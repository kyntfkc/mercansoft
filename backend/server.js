const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const imageStorage = require('./storage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Base64 görseller için limit artırıldı

// Static file serving - Görselleri serve et
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway internal connections don't require SSL
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.app') 
    ? { rejectUnauthorized: false } 
    : process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'mercan-soft-secret';
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'mercan';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Mercan@123';

// Test database connection
pool.on('connect', () => {
  console.log('PostgreSQL bağlantısı başarılı');
});

pool.on('error', (err) => {
  console.error('PostgreSQL bağlantı hatası:', err);
});

// Initialize database tables
async function initDatabase() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  try {
    // Stones table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        count_per_gram DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Models table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        stock_code VARCHAR(100),
        category VARCHAR(100),
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Model stones junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_stones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID REFERENCES models(id) ON DELETE CASCADE,
        stone_id UUID REFERENCES stones(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stone sets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stone_sets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stone set items junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stone_set_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stone_set_id UUID REFERENCES stone_sets(id) ON DELETE CASCADE,
        stone_id UUID REFERENCES stones(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Company settings table (tek satır olacak)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
        company_name VARCHAR(255) DEFAULT 'MercanSoft',
        legal_name VARCHAR(255),
        tax_office VARCHAR(100),
        tax_number VARCHAR(50),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(100),
        website VARCHAR(255),
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tek satır garantisi için
    await pool.query(`
      INSERT INTO company_settings (id, company_name)
      VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'MercanSoft')
      ON CONFLICT (id) DO NOTHING
    `);

    await ensureDefaultUser();

    console.log('Veritabanı tabloları hazır');
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
  }
}

async function ensureDefaultUser() {
  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [DEFAULT_ADMIN_USERNAME]
    );

    if (existingUser.rows.length === 0) {
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        [DEFAULT_ADMIN_USERNAME, passwordHash]
      );
      console.log(`Varsayılan admin kullanıcısı oluşturuldu (${DEFAULT_ADMIN_USERNAME})`);
    } else {
      console.log('Varsayılan admin kullanıcısı mevcut');
    }
  } catch (error) {
    console.error('Varsayılan kullanıcı oluşturulamadı:', error);
  }
}

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return res.status(401).json({ error: 'Oturum süresi doldu veya geçersiz token' });
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir' });
  }

  try {
    const userResult = await pool.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
});

// API Routes - Stones
app.get('/api/stones', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stones ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stones', authenticate, async (req, res) => {
  try {
    const { name, countPerGram } = req.body;
    const result = await pool.query(
      'INSERT INTO stones (name, count_per_gram) VALUES ($1, $2) RETURNING *',
      [name, countPerGram]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/stones/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, countPerGram } = req.body;
    const result = await pool.query(
      'UPDATE stones SET name = $1, count_per_gram = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, countPerGram, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Taş bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stones/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM stones WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Taş bulunamadı' });
    }
    res.json({ message: 'Taş silindi', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Models
app.get('/api/models', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        COALESCE(
          json_agg(
            json_build_object(
              'stoneId', ms.stone_id,
              'quantity', ms.quantity
            )
          ) FILTER (WHERE ms.stone_id IS NOT NULL),
          '[]'
        ) as stones
      FROM models m
      LEFT JOIN model_stones ms ON m.id = ms.model_id
      GROUP BY m.id
      ORDER BY m.name
    `);
    
    const models = result.rows.map(row => ({
      ...row,
      stones: row.stones || []
    }));
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/models', authenticate, async (req, res) => {
  try {
    const { name, stockCode, category, image, stones } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Önce model'i oluştur (ID'yi almak için)
      const modelResult = await client.query(
        'INSERT INTO models (name, stock_code, category) VALUES ($1, $2, $3) RETURNING *',
        [name, stockCode || null, category || null]
      );
      
      const model = modelResult.rows[0];
      
      // Base64 görseli dosyaya çevir (artık model ID'si var)
      let imageUrl = null;
      if (image && imageStorage.isBase64(image)) {
        imageUrl = await imageStorage.saveBase64Image(image, model.id);
        // Database'i güncelle
        await client.query('UPDATE models SET image = $1 WHERE id = $2', [imageUrl, model.id]);
        model.image = imageUrl;
      } else if (image) {
        // Zaten URL ise direkt kullan
        imageUrl = image;
        await client.query('UPDATE models SET image = $1 WHERE id = $2', [imageUrl, model.id]);
        model.image = imageUrl;
      }
      
      if (stones && stones.length > 0) {
        for (const stone of stones) {
          await client.query(
            'INSERT INTO model_stones (model_id, stone_id, quantity) VALUES ($1, $2, $3)',
            [model.id, stone.stoneId, stone.quantity]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const finalResult = await pool.query(`
        SELECT 
          m.*,
          COALESCE(
            json_agg(
              json_build_object(
                'stoneId', ms.stone_id,
                'quantity', ms.quantity
              )
            ) FILTER (WHERE ms.stone_id IS NOT NULL),
            '[]'
          ) as stones
        FROM models m
        LEFT JOIN model_stones ms ON m.id = ms.model_id
        WHERE m.id = $1
        GROUP BY m.id
      `, [model.id]);
      
      res.status(201).json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/models/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stockCode, category, image, stones } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mevcut görseli al
      const currentModel = await client.query('SELECT image FROM models WHERE id = $1', [id]);
      const oldImageUrl = currentModel.rows[0]?.image;
      
      // Base64 görseli dosyaya çevir
      let imageUrl = null;
      if (image && imageStorage.isBase64(image)) {
        // Eski görseli sil
        if (oldImageUrl) {
          await imageStorage.deleteImage(oldImageUrl);
        }
        // Yeni görseli kaydet
        imageUrl = await imageStorage.saveBase64Image(image, id);
      } else if (image) {
        // Zaten URL ise direkt kullan
        imageUrl = image;
      } else if (image === null) {
        // Görsel silinmek isteniyor
        if (oldImageUrl) {
          await imageStorage.deleteImage(oldImageUrl);
        }
        imageUrl = null;
      } else {
        // Görsel değişmedi, eski URL'i kullan
        imageUrl = oldImageUrl;
      }
      
      await client.query(
        'UPDATE models SET name = $1, stock_code = $2, category = $3, image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [name, stockCode || null, category || null, imageUrl, id]
      );
      
      await client.query('DELETE FROM model_stones WHERE model_id = $1', [id]);
      
      if (stones && stones.length > 0) {
        for (const stone of stones) {
          await client.query(
            'INSERT INTO model_stones (model_id, stone_id, quantity) VALUES ($1, $2, $3)',
            [id, stone.stoneId, stone.quantity]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const finalResult = await pool.query(`
        SELECT 
          m.*,
          COALESCE(
            json_agg(
              json_build_object(
                'stoneId', ms.stone_id,
                'quantity', ms.quantity
              )
            ) FILTER (WHERE ms.stone_id IS NOT NULL),
            '[]'
          ) as stones
        FROM models m
        LEFT JOIN model_stones ms ON m.id = ms.model_id
        WHERE m.id = $1
        GROUP BY m.id
      `, [id]);
      
      if (finalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Model bulunamadı' });
      }
      
      res.json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/models/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Önce görseli al ve sil
    const modelResult = await pool.query('SELECT image FROM models WHERE id = $1', [id]);
    if (modelResult.rows.length > 0 && modelResult.rows[0].image) {
      await imageStorage.deleteImage(modelResult.rows[0].image);
    }
    
    const result = await pool.query('DELETE FROM models WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model bulunamadı' });
    }
    res.json({ message: 'Model silindi', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Stone Sets
app.get('/api/stone-sets', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ss.*,
        COALESCE(
          json_agg(
            json_build_object(
              'stoneId', ssi.stone_id,
              'quantity', ssi.quantity
            )
          ) FILTER (WHERE ssi.stone_id IS NOT NULL),
          '[]'
        ) as stones
      FROM stone_sets ss
      LEFT JOIN stone_set_items ssi ON ss.id = ssi.stone_set_id
      GROUP BY ss.id
      ORDER BY ss.name
    `);
    
    const sets = result.rows.map(row => ({
      ...row,
      stones: row.stones || []
    }));
    
    res.json(sets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stone-sets', authenticate, async (req, res) => {
  try {
    const { name, description, stones } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const setResult = await client.query(
        'INSERT INTO stone_sets (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || null]
      );
      
      const stoneSet = setResult.rows[0];
      
      if (stones && stones.length > 0) {
        for (const stone of stones) {
          await client.query(
            'INSERT INTO stone_set_items (stone_set_id, stone_id, quantity) VALUES ($1, $2, $3)',
            [stoneSet.id, stone.stoneId, stone.quantity]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const finalResult = await pool.query(`
        SELECT 
          ss.*,
          COALESCE(
            json_agg(
              json_build_object(
                'stoneId', ssi.stone_id,
                'quantity', ssi.quantity
              )
            ) FILTER (WHERE ssi.stone_id IS NOT NULL),
            '[]'
          ) as stones
        FROM stone_sets ss
        LEFT JOIN stone_set_items ssi ON ss.id = ssi.stone_set_id
        WHERE ss.id = $1
        GROUP BY ss.id
      `, [stoneSet.id]);
      
      res.status(201).json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/stone-sets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stones } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(
        'UPDATE stone_sets SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [name, description || null, id]
      );
      
      await client.query('DELETE FROM stone_set_items WHERE stone_set_id = $1', [id]);
      
      if (stones && stones.length > 0) {
        for (const stone of stones) {
          await client.query(
            'INSERT INTO stone_set_items (stone_set_id, stone_id, quantity) VALUES ($1, $2, $3)',
            [id, stone.stoneId, stone.quantity]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const finalResult = await pool.query(`
        SELECT 
          ss.*,
          COALESCE(
            json_agg(
              json_build_object(
                'stoneId', ssi.stone_id,
                'quantity', ssi.quantity
              )
            ) FILTER (WHERE ssi.stone_id IS NOT NULL),
            '[]'
          ) as stones
        FROM stone_sets ss
        LEFT JOIN stone_set_items ssi ON ss.id = ssi.stone_set_id
        WHERE ss.id = $1
        GROUP BY ss.id
      `, [id]);
      
      if (finalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Taş seti bulunamadı' });
      }
      
      res.json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stone-sets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM stone_sets WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Taş seti bulunamadı' });
    }
    res.json({ message: 'Taş seti silindi', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Users
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticate, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    // Kullanıcı var mı kontrol et
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcı adı güncelleniyorsa, başka bir kullanıcıda aynı isim var mı kontrol et
    if (username) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
    }

    // Şifre güncelleniyorsa hash'le
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      if (username) {
        const result = await pool.query(
          'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, created_at',
          [username, passwordHash, id]
        );
        return res.json(result.rows[0]);
      } else {
        const result = await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, created_at',
          [passwordHash, id]
        );
        return res.json(result.rows[0]);
      }
    } else if (username) {
      const result = await pool.query(
        'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, created_at',
        [username, id]
      );
      return res.json(result.rows[0]);
    }

    res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kendi kullanıcısını silmesini engelle
    if (req.user.userId === id) {
      return res.status(400).json({ error: 'Kendi kullanıcınızı silemezsiniz' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ message: 'Kullanıcı silindi', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Company Settings
app.get('/api/company-settings', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM company_settings WHERE id = $1',
      ['00000000-0000-0000-0000-000000000000']
    );
    
    if (result.rows.length === 0) {
      // İlk kez çağrılıyorsa varsayılan değerler döndür
      return res.json({
        id: '00000000-0000-0000-0000-000000000000',
        companyName: 'MercanSoft',
        legalName: '',
        taxOffice: '',
        taxNumber: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logo: null,
      });
    }
    
    const settings = result.rows[0];
    res.json({
      id: settings.id,
      companyName: settings.company_name,
      legalName: settings.legal_name,
      taxOffice: settings.tax_office,
      taxNumber: settings.tax_number,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      logo: settings.logo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/company-settings', authenticate, async (req, res) => {
  try {
    const {
      companyName,
      legalName,
      taxOffice,
      taxNumber,
      address,
      phone,
      email,
      website,
      logo,
    } = req.body;

    // Logo base64 ise, storage'a kaydet
    let logoUrl = logo;
    if (logo && imageStorage.isBase64(logo)) {
      try {
        logoUrl = await imageStorage.saveBase64Image(logo, 'company-logo');
      } catch (error) {
        console.error('Logo kaydetme hatası:', error);
        // Logo kaydedilemezse base64 olarak sakla
        logoUrl = logo;
      }
    }

    const result = await pool.query(
      `UPDATE company_settings SET
        company_name = $1,
        legal_name = $2,
        tax_office = $3,
        tax_number = $4,
        address = $5,
        phone = $6,
        email = $7,
        website = $8,
        logo = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = '00000000-0000-0000-0000-000000000000'
      RETURNING *`,
      [
        companyName || 'MercanSoft',
        legalName || null,
        taxOffice || null,
        taxNumber || null,
        address || null,
        phone || null,
        email || null,
        website || null,
        logoUrl || null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company settings bulunamadı' });
    }

    const settings = result.rows[0];
    res.json({
      id: settings.id,
      companyName: settings.company_name,
      legalName: settings.legal_name,
      taxOffice: settings.tax_office,
      taxNumber: settings.tax_number,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      logo: settings.logo,
    });
  } catch (error) {
    console.error('Company settings güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Migration endpoint (tek kullanımlık - güvenlik için)
let migrationCompleted = false;
app.post('/api/migrate', authenticate, express.json({ limit: '50mb' }), async (req, res) => {
  if (migrationCompleted) {
    return res.status(403).json({ error: 'Migration zaten tamamlanmış' });
  }

  try {
    const data = req.body;
    const { migrateData } = require('./migrate-local-data');
    
    // migrateData fonksiyonunu çağır
    await migrateData(data);
    
    migrationCompleted = true;
    res.json({ message: 'Migration başarıyla tamamlandı!' });
  } catch (error) {
    console.error('Migration hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server ${PORT} portunda çalışıyor`);
  });
});


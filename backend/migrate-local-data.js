const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const imageStorage = require('./storage');
require('dotenv').config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// LocalStorage verilerini oku (eski masaüstü kurulumundan kalan yollar)
// Windows: C:\Users\<username>\AppData\Roaming\<app-name>\Local Storage\leveldb\
// veya C:\Users\<username>\AppData\Local\<app-name>\Local Storage\leveldb\

function findLocalStorageData() {
  const possiblePaths = [
    path.join(process.env.APPDATA || '', 'mercansoft', 'Local Storage', 'leveldb'),
    path.join(process.env.LOCALAPPDATA || '', 'mercansoft', 'Local Storage', 'leveldb'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'mercansoft', 'Local Storage', 'leveldb'),
    'C:\\Users\\kayha\\AppData\\Local\\Programs\\mercansoft',
  ];

  for (const storagePath of possiblePaths) {
    if (fs.existsSync(storagePath)) {
      console.log(`LocalStorage bulundu: ${storagePath}`);
      return storagePath;
    }
  }

  return null;
}

// Alternatif: JSON dosyasından oku (eğer export edilmişse)
function readFromJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('JSON dosyası okuma hatası:', error);
    return null;
  }
}

// LocalStorage LevelDB'den veri okuma (basitleştirilmiş)
// Not: LevelDB okumak için 'level' paketi gerekir, bu yüzden manuel export öneriyoruz
async function migrateData(data) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Stones migration
    if (data.stones && data.stones.length > 0) {
      console.log(`${data.stones.length} taş aktarılıyor...`);
      for (const stone of data.stones) {
        await client.query(
          'INSERT INTO stones (id, name, count_per_gram) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, count_per_gram = $3',
          [stone.id, stone.name, stone.countPerGram]
        );
      }
      console.log('✓ Taşlar aktarıldı');
    }

    // Models migration
    if (data.models && data.models.length > 0) {
      console.log(`${data.models.length} model aktarılıyor...`);
      for (const model of data.models) {
        // Base64 görseli dosyaya çevir
        let imageUrl = null;
        if (model.image && imageStorage.isBase64(model.image)) {
          try {
            imageUrl = await imageStorage.saveBase64Image(model.image, model.id);
            console.log(`  ✓ Görsel kaydedildi: ${model.name}`);
          } catch (error) {
            console.error(`  ⚠ Görsel kaydedilemedi (${model.name}):`, error.message);
            // Hata olsa bile devam et, görsel olmadan kaydet
          }
        } else if (model.image) {
          // Zaten URL ise direkt kullan
          imageUrl = model.image;
        }
        
        // Model ekle
        await client.query(
          'INSERT INTO models (id, name, stock_code, category, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, stock_code = $3, category = $4, image = $5',
          [model.id, model.name, model.stockCode || null, model.category || null, imageUrl]
        );

        // Model stones ekle
        if (model.stones && model.stones.length > 0) {
          // Önce mevcut taşları sil
          await client.query('DELETE FROM model_stones WHERE model_id = $1', [model.id]);
          
          // Yeni taşları ekle
          for (const stone of model.stones) {
            await client.query(
              'INSERT INTO model_stones (model_id, stone_id, quantity) VALUES ($1, $2, $3)',
              [model.id, stone.stoneId, stone.quantity]
            );
          }
        }
      }
      console.log('✓ Modeller aktarıldı');
    }

    // Stone Sets migration
    if (data.stoneSets && data.stoneSets.length > 0) {
      console.log(`${data.stoneSets.length} taş seti aktarılıyor...`);
      for (const set of data.stoneSets) {
        // Set ekle
        await client.query(
          'INSERT INTO stone_sets (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, description = $3',
          [set.id, set.name, set.description || null]
        );

        // Set items ekle
        if (set.stones && set.stones.length > 0) {
          // Önce mevcut itemları sil
          await client.query('DELETE FROM stone_set_items WHERE stone_set_id = $1', [set.id]);
          
          // Yeni itemları ekle
          for (const stone of set.stones) {
            await client.query(
              'INSERT INTO stone_set_items (stone_set_id, stone_id, quantity) VALUES ($1, $2, $3)',
              [set.id, stone.stoneId, stone.quantity]
            );
          }
        }
      }
      console.log('✓ Taş setleri aktarıldı');
    }

    await client.query('COMMIT');
    console.log('\n✅ Tüm veriler başarıyla aktarıldı!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  let data;
  
  // Eğer dosya yolu verilmişse dosyadan oku
  if (args.length > 0) {
    const jsonFilePath = args[0];
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Dosya bulunamadı: ${jsonFilePath}`);
      process.exit(1);
    }

    console.log('📂 Veriler dosyadan okunuyor...');
    data = readFromJsonFile(jsonFilePath);
  } else {
    // Stdin'den oku (Railway'de pipe için)
    console.log('📂 Veriler stdin\'den okunuyor...');
    try {
      const stdin = fs.readFileSync(0, 'utf-8');
      if (stdin.trim()) {
        data = JSON.parse(stdin);
      } else {
        console.log(`
Kullanım:
  node migrate-local-data.js <json-file-path>
  veya
  cat veriler.json | node migrate-local-data.js
  
Örnek:
  node migrate-local-data.js C:\\Users\\kayha\\Desktop\\mercansoft-veriler.json

Not: Önce uygulamadan verileri export edin:
  1. Uygulamayı açın
  2. Sistem Ayarları > Veri Yönetimi > Verileri Dışa Aktar
  3. JSON dosyasını kaydedin
  4. Bu script'i çalıştırın
        `);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Stdin okuma hatası:', error.message);
      process.exit(1);
    }
  }
  
  if (!data) {
    console.error('❌ Veri okunamadı!');
    process.exit(1);
  }

  console.log('📊 Veri özeti:');
  console.log(`  - Taşlar: ${data.stones?.length || 0}`);
  console.log(`  - Modeller: ${data.models?.length || 0}`);
  console.log(`  - Taş Setleri: ${data.stoneSets?.length || 0}`);
  console.log('');

  // Database bağlantısını test et
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable bulunamadı!');
    console.log('\nRailway\'de çalıştırıyorsanız, Railway otomatik olarak DATABASE_URL\'i set eder.');
    console.log('Local\'de çalıştırıyorsanız, Railway DATABASE_URL\'ini manuel olarak set edin.');
    process.exit(1);
  }
  
  console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Şifreyi gizle
  
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database bağlantısı başarılı\n');
  } catch (error) {
    console.error('❌ Database bağlantı hatası:', error.message);
    console.log('\nLütfen DATABASE_URL environment variable\'ını kontrol edin.');
    process.exit(1);
  }

  // Migration başlat
  try {
    await migrateData(data);
  } catch (error) {
    console.error('❌ Migration başarısız:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Export migrateData fonksiyonu (API endpoint için)
module.exports = { migrateData };

// CLI için main fonksiyonu
if (require.main === module) {
  main();
}


# MercanSoft Backend API

Express + PostgreSQL backend API for MercanSoft application.

## Railway Deployment

### 1. Railway'de Proje Oluştur

1. https://railway.app adresine git
2. "New Project" → "Empty Project" seç
3. Proje adını "mercansoft-backend" olarak ayarla

### 2. PostgreSQL Database Ekle

1. Projeye "New" → "Database" → "Add PostgreSQL" seç
2. Database otomatik olarak oluşturulacak
3. Database'in "Variables" sekmesinden `DATABASE_URL` değerini kopyala

### 3. Backend Service Ekle

1. Projeye "New" → "GitHub Repo" seç (veya "Empty Service")
2. GitHub repo'yu bağla (backend klasörü root'ta olmalı)
3. Veya "Empty Service" seçip GitHub'a push yap

### 4. Persistent Volume Ekle (Görseller İçin)

1. Projeye "New" → "Volume" seç
2. Volume adını "uploads" olarak ayarla
3. Backend service'in "Settings" sekmesine git
4. "Volumes" bölümünden "Add Volume" butonuna tıkla
5. "uploads" volume'ünü seç ve mount path olarak `/app/uploads` yaz

### 5. Environment Variables Ayarla

Railway'de service'in "Variables" sekmesine git ve şunları ekle:

- `DATABASE_URL`: PostgreSQL connection string (Database'den otomatik gelir)
- `PORT`: 3001 (opsiyonel, Railway otomatik ayarlar)
- `NODE_ENV`: production
- `STORAGE_PATH`: `/app/uploads` (Volume mount path)
- `API_URL`: Backend domain URL'i (örn: `https://mercansoft-backend.up.railway.app`)

### 6. Deploy

Railway otomatik olarak deploy edecek. Deploy tamamlandıktan sonra:

1. Service'in "Settings" sekmesinden "Generate Domain" butonuna tıkla
2. Domain URL'ini kopyala (örn: `mercansoft-backend-production.up.railway.app`)
3. `API_URL` environment variable'ını domain URL'i ile güncelle

## Local Development

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/mercansoft
NODE_ENV=development

# Server'ı başlat
npm run dev
```

## API Endpoints

- `GET /api/stones` - Tüm taşları listele
- `POST /api/stones` - Yeni taş ekle
- `PUT /api/stones/:id` - Taş güncelle
- `DELETE /api/stones/:id` - Taş sil

- `GET /api/models` - Tüm modelleri listele
- `POST /api/models` - Yeni model ekle
- `PUT /api/models/:id` - Model güncelle
- `DELETE /api/models/:id` - Model sil

- `GET /api/stone-sets` - Tüm taş setlerini listele
- `POST /api/stone-sets` - Yeni taş seti ekle
- `PUT /api/stone-sets/:id` - Taş seti güncelle
- `DELETE /api/stone-sets/:id` - Taş seti sil

- `GET /health` - Health check


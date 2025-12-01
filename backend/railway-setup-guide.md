# Railway Kurulum Rehberi

Railway CLI token ile direkt giriş yapamadığı için, web arayüzünden kurulum yapmanız gerekiyor. Aşağıdaki adımları takip edin:

## Adım 1: Railway'de Giriş Yap

1. https://railway.app adresine gidin
2. Token ile giriş yapın (token: `25776ae7-8739-440d-8c1e-9251bb82b992`)

## Adım 2: Proje Oluştur

1. "New Project" → "Empty Project" seçin
2. Proje adını "mercansoft-backend" olarak ayarlayın

## Adım 3: PostgreSQL Database Ekle

1. Projeye "New" → "Database" → "Add PostgreSQL" seçin
2. Database otomatik olarak oluşturulacak
3. Database'in "Variables" sekmesinden `DATABASE_URL` değerini not edin

## Adım 4: Volume Oluştur (Görseller İçin)

1. Projeye "New" → "Volume" seçin
2. Volume adını "uploads" olarak ayarlayın
3. Volume oluşturulduktan sonra, backend service'e mount edeceğiz

## Adım 5: Backend Service Ekle

1. Projeye "New" → "GitHub Repo" seçin
2. GitHub repo'nuzu seçin (backend klasörü root'ta olmalı)
3. Veya "Empty Service" seçip manuel deploy yapın

## Adım 6: Volume'ü Mount Et

1. Backend service'in "Settings" sekmesine gidin
2. "Volumes" bölümünden "Add Volume" butonuna tıklayın
3. "uploads" volume'ünü seçin
4. Mount path olarak `/app/uploads` yazın

## Adım 7: Environment Variables Ayarla

Backend service'in "Variables" sekmesine gidin ve şunları ekleyin:

- `DATABASE_URL`: PostgreSQL connection string (Database'den otomatik gelir, "Connect" butonuna tıklayın)
- `NODE_ENV`: `production`
- `STORAGE_PATH`: `/app/uploads`
- `PORT`: `3001` (opsiyonel, Railway otomatik ayarlar)

## Adım 8: Domain Oluştur

1. Backend service'in "Settings" sekmesine gidin
2. "Generate Domain" butonuna tıklayın
3. Domain URL'ini kopyalayın (örn: `mercansoft-backend-production.up.railway.app`)
4. `API_URL` environment variable'ını domain URL'i ile güncelleyin:
   - `API_URL`: `https://mercansoft-backend-production.up.railway.app`

## Adım 9: Deploy

Railway otomatik olarak deploy edecek. Deploy tamamlandıktan sonra:

1. Service'in "Deployments" sekmesinden deploy durumunu kontrol edin
2. "Logs" sekmesinden logları kontrol edin
3. Health check endpoint'ini test edin: `https://your-domain.railway.app/health`

## Adım 10: CLI ile Link Et (Opsiyonel)

Backend klasöründe:

```bash
railway login
railway link
```

Proje ID'sini seçin veya girin.

## Sorun Giderme

### Database Bağlantı Hatası
- `DATABASE_URL` environment variable'ının doğru olduğundan emin olun
- Database servisinin çalıştığından emin olun

### Volume Mount Hatası
- Volume'ün oluşturulduğundan emin olun
- Mount path'in `/app/uploads` olduğundan emin olun

### Deploy Hatası
- Logs sekmesinden hata mesajlarını kontrol edin
- `package.json` dosyasının doğru olduğundan emin olun
- `railway.json` veya `railway.toml` dosyasının mevcut olduğundan emin olun


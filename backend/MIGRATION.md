# Local Verileri Railway Backend'e Aktarma

Bu rehber, Electron uygulamasındaki local verileri Railway backend'e aktarmanız için adımları içerir.

## Adım 1: Verileri Export Et

### Yöntem 1: Uygulama İçinden (Önerilen)

1. Electron uygulamasını açın
2. **Sistem Ayarları** sekmesine gidin
3. **Veri Yönetimi** bölümünde **"Verileri Dışa Aktar"** butonuna tıklayın
4. JSON dosyasını kaydedin (örn: `mercansoft-veriler.json`)

### Yöntem 2: Developer Tools ile

1. Electron uygulamasını açın
2. `Ctrl+Shift+I` ile Developer Tools'u açın
3. Console sekmesine gidin
4. Şu komutu çalıştırın:
   ```javascript
   localStorage.getItem('mercansoft-storage')
   ```
5. Çıkan JSON'u kopyalayıp bir dosyaya kaydedin (örn: `mercansoft-veriler.json`)

## Adım 2: Railway Backend'e Bağlan

1. Railway'de backend servisinizin **Variables** sekmesine gidin
2. `DATABASE_URL` değerini kopyalayın
3. Backend klasöründe `.env` dosyası oluşturun:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   NODE_ENV=production
   STORAGE_PATH=./uploads
   API_URL=http://localhost:3001
   ```

**Not:** Migration sırasında base64 görseller otomatik olarak dosyaya çevrilip `uploads/` klasörüne kaydedilecek.

## Adım 3: Migration Script'ini Çalıştır

```bash
cd backend
npm install
node migrate-local-data.js C:\path\to\mercansoft-veriler.json
```

Örnek:
```bash
node migrate-local-data.js C:\Users\kayha\Desktop\mercansoft-veriler.json
```

## Adım 4: Verileri Kontrol Et

Migration tamamlandıktan sonra:

1. Railway backend'inizin domain'ine gidin (örn: `https://mercansoft-backend.up.railway.app`)
2. Health check endpoint'ini test edin: `GET /health`
3. Verileri kontrol edin:
   - `GET /api/stones` - Taşlar
   - `GET /api/models` - Modeller
   - `GET /api/stone-sets` - Taş setleri

## Sorun Giderme

### Database Bağlantı Hatası

```
❌ Database bağlantı hatası: ...
```

**Çözüm:**
- `.env` dosyasındaki `DATABASE_URL` değerini kontrol edin
- Railway'de PostgreSQL servisinin çalıştığından emin olun
- `DATABASE_URL` formatı: `postgresql://user:password@host:port/database`

### Veri Formatı Hatası

```
❌ Veri okunamadı!
```

**Çözüm:**
- Export edilen JSON dosyasının formatını kontrol edin
- JSON dosyası şu yapıda olmalı:
  ```json
  {
    "stones": [...],
    "models": [...],
    "stoneSets": [...]
  }
  ```

### Migration Hatası

```
❌ Migration hatası: ...
```

**Çözüm:**
- Database tablolarının oluşturulduğundan emin olun
- Backend server'ı bir kez çalıştırın (tablolar otomatik oluşturulur)
- Hata mesajını kontrol edin ve gerekirse Railway logs'a bakın

## Notlar

- Migration işlemi mevcut verileri **üzerine yazmaz**, sadece ekler
- Aynı ID'ye sahip veriler varsa `ON CONFLICT` ile güncellenir
- Migration işlemi transaction içinde çalışır, hata durumunda geri alınır


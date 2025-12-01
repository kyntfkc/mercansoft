# Vercel Deployment - Environment Variables

## Sorun 1: Build Hatası - "Couldn't find any `pages` or `app` directory"

Eğer build sırasında bu hatayı alıyorsanız, Vercel'in root directory'yi yanlış algılamasıdır.

### Çözüm: Root Directory Ayarlama

**ÖNEMLİ:** Önce GitHub repo yapınızı kontrol edin!

1. **GitHub repo'nuzu kontrol edin:**
   - https://github.com/kyntfkc/mercansoft adresine gidin
   - Repo root'unda hangi dosyalar var?
   - `src` klasörü direkt root'ta mı yoksa `mercansoftV2/src` şeklinde mi?

2. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard
   - Projenizi seçin

3. **Settings → General → Root Directory:**
   
   **Eğer GitHub repo root'u şu şekildeyse:**
   ```
   mercansoft/
     ├── src/
     ├── package.json
     ├── next.config.ts
     └── ...
   ```
   → **Root Directory alanını BOŞ BIRAKIN** (veya `.` yazın)
   
   **Eğer GitHub repo root'u şu şekildeyse:**
   ```
   mercansoft/
     └── mercansoftV2/
         ├── src/
         ├── package.json
         └── ...
   ```
   → **Root Directory alanına `mercansoftV2` yazın**

4. **Save** butonuna tıklayın

5. **Redeploy:**
   - **Deployments** sekmesine gidin
   - En son deployment'ın yanındaki **"..."** menüsüne tıklayın
   - **"Redeploy"** seçeneğini seçin

---

## Sorun 2: Veriler Görünmüyor

Uygulama Vercel'de açılıyor ama veriler görünmüyor. Bu genellikle environment variable'ların ayarlanmamış olmasından kaynaklanır.

## Çözüm: Vercel'de Environment Variable Ayarlama

### 1. Vercel Dashboard'a Gidin

1. https://vercel.com/dashboard adresine gidin
2. Projenizi seçin

### 2. Environment Variables Ekleyin

1. **Settings** sekmesine gidin
2. **Environment Variables** bölümüne gidin
3. Aşağıdaki variable'ı ekleyin:

#### NEXT_PUBLIC_API_URL

- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** Railway backend URL'iniz (örn: `https://backend-production-678d.up.railway.app`)
- **Environment:** Production, Preview, Development (hepsini seçin)

### 3. Redeploy

Environment variable ekledikten sonra:

1. **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. **"Use existing Build Cache"** seçeneğini kapatın (opsiyonel, ama önerilir)
5. **"Redeploy"** butonuna tıklayın

### 4. Kontrol

Deploy tamamlandıktan sonra:

1. Tarayıcıda uygulamayı açın
2. **Developer Tools** (F12) → **Console** sekmesine gidin
3. Şu logları görmelisiniz:
   - `🔗 API URL: https://backend-production-678d.up.railway.app`
   - `🔄 Backend'den veri çekiliyor...`
   - `🌐 API İsteği: GET https://...`

Eğer hata görüyorsanız:
- `❌ Network Hatası: Backend'e bağlanılamıyor` → API URL'i yanlış veya backend çalışmıyor
- `❌ API Hatası: 401` → Authentication token eksik veya geçersiz
- `❌ API Hatası: 500` → Backend hatası

## Railway Backend Kontrolü

Backend'in çalıştığından emin olun:

1. Railway dashboard'a gidin
2. Backend servisinizin **Deployments** sekmesine bakın
3. Son deployment'ın **"Active"** olduğundan emin olun
4. **Logs** sekmesinde hata olup olmadığını kontrol edin

### Health Check

Backend'in çalıştığını test etmek için:

```bash
curl https://backend-production-678d.up.railway.app/health
```

Yanıt:
```json
{"status":"OK","timestamp":"2024-..."}
```

## Alternatif: Vercel CLI ile

```bash
# Vercel CLI ile login
vercel login

# Projeyi link et
vercel link

# Environment variable ekle
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://backend-production-678d.up.railway.app

# Redeploy
vercel --prod
```

## Sorun Giderme

### Veriler hala görünmüyor

1. **Browser Console'u kontrol edin:**
   - F12 → Console
   - API hatalarını kontrol edin

2. **Network sekmesini kontrol edin:**
   - F12 → Network
   - API isteklerinin başarılı olup olmadığını kontrol edin
   - 401, 403, 500 gibi hataları kontrol edin

3. **Backend loglarını kontrol edin:**
   - Railway dashboard → Backend service → Logs
   - Gelen istekleri ve hataları kontrol edin

4. **Authentication kontrolü:**
   - Login sayfasından tekrar giriş yapın
   - Token'ın localStorage'da olduğunu kontrol edin (F12 → Application → Local Storage)

### CORS Hatası

Eğer CORS hatası görüyorsanız, backend'de CORS ayarlarını kontrol edin. `server.js` dosyasında:

```javascript
app.use(cors());
```

Bu satırın olduğundan emin olun.


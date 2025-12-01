# Railway Deploy Hatası Düzeltme

## Sorun
Railway backend klasörünü bulamıyor, bu yüzden build başarısız oluyor.

## Çözüm 1: Railway Web Arayüzünden (Önerilen)

1. **Railway Dashboard'a gidin:**
   - https://railway.app/project/d3fd3ec0-5021-494d-a33e-6210e5d49166

2. **Backend service'ine tıklayın:**
   - Sol menüden "backend" service'ini seçin

3. **Settings → Root Directory ayarlayın:**
   - Settings sekmesine gidin
   - "Root Directory" bölümünü bulun
   - `backend` yazın (veya boş bırakın, çünkü zaten backend klasöründesiniz)
   - Kaydedin

4. **Redeploy yapın:**
   - Deployments sekmesine gidin
   - En son deployment'a tıklayın
   - "Redeploy" butonuna tıklayın

## Çözüm 2: CLI ile

Backend klasöründe deploy yapın:

```bash
cd backend
railway link
railway up
```

## Çözüm 3: Railway.json ile Root Directory Belirtme

Backend klasöründe `railway.json` dosyasına root directory ekleyin:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "rootDirectory": "."
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Kontrol

Deploy başarılı olduktan sonra:

1. Health check: https://backend-production-678d.up.railway.app/health
2. API test: https://backend-production-678d.up.railway.app/api/stones

## Sorun Devam Ederse

1. Build loglarına bakın: Railway Dashboard → Service → Deployments → Build Logs
2. Environment variables kontrol edin: Settings → Variables
3. Volume mount kontrol edin: Settings → Volumes


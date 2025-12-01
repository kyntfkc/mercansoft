# Railway Environment Variables Kurulumu

## Sorun
PostgreSQL bağlantı hatası: `ECONNREFUSED ::1:5432`
- `DATABASE_URL` environment variable'ı eksik

## Çözüm: Railway Web Arayüzünden

### 1. PostgreSQL Servisini Backend'e Bağlama

1. **Railway Dashboard'a gidin:**
   - https://railway.app/project/d3fd3ec0-5021-494d-a33e-6210e5d49166

2. **PostgreSQL servisine tıklayın:**
   - Sol menüden "Postgres" servisini seçin

3. **Variables sekmesine gidin:**
   - PostgreSQL servisinin Variables sekmesine gidin
   - `DATABASE_URL` değerini kopyalayın

4. **Backend servisine gidin:**
   - Sol menüden "backend" servisini seçin

5. **Settings → Variables:**
   - "New Variable" butonuna tıklayın
   - **Name:** `DATABASE_URL`
   - **Value:** PostgreSQL servisinden kopyaladığınız `DATABASE_URL` değerini yapıştırın
   - **Veya** Railway'in otomatik referansını kullanın: `${{Postgres.DATABASE_URL}}`
   - Kaydedin

### 2. Diğer Gerekli Environment Variables

Backend servisinde şu environment variables'ları ekleyin:

1. **NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`

2. **STORAGE_PATH**
   - Name: `STORAGE_PATH`
   - Value: `/app/uploads`

3. **API_URL** (Opsiyonel - Domain oluşturduktan sonra)
   - Name: `API_URL`
   - Value: Backend servisinizin domain URL'i (örn: `https://backend-production-xxxx.up.railway.app`)

### 3. Domain Oluşturma

1. **Backend servisine gidin**
2. **Settings → Networking**
3. **"Generate Domain"** butonuna tıklayın
4. Oluşturulan domain'i kopyalayın
5. **Settings → Variables** → `API_URL` variable'ını güncelleyin

### 4. Redeploy

1. **Deployments sekmesine gidin**
2. En son deployment'a tıklayın
3. **"Redeploy"** butonuna tıklayın

## Alternatif: Railway CLI ile

```bash
cd backend

# PostgreSQL DATABASE_URL'ini backend servisine ekle
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"

# Diğer variables
railway variables --set "NODE_ENV=production"
railway variables --set "STORAGE_PATH=/app/uploads"

# Domain oluştur
railway domain

# Domain'i API_URL olarak ekle (domain oluşturduktan sonra)
railway variables --set "API_URL=\${{RAILWAY_PUBLIC_DOMAIN}}"
```

## Kontrol

Deploy başarılı olduktan sonra:

1. **Health check:**
   - `https://your-backend-domain.up.railway.app/health`

2. **API test:**
   - `https://your-backend-domain.up.railway.app/api/stones`


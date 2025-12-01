# Railway Otomatik Kurulum Script
# Railway CLI login yapılmış olmalı

Write-Host "🚂 Railway otomatik kurulum başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# Login kontrolü
Write-Host "🔐 Login kontrol ediliyor..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway CLI'ye login yapılmamış!" -ForegroundColor Red
    Write-Host "Lütfen önce 'railway login' komutunu çalıştırın." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Login başarılı: $whoami" -ForegroundColor Green
Write-Host ""

# 1. Proje oluştur
Write-Host "📦 Proje oluşturuluyor..." -ForegroundColor Yellow
railway init --name mercansoft-backend
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Proje oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "⚠️  Proje oluşturulamadı veya zaten var" -ForegroundColor Yellow
}
Write-Host ""

# 2. PostgreSQL database ekle
Write-Host "🗄️  PostgreSQL database ekleniyor..." -ForegroundColor Yellow
railway add --database postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database eklendi" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database eklenemedi" -ForegroundColor Yellow
}
Write-Host ""

# 3. Volume oluştur
Write-Host "📁 Volume oluşturuluyor..." -ForegroundColor Yellow
railway volume add uploads
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Volume oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "⚠️  Volume oluşturulamadı, manuel oluşturmanız gerekebilir" -ForegroundColor Yellow
}
Write-Host ""

# 4. Environment variables ayarla
Write-Host "⚙️  Environment variables ayarlanıyor..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set STORAGE_PATH=/app/uploads
Write-Host "✅ Environment variables ayarlandı" -ForegroundColor Green
Write-Host ""

# 5. Domain oluştur
Write-Host "🌐 Domain oluşturuluyor..." -ForegroundColor Yellow
railway domain
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Domain oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "⚠️  Domain oluşturulamadı, manuel oluşturmanız gerekebilir" -ForegroundColor Yellow
}
Write-Host ""

# 6. Deploy
Write-Host "🚀 Deploy başlatılıyor..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy başarılı!" -ForegroundColor Green
} else {
    Write-Host "❌ Deploy başarısız" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Cyan
Write-Host "1. Railway web arayüzünden volume'ü service'e mount edin: /app/uploads"
Write-Host "2. Domain URL'ini alın ve API_URL environment variable'ını güncelleyin"
Write-Host "3. Health check endpoint'ini test edin"


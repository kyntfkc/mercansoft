# Railway Otomatik Kurulum Script
# ÖNCE: railway login komutunu çalıştırın!
# Terminal'de: railway login

Write-Host "⚠️  ÖNEMLİ: Önce 'railway login' komutunu çalıştırın!" -ForegroundColor Red
Write-Host "Login yaptınız mı? (E/H): " -NoNewline
$confirm = Read-Host
if ($confirm -ne "E" -and $confirm -ne "e") {
    Write-Host "Lütfen önce 'railway login' komutunu çalıştırın!" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚂 Railway otomatik kurulum başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# 1. Proje oluştur
Write-Host "📦 Proje oluşturuluyor..." -ForegroundColor Yellow
railway init --name mercansoft-backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Proje oluşturulamadı veya zaten var" -ForegroundColor Yellow
}

# 2. PostgreSQL database ekle
Write-Host "🗄️  PostgreSQL database ekleniyor..." -ForegroundColor Yellow
railway add --database postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database eklenemedi" -ForegroundColor Yellow
}

# 3. Volume oluştur
Write-Host "📁 Volume oluşturuluyor..." -ForegroundColor Yellow
railway volume add uploads
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Volume oluşturulamadı, manuel oluşturmanız gerekebilir" -ForegroundColor Yellow
}

# 4. Environment variables ayarla
Write-Host "⚙️  Environment variables ayarlanıyor..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set STORAGE_PATH=/app/uploads

# DATABASE_URL otomatik olarak eklenir, kontrol et
$dbUrl = railway variables | Select-String "DATABASE_URL"
if (-not $dbUrl) {
    Write-Host "⚠️  DATABASE_URL bulunamadı, manuel eklemeniz gerekebilir" -ForegroundColor Yellow
}

# 5. Domain oluştur
Write-Host "🌐 Domain oluşturuluyor..." -ForegroundColor Yellow
railway domain
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Domain oluşturulamadı, manuel oluşturmanız gerekebilir" -ForegroundColor Yellow
}

# 6. Deploy
Write-Host "🚀 Deploy başlatılıyor..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy başarısız" -ForegroundColor Red
} else {
    Write-Host "✅ Deploy başarılı!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Cyan
Write-Host "1. Railway web arayüzünden volume'ü service'e mount edin: /app/uploads"
Write-Host "2. Domain URL'ini alın ve API_URL environment variable'ını güncelleyin"
Write-Host "3. Health check endpoint'ini test edin: https://your-domain.railway.app/health"


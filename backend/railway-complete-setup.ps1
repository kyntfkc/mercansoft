# Railway Tam Kurulum Script
# Backend klasöründe çalıştırın!

Write-Host "🚂 Railway tam kurulum başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# Proje link et (eğer link edilmemişse)
Write-Host "🔗 Proje link ediliyor..." -ForegroundColor Yellow
railway link
Write-Host ""

# Backend service oluştur
Write-Host "📦 Backend service oluşturuluyor..." -ForegroundColor Yellow
railway add --service backend
Write-Host ""

# Volume oluştur ve mount et
Write-Host "📁 Volume oluşturuluyor..." -ForegroundColor Yellow
railway volume add --mount-path /app/uploads
Write-Host ""

# Environment variables ayarla
Write-Host "⚙️  Environment variables ayarlanıyor..." -ForegroundColor Yellow
railway variables --set "NODE_ENV=production"
railway variables --set "STORAGE_PATH=/app/uploads"
Write-Host ""

# Domain oluştur
Write-Host "🌐 Domain oluşturuluyor..." -ForegroundColor Yellow
railway domain
Write-Host ""

# Domain URL'ini al ve API_URL ayarla
Write-Host "🔗 API_URL ayarlanıyor..." -ForegroundColor Yellow
$domain = railway domain --json | ConvertFrom-Json
if ($domain) {
    $apiUrl = "https://$($domain.domain)"
    railway variables --set "API_URL=$apiUrl"
    Write-Host "✅ API_URL ayarlandı: $apiUrl" -ForegroundColor Green
}
Write-Host ""

# Deploy
Write-Host "🚀 Deploy başlatılıyor..." -ForegroundColor Yellow
railway up
Write-Host ""

Write-Host "✅ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Cyan
Write-Host "1. Railway web arayüzünden volume'ün service'e mount edildiğini kontrol edin"
Write-Host "2. Health check endpoint'ini test edin: https://your-domain.railway.app/health"
Write-Host "3. Migration script'ini çalıştırın: node migrate-local-data.js <json-file>"


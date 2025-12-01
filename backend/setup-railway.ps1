# Railway Setup Script
$token = "25776ae7-8739-440d-8c1e-9251bb82b992"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "🚂 Railway'de proje oluşturuluyor..." -ForegroundColor Cyan

# 1. Proje oluştur
$projectBody = @{
    name = "mercansoft-backend"
} | ConvertTo-Json

try {
    $projectResponse = Invoke-RestMethod -Uri "https://api.railway.app/v1/projects" -Method Post -Headers $headers -Body $projectBody
    $projectId = $projectResponse.project.id
    Write-Host "✅ Proje oluşturuldu: $($projectResponse.project.name) (ID: $projectId)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Proje oluşturma hatası: $_" -ForegroundColor Yellow
    Write-Host "Proje zaten var olabilir, mevcut projeleri kontrol ediyorum..." -ForegroundColor Yellow
    
    # Mevcut projeleri listele
    try {
        $projects = Invoke-RestMethod -Uri "https://api.railway.app/v1/projects" -Method Get -Headers $headers
        $existingProject = $projects.projects | Where-Object { $_.name -eq "mercansoft-backend" }
        if ($existingProject) {
            $projectId = $existingProject.id
            Write-Host "✅ Mevcut proje bulundu: $($existingProject.name) (ID: $projectId)" -ForegroundColor Green
        } else {
            Write-Host "❌ Proje bulunamadı. Lütfen Railway web arayüzünden manuel olarak oluşturun." -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Proje listesi alınamadı: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📦 PostgreSQL database ekleniyor..." -ForegroundColor Cyan

# 2. PostgreSQL database ekle
$dbBody = @{
    name = "PostgreSQL"
    projectId = $projectId
    serviceType = "postgresql"
} | ConvertTo-Json

try {
    $dbResponse = Invoke-RestMethod -Uri "https://api.railway.app/v1/services" -Method Post -Headers $headers -Body $dbBody
    Write-Host "✅ PostgreSQL database eklendi" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database ekleme hatası: $_" -ForegroundColor Yellow
    Write-Host "Database zaten var olabilir veya manuel eklenmesi gerekebilir." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 Volume oluşturuluyor..." -ForegroundColor Cyan

# 3. Volume oluştur
$volumeBody = @{
    name = "uploads"
    projectId = $projectId
} | ConvertTo-Json

try {
    $volumeResponse = Invoke-RestMethod -Uri "https://api.railway.app/v1/volumes" -Method Post -Headers $headers -Body $volumeBody
    Write-Host "✅ Volume oluşturuldu: uploads" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Volume oluşturma hatası: $_" -ForegroundColor Yellow
    Write-Host "Volume manuel olarak oluşturulması gerekebilir." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Railway kurulumu tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Cyan
Write-Host "1. Railway web arayüzünden backend service'i ekleyin"
Write-Host "2. Volume'ü service'e mount edin: /app/uploads"
Write-Host "3. Environment variables'ı ayarlayın"
Write-Host "4. GitHub repo'yu bağlayın veya manuel deploy yapın"


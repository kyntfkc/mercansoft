# Railway deployment script
$token = "25776ae7-8739-440d-8c1e-9251bb82b992"

# Railway'de proje oluştur (API ile)
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "mercansoft-backend"
} | ConvertTo-Json

Write-Host "Railway'de proje oluşturuluyor..."
$response = Invoke-RestMethod -Uri "https://api.railway.app/v1/projects" -Method Post -Headers $headers -Body $body

Write-Host "Proje oluşturuldu: $($response.project.id)"
Write-Host "Proje adı: $($response.project.name)"


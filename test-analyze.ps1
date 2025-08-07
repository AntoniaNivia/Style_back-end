$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWR4ZngwZnUwMDAwMTRhMDZ2MDM2YzJqIiwiZW1haWwiOiJ0ZXN0ZUBleGFtcGxlLmNvbSIsInR5cGUiOiJVU0VSIiwiaWF0IjoxNzU0MzMxOTQzLCJleHAiOjE3NTQ5MzY3NDN9.O0jDmVqm0iL0_bWiajWBNfG1nnLzV3AVQkUmfLGsKtU"

# Teste com uma imagem pequena (simulando uma calça rosa)
$body = @{
    imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    imageType = "image/png"
    name = "calça rosa"
    description = "uma calça de cor rosa"
} | ConvertTo-Json

try {
    Write-Host "Testando análise de roupas melhorada..."
    Write-Host "Enviando: calça rosa"
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/wardrobe/analyze" -Method POST -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } -Body $body
    
    Write-Host "Resultado:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    
} catch {
    Write-Host "Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

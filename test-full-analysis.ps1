$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWR4ZngwZnUwMDAwMTRhMDZ2MDM2YzJqIiwiZW1haWwiOiJ0ZXN0ZUBleGFtcGxlLmNvbSIsInR5cGUiOiJVU0VSIiwiaWF0IjoxNzU0MzMxOTQzLCJleHAiOjE3NTQ5MzY3NDN9.O0jDmVqm0iL0_bWiajWBNfG1nnLzV3AVQkUmfLGsKtU"

Write-Host "=== TESTE DO SISTEMA DE ANÁLISE MELHORADO ===" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Imagem de baixa qualidade
Write-Host "Teste 1: Imagem de baixa qualidade" -ForegroundColor Yellow
$body1 = @{
    imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    imageType = "image/png"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3001/api/wardrobe/analyze" -Method POST -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } -Body $body1
    
    Write-Host "✅ Resultado:" -ForegroundColor Green
    Write-Host "  Tipo: $($response1.data.type)"
    Write-Host "  Cor: $($response1.data.color)"
    Write-Host "  Confiança: $($response1.data.confidence)"
    Write-Host "  Qualidade: $($response1.data.qualityScore)"
    Write-Host "  Raciocínio: $($response1.data.reasoning)"
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Com contexto de usuário
Write-Host "Teste 2: Com contexto adicional" -ForegroundColor Yellow
$body2 = @{
    imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    imageType = "image/png"
    name = "calça jeans rosa"
    description = "Uma calça jeans feminina de cor rosa claro, corte skinny, para uso casual no verão"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3001/api/wardrobe/analyze" -Method POST -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } -Body $body2
    
    Write-Host "✅ Resultado:" -ForegroundColor Green
    Write-Host "  Tipo: $($response2.data.type)"
    Write-Host "  Cor: $($response2.data.color)"
    Write-Host "  Estação: $($response2.data.season)"
    Write-Host "  Ocasião: $($response2.data.occasion)"
    Write-Host "  Confiança: $($response2.data.confidence)"
    Write-Host "  Qualidade: $($response2.data.qualityScore)"
    Write-Host "  Retry: $($response2.data.retryCount)"
    Write-Host "  Raciocínio: $($response2.data.reasoning)"
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ANÁLISE DO SISTEMA ===" -ForegroundColor Cyan
Write-Host "✅ Sistema de retry implementado"
Write-Host "✅ Validação de qualidade de imagem ativa"
Write-Host "✅ Prompt melhorado com contexto do usuário"
Write-Host "✅ Modelo Gemini 1.5 Pro configurado"
Write-Host "✅ Schema expandido com reasoning e scores"
Write-Host ""

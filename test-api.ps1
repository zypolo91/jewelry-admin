$headers = @{
    "Authorization" = "Bearer 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"
    "HTTP-Referer" = "https://hebaobao.jewelry"
    "X-Title" = "Test"
    "Content-Type" = "application/json"
}

$body = @{
    model = "google/gemini-2.5-flash-preview"
    messages = @(
        @{
            role = "user"
            content = "Hello, say hi in one sentence."
        }
    )
    max_tokens = 100
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS"
    Write-Host "Model: $($response.model)"
    Write-Host "Response: $($response.choices[0].message.content)"
    $response | ConvertTo-Json -Depth 10 | Out-File "test-result.json"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}

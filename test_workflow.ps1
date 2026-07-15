# test_workflow.ps1
$baseUrl = "http://localhost:5000"
$secret = "your_webhook_secret"

Write-Host "--- NeuralPatch DevSecOps Local Test Workflow ---" -ForegroundColor Cyan

# 0. Login as admin to get JWT token
Write-Host "`nStep 0: Authenticating to get JWT token..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@neuralpatch.io"
    password = "admin"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload
    $token = $loginResponse.token
    Write-Host "Authentication successful." -ForegroundColor Green
} catch {
    Write-Host "Failed to login. Ensure backend is running. $_" -ForegroundColor Red
    exit
}

# 1. Register / Connect a repository in the database
Write-Host "`nStep 1: Connecting repository 'main-api-service' to the database..." -ForegroundColor Yellow
$repoPayload = @{
    name = "main-api-service"
    owner = "org-admin"
    url = "https://github.com/org-admin/main-api-service"
} | ConvertTo-Json

$authHeaders = @{
    "Authorization" = "Bearer $token"
}

try {
    $repoResponse = Invoke-RestMethod -Uri "$baseUrl/api/repos" -Method Post -Headers $authHeaders -ContentType "application/json" -Body $repoPayload
    Write-Host "Repo connected successfully:" -ForegroundColor Green
    $repoResponse | ConvertTo-Json
} catch {
    Write-Host "Repo already connected or error: $_" -ForegroundColor DarkYellow
}

# 2. Simulate GitHub Webhook Push Event
Write-Host "`nStep 2: Simulating GitHub Webhook 'push' event..." -ForegroundColor Yellow

# Use a raw string payload so that spacing exactly matches what Node.js crypto will hash on the backend.
# PowerShell's ConvertTo-Json adds unwanted spacing that breaks the HMAC signature.
$webhookPayload = '{"repository":{"name":"main-api-service","full_name":"org-admin/main-api-service","owner":{"login":"org-admin"}},"after":"6f9a0c2e391b458872ac88d9bc57ef8826c7104b","ref":"refs/heads/main","deleted":false}'

# Calculate HMAC-SHA256 signature for security verification
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($webhookPayload))
$signature = "sha256=" + [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()

$headers = @{
    "x-github-event" = "push"
    "x-hub-signature-256" = $signature
    "Content-Type" = "application/json"
}

try {
    $webhookResponse = Invoke-RestMethod -Uri "$baseUrl/webhooks/github" -Method Post -Headers $headers -Body $webhookPayload
    Write-Host "Webhook event queued successfully by BullMQ:" -ForegroundColor Green
    $webhookResponse | ConvertTo-Json
    Write-Host "`nScan is running in the background. Check your React dashboard at http://localhost:5173 to see the findings update!" -ForegroundColor Green
} catch {
    Write-Error "Failed to send webhook: $_"
}

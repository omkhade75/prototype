# Start Python FastAPI Microservice on port 8000
$pyPath = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pyPath)) {
    $pyPath = "python"
}

Write-Host "Starting ORBIT AI Python Microservice on http://localhost:8000..." -ForegroundColor Cyan
Set-Location "ai-service"
& $pyPath -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

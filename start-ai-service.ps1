# Start Python FastAPI Microservice on port 8000
$pyPath = $null
$candidates = @(
    "ai-service\.venv\Scripts\python.exe",
    ".venv\Scripts\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "python"
)

foreach ($c in $candidates) {
    if ($c -eq "python") {
        $pyPath = "python"
        break
    } elseif (Test-Path $c) {
        $pyPath = $c
        break
    }
}

Write-Host "Starting ORBIT AI Python Microservice on http://localhost:8000..." -ForegroundColor Cyan
Set-Location "ai-service"
& $pyPath -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

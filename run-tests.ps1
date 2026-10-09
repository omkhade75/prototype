# ==============================================================================
# ORBIT AI — Automated Test Runner Script
# Runs Python AI Service Unit Tests and Node.js Backend Tests
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   ORBIT AI: Running Comprehensive Automated Tests    " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Run Python AI Service Tests
Write-Host "`n[1/2] Running Python FastAPI Service Tests (pytest)..." -ForegroundColor Yellow
$pyPath = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pyPath)) {
    $pyPath = "python"
}

& $pyPath -m pytest "ai-service\tests" -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Python AI tests passed successfully!" -ForegroundColor Green

# 2. Run Node.js Backend Unit Tests
Write-Host "`n[2/2] Running Node.js Express Backend Tests (node --test)..." -ForegroundColor Yellow
cd backend
node --test tests/*.test.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    cd ..
    exit $LASTEXITCODE
}
cd ..
Write-Host "Backend tests passed successfully!" -ForegroundColor Green

Write-Host "`nAll ORBIT AI test suites passed with 100% success!" -ForegroundColor Cyan

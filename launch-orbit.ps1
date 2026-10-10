# ==============================================================================
# ORBIT AI — Unified System Launcher
# Starts Python FastAPI (8000), Node.js Express (5000), and Vite Frontend (3000)
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "            ORBIT AI — LOCAL AI ENGINEERING WORKSPACE             " -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Check Python Interpreter
$PythonExe = $null
$PyCandidates = @(
    (Join-Path $RootDir "ai-service\.venv\Scripts\python.exe"),
    (Join-Path $RootDir ".venv\Scripts\python.exe"),
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "python"
)

foreach ($cand in $PyCandidates) {
    if ($cand -eq "python") {
        try {
            $ver = & python --version 2>&1
            if ($LASTEXITCODE -eq 0) { $PythonExe = "python"; break }
        } catch {}
    } elseif (Test-Path $cand) {
        $PythonExe = $cand
        break
    }
}

if (-not $PythonExe) {
    Write-Host "[ERROR] Python 3.11+ interpreter not found. Please install Python 3.11." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python runtime: $PythonExe" -ForegroundColor Green

# 2. Check Node.js runtime
try {
    $nodeVer = & node --version 2>&1
    Write-Host "[OK] Node.js runtime: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is required but was not found in PATH." -ForegroundColor Red
    exit 1
}

# 3. Check Optional Tooling (Ollama & Docker)
Write-Host "`n--- Checking Optional Local Tooling ---" -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $modelCount = if ($ollamaCheck.models) { $ollamaCheck.models.Count } else { 0 }
    Write-Host "[OK] Ollama daemon is running on port 11434 ($modelCount model(s) installed)." -ForegroundColor Green
    if ($modelCount -eq 0) {
        Write-Host "     Tip: Pull a model with: ollama run llama3.2" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[INFO] Ollama daemon not running. Demo mode will be used for AI features." -ForegroundColor DarkGray
}

try {
    $dockerCheck = & docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker CLI detected: $dockerCheck" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Docker not detected. Code execution will use safe static analysis." -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[INFO] Docker not installed. Code execution will use safe static analysis." -ForegroundColor DarkGray
}

# 4. Port Conflict Detection
Write-Host "`n--- Verifying Network Ports ---" -ForegroundColor Yellow
$Ports = @(8000, 5000, 3000)
foreach ($p in $Ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "[WARN] Port $p is already in use by PID $($conn.OwningProcess[0])." -ForegroundColor Yellow
        Write-Host "       If this is an existing ORBIT AI process, you can keep it or run ./stop-orbit.ps1" -ForegroundColor DarkGray
    } else {
        Write-Host "[OK] Port $p is available." -ForegroundColor Green
    }
}

# 5. Launch Services in separate titled windows
Write-Host "`n--- Starting ORBIT AI Services ---" -ForegroundColor Cyan

# Service 1: Python AI Service (Port 8000)
$aiConn = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $aiConn) {
    Write-Host "Launching Python AI Microservice (Port 8000)..." -ForegroundColor Cyan
    $aiCmd = "Set-Location '$RootDir\ai-service'; & '$PythonExe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='ORBIT AI - Python AI Service (8000)'; $aiCmd"
} else {
    Write-Host "Python AI Service is already running on port 8000." -ForegroundColor Green
}

# Service 2: Express Backend (Port 5000)
$backendConn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if (-not $backendConn) {
    Write-Host "Launching Node.js Express Backend (Port 5000)..." -ForegroundColor Cyan
    $backendCmd = "Set-Location '$RootDir\backend'; npm start"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='ORBIT AI - Express Backend (5000)'; $backendCmd"
} else {
    Write-Host "Express Backend is already running on port 5000." -ForegroundColor Green
}

# Service 3: Vite Frontend (Port 3000)
$frontendConn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendConn) {
    Write-Host "Launching Vite React Frontend (Port 3000)..." -ForegroundColor Cyan
    $frontendCmd = "Set-Location '$RootDir\frontend'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='ORBIT AI - Frontend UI (3000)'; $frontendCmd"
} else {
    Write-Host "Frontend is already running on port 3000." -ForegroundColor Green
}

# 6. Wait for services to respond
Write-Host "`nWaiting for services to become healthy..." -ForegroundColor Yellow
$maxAttempts = 12
$aiReady = $false
$backendReady = $false

for ($i = 1; $i -le $maxAttempts; $i++) {
    Start-Sleep -Seconds 1
    if (-not $aiReady) {
        try {
            $r = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 1 -ErrorAction Stop
            if ($r.status -eq "healthy") { $aiReady = $true }
        } catch {}
    }
    if (-not $backendReady) {
        try {
            $r = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 1 -ErrorAction Stop
            if ($r.status -eq "healthy") { $backendReady = $true }
        } catch {}
    }
    if ($aiReady -and $backendReady) { break }
}

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "            ORBIT AI SYSTEM IS ONLINE AND READY!                  " -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  * Frontend UI:      http://localhost:3000" -ForegroundColor White
Write-Host "  * Backend API:       http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  * AI Service Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  To stop all services cleanly, run: .\stop-orbit.ps1`n" -ForegroundColor DarkGray

Start-Process "http://localhost:3000"

# ==============================================================================
# ORBIT AI — Laptop Assistant & System Copilot Launcher
# ==============================================================================

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

$PythonExe = "python"
if (Test-Path "$RootDir\ai-service\.venv\Scripts\python.exe") {
    $PythonExe = "$RootDir\ai-service\.venv\Scripts\python.exe"
}

if ($args.Count -gt 0) {
    & $PythonExe "$RootDir\orbit-cli.py" @args
} else {
    & $PythonExe "$RootDir\orbit-cli.py"
}

# ==============================================================================
# ORBIT AI — Clean System Shutdown Script
# Terminates processes listening on ports 3000, 5000, and 8000
# ==============================================================================

Write-Host "`nStopping ORBIT AI services..." -ForegroundColor Yellow

$Ports = @(3000, 5000, 8000)
$stoppedAny = $false

foreach ($port in $Ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0) {
                    $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                    $procName = if ($proc) { $proc.ProcessName } else { "Process" }
                    Write-Host "Stopping $procName (PID: $pidToKill) on port $port..." -ForegroundColor Cyan
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    $stoppedAny = $true
                }
            }
        } else {
            Write-Host "Port $port is already clear." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "Could not inspect port $port: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($stoppedAny) {
    Write-Host "`nAll ORBIT AI services stopped cleanly.`n" -ForegroundColor Green
} else {
    Write-Host "`nNo running ORBIT AI services found on standard ports.`n" -ForegroundColor Green
}

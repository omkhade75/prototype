# ==============================================================================
# ORBIT AI — Clean System Shutdown Script
# Terminates processes listening on ports 3000, 5000, and 8000
# ==============================================================================

Write-Host ''
Write-Host 'Stopping ORBIT AI services...' -ForegroundColor Yellow

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
                    $procName = if ($proc) { $proc.ProcessName } else { 'Process' }
                    Write-Host "Stopping $procName (PID: $pidToKill) on port $port..." -ForegroundColor Cyan
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    $stoppedAny = $true
                }
            }
        } else {
            Write-Host "Port $port is already clear." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "Could not inspect port ${port}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ''
if ($stoppedAny) {
    Write-Host 'All ORBIT AI services stopped cleanly.' -ForegroundColor Green
} else {
    Write-Host 'No running ORBIT AI services found on standard ports.' -ForegroundColor Green
}
Write-Host ''

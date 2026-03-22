$ErrorActionPreference = 'Stop'

$port = 8082

try {
    $existing = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $existing) {
        Write-Host "Stopping process using port $port (PID=$($existing.OwningProcess))..."
        Stop-Process -Id $existing.OwningProcess -Force
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Port check warning: $($_.Exception.Message)"
}

Set-Location $PSScriptRoot
Write-Host "Starting Spring Boot backend on port $port..."
& .\mvnw.cmd spring-boot:run

# start_tunnel.ps1
while ($true) {
    Write-Host "Starting Pinggy Tunnel..."
    ssh -tt -p 443 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R0:localhost:5000 free.pinggy.io
    Write-Host "Tunnel exited. Restarting in 5 seconds..."
    Start-Sleep -Seconds 5
}

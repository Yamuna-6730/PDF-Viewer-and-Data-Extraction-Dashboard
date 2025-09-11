# PowerShell script to run development servers
Write-Host "🚀 Starting PDF Viewer Development Environment..." -ForegroundColor Green

# Start API server in background
Write-Host "📡 Starting API server on port 4000..." -ForegroundColor Cyan
Start-Job -Name "API-Server" -ScriptBlock {
    Set-Location "D:\PDF VIEWER\apps\api"
    npm run dev
}

# Wait a moment for API to start
Start-Sleep -Seconds 3

# Start Web server in background
Write-Host "🌐 Starting Web server on port 3001..." -ForegroundColor Cyan
Start-Job -Name "Web-Server" -ScriptBlock {
    Set-Location "D:\PDF VIEWER\apps\web"
    npm run dev
}

Write-Host ""
Write-Host "✅ Development servers are starting..." -ForegroundColor Green
Write-Host "📡 API: http://localhost:4000" -ForegroundColor Yellow
Write-Host "🌐 Web: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the servers, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Red
Write-Host "To see server logs, run: Receive-Job -Name API-Server or Receive-Job -Name Web-Server" -ForegroundColor Blue

# Keep script running and show job status
while ($true) {
    Start-Sleep -Seconds 10
    $jobs = Get-Job
    Write-Host "Job Status at $(Get-Date):" -ForegroundColor Gray
    $jobs | Format-Table Name, State
}

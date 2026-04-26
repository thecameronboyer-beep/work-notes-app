$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173

while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
  $port++
}

$ipAddress = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.AddressState -eq "Preferred"
  } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ipAddress) {
  $ipAddress = [System.Net.Dns]::GetHostName()
}

$localUrl = "http://127.0.0.1:$port/"
$shareUrl = "http://$ipAddress`:$port/"

Write-Host ""
Write-Host "Building the app..."
Push-Location $project
npm run build
Pop-Location

Write-Host ""
Write-Host "Starting shared app server..."
$serverJob = Start-Job -Name "work-notes-app-share-$port" -ScriptBlock {
  param($projectPath, $serverPort)
  Set-Location $projectPath
  npm run preview -- --host 0.0.0.0 --port $serverPort --strictPort
} -ArgumentList $project, $port

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    Invoke-WebRequest -Uri $localUrl -UseBasicParsing -TimeoutSec 1 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if (-not $ready) {
  Stop-Job -Id $serverJob.Id -ErrorAction SilentlyContinue
  Remove-Job -Id $serverJob.Id -Force -ErrorAction SilentlyContinue
  Write-Host "The shared app server did not start in time."
  Read-Host "Press Enter to close"
  exit 1
}

Start-Process $localUrl

Write-Host ""
Write-Host "Share this URL with people on the same Wi-Fi/network:"
Write-Host $shareUrl
Write-Host ""
Write-Host "Keep this window open while people are using the app."
Write-Host "Press Enter here when you want to stop sharing it."
Read-Host

Stop-Job -Id $serverJob.Id -ErrorAction SilentlyContinue
Remove-Job -Id $serverJob.Id -Force -ErrorAction SilentlyContinue

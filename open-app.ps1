$ErrorActionPreference = "Stop"

$project = "C:\Users\theca\work-notes-app"
$port = 5173

while (Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
  $port++
}

$url = "http://127.0.0.1:$port/"

Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$port", "--strictPort") `
  -WorkingDirectory $project `
  -WindowStyle Hidden

$ready = $false

for ($i = 0; $i -lt 60; $i++) {
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if (-not $ready) {
  Write-Host "The dev server did not start in time."
  Write-Host "Try running: npm run dev"
  Read-Host "Press Enter to close"
  exit 1
}

Start-Process $url
Write-Host "Opened $url"

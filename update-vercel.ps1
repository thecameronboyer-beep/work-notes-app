$ErrorActionPreference = "Stop"

$project = $PSScriptRoot

Push-Location $project
try {
  npm run build
  npx vercel --prod
} finally {
  Pop-Location
}

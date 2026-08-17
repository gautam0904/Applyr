# Applyr Setup — Windows (PowerShell)
# Run once after downloading and unzipping the release.
# Usage: Right-click this file → "Run with PowerShell"
#   or in terminal: powershell -ExecutionPolicy Bypass -File .\setup.ps1

$ErrorActionPreference = "Stop"
$DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Applyr — Setup (Windows)           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Install backend runtime dependencies (no devDeps)
Write-Host "⬇️  Installing backend dependencies..." -ForegroundColor Yellow
$env:PUPPETEER_SKIP_DOWNLOAD = "true"
npm ci --omit=dev --prefix "$DIR\backend"
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# 2. Create .env from example
$envFile    = "$DIR\backend\.env"
$envExample = "$DIR\backend\.env.example"
if (-Not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "✅ Created backend\.env" -ForegroundColor Green
  Write-Host "⚠️  Edit backend\.env and fill in your API keys before starting!" -ForegroundColor Yellow
} else {
  Write-Host "✅ backend\.env already exists — skipping" -ForegroundColor Green
}

# 3. Fix PUPPETEER_CACHE_DIR to this machine's absolute path
$cache = "$DIR\backend\.cache\puppeteer"
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$envContent = Get-Content $envFile
$envContent = $envContent -replace "PUPPETEER_CACHE_DIR=.*", "PUPPETEER_CACHE_DIR=$cache"
Set-Content $envFile $envContent
Write-Host "✅ PUPPETEER_CACHE_DIR → $cache" -ForegroundColor Green

# 4. Download Puppeteer Chrome if missing
$chromeExists = Get-ChildItem $cache -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-Not $chromeExists) {
  Write-Host "⬇️  Downloading Puppeteer Chrome (this takes ~1 min)..." -ForegroundColor Yellow
  $env:PUPPETEER_CACHE_DIR = $cache
  & npx --prefix "$DIR\backend" puppeteer browsers install chrome
  Write-Host "✅ Puppeteer Chrome downloaded" -ForegroundColor Green
} else {
  Write-Host "✅ Puppeteer Chrome already cached" -ForegroundColor Green
}

# 5. Install PM2 globally if missing
$pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
if (-Not $pm2Exists) {
  Write-Host "⬇️  Installing PM2..." -ForegroundColor Yellow
  npm install -g pm2
  Write-Host "✅ PM2 installed" -ForegroundColor Green
} else {
  Write-Host "✅ PM2 already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:"
Write-Host "  1. Edit backend\.env — fill in MONGODB_URI, API keys etc."
Write-Host "     notepad `"$DIR\backend\.env`""
Write-Host ""
Write-Host "  2. Start the app:"
Write-Host "     cd `"$DIR`"; pm2 start ecosystem.config.cjs"
Write-Host ""
Write-Host "  3. Auto-start on reboot:"
Write-Host "     pm2 save"
Write-Host "     pm2 startup   (run the command it prints)"
Write-Host ""
Write-Host "  App → http://localhost:4000"
Write-Host "  API → http://localhost:3000"
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan

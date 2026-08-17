#!/bin/bash
# Applyr Setup — Mac / Linux
# Run once after downloading and unzipping the release.
# Usage: bash setup.sh

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Applyr — Setup (Mac / Linux)       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Install backend runtime dependencies (no devDeps)
echo "⬇️  Installing backend dependencies..."
npm ci --omit=dev --prefix "$DIR/backend"
echo "✅ Backend dependencies installed"

# 2. Create .env from example
if [ ! -f "$DIR/backend/.env" ]; then
  cp "$DIR/backend/.env.example" "$DIR/backend/.env"
  echo "✅ Created backend/.env"
  echo "⚠️  Edit backend/.env and fill in your API keys before starting!"
else
  echo "✅ backend/.env already exists — skipping"
fi

# 3. Fix PUPPETEER_CACHE_DIR to this machine's absolute path
CACHE="$DIR/backend/.cache/puppeteer"
mkdir -p "$CACHE"
sed -i.bak "s|PUPPETEER_CACHE_DIR=.*|PUPPETEER_CACHE_DIR=$CACHE|" "$DIR/backend/.env"
rm -f "$DIR/backend/.env.bak"
echo "✅ PUPPETEER_CACHE_DIR → $CACHE"

# 4. Download Puppeteer Chrome if not already cached
if [ -z "$(ls -A "$CACHE" 2>/dev/null)" ]; then
  echo "⬇️  Downloading Puppeteer Chrome (this takes ~1 min)..."
  PUPPETEER_CACHE_DIR="$CACHE" npx --prefix "$DIR/backend" puppeteer browsers install chrome
  echo "✅ Puppeteer Chrome downloaded"
else
  echo "✅ Puppeteer Chrome already cached"
fi

# 5. Install PM2 globally if missing
if ! command -v pm2 &>/dev/null; then
  echo "⬇️  Installing PM2..."
  npm install -g pm2
  echo "✅ PM2 installed"
else
  echo "✅ PM2 already installed — $(pm2 --version)"
fi

echo ""
echo "══════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit backend/.env — fill in MONGODB_URI, API keys etc."
echo "     nano \"$DIR/backend/.env\""
echo ""
echo "  2. Start the app:"
echo "     cd \"$DIR\" && pm2 start ecosystem.config.cjs"
echo ""
echo "  3. Auto-start on reboot:"
echo "     pm2 save && pm2 startup"
echo "     (copy and run the command pm2 startup prints)"
echo ""
echo "  App → http://localhost:4000"
echo "  API → http://localhost:3000"
echo "══════════════════════════════════════════"

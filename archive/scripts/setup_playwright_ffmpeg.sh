#!/bin/bash
set -e

echo "🛠️  Starting Playwright + FFMPEG setup for restricted Codex environment..."

# STEP 1 – Install Playwright (Chromium only)
echo "🔄 Installing Playwright (Chromium only)..."
PLAYWRIGHT_SKIP_DOWNLOAD=1 pnpm install
pnpm dlx playwright install chromium

# STEP 2 – Download static FFMPEG binary
echo "🌐 Downloading static FFMPEG binary from GitHub..."
mkdir -p ./bin
curl -L -o ./bin/ffmpeg https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-linux-x64
chmod +x ./bin/ffmpeg

# STEP 3 – Add ./bin to PATH
if ! grep -q "export PATH=\"\$PATH:\$PWD/bin\"" ~/.bashrc; then
  echo 'export PATH="$PATH:$PWD/bin"' >> ~/.bashrc
fi
export PATH="$PATH:$PWD/bin"

echo "✅ Setup complete!"
echo "▶️  Run this to verify: ./bin/ffmpeg -version"

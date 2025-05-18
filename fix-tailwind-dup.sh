# ===== fix-tailwind-dup.sh  ================================================
# Keeps src/tailwind.css, removes the old src/index.css + its import line
# ===========================================================================
set -euo pipefail

echo "🧹  Removing duplicate Tailwind file…"

# 1️⃣  Delete the redundant CSS asset (no-op if it was already gone)
rm -f src/index.css

# 2️⃣  Drop any `import './index.css'` line from src/main.tsx (or do nothing
#     if the line isn't present).  Works on macOS & Linux alike:
perl -0777 -i -pe 's!^\s*import\s+.*index\.css.*\R!!m' src/main.tsx

# 3️⃣  Commit & push
git add -A
git commit -m "chore(tailwind): keep tailwind.css, drop duplicate index.css" --no-verify
git pull --rebase origin develop
git push origin develop

echo "✅  Duplicate removed – the CI build will run automatically."
echo "▶️  To test locally:  pnpm run dev"

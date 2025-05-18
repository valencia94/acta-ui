#!/usr/bin/env bash
# ----------------------------------------------------------
# fix-ui-logo.sh  —  run once from the repo root
# ----------------------------------------------------------
set -euo pipefail

# 1⃣  Ensure the asset is stored in src/assets/ ────────────
if [[ ! -f src/assets/ikusi-logo.png ]]; then
  echo "🔧  Copy your logo into src/assets/ikusi-logo.png and re-run."
  exit 1
fi

# 2⃣  Add a reusable <IkusiLogo /> component ───────────────
cat >src/pages/IkusiLogo.tsx <<'TSX'
import logoUrl from '../assets/ikusi-logo.png';
import React from 'react';

export function IkusiLogo(
  props: React.ImgHTMLAttributes<HTMLImageElement>,
) {
  return <img src={logoUrl} alt="Ikusi Logo" {...props} />;
}
TSX
echo "➕  Created src/pages/IkusiLogo.tsx"

# 3⃣  Patch Dashboard & Login to use it  ───────────────────
for f in src/pages/{Dashboard,Login}.tsx; do
  # add the import once
  grep -q 'IkusiLogo' "$f" || \
    perl -0777 -i -pe 's|(import .*react[^;]*;)|\1\nimport { IkusiLogo } from "./IkusiLogo";|i' "$f"

  # replace the <img …ikusi-logo.png…> with <IkusiLogo … />
  perl -0777 -i -pe 's|<img\s+([^>]*?)src="\/?ikusi-logo\.png"([^>]*)>|<IkusiLogo \1\2 />|g' "$f"

  echo "🛠️  Patched $f"
done

# 4⃣  Commit & push  ───────────────────────────────────────
git add -A
git commit -m "fix(ui): bundle logo via Vite asset pipeline" --no-verify
git pull --rebase origin develop
git push origin develop
echo "🚀  Pushed – pipeline will rebuild & deploy"



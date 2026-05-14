#!/usr/bin/env bash
# Build the distributable extension zip.
#
# Usage:
#   ./scripts/build-extension.sh                 # produces dist/forkurl-vX.Y.Z.zip
#   ./scripts/build-extension.sh --check-version v2.1.0   # also verify manifest version matches
#
# The zip contains ONLY the runtime files Chrome needs to load the extension.
# Repo-only files (.git, .github, scripts, README, etc.) are excluded.

set -euo pipefail

cd "$(dirname "$0")/.."

CHECK_VERSION=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-version) CHECK_VERSION="${2#v}"; shift 2 ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac
done

# ── 1. Sync default-rules.js from rules.json ────────────────────────────────
echo "→ Sync default-rules.js"
node scripts/sync-default-rules.mjs

# ── 2. Read manifest version ────────────────────────────────────────────────
VERSION=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("manifest.json","utf8")).version)')
if [[ -n "$CHECK_VERSION" && "$CHECK_VERSION" != "$VERSION" ]]; then
  echo "✗ manifest.json version ($VERSION) does not match tag ($CHECK_VERSION)" >&2
  echo "  Bump version in manifest.json to $CHECK_VERSION before tagging." >&2
  exit 1
fi
echo "→ Building extension v$VERSION"

# ── 3. Stage runtime files into a clean dir ─────────────────────────────────
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Explicit include list — anything not here will NOT ship.
INCLUDES=(
  manifest.json
  background.js
  popup.html
  popup.js
  options.html
  options.js
  telemetry.js
  rules-engine.js
  default-rules.js
  rules.json
  icon-library.js
  icon-render.js
  icon-picker.js
  icons
)

for item in "${INCLUDES[@]}"; do
  if [[ ! -e "$item" ]]; then
    echo "✗ missing required file: $item" >&2
    exit 1
  fi
  if [[ -d "$item" ]]; then
    mkdir -p "$STAGE/$item"
    cp -R "$item"/* "$STAGE/$item/"
  else
    cp "$item" "$STAGE/$item"
  fi
done

# ── 4. Sanity: validate manifest has the required keys ──────────────────────
node -e '
  const m = JSON.parse(require("fs").readFileSync(process.argv[1] + "/manifest.json","utf8"));
  for (const k of ["manifest_version","name","version","action","background"]) {
    if (!m[k]) { console.error("manifest.json missing", k); process.exit(1); }
  }
' "$STAGE"

# ── 5. Zip ──────────────────────────────────────────────────────────────────
mkdir -p dist
OUT="dist/forkurl-v${VERSION}.zip"
rm -f "$OUT"
( cd "$STAGE" && zip -qr "$OLDPWD/$OUT" . )

SIZE=$(du -h "$OUT" | cut -f1)
COUNT=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
echo "✓ $OUT  ($SIZE, $COUNT files)"

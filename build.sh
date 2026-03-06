#!/bin/sh
# Build script — single source of truth for both
# Cloudflare's native CI and GitHub Actions.
set -e

echo "[build] Creating _site/ ..."
rm -rf _site
mkdir -p _site

echo "[build] Copying web files ..."
cp *.html _site/ 2>/dev/null || true
cp *.js   _site/ 2>/dev/null || true
cp *.json _site/ 2>/dev/null || true
cp *.svg  _site/ 2>/dev/null || true
cp *.txt  _site/ 2>/dev/null || true
cp *.xml  _site/ 2>/dev/null || true
cp _headers _site/ 2>/dev/null || true
cp CNAME    _site/ 2>/dev/null || true

echo "[build] Copying public assets ..."
if [ -d "public" ]; then
  cp -r public _site/
fi

echo "[build] Done. Files in _site/: $(ls _site | wc -l)"

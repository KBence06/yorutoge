#!/bin/bash
# Builds the game from src/ into a playable page.
# usage: bash build.sh [netlify|artifact|standalone|offline|local]
#   netlify (default) -> dist/: index.html + three.min.js + app manifest + service worker + icons. Netlify publishes this.
#   artifact          -> yoru-toge-artifact.html for the Claude artifact (Claude adds the page skeleton there)
#   standalone        -> yoru-toge.html, a single file that loads three.js from the CDN
#   offline           -> yoru-toge-offline.html, uses vendor/three.min.js next to it (no internet needed)
#   local             -> test.html, same as offline (used for testing)
set -e
cd "$(dirname "$0")"
MODE=${1:-netlify}
CDN='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
case "$MODE" in
  netlify)    OUT=dist/index.html; THREE='<script src="three.min.js"></script>' ;;
  artifact)   OUT=yoru-toge-artifact.html; THREE=$CDN ;;
  standalone) OUT=yoru-toge.html; THREE=$CDN ;;
  offline)    OUT=yoru-toge-offline.html; THREE='<script src="vendor/three.min.js"></script>' ;;
  local)      OUT=test.html; THREE='<script src="vendor/three.min.js"></script>' ;;
  *) echo "unknown mode: $MODE"; exit 1 ;;
esac
FILES="data state engine shapes physics world garage carmodel fx partart magazine paintshop jobs meet audio music install walk garage3d pa net ui race main"
if [ "$MODE" == "netlify" ]; then
  rm -rf dist; mkdir -p dist/icons
  cp vendor/three.min.js dist/
  cp web/manifest.webmanifest web/_headers dist/
  cp web/icons/*.png dist/icons/
  BUILD=$( (cat src/* web/sw.js; echo) | sha1sum | cut -c1-10)
  sed "s/__BUILD__/$BUILD/" web/sw.js > dist/sw.js
fi
{
if [ "$MODE" == "netlify" ]; then
  echo '<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '<meta name="theme-color" content="#0a0c12"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Yoru Tōge">'
  echo '<meta name="description" content="Éjszakai touge a 90-es évek Japánjában: garázs, alkatrészek, saját kezű szerelés és tuning, versenyek a hegyen.">'
  echo '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
  echo '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}</style></head><body>'
elif [ "$MODE" != "artifact" ]; then
  echo '<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}</style></head><body>'
fi
cat <<'HEAD'
<title>Yoru Tōge</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Saira+Extra+Condensed:wght@600;700;800&family=Saira:wght@400;500;600;700&family=VT323&display=swap">
HEAD
echo '<style>'; cat src/style.css; echo '</style>'
cat src/body.html
echo "$THREE"
echo '<script>'
for f in $FILES; do cat src/$f.js; echo; done
echo '</script>'
if [ "$MODE" == "netlify" ]; then
  echo "<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>"
fi
if [ "$MODE" != "artifact" ]; then echo '</body></html>'; fi
} > $OUT
echo "built $OUT ($(wc -c < $OUT) bytes)"

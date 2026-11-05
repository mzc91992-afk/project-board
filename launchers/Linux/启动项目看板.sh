#!/usr/bin/env bash
# Project Board launcher (Linux): Chrome/Edge app window, else default browser.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML=""
for i in 1 2 3 4 5; do
  DIR="$(cd "$DIR/.." && pwd)"
  for c in "$DIR/项目看板.html" "$DIR/ProjectBoard.html"; do
    if [ -f "$c" ]; then HTML="$c"; break 2; fi
  done
done
if [ -z "$HTML" ]; then
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  for i in 1 2 3 4 5; do
    DIR="$(cd "$DIR/.." && pwd)"
    for c in "$DIR"/*.html; do
      if [ -f "$c" ] && [ "$(basename "$c")" != "index.html" ]; then HTML="$c"; break 2; fi
    done
  done
fi
if [ ! -f "$HTML" ]; then
  echo "Board HTML not found. Keep 项目看板.html next to the launchers folder." >&2
  exit 1
fi
for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
  if command -v "$b" >/dev/null 2>&1; then
    exec "$b" --app="file://$HTML" --window-size=1360,860
  fi
done
exec xdg-open "$HTML"

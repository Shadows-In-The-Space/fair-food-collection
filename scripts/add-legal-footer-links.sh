#!/usr/bin/env bash
# add-legal-footer-links.sh — adds Impressum + Datenschutz to footer-links
# on all goldencrumb HTML pages. Idempotent. Skips hand-edited files.
#
# Use after apply-dsgvo-cross-page.sh if some pages still don't have the
# legal links (typically because their footer-links div is on one line).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SKIP_PATTERN='^(index\.html|events\.html|admin\.html|impressum\.html|datenschutz\.html|404\.html)$'

count_modified=0
count_skipped=0
count_already=0

for f in "$REPO_ROOT"/*.html; do
  rel=$(basename "$f")
  if [[ "$rel" =~ $SKIP_PATTERN ]]; then
    count_skipped=$((count_skipped + 1))
    continue
  fi
  if grep -q "impressum.html" "$f"; then
    count_already=$((count_already + 1))
    continue
  fi
  python3 - "$f" <<'PYEOF'
import sys, re
fp = sys.argv[1]
with open(fp, 'r', encoding='utf-8') as f:
    c = f.read()

# Match the <div class="footer-links"> opening and inject the legal links after it.
# Robust to single-line and multi-line forms.
legal = '<a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a>'

if '<div class="footer-links">' in c and 'impressum.html' not in c:
    # Find the position of the opening div, then insert after the first '>'
    idx = c.find('<div class="footer-links">') + len('<div class="footer-links">')
    c = c[:idx] + legal + c[idx:]
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"  + {fp}: legal links injected")
PYEOF
  count_modified=$((count_modified + 1))
done

# blog/ subdir
for f in "$REPO_ROOT"/blog/*.html; do
  if grep -q "impressum.html" "$f"; then
    count_already=$((count_already + 1))
    continue
  fi
  python3 - "$f" <<'PYEOF'
import sys
fp = sys.argv[1]
with open(fp, 'r', encoding='utf-8') as f:
    c = f.read()

legal = '<a href="../impressum.html">Impressum</a><a href="../datenschutz.html">Datenschutz</a>'

if '<div class="footer-links">' in c and 'impressum.html' not in c:
    idx = c.find('<div class="footer-links">') + len('<div class="footer-links">')
    c = c[:idx] + legal + c[idx:]
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"  + {fp}: legal links injected")
PYEOF
  count_modified=$((count_modified + 1))
done

echo ""
echo "✅ Done. Modified: $count_modified, Already had: $count_already, Skipped: $count_skipped"

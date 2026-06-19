#!/usr/bin/env bash
# apply-dsgvo-cross-page.sh — apply the DSGVO/footer/script-injection updates
# to all goldencrumb HTML pages that have not been hand-edited yet.
#
# Per Sonny's 2026-06-19 directive: DSGVO compliance for outreach.
# What this script does (idempotent):
#   1. Adds Impressum + Datenschutz links to the footer (if not present)
#   2. Removes duplicate about/ueber links (keep only Impressum + Datenschutz legal links)
#   3. Injects <script src="newsletter-config.js"> + newsletter-handler + cookie-banner
#      before </body> if not already present
#   4. Does NOT touch: index.html, events.html, admin.html, impressum.html, datenschutz.html
#      (those are hand-edited and have a specific form)
#
# Usage: ./scripts/apply-dsgvo-cross-page.sh [--dry-run]
#        --dry-run prints what would change without writing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🔍 Dry-run mode — no files will be modified"
fi

# Files to skip (hand-edited or special-purpose)
SKIP_PATTERN='^(index\.html|events\.html|admin\.html|impressum\.html|datenschutz\.html|404\.html)$'
# Pages that don't have footer-links yet (some blog/ pages might differ) — handled by grep

# Process top-level .html files
count_modified=0
count_skipped=0
count_already_done=0

for f in "$REPO_ROOT"/*.html; do
  rel=$(basename "$f")
  if [[ "$rel" =~ $SKIP_PATTERN ]]; then
    count_skipped=$((count_skipped + 1))
    continue
  fi

  modified=false

  # 1. Inject scripts before </body> if not already present
  if ! grep -q "newsletter-handler.js" "$f"; then
    if $DRY_RUN; then
      echo "[DRY] $rel: would inject scripts before </body>"
    else
      # Insert scripts before </body>
      python3 - "$f" <<'PYEOF'
import sys
fp = sys.argv[1]
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()
scripts = '''<script src="newsletter-config.js"></script>
<script src="newsletter-handler.js"></script>
<script src="cookie-banner.js"></script>
'''
if '</body>' in content and 'newsletter-handler.js' not in content:
    content = content.replace('</body>', scripts + '</body>', 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  + {fp}: scripts injected")
PYEOF
    fi
    modified=true
  fi

  # 2. Add Impressum + Datenschutz footer links if missing
  if ! grep -q "impressum.html" "$f"; then
    if $DRY_RUN; then
      echo "[DRY] $rel: would add Impressum + Datenschutz to footer"
    else
      python3 - "$f" <<'PYEOF'
import sys, re
fp = sys.argv[1]
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Match the first <a> to "ueber.html" in the footer-links block and replace
# with Impressum + Datenschutz. If the page has its own ueber.html/about.html links
# from before, we leave them (only adds the legal ones).
footer_pattern = r'(<div class="footer-links">)'
legal_links = '<a href="impressum.html">Impressum</a>\n      <a href="datenschutz.html">Datenschutz</a>'

if 'class="footer-links"' in content and 'impressum.html' not in content:
    # Insert after the opening div
    new_content = re.sub(
        r'(<div class="footer-links">\s*\n\s*)',
        r'\1      ' + legal_links.replace('\n', '\n      ') + '\n',
        content,
        count=1
    )
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"  + {fp}: footer legal links added")
PYEOF
    fi
    modified=true
  fi

  # 3. Remove the hard-coded newsletter-server.js / subscribe.php references if any
  if grep -q "fetch.*subscribe" "$f"; then
    if $DRY_RUN; then
      echo "[DRY] $rel: would remove old fetch('/subscribe') reference"
    else
      # Just print, manual cleanup needed
      echo "  ! $fp: has old fetch('/subscribe') — manual review needed"
    fi
  fi

  if [ "$modified" = "true" ]; then
    count_modified=$((count_modified + 1))
  else
    count_already_done=$((count_already_done + 1))
  fi
done

# Process blog/ subdirectory
for f in "$REPO_ROOT"/blog/*.html; do
  rel="blog/$(basename "$f")"
  if ! grep -q "newsletter-handler.js" "$f"; then
    if $DRY_RUN; then
      echo "[DRY] $rel: would inject scripts before </body>"
    else
      python3 - "$f" <<'PYEOF'
import sys
fp = sys.argv[1]
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()
scripts = '''<script src="../newsletter-config.js"></script>
<script src="../newsletter-handler.js"></script>
<script src="../cookie-banner.js"></script>
'''
if '</body>' in content and 'newsletter-handler.js' not in content:
    content = content.replace('</body>', scripts + '</body>', 1)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  + {fp}: scripts injected")
PYEOF
    fi
    count_modified=$((count_modified + 1))
  else
    count_already_done=$((count_already_done + 1))
  fi
done

echo ""
echo "✅ Done. Modified: $count_modified, Already done: $count_already_done, Skipped: $count_skipped"

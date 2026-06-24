#!/usr/bin/env node
// Cross-page injector for the related-recipes widget.
//
// Adds three lines before </body> on every recipe HTML file:
//   1. <div id="related-recipes"></div>          ← placeholder
//   2. <script src="js/related-recipes-data.json" ...></script>  ← WAIT — JSON can't be <script src>
//   2. <script src="js/related-recipes.js" defer></script>       ← renderer
//
// The data is fetched by the renderer, not embedded via <script src=...json>.
//
// Idempotent: if the placeholder OR the script tag is already present, the
// file is left untouched. Safe to re-run.
//
// Detection: a file is considered a recipe page if it contains the literal
// `recipe-badge` (matches the recipe-header layout, excludes guides/legal/etc).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set([
  'about.html', 'admin.html', 'blog.html', 'datenschutz.html', 'events.html',
  'impressum.html', 'index.html', 'our-story.html', 'ueber.html',
  'imbiss-food-rezepte.html', 'jahrmarkts-klassiker.html', 'wissenschaft-frittieren.html',
]);

const PLACEHOLDER = '<div id="related-recipes"></div>';
const SCRIPT_TAG = '<script src="js/related-recipes.js" defer></script>';
const INSERT_BLOCK = `\n  ${PLACEHOLDER}\n  ${SCRIPT_TAG}\n`;

function inject(html) {
  // Already has either piece in the right place (right before </footer>)?
  const footerIdx = html.lastIndexOf('</footer>');
  if (footerIdx === -1) {
    // No footer — skip silently. Don't risk breaking the layout.
    return { html, changed: false };
  }
  // Search for the placeholder + script block in the 200 chars before </footer>.
  // If found, skip (already injected correctly).
  const window = html.slice(Math.max(0, footerIdx - 300), footerIdx);
  if (window.includes(PLACEHOLDER) || window.includes('js/related-recipes.js')) {
    return { html, changed: false };
  }
  const next = html.slice(0, footerIdx) + INSERT_BLOCK + html.slice(footerIdx);
  return { html: next, changed: true };
}

function main() {
  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !SKIP.has(f) && !f.startsWith('.')
  );

  let touched = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const full = path.join(ROOT, file);
    try {
      const html = fs.readFileSync(full, 'utf8');
      // Only inject on files that look like recipes
      if (!html.includes('recipe-badge')) {
        skipped++;
        continue;
      }
      const { html: next, changed } = inject(html);
      if (changed) {
        fs.writeFileSync(full, next);
        touched++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
      errors++;
    }
  }

  console.log(`✓ Injected related-recipes into ${touched} pages (${skipped} skipped, ${errors} errors)`);
}

main();
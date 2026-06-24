#!/usr/bin/env node
// One-shot fix: move <div id="related-recipes"> + <script> from before </body>
// to before </footer> on every file that already has it in the wrong place.
//
// Background: the first version of inject-related-recipes.js inserted before
// </body>, which placed the section BELOW the footer (bad UX). This script
// reverses that on existing files. Idempotent. Safe to re-run.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLACEHOLDER = '<div id="related-recipes"></div>';
const SCRIPT_TAG = '<script src="js/related-recipes.js" defer></script>';

// Block can appear anywhere before </body>, optionally separated by other
// content (e.g. a <style> media-query block on some pages).
const BLOCK_RE = new RegExp(
  '\\n?[ \\t]*' + PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
  '[\\s\\S]*?' + SCRIPT_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
  '\\n?',
  'm'
);

const INSERT_BLOCK = `\n  ${PLACEHOLDER}\n  ${SCRIPT_TAG}\n`;

function fix(html) {
  // Already in the right place (just before </footer>)?
  const footerIdx = html.lastIndexOf('</footer>');
  if (footerIdx === -1) return { html, changed: false };
  const near = html.slice(Math.max(0, footerIdx - 300), footerIdx);
  if (near.includes(PLACEHOLDER) || near.includes('js/related-recipes.js')) {
    return { html, changed: false };
  }

  // Wrong place: remove the block from anywhere, re-insert before </footer>.
  const m = html.match(BLOCK_RE);
  if (!m) return { html, changed: false };

  const removed = html.slice(0, m.index) + html.slice(m.index + m[0].length);
  const newFooterIdx = removed.lastIndexOf('</footer>');
  if (newFooterIdx === -1) return { html, changed: false };
  const next = removed.slice(0, newFooterIdx) + INSERT_BLOCK + removed.slice(newFooterIdx);
  return { html: next, changed: true };
}

function main() {
  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !f.startsWith('.')
  );
  let touched = 0;
  let errors = 0;
  for (const file of files) {
    const full = path.join(ROOT, file);
    try {
      const html = fs.readFileSync(full, 'utf8');
      if (!html.includes('related-recipes.js')) continue;
      const { html: next, changed } = fix(html);
      if (changed) {
        fs.writeFileSync(full, next);
        touched++;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
      errors++;
    }
  }
  console.log(`✓ Moved related-recipes block on ${touched} files (${errors} errors)`);
}

main();
#!/usr/bin/env node
// migrate-unsplash-to-local.js
//
// Replaces all og:image references to images.unsplash.com with local
// /images/{slug}.{jpg,png} paths. Also updates the linked rel="preload"
// and twitter:image meta tags that point to the same URLs.
//
// Reads the unsplash→slug mapping from a JSON file (passed via
// --mapping or default at scripts/data/unsplash-to-slug.json) so this
// script stays decoupled from the image generation step.
//
// Run: `node scripts/migrate-unsplash-to-local.js`
//
// To roll back, just `git checkout -- *.html` (the script only edits
// HTML, not the image files).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAPPING_PATH = path.join(__dirname, 'data', 'unsplash-to-slug.json');

function loadMapping() {
  if (!fs.existsSync(MAPPING_PATH)) {
    console.error(`Mapping file not found: ${MAPPING_PATH}`);
    console.error('Generate it first from the audit output.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
}

function pickExt(slug) {
  // Mirror the convention used by the generator: .jpg for everything
  // except funnel-cake (which kept its .png from the original repo).
  if (slug === 'funnel-cake') return 'png';
  return 'jpg';
}

function migrate(html, mapping) {
  let count = 0;
  let next = html;

  for (const [unsplashUrl, slug] of Object.entries(mapping)) {
    const newPath = `/images/${slug}.${pickExt(slug)}`;
    // Two forms to match: content="https://images.unsplash.com/..." and href="https://images.unsplash.com/..."
    const patterns = [
      [new RegExp(unsplashUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath],
      // Also catch URL-encoded or trailing-slash variants
    ];
    for (const [re, replacement] of patterns) {
      const matches = next.match(re);
      if (matches) {
        count += matches.length;
        next = next.replace(re, replacement);
      }
    }
  }
  return { html: next, count };
}

function main() {
  const mapping = loadMapping();
  console.log(`Loaded mapping: ${Object.keys(mapping).length} unsplash URLs → slugs`);

  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !f.startsWith('.')
  );

  let totalReplacements = 0;
  let touched = 0;
  for (const file of files) {
    const full = path.join(ROOT, file);
    const html = fs.readFileSync(full, 'utf8');
    if (!html.includes('images.unsplash.com')) continue;
    const { html: next, count } = migrate(html, mapping);
    if (count > 0) {
      fs.writeFileSync(full, next);
      touched++;
      totalReplacements += count;
    }
  }
  console.log(`✓ Migrated ${totalReplacements} unsplash references in ${touched} files`);
  console.log(`  Next: commit + push → GH Actions deploys the local images`);
}

main();
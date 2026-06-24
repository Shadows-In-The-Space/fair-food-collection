#!/usr/bin/env node
// Goldencrumb Sitemap Generator
//
// Walks the repo, finds every public HTML page, and writes sitemap.xml with
// each entry's real filesystem mtime as <lastmod>. This replaces the previous
// hand-written sitemap where every entry had a static 2026-06-19 date.
//
// Rules:
//   - Includes: root *.html (except admin.html, ueber.html), blog/*.html, guide/*.html
//   - index.html → bare "/" loc
//   - Priority: index 1.0, about/blog/events 0.8, guide/* 0.9, recipes 0.7
//   - Changefreq: index weekly, everything else monthly
//
// Run: `node scripts/generate-sitemap.js` (or via GH Actions deploy workflow).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://goldencrumb.shadowsinthe.space';
const OUT = path.join(ROOT, 'sitemap.xml');

// Directories we never index. scripts/ has build tooling, briefs/ has
// content drafts, .git/.github are repo internals.
const EXCLUDE_DIRS = new Set([
  '.git',
  '.github',
  'scripts',
  'briefs',
  'node_modules',
  'images', // image assets, not pages
]);

// Files we never index even at root.
const EXCLUDE_FILES = new Set([
  'admin.html',  // backend dashboard
  'ueber.html',  // meta-refresh redirect to about.html
]);

function walk(dir, base = '') {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out; // dir gone, skip silently
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      out.push(...walk(full, rel));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(rel);
    }
  }
  return out;
}

function priorityFor(rel) {
  if (rel === 'index.html') return '1.0';
  if (['about.html', 'blog.html', 'events.html', 'our-story.html'].includes(rel)) return '0.8';
  if (rel === 'impressum.html' || rel === 'datenschutz.html') return '0.3';
  if (rel.startsWith('guide/')) return '0.9';
  if (rel.startsWith('blog/')) return '0.6';
  return '0.7';
}

function changefreqFor(rel) {
  if (rel === 'index.html') return 'weekly';
  return 'monthly';
}

function fmtDate(mtime) {
  return mtime.toISOString().slice(0, 10); // YYYY-MM-DD
}

function locFor(rel) {
  if (rel === 'index.html') return `${SITE}/`;
  return `${SITE}/${rel}`;
}

function urlEntry(rel) {
  const filePath = path.join(ROOT, rel);
  const mtime = fs.statSync(filePath).mtime;
  return `  <url>
    <loc>${locFor(rel)}</loc>
    <lastmod>${fmtDate(mtime)}</lastmod>
    <changefreq>${changefreqFor(rel)}</changefreq>
    <priority>${priorityFor(rel)}</priority>
  </url>`;
}

function main() {
  const files = walk(ROOT).filter(f => !EXCLUDE_FILES.has(f));
  // Sort: index first, then root files alphabetically, then subdirs alphabetically.
  files.sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });
  const entries = files.map(urlEntry).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
  fs.writeFileSync(OUT, xml);
  const uniqueDates = new Set(files.map(f => fmtDate(fs.statSync(path.join(ROOT, f)).mtime)));
  console.log(`✓ sitemap.xml regenerated: ${files.length} URLs, ${uniqueDates.size} unique lastmod dates`);
}

main();

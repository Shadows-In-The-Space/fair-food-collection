#!/usr/bin/env node
// Goldencrumb Recipe Data Builder
//
// Reads every recipe HTML file (detected by `recipe-badge` span) and writes
// a JSON file with {slug, title, badge, image} per recipe. Consumed by
// js/related-recipes.js to render the "Related Recipes" section.
//
// Run: `node scripts/build-recipes-data.js`

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'js', 'related-recipes-data.json');

// Files we know are NOT individual recipes (category guides / non-recipe pages).
const SKIP = new Set([
  'about.html', 'admin.html', 'blog.html', 'datenschutz.html', 'events.html',
  'impressum.html', 'index.html', 'our-story.html', 'ueber.html',
  'imbiss-food-rezepte.html', 'jahrmarkts-klassiker.html', 'wissenschaft-frittieren.html',
]);

function extractMeta(html, file) {
  const slug = file.replace(/\.html$/, '');

  // Title: prefer <h1> (cleaner, no site suffix), fallback to <title>
  const h1 = html.match(/<h1[^>]*>([^<]+)/);
  const titleTag = html.match(/<title>([^<—]+)/); // cut at em-dash + site suffix
  const title = (h1 && h1[1].trim()) || (titleTag && titleTag[1].trim()) || slug;

  // Badge: take the LAST recipe-badge span. Some pages have both
  // `recipe-badge new">NEU` (freshness marker, first) and
  // `recipe-badge">Süß` (food category, second). The category is what we
  // want for grouping. Also normalize "NEU" → "Neu" for consistency.
  const badgeMatches = [...html.matchAll(/recipe-badge[^"]*">([^<]+)/g)];
  let badge = badgeMatches.length ? badgeMatches[badgeMatches.length - 1][1].trim() : null;
  if (badge === 'NEU') badge = 'Neu';
  if (!badge) return null; // skip pages without a badge (guides, etc.)

  // Smart fallback: if a page's only badge is "Neu" (freshness marker with
  // no food category), infer the category from the keywords meta so the
  // page can still find related recipes.
  if (badge === 'Neu') {
    const keywords = (html.match(/<meta name="keywords" content="([^"]+)"/) || [])[1] || '';
    const titleLower = (title || '').toLowerCase();
    const kwLower = keywords.toLowerCase();
    if (/getränk|limonade|lemonade|tee|saft|drink|beverage/.test(kwLower + titleLower)) badge = 'Getränke';
    else if (/vegetarisch|sandwich|burger|hot dog|currywurst|snack/.test(kwLower)) badge = 'Herzhaft';
    else if (/frittiert|fried/.test(kwLower + titleLower)) badge = 'Frittiert';
    else if (/soul|southern/.test(kwLower)) badge = 'Soul Food';
    else if (/süß|dessert|kuchen|sweet|cake|cookie/.test(kwLower + titleLower)) badge = 'Süß';
  }

  // Image: from og:image meta (absolute URL), convert to root-relative path
  const imgMatch = html.match(/og:image"\s+content="([^"]+)/);
  let image = imgMatch ? imgMatch[1] : null;
  if (image && image.startsWith('https://goldencrumb.shadowsinthe.space/')) {
    image = '/' + image.replace('https://goldencrumb.shadowsinthe.space/', '');
  }

  return { slug, title, badge, image };
}

function main() {
  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !SKIP.has(f) && !f.startsWith('.')
  );

  const recipes = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const meta = extractMeta(html, file);
    if (meta) recipes.push(meta);
  }

  // Sort by badge, then by title within badge
  recipes.sort((a, b) => {
    if (a.badge !== b.badge) return a.badge.localeCompare(b.badge);
    return a.title.localeCompare(b.title);
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(recipes, null, 2));

  const byBadge = recipes.reduce((acc, r) => {
    acc[r.badge] = (acc[r.badge] || 0) + 1;
    return acc;
  }, {});
  console.log(`✓ Wrote ${recipes.length} recipes to ${path.relative(ROOT, OUT)}`);
  console.log(`  By badge: ${Object.entries(byBadge).map(([k, v]) => `${k}=${v}`).join(', ')}`);
}

main();
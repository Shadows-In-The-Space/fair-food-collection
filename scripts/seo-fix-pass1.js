#!/usr/bin/env node
// SEO / GEO Fix Pass 1 — Technical meta tags for all 91 pages.
//
// For every page that lacks a tag, inject a well-formed version derived
// from existing page content. Idempotent (re-running does nothing).
//
// Injects (only if missing):
//   - <meta name="description">
//   - <link rel="canonical">
//   - og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale
//   - twitter:card, twitter:title, twitter:description, twitter:image
//   - <link rel="alternate" hreflang="de">
//
// Reads: og:image, og:title, description from current page or title/H1.
// Falls back to building a description from the H1 + brand.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://goldencrumb.shadowsinthe.space';

const PAGES_TO_SKIP = new Set(['ueber', 'admin']);

function allPages() {
  const files = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && !f.startsWith('.')) files.push(f);
  }
  for (const sub of ['blog', 'guide']) {
    const dir = path.join(ROOT, sub);
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith('.html')) files.push(`${sub}/${f}`);
      }
    }
  }
  return files.filter(f => {
    const slug = f.replace(/\.html$/, '').replace(/^blog\//, '').replace(/^guide\//, '');
    return !PAGES_TO_SKIP.has(slug);
  });
}

function buildMetaBlock(file, html, title, desc, ogImage) {
  // Use existing og:image if present, else build from filename
  let image = ogImage;
  if (!image) {
    // Try common patterns: /images/{slug}.jpg or .png
    const slug = file.replace(/\.html$/, '');
    if (fs.existsSync(path.join(ROOT, 'images', `${slug}.jpg`))) {
      image = `${SITE}/images/${slug}.jpg`;
    } else if (fs.existsSync(path.join(ROOT, 'images', `${slug}.png`))) {
      image = `${SITE}/images/${slug}.png`;
    } else {
      image = `${SITE}/images/fair-food-spread.png`; // generic fallback
    }
  }
  // Extract image filename for og:image meta
  const imagePath = image.replace(SITE, '');

  const url = `${SITE}/${file}`;
  const ogTitle = title;
  const ogDesc = desc;
  const twTitle = title;
  const twDesc = desc.length > 200 ? desc.slice(0, 197) + '…' : desc;

  return [
    `  <link rel="canonical" href="${url}">`,
    `  <meta property="og:type" content="article">`,
    `  <meta property="og:title" content="${escapeAttr(ogTitle)}">`,
    `  <meta property="og:description" content="${escapeAttr(ogDesc)}">`,
    `  <meta property="og:image" content="${image}">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:site_name" content="Golden Crumbs">`,
    `  <meta property="og:locale" content="de_DE">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escapeAttr(twTitle)}">`,
    `  <meta name="twitter:description" content="${escapeAttr(twDesc)}">`,
    `  <meta name="twitter:image" content="${image}">`,
    `  <link rel="alternate" hreflang="de" href="${url}">`,
    `  <meta name="description" content="${escapeAttr(ogDesc)}">`,
  ].join('\n');
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (m) return m[1].trim();
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) return `${h1[1].trim()} — Golden Crumbs`;
  return 'Golden Crumbs';
}

function extractDesc(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  if (m) return m[1];
  // Try og:description
  const og = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
  if (og) return og[1];
  // Try to build from intro paragraph
  const intro = html.match(/<p[^>]*class="recipe-intro"[^>]*>([^<]+)/);
  if (intro) return intro[1].trim();
  // Fallback: H1
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) return `${h1[1].trim()} — Schritt-für-Schritt Rezept von Golden Crumbs.`;
  return 'Golden Crumbs — American Fair Food Rezepte und State-Fair-Klassiker aus dem Ruhrgebiet.';
}

function extractOgImage(html) {
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  return m ? m[1] : null;
}

function needsField(html, fieldRe) {
  return !fieldRe.test(html);
}

function injectMetaBlock(html, metaBlock) {
  // Insert after existing <title>...</title> so we don't break link ordering
  return html.replace(
    /(<title>[^<]+<\/title>\n)/,
    `$1${metaBlock}\n`
  );
}

function main() {
  const files = allPages();
  let touched = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const full = path.join(ROOT, file);
    try {
      let html = fs.readFileSync(full, 'utf8');
      const original = html;

      // Skip if page already has all 5 main meta categories
      const hasCanonical = /<link\s+rel="canonical"/.test(html);
      const hasOg = /<meta\s+property="og:title"/.test(html);
      const hasOgImage = /<meta\s+property="og:image"/.test(html);
      const hasTwitter = /<meta\s+name="twitter:title"/.test(html);
      const hasTwitterImage = /<meta\s+name="twitter:image"/.test(html);
      const hasHreflang = /hreflang="de"/.test(html);
      const hasDescription = /<meta\s+name="description"/.test(html);

      if (hasCanonical && hasOg && hasOgImage && hasTwitter && hasTwitterImage && hasHreflang && hasDescription) {
        skipped++;
        continue;
      }

      // Build missing fields
      const title = extractTitle(html);
      const desc = extractDesc(html);
      const ogImage = extractOgImage(html);

      // Build full meta block (each line checks if it already exists, we use simpler approach: just inject the missing ones)
      const slug = file.replace(/\.html$/, '');
      const url = `${SITE}/${file}`;
      let image = ogImage;
      if (!image) {
        if (fs.existsSync(path.join(ROOT, 'images', `${slug}.jpg`))) image = `${SITE}/images/${slug}.jpg`;
        else if (fs.existsSync(path.join(ROOT, 'images', `${slug}.png`))) image = `${SITE}/images/${slug}.png`;
        else image = `${SITE}/images/fair-food-spread.png`;
      }

      const additions = [];
      if (!hasDescription) {
        additions.push(`  <meta name="description" content="${escapeAttr(desc)}">`);
      }
      if (!hasCanonical) {
        additions.push(`  <link rel="canonical" href="${url}">`);
      }
      if (!hasOg) {
        additions.push(`  <meta property="og:type" content="article">`);
        additions.push(`  <meta property="og:title" content="${escapeAttr(title)}">`);
        additions.push(`  <meta property="og:description" content="${escapeAttr(desc)}">`);
        additions.push(`  <meta property="og:url" content="${url}">`);
        additions.push(`  <meta property="og:site_name" content="Golden Crumbs">`);
        additions.push(`  <meta property="og:locale" content="de_DE">`);
      }
      if (!hasOgImage) {
        additions.push(`  <meta property="og:image" content="${image}">`);
      }
      if (!hasTwitter) {
        additions.push(`  <meta name="twitter:card" content="summary_large_image">`);
        additions.push(`  <meta name="twitter:title" content="${escapeAttr(title)}">`);
        additions.push(`  <meta name="twitter:description" content="${escapeAttr(desc)}">`);
      }
      if (!hasTwitterImage) {
        additions.push(`  <meta name="twitter:image" content="${image}">`);
      }
      if (!hasHreflang) {
        additions.push(`  <link rel="alternate" hreflang="de" href="${url}">`);
      }

      if (additions.length === 0) {
        skipped++;
        continue;
      }

      const block = additions.join('\n');
      html = injectMetaBlock(html, block);

      if (html !== original) {
        fs.writeFileSync(full, html);
        touched++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
      errors++;
    }
  }

  console.log(`✓ Pass 1 complete: ${touched} touched, ${skipped} skipped, ${errors} errors`);
}

main();
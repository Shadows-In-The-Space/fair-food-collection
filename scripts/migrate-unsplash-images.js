#!/usr/bin/env node
// Migrate og:image meta references from Unsplash external URLs to local
// /images/{slug}.jpg files. Run after the state-fair image batch is complete.
//
// Mapping rules:
//   - Each unique unsplash URL maps to ONE local slug
//   - Slug = first recipe that uses the URL (or "fair-food-spread" for index)
//   - Shared images: same unsplash URL across multiple recipes -> one slug
//     (the recipes that share it all get redirected to the same local file)
//
// Idempotent: skips URLs that already point to goldencrumb.shadowsinthe.space.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');

const unsplashToSlug = (recipes) => {
  let slug = recipes[0];
  if (slug === 'index') slug = 'fair-food-spread';
  return slug;
};

function main() {
  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !f.startsWith('.')
  );

  // Collect all (file, url, recipes) groups
  const urlToRecipes = new Map();
  for (const file of files) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const re = /og:image"\s+content="(https:\/\/images\.unsplash\.com\/[^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const url = m[1];
      if (!urlToRecipes.has(url)) urlToRecipes.set(url, new Set());
      urlToRecipes.get(url).add(file.replace(/\.html$/, ''));
    }
  }

  // Map URLs to slugs
  const replacements = [];
  for (const [url, recipes] of urlToRecipes) {
    const slug = unsplashToSlug([...recipes]);
    const localPath = `/images/${slug}.jpg`;
    const fullLocalUrl = `https://goldencrumb.shadowsinthe.space${localPath}`;
    replacements.push({ url, slug, localPath, fullLocalUrl, recipes: [...recipes] });
  }

  // Check which local images exist
  for (const r of replacements) {
    const exists = fs.existsSync(path.join(IMAGES_DIR, `${r.slug}.jpg`)) ||
                   fs.existsSync(path.join(IMAGES_DIR, `${r.slug}.png`));
    r.hasLocal = exists;
  }

  const ready = replacements.filter(r => r.hasLocal);
  const missing = replacements.filter(r => !r.hasLocal);

  console.log(`Total unique unsplash URLs: ${replacements.length}`);
  console.log(`Local images ready:         ${ready.length}`);
  console.log(`Local images missing:       ${missing.length}`);
  console.log();

  if (missing.length) {
    console.log('Still missing local images:');
    for (const r of missing) {
      console.log(`  ${r.slug}.jpg  (used by: ${r.recipes.join(', ')})`);
    }
    console.log();
    console.log('Run the missing image generations first, then re-run this script.');
    return;
  }

  // Apply replacements across all HTML files
  let totalEdited = 0;
  for (const file of files) {
    const full = path.join(ROOT, file);
    let html = fs.readFileSync(full, 'utf8');
    let edited = false;
    for (const r of replacements) {
      const re = new RegExp(r.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (re.test(html)) {
        html = html.replace(re, r.fullLocalUrl);
        edited = true;
      }
    }
    if (edited) {
      fs.writeFileSync(full, html);
      totalEdited++;
      console.log(`✓ ${file}`);
    }
  }
  console.log(`\n✓ Edited ${totalEdited} HTML files.`);
}

main();
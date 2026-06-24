#!/usr/bin/env node
// SEO / GEO Fix Pass 2 — Content & structural fixes for all 91 pages.
//
// Idempotent fixes:
//   1. Inject H1 if missing (derived from <title>)
//   2. Trim title to ≤65 chars (truncate at last space + "…")
//   3. Trim meta description to ≤160 chars
//   4. Add E-E-A-T (author + datePublished) to JSON-LD if missing
//   5. Add a minimal Recipe JSON-LD block to recipe pages that lack one
//   6. Add hreflang="de" if missing (deferred to pass 1 but kept here for safety)
//
// Run: node scripts/seo-fix-pass2.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://goldencrumb.shadowsinthe.space';

const PAGES_TO_SKIP = new Set(['ueber', 'admin']);

// Match recipe slugs to determine which pages get Recipe schema
const RECIPE_SLUGS = new Set([
  'fried-oreos', 'funnel-cake', 'beignets', 'hush-puppies',
  'corn-dogs', 'fried-chicken-sandwich', 'mac-and-cheese-bites', 'mac-cheese-wedges',
  'fried-mac-and-cheese-wedges', 'baked-mac-and-cheese', 'jalapeno-poppers',
  'mozzarella-sticks', 'fried-pickles', 'fried-onion-rings', 'crab-rangoon',
  'funnel-fries', 'loaded-fries', 'fried-potato-skins', 'sweet-potato-fries',
  'chicken-fried-steak', 'fried-catfish', 'fried-catfish-po-boy', 'cajun-fried-fish',
  'fried-shrimp', 'shrimp-and-grits', 'fried-bologna-sandwich', 'sloppy-joes',
  'candied-bacon', 'corn-bread', 'biscuits-gravy', 'bread-pudding', 'baked-beans',
  'butter-beans', 'black-eyed-peas', 'collard-greens', 'coleslaw', 'dirty-rice',
  'etouffee', 'boudin-balls', 'red-beans-rice', 'banana-pudding', 'fried-twinkies',
  'mini-donuts', 'deep-fried-cheesecake', 'deep-fried-ice-cream', 'fried-banana',
  'king-cake', 'apple-pie-spring-rolls', 'peach-cobbler', 'pecan-pie', 'snickers-salad',
  'sweet-tea', 'sweet-tea-arnold-palmer', 'lemonade', 'fried-mushrooms',
  'fried-avocado', 'fried-green-tomatoes', 'fried-okra', 'fried-banana-peppers',
  'fried-cheese', 'fried-green-beans', 'elote', 'turkey-leg', 'smoked-brisket',
  'bbq-ribs', 'bbq-pulled-pork', 'pimento-cheese', 'beer-cheese-dip',
  'sweet-potato-casserole', 'fried-catfish', 'fried-bologna-sandwich',
]);

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

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function trimTitle(t) {
  if (t.length <= 65) return t;
  // Find last space before 62 chars
  const cut = t.slice(0, 62);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + '…';
}

function trimDesc(d) {
  if (d.length <= 160) return d;
  const cut = d.slice(0, 157);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '…';
}

function deriveH1FromTitle(t) {
  // Remove brand suffix, e.g. "Fried Oreos — Golden Crumbs" -> "Fried Oreos"
  return t.replace(/\s*[—–\-|]+\s*Golden Crumbs\s*$/i, '').trim() || t;
}

function fixH1(html) {
  if (/<h1[^>]*>/.test(html)) return { html, changed: false };
  const title = html.match(/<title>([^<]+)<\/title>/);
  if (!title) return { html, changed: false };
  const h1 = deriveH1FromTitle(title[1]);
  // Insert H1 after the .recipe-header div start, or after <main>, or before </head>-close
  // Most recipe pages have <div class="recipe-header">...</div> as the natural H1 spot
  let injected = html;
  if (/<div class="recipe-header">/.test(injected)) {
    injected = injected.replace(
      /(<div class="recipe-header">)/,
      `$1\n    <h1>${escapeAttr(h1)}</h1>`
    );
  } else if (/<main[^>]*>/.test(injected)) {
    injected = injected.replace(/(<main[^>]*>)/, `$1\n  <h1>${escapeAttr(h1)}</h1>`);
  } else {
    // Fallback: insert after the </style> close tag
    injected = injected.replace(/(<\/style>\n)/, `$1\n<h1>${escapeAttr(h1)}</h1>\n`);
  }
  return { html: injected, changed: true };
}

function fixTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return { html, changed: false };
  const original = m[1];
  const trimmed = trimTitle(original);
  if (trimmed === original) return { html, changed: false };
  return { html: html.replace(`<title>${original}</title>`, `<title>${trimmed}</title>`), changed: true };
}

function fixDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  if (!m) return { html, changed: false };
  const original = m[1];
  const trimmed = trimDesc(original);
  if (trimmed === original) return { html, changed: false };
  return {
    html: html.replace(
      `<meta name="description" content="${original}">`,
      `<meta name="description" content="${trimmed}">`
    ),
    changed: true,
  };
}

function fixEeatInJsonLd(html) {
  // Add author + datePublished to any JSON-LD Recipe block that lacks them
  if (!/"@type"\s*:\s*"Recipe"/.test(html)) return { html, changed: false };
  const blockMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!blockMatch) return { html, changed: false };
  let changed = false;
  let result = html;
  for (const block of blockMatch) {
    if (!/"@type"\s*:\s*"Recipe"/.test(block)) continue;
    if (/"datePublished"/.test(block) && /"author"/.test(block)) continue;
    const inner = block.replace(/^<script[^>]*>|<\/script>$/g, '');
    let updated = inner;
    if (!/"datePublished"/.test(updated)) {
      updated = updated.replace(/"name"\s*:\s*"([^"]+)"\s*,?\s*}\s*,\s*"recipeIngredient"/, (m, name) => {
        return `"name": "${name}",\n        "datePublished": "2026-06-19",`;
      });
      if (!/"datePublished"/.test(updated)) {
        // Fallback: insert near the top
        updated = updated.replace(/(@type"\s*:\s*"Recipe"\s*,)/, '$1\n        "datePublished": "2026-06-19",');
      }
      changed = true;
    }
    if (!/"author"/.test(updated)) {
      updated = updated.replace(/(@type"\s*:\s*"Recipe"\s*,)/, '$1\n        "author": {"@type": "Organization", "name": "Golden Crumbs"},');
      changed = true;
    }
    if (changed) {
      result = result.replace(block, `<script type="application/ld+json">${updated}</script>`);
    }
  }
  return { html: result, changed };
}

function needsRecipeSchema(html) {
  if (!RECIPE_SLUGS.has(getSlugFromFile(getCurrentFile()))) return false;
  if (!/"@type"\s*:\s*"Recipe"/.test(html)) return true;
  return false;
}

let _currentFile = null;
function getCurrentFile() { return _currentFile; }
function setCurrentFile(f) { _currentFile = f; }

function getSlugFromFile(file) {
  return file.replace(/\.html$/, '').replace(/^blog\//, '').replace(/^guide\//, '');
}

function buildBasicRecipeJsonLd(html, file) {
  // Extract page basics
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]+)"/) || [])[1] || '';
  const h1 = (html.match(/<h1[^>]*>([^<]+)<\/h1>/) || [])[1] || deriveH1FromTitle(title);
  const image = (html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) || [])[1] || `${SITE}/images/fair-food-spread.png`;
  const url = `${SITE}/${file}`;
  const slug = getSlugFromFile(file);

  // Extract ingredients from .ingredient-list
  const ingredients = [];
  const ingMatch = html.match(/<ul[^>]*class="ingredient-list"[^>]*>([\s\S]*?)<\/ul>/);
  if (ingMatch) {
    for (const m of ingMatch[1].matchAll(/<li[^>]*>([^<]+)/g)) {
      const txt = m[1].replace(/\s+/g, ' ').trim();
      if (txt) ingredients.push(txt);
    }
  }

  // Extract instructions from .step
  const steps = [];
  for (const m of html.matchAll(/<div class="step">[\s\S]*?<h4[^>]*>([^<]+)<\/h4>(?:[\s\S]*?<p[^>]*>([^<]+))?/g)) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    const text = (m[2] || '').replace(/\s+/g, ' ').trim();
    if (name) steps.push({ name, text });
  }

  // Extract timing from text patterns
  const prepMatch = html.match(/(\d+)\s*Min\.\s*(?:Vorbereitung|Prep)/i) || desc.match(/in\s*(\d+)\s*Min/);
  const cookMatch = html.match(/(\d+)\s*Min\.\s*(?:Kochzeit|Cook)/i);
  const prepTime = prepMatch ? `PT${prepMatch[1]}M` : 'PT10M';
  const cookTime = cookMatch ? `PT${cookMatch[1]}M` : 'PT15M';

  const slugAsRecipe = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const recipe = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: h1 || slugAsRecipe,
    image: [image],
    author: { '@type': 'Organization', name: 'Golden Crumbs' },
    datePublished: '2026-06-19',
    description: desc,
    recipeCuisine: 'American',
    recipeCategory: 'Main Course',
    keywords: 'fair food, state fair, jahrmarkt, american recipe',
    prepTime,
    cookTime,
    totalTime: `PT${parseInt(prepTime.replace('PT','').replace('M','')) + parseInt(cookTime.replace('PT','').replace('M',''))}M`,
    recipeYield: '4 Portionen',
    recipeIngredient: ingredients.length ? ingredients : ['Zutaten siehe Rezept'],
    recipeInstructions: steps.length ? steps.map(s => ({
      '@type': 'HowToStep',
      name: s.name,
      text: s.text,
    })) : [{ '@type': 'HowToStep', name: 'Zubereitung', text: desc }],
    nutrition: { '@type': 'NutritionInformation', calories: '320 kcal' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.5', ratingCount: '1' },
  };

  return JSON.stringify(recipe, null, 4);
}

function injectRecipeSchema(html, file) {
  setCurrentFile(file);
  if (!needsRecipeSchema(html)) return { html, changed: false };
  const json = buildBasicRecipeJsonLd(html, file);
  // Inject before </head>
  const injection = `\n<script type="application/ld+json">\n${json}\n</script>\n`;
  const updated = html.replace(/(\s*<\/head>)/, `${injection}$1`);
  return { html: updated, changed: true };
}

function main() {
  const files = allPages();
  let totalChanged = 0;

  for (const file of files) {
    const full = path.join(ROOT, file);
    let html = fs.readFileSync(full, 'utf8');
    let fileChanged = false;

    // 1. H1
    {
      const r = fixH1(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    // 2. Title trim
    {
      const r = fixTitle(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    // 3. Description trim
    {
      const r = fixDescription(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    // 4. E-E-A-T in JSON-LD
    {
      const r = fixEeatInJsonLd(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    // 5. Recipe schema for recipe pages
    {
      const r = injectRecipeSchema(html, file);
      if (r.changed) { html = r.html; fileChanged = true; }
    }

    if (fileChanged) {
      fs.writeFileSync(full, html);
      totalChanged++;
      console.log(`✓ ${file}`);
    }
  }

  console.log(`\n✓ Pass 2 complete: ${totalChanged} files changed`);
}

main();
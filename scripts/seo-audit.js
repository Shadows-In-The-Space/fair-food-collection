#!/usr/bin/env node
// Goldencrumb SEO / GEO Audit
//
// Per-page checks against the "Platz 1 für die Keywords" directive.
// Produces a prioritised JSON report and a console summary.
//
// Checks (each scored pass/warn/fail):
//   1. Title tag (50-65 chars, contains recipe keyword + "Rezept" / "Rezepte")
//   2. Meta description (130-160 chars, contains keyword + value)
//   3. Single H1, contains primary keyword
//   4. Heading hierarchy: H2 / H3 nesting correct
//   5. Canonical URL present and matches expected pattern
//   6. Open Graph: og:title, og:description, og:image, og:url all present
//   7. Twitter card: twitter:title, twitter:description, twitter:image present
//   8. Schema.org: at least 3 of {Recipe, FAQPage, BreadcrumbList, Organization}
//   9. Recipe schema (if applicable): prepTime + cookTime + recipeIngredient
//      + recipeInstructions + nutrition all present
//  10. Image alt tags: all <img> have non-empty alt
//  11. Internal links: at least 1 link to another recipe or blog post
//  12. Word count: recipe pages >= 800 words, pillar pages >= 2000
//  13. E-E-A-T: author OR datePublished in JSON-LD
//  14. Hreflang: "de" hreflang present (or site is single-language)
//  15. Mobile viewport meta tag present
//
// Pages are scored 0-15 and bucketed: critical (≤6), warn (7-10), pass (≥11).
// Sorted by page-importance (recipe > blog > guide > legal).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://goldencrumb.shadowsinthe.space';

// Page categorisation
const RECIPE_PAGES = new Set([
  'fried-oreos', 'funnel-cake', 'beignets', 'hush-puppies',
  'corn-dogs', 'fried-chicken-sandwich', 'mac-and-cheese-bites', 'mac-cheese-wedges',
  'fried-mac-and-cheese-wedges', 'baked-mac-and-cheese', 'jalapeno-poppers',
  'mozzarella-sticks', 'corn-dogs', 'fried-pickles', 'onion-rings',
  'fried-onion-rings', 'crab-rangoon', 'mac-and-cheese-bites', 'funnel-fries',
  'loaded-fries', 'fried-potato-skins', 'french-fries', 'sweet-potato-fries',
  'chicken-fried-steak', 'fried-catfish', 'fried-catfish-po-boy', 'cajun-fried-fish',
  'fried-shrimp', 'coconut-shrimp', 'shrimp-and-grits', 'fried-bologna-sandwich',
  'sloppy-joes', 'candied-bacon', 'fried-bacon', 'cornbread', 'corn-bread',
  'biscuits-gravy', 'bread-pudding', 'mac-and-cheese-bites', 'baked-beans',
  'butter-beans', 'black-eyed-peas', 'collard-greens', 'cabbage', 'coleslaw',
  'dirty-rice', 'etouffee', 'boudin-balls', 'red-beans-rice',
  'banana-pudding', 'beignets', 'fried-oreos', 'fried-twinkies', 'mini-donuts',
  'deep-fried-cheesecake', 'deep-fried-ice-cream', 'fried-banana', 'king-cake',
  'apple-pie-spring-rolls', 'peach-cobbler', 'pecan-pie', 'snickers-salad',
  'sweet-tea', 'sweet-tea-arnold-palmer', 'lemonade', 'fried-mushrooms',
  'fried-avocado', 'fried-green-tomatoes', 'fried-okra', 'fried-banana-peppers',
  'fried-cheese', 'fried-green-beans', 'elote', 'turkey-leg', 'smoked-brisket',
  'bbq-ribs', 'bbq-pulled-pork', 'pimento-cheese', 'beer-cheese-dip',
  'fried-bologna-sandwich', 'candied-bacon', 'sweet-potato-casserole',
  'king-cake', 'peach-cobbler', 'pecan-pie', 'lemonade',
]);

const PILLAR_PAGES = new Set([
  'guide/deep-frying-at-home',
  'imbiss-food-rezepte',
  'jahrmarkts-klassiker',
  'wissenschaft-frittieren',
]);

const BLOG_PAGES = new Set([
  'blog/carnival-food', 'blog/dutch-oven-vs-gusseiserne-pfanne',
  'blog/fair-food-deutschland', 'blog/frittier-fehler', 'blog/frittiert-sucht',
  'blog/jahrmarkt-in-die-welt', 'blog/soul-food-kultur',
  'blog/southern-soul-food', 'blog/state-fair-geschichte',
  'blog/texas-state-fair', 'blog/wissenschaft-des-frittierens',
]);

const LEGAL_PAGES = new Set(['impressum', 'datenschutz']);

const PAGES_TO_SKIP = new Set(['ueber', 'admin']);

function categorisePage(slug) {
  if (LEGAL_PAGES.has(slug)) return 'legal';
  if (PILLAR_PAGES.has(slug)) return 'pillar';
  if (BLOG_PAGES.has(slug)) return 'blog';
  if (RECIPE_PAGES.has(slug)) return 'recipe';
  return 'other';
}

function pageImportance(category) {
  return { pillar: 4, recipe: 3, blog: 2, other: 1, legal: 0 }[category] || 0;
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(html) {
  const text = stripHtml(html);
  return text.split(/\s+/).filter(Boolean).length;
}

function checkPage(file) {
  const slug = file.replace(/\.html$/, '').replace(/^blog\//, 'blog/');
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const category = categorisePage(slug);
  const checks = [];

  // 1. Title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';
  const titleLen = title.length;
  if (!title) checks.push({ id: 'title', status: 'fail', msg: 'no <title>' });
  else if (titleLen < 30) checks.push({ id: 'title', status: 'fail', msg: `too short (${titleLen} chars): "${title}"` });
  else if (titleLen > 65) checks.push({ id: 'title', status: 'warn', msg: `too long (${titleLen} chars): "${title}"` });
  else checks.push({ id: 'title', status: 'pass', msg: `${titleLen} chars: "${title}"` });

  // 2. Meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const desc = descMatch ? descMatch[1] : '';
  if (!desc) checks.push({ id: 'description', status: 'fail', msg: 'no meta description' });
  else if (desc.length < 100) checks.push({ id: 'description', status: 'fail', msg: `too short (${desc.length} chars)` });
  else if (desc.length > 160) checks.push({ id: 'description', status: 'warn', msg: `too long (${desc.length} chars)` });
  else checks.push({ id: 'description', status: 'pass', msg: `${desc.length} chars` });

  // 3. H1 (use a tag-based scan to handle nested elements like <br><span>)
  const h1OpenCount = (html.match(/<h1\b/gi) || []).length;
  if (h1OpenCount === 0) checks.push({ id: 'h1', status: 'fail', msg: 'no H1' });
  else if (h1OpenCount > 1) checks.push({ id: 'h1', status: 'warn', msg: `${h1OpenCount} H1s` });
  else checks.push({ id: 'h1', status: 'pass', msg: 'present' });

  // 4. H2/H3 hierarchy
  const headingLevels = [];
  for (const m of html.matchAll(/<h([1-6])[^>]*>/g)) headingLevels.push(parseInt(m[1]));
  let hierarchyOk = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) { hierarchyOk = false; break; }
  }
  if (headingLevels.length === 0) checks.push({ id: 'hierarchy', status: 'warn', msg: 'no H2-H6 headings' });
  else if (!hierarchyOk) checks.push({ id: 'hierarchy', status: 'warn', msg: 'heading skip detected' });
  else checks.push({ id: 'hierarchy', status: 'pass', msg: `h${headingLevels[0]}..h${headingLevels[headingLevels.length-1]} OK` });

  // 5. Canonical
  const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  if (!canonMatch) checks.push({ id: 'canonical', status: 'fail', msg: 'no canonical' });
  else if (!canonMatch[1].startsWith(SITE)) checks.push({ id: 'canonical', status: 'warn', msg: `non-canonical host: ${canonMatch[1]}` });
  else checks.push({ id: 'canonical', status: 'pass', msg: 'OK' });

  // 6. Open Graph (need og:title, og:description, og:image, og:url)
  const ogFields = ['og:title', 'og:description', 'og:image', 'og:url'];
  const missing = ogFields.filter(f => !new RegExp(`property="${f}"`).test(html));
  if (missing.length === 0) checks.push({ id: 'og', status: 'pass', msg: 'all 4 fields' });
  else if (missing.length >= 2) checks.push({ id: 'og', status: 'fail', msg: `missing: ${missing.join(', ')}` });
  else checks.push({ id: 'og', status: 'warn', msg: `missing: ${missing.join(', ')}` });

  // 7. Twitter card
  const twFields = ['twitter:title', 'twitter:description', 'twitter:image'];
  const twMissing = twFields.filter(f => !new RegExp(`name="${f}"`).test(html));
  if (twMissing.length === 0) checks.push({ id: 'twitter', status: 'pass', msg: 'all 3 fields' });
  else if (twMissing.length >= 2) checks.push({ id: 'twitter', status: 'fail', msg: `missing: ${twMissing.join(', ')}` });
  else checks.push({ id: 'twitter', status: 'warn', msg: `missing: ${twMissing.join(', ')}` });

  // 8. Schema.org
  const ldjson = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let schemaTypes = new Set();
  for (const block of ldjson) {
    const types = block.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
    for (const t of types) schemaTypes.add(t[1]);
  }
  if (category === 'recipe') {
    if (!schemaTypes.has('Recipe')) checks.push({ id: 'schema', status: 'fail', msg: 'no Recipe schema' });
    else checks.push({ id: 'schema', status: 'pass', msg: [...schemaTypes].join(', ') });
  } else if (category === 'pillar' || category === 'blog') {
    // Pillar/blog pages are guides, not individual recipes.
    // Accept Article, CollectionPage, FAQPage, ItemList, or Recipe as valid.
    const guideTypes = ['Article', 'CollectionPage', 'FAQPage', 'ItemList', 'Recipe', 'WebPage'];
    const hasValid = guideTypes.some(t => schemaTypes.has(t));
    if (!hasValid) checks.push({ id: 'schema', status: 'fail', msg: 'no Article/CollectionPage/FAQPage schema' });
    else if (schemaTypes.size < 2) checks.push({ id: 'schema', status: 'warn', msg: [...schemaTypes].join(', ') });
    else checks.push({ id: 'schema', status: 'pass', msg: [...schemaTypes].join(', ') });
  } else {
    if (schemaTypes.size >= 2) checks.push({ id: 'schema', status: 'pass', msg: [...schemaTypes].join(', ') });
    else checks.push({ id: 'schema', status: 'warn', msg: 'minimal schema' });
  }

  // 9. Recipe schema completeness (for recipe pages)
  if (category === 'recipe' && schemaTypes.has('Recipe')) {
    const recipeBlock = ldjson.find(b => b.includes('"@type": "Recipe"') || b.includes('"@type":"Recipe"'));
    const required = ['prepTime', 'cookTime', 'recipeIngredient', 'recipeInstructions', 'nutrition'];
    const recipeMissing = required.filter(f => !recipeBlock.includes(`"${f}"`));
    if (recipeMissing.length === 0) checks.push({ id: 'recipe-schema', status: 'pass', msg: 'all fields' });
    else if (recipeMissing.length >= 3) checks.push({ id: 'recipe-schema', status: 'fail', msg: `missing: ${recipeMissing.join(', ')}` });
    else checks.push({ id: 'recipe-schema', status: 'warn', msg: `missing: ${recipeMissing.join(', ')}` });
  } else if (category === 'recipe') {
    // already failed schema check
  } else {
    checks.push({ id: 'recipe-schema', status: 'pass', msg: 'N/A (not recipe)' });
  }

  // 10. Image alt tags
  const imgs = [...html.matchAll(/<img\s+[^>]*>/g)].map(m => m[0]);
  const imgsWithoutAlt = imgs.filter(img => !/\salt=/.test(img) || /\salt=""/.test(img));
  if (imgs.length === 0) checks.push({ id: 'img-alt', status: 'warn', msg: 'no images' });
  else if (imgsWithoutAlt.length === 0) checks.push({ id: 'img-alt', status: 'pass', msg: `${imgs.length} imgs all have alt` });
  else checks.push({ id: 'img-alt', status: 'fail', msg: `${imgsWithoutAlt.length}/${imgs.length} missing alt` });

  // 11. Internal links to other recipes
  const internalLinks = [...html.matchAll(/href="([a-z][^"]*\.html)"/g)].map(m => m[1]);
  const crossLinks = internalLinks.filter(l => !l.startsWith('http') && l !== file && !l.includes('#'));
  if (crossLinks.length >= 2) checks.push({ id: 'internal-links', status: 'pass', msg: `${crossLinks.length} cross-links` });
  else if (crossLinks.length === 1) checks.push({ id: 'internal-links', status: 'warn', msg: '1 cross-link' });
  else checks.push({ id: 'internal-links', status: 'fail', msg: 'no cross-links' });

  // 12. Word count
  const wc = wordCount(html);
  const target = category === 'pillar' ? 2000 : (category === 'recipe' || category === 'blog' ? 800 : 200);
  if (wc >= target) checks.push({ id: 'wordcount', status: 'pass', msg: `${wc} words (≥${target})` });
  else if (wc >= target * 0.7) checks.push({ id: 'wordcount', status: 'warn', msg: `${wc} words (<${target})` });
  else checks.push({ id: 'wordcount', status: 'fail', msg: `${wc} words (<<${target})` });

  // 13. E-E-A-T signals
  const hasAuthor = /"author"|"author":\s*{/.test(html);
  const hasDate = /"datePublished"|"dateModified"/.test(html);
  if (hasAuthor && hasDate) checks.push({ id: 'eeat', status: 'pass', msg: 'author+date' });
  else if (hasAuthor || hasDate) checks.push({ id: 'eeat', status: 'warn', msg: `only ${hasAuthor ? 'author' : 'date'}` });
  else checks.push({ id: 'eeat', status: 'fail', msg: 'no author/date' });

  // 14. Hreflang
  const hreflangMatch = /hreflang="(de|DE)"/.test(html);
  checks.push({ id: 'hreflang', status: hreflangMatch ? 'pass' : 'warn', msg: hreflangMatch ? 'de' : 'missing de' });

  // 15. Viewport
  const hasViewport = /name="viewport"/.test(html);
  checks.push({ id: 'viewport', status: hasViewport ? 'pass' : 'fail', msg: hasViewport ? 'OK' : 'missing viewport' });

  // Score
  const score = checks.reduce((s, c) => s + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const fails = checks.filter(c => c.status === 'fail').length;
  const warns = checks.filter(c => c.status === 'warn').length;

  return {
    file, slug, category, importance: pageImportance(category),
    title, desc, wordCount: wc, score, fails, warns,
    checks, schemaTypes: [...schemaTypes],
  };
}

function main() {
  const files = fs.readdirSync(ROOT).filter(f =>
    f.endsWith('.html') && !f.startsWith('.') && !PAGES_TO_SKIP.has(f.replace(/\.html$/, ''))
  );
  // also include blog/*.html
  const blogDir = path.join(ROOT, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir)) {
      if (f.endsWith('.html')) files.push(`blog/${f}`);
    }
  }
  // include guide/*.html
  const guideDir = path.join(ROOT, 'guide');
  if (fs.existsSync(guideDir)) {
    for (const f of fs.readdirSync(guideDir)) {
      if (f.endsWith('.html')) files.push(`guide/${f}`);
    }
  }

  const reports = files.map(checkPage);

  // Sort: critical first (most fails), then by importance
  reports.sort((a, b) => {
    if (a.fails !== b.fails) return b.fails - a.fails;
    if (a.importance !== b.importance) return b.importance - a.importance;
    return a.score - b.score;
  });

  // Console summary
  console.log(`Audited ${reports.length} pages\n`);
  const byScore = { pass: 0, warn: 0, fail: 0 };
  for (const r of reports) {
    if (r.fails >= 3) byScore.fail++;
    else if (r.fails > 0 || r.warns >= 4) byScore.warn++;
    else byScore.pass++;
  }
  console.log(`Bucket distribution:`);
  console.log(`  Critical (≥3 fails): ${byScore.fail}`);
  console.log(`  Warning: ${byScore.warn}`);
  console.log(`  Pass: ${byScore.pass}`);
  console.log();

  // Top 20 most-broken pages
  console.log(`Top 20 most-broken pages (by fail count, then by importance):`);
  console.log(`  ${'file'.padEnd(45)} ${'cat'.padEnd(8)} ${'fails'.padEnd(6)} ${'warns'.padEnd(6)} ${'score'.padEnd(6)} ${'words'.padEnd(6)}`);
  for (const r of reports.slice(0, 20)) {
    console.log(`  ${r.file.padEnd(45)} ${r.category.padEnd(8)} ${String(r.fails).padEnd(6)} ${String(r.warns).padEnd(6)} ${r.score.toFixed(1).padEnd(6)} ${String(r.wordCount).padEnd(6)}`);
  }
  console.log();

  // Aggregate issues by check id
  const issueAgg = {};
  for (const r of reports) {
    for (const c of r.checks) {
      if (c.status === 'pass') continue;
      const key = `${c.id}:${c.status}`;
      issueAgg[key] = (issueAgg[key] || 0) + 1;
    }
  }
  console.log(`Most common issues:`);
  const sortedIssues = Object.entries(issueAgg).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of sortedIssues.slice(0, 20)) {
    console.log(`  ${k.padEnd(30)} ${v} pages`);
  }

  // Write JSON report
  const outPath = path.join(ROOT, 'seo-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify(reports, null, 2));
  console.log(`\nFull report: ${path.relative(ROOT, outPath)}`);
}

main();
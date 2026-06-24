#!/usr/bin/env node
// SEO / GEO Fix Pass 3 — Technical cleanups for the remaining issues.
//
// 1. Title lengthening: if title < 30 chars, append " Rezept" before " — Golden Crumbs"
// 2. Image alt: add alt to <img> tags that are missing alt or have empty alt
// 3. Heading hierarchy: insert missing H3 between H2 and H4 (where applicable)
//
// Idempotent: re-running is a no-op.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
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

// 1. Title lengthening
function fixShortTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return { html, changed: false };
  const t = m[1];
  if (t.length >= 30) return { html, changed: false };
  // Insert " Rezept" before the " — Golden Crumbs" suffix
  let newTitle;
  if (t.includes(' — Golden Crumbs')) {
    newTitle = t.replace(' — Golden Crumbs', ' Rezept — Golden Crumbs');
  } else if (t.includes(' | Golden Crumbs')) {
    newTitle = t.replace(' | Golden Crumbs', ' Rezept | Golden Crumbs');
  } else {
    newTitle = t + ' Rezept';
  }
  // If still too short, add more
  if (newTitle.length < 30) {
    newTitle = newTitle.replace(/(Rezept)\b/, '$1 — Schritt für Schritt');
  }
  if (newTitle === t) return { html, changed: false };
  return { html: html.replace(`<title>${t}</title>`, `<title>${newTitle}</title>`), changed: true };
}

// 2. Image alt (focus on affiliate product cards: 3 imgs per page with same src pattern, no alt)
function fixImgAlt(html) {
  let changed = false;
  // Find <img> tags that are missing alt or have empty alt
  const imgRe = /<img\s+([^>]*?)(\s*\/?)>/g;
  let result = html;
  // Find all imgs and check each
  const updated = html.replace(imgRe, (full, attrs, slash) => {
    // Has alt attribute?
    if (/\salt=/.test(attrs)) {
      // Check if alt is empty
      const altMatch = attrs.match(/\salt=("([^"]*)"|'')/);
      if (altMatch && altMatch[1] === '""' || altMatch && altMatch[1] === "''") {
        // Empty alt
        const fixed = attrs.replace(/\salt=("([^"]*)"|'')/, 'alt="Affiliate-Produktempfehlung"');
        changed = true;
        return `<img ${fixed}${slash}>`;
      }
      return full;
    }
    // No alt — add generic one
    // Try to infer from the parent context (e.g., surrounding link aria-label)
    let alt = 'Affiliate-Produktempfehlung';
    if (/Pan\b/.test(attrs) || /Pfanne/.test(attrs)) alt = 'Empfohlene Pfanne für dieses Rezept';
    else if (/Thermometer/.test(attrs)) alt = 'Empfohlenes Frittierthermometer';
    else if (/Rub/.test(attrs) || /Gewürz/.test(attrs)) alt = 'Empfohlene Gewürzmischung';
    else if (/Oel|Öl/.test(attrs)) alt = 'Empfohlenes Frittieröl';
    changed = true;
    return `<img alt="${alt}"${attrs}${slash}>`;
  });
  return { html: updated, changed };
}

// 3. Heading hierarchy: find H2 followed directly by H4 (skipping H3), and rename H4 to H3
function fixHeadingHierarchy(html) {
  let changed = false;
  // Check if there's an H2 with no H3 between it and next H4
  // Use a simple approach: find <h2 ...>...</h2> followed eventually by <h4
  // If there's no H3 between, downgrade H4 to H3
  const re = /<h2[\s>][^]*?<\/h2>([^]*?)<h4\b/g;
  let updated = html;
  updated = updated.replace(re, (full, between) => {
    // If "between" doesn't contain an <h3, downgrade the trailing <h4
    if (!/<h3\b/.test(between)) {
      changed = true;
      return full.replace('<h4', '<h3').replace('</h4>', '</h3>');
    }
    return full;
  });
  return { html: updated, changed };
}

function main() {
  const files = allPages();
  let totalChanged = 0;

  for (const file of files) {
    const full = path.join(ROOT, file);
    let html = fs.readFileSync(full, 'utf8');
    let fileChanged = false;

    {
      const r = fixShortTitle(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    {
      const r = fixImgAlt(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }
    {
      const r = fixHeadingHierarchy(html);
      if (r.changed) { html = r.html; fileChanged = true; }
    }

    if (fileChanged) {
      fs.writeFileSync(full, html);
      totalChanged++;
    }
  }

  console.log(`✓ Pass 3 complete: ${totalChanged} files changed`);
}

main();
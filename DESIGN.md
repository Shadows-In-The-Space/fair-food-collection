---
name: Golden Crumbs — Visual Identity
version: 1.0.0
updated: 2026-06-19
status: living document
author: Sonny
generated-by: Google DESIGN.md format (per `~/.agents/skills/design-md/SKILL.md`)

colors:
  primary: "#E8A317"      # Mustard Gold — primary brand
  secondary: "#C63D2F"    # Ketchup Red — emphasis
  accent: "#C97B3A"       # Sweet Potato — warm secondary
  surface: "#FDF6E3"      # Cream — base canvas
  surface_alt: "#FFF5DC"  # Cream Pie — elevated cards
  ink: "#3D2314"          # Burnt Brown — primary text on cream
  ink_alt: "#2A2A2A"      # Charcoal — body text
  glow: "rgba(232,163,23,0.6)"  # Mustard glow — string-lights

typography:
  display: "Abril Fatface"  # Headlines, logo, hero h1
  subhead: "Josefin Sans"   # Buttons, badges, nav, labels
  body: "Crimson Text"      # Long-form recipe text, paragraphs
  fallback_display: Georgia
  fallback_body: Georgia

rounded:
  badge: "12px"
  button: "8px"
  # Note: bulbs use a non-standard asymmetric border-radius (50% 50% 50% 50% / 60% 60% 40% 40%)
  # that the linter rejects. It lives in the bulb component below as a special string.

spacing:
  page_x: "48px"           # Horizontal page padding (desktop)
  page_x_mobile: "20px"    # Mobile horizontal
  section_y: "64px"        # Vertical between major sections
  block_y: "24px"          # Vertical between content blocks
  inline: "12px"           # Inline element spacing

elevation:
  card: "0 2px 8px rgba(0,0,0,0.08)"
  card_hover: "0 4px 16px rgba(0,0,0,0.12)"
  nav: "0 2px 12px rgba(0,0,0,0.2)"
  glow: "0 0 8px var(--glow), 0 0 16px var(--glow)"  # String-lights effect
  # Note: elevation values used as direct CSS, not referenced from components per spec.

shapes:
  divider: "checkered 24px 24px"  # Checkered divider — carnival/circus feel
  banner: "bunting"               # Triangle bunting string lights
  bulb: "asymmetric"              # 50% 50% 50% 50% / 60% 60% 40% 40%

components:
  nav:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.subhead}"
    # sticky: true (sticky positioning) — lives in prose, not as a token
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    # hover: bg → secondary, text → surface (lives in prose)
    # border: 1px solid primary (lives in prose)
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.badge}"
  card:
    backgroundColor: "{colors.surface_alt}"
    rounded: "{rounded.button}"
    # elevation: card shadow (lives in prose)
    # border: 1px dashed primary (lives in prose)
  string_lights:
    # Special: bulbs use non-standard asymmetric border-radius
    # border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%
    bulbs: 10
    colors: ["{colors.primary}", "{colors.secondary}", "{colors.accent}"]
    animation: "glow 2s ease-in-out infinite alternate"
    animation_delays: [0, 0.3, 0.6, 0.9, 1.2, 1.5, 0.8, 0.4]
  recipe_meta:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink_alt}"
  affiliate_section:
    backgroundColor: "{colors.surface_alt}"
    rounded: "{rounded.button}"
    # border: 2px solid primary (lives in prose)
  faq_item:
    backgroundColor: "{colors.surface_alt}"
    rounded: "{rounded.button}"
    # border: 1px solid rgba(61,35,20,0.1) (lives in prose)
  scroll_reveal:
    backgroundColor: "{colors.surface}"
    # threshold: 0.1 (lives in prose)
    # transition: transform 0.8s ease-out, opacity 0.8s ease-out (lives in prose)
---

# Golden Crumbs — Visual Identity

## Overview

Golden Crumbs is an American fair-food / soul-food / Kirmes recipe blog. The site lives in the German Ruhrgebiet ("Metropole Ruhr") and bridges American State Fair food with German Kirmes/Karneval/Jahrmarkt traditions.

The visual identity is **carnival / state-fair nostalgic** — think string lights, bunting, mustard-and-ketchup, checkered tablecloths. Warm, inviting, hand-crafted, with subtle motion (glowing bulbs, scroll reveals) that signals "this is a real place, not a corporate blog".

The DESIGN.md captures this identity as a structured contract so any future UI work (new pages, redesign, components) stays on-brand without re-deriving the rules from inspection.

## Colors

The palette is a **warm, food-evocative triad** — not neutral + accent, but three warm primary-like colors that all sit comfortably together:

| Token | Hex | Role | Use |
|-------|-----|------|-----|
| `colors.primary` | `#E8A317` Mustard Gold | Brand primary | CTAs, links, accents, focus rings, badge bg |
| `colors.secondary` | `#C63D2F` Ketchup Red | Emphasis | Hover states, sale-style emphasis, alerts |
| `colors.accent` | `#C97B3A` Sweet Potato | Warm secondary | Third-bulb color, recipes-with-warmth signals |
| `colors.surface` | `#FDF6E3` Cream | Base canvas | Body background, default canvas |
| `colors.surface_alt` | `#FFF5DC` Cream Pie | Elevated surface | Card backgrounds, affiliate sections, FAQ items |
| `colors.ink` | `#3D2314` Burnt Brown | Primary text on cream | Headlines, logo, nav background, ink on cream |
| `colors.ink_alt` | `#2A2A2A` Charcoal | Body text | Long-form paragraph text on cream |
| `colors.glow` | `rgba(232,163,23,0.6)` | String-light glow | Animated box-shadow on bulbs |

**Never use pure black `#000000`** — use `colors.ink` (`#3D2314`) on light surfaces, `colors.surface` (`#FDF6E3`) on dark surfaces. The warm-brown ink is part of the carnival identity.

**No neon, no AI-purple, no pure white.** All surfaces and text are warm.

## Typography

Three font families, each with a specific role. The trio is **the** Golden Crumbs voice — Abril Fatface for headlines (slightly condensed, dramatic, fair-poster energy), Josefin Sans for UI elements (geometric, wide-tracked, modern), Crimson Text for body (warm, readable, food-blog).

| Token | Font | Fallback | Role | Examples |
|-------|------|----------|------|----------|
| `typography.display` | Abril Fatface | Georgia, serif | Headlines, logo, h1, h2, h3 | `<h1>Golden Crumbs</h1>`, page titles |
| `typography.subhead` | Josefin Sans | sans-serif | UI: nav, buttons, badges, labels | Nav links, recipe badge, FAQ summary |
| `typography.body` | Crimson Text | Georgia, serif | Long-form text, paragraphs | Recipe intro, instructions, FAQ answers |

**Type scale (mobile-first, fluid via clamp):**
- `h1`: `clamp(2.5rem, 6vw, 4rem)` — large but not screaming
- `h2`: `clamp(1.6rem, 4vw, 2.4rem)` — section anchors
- `h3`: `clamp(1.2rem, 3vw, 1.5rem)` — sub-sections
- Body: `1.15rem` for recipe intros, `1rem` for body
- Caption / meta: `0.8rem` — recipe meta, breadcrumb

**Line-height:** `1.6` for body, `1.7` for long-form recipe intros.
**Tracking:** uppercase subhead/UI text gets `letter-spacing: 1px` for the fair-poster feel.

## Layout

**Page structure** (every page, top to bottom):
1. `nav` — sticky, `var(--brown)` background, `var(--cream)` text, mustard logo
2. Optional: `.breadcrumb` — cream-pie background, Josefin Sans, small caps
3. Page-specific hero (recipe pages: `.recipe-header` with title + meta; homepage: `.hero` with logo + tagline)
4. Main content section (`<section class="recipe-content">` for recipe pages; multiple sections for homepage)
5. Optional: FAQ section (recipe pages)
6. Optional: Related recipes (`<section class="related-recipes">`)
7. Affiliate disclosure + banner
8. `footer` — dark, cream text, mustard accents

**Grid:**
- Recipe page main grid: `grid-template-columns: 1fr 320px; gap: 48px;` (content + sidebar on desktop, stacks on mobile)
- Homepage recipes grid: dynamic via JS, but visually 3-4 cards per row on desktop, 1 on mobile

**Page padding:**
- Desktop: `48px` horizontal
- Mobile: `20px` horizontal
- Section vertical: `64px` between major sections

## Elevation & Depth

Subtle, never harsh. The site is not a card-stacked material design — it's a vintage fair poster.

| Token | Value | Use |
|-------|-------|-----|
| `elevation.card` | `0 2px 8px rgba(0,0,0,0.08)` | Default card on cream surface |
| `elevation.card_hover` | `0 4px 16px rgba(0,0,0,0.12)` | Card hover (slight lift) |
| `elevation.nav` | `0 2px 12px rgba(0,0,0,0.2)` | Sticky nav, sets it apart from page |
| `elevation.glow` | `0 0 8px var(--glow), 0 0 16px var(--glow)` | String-light bulbs only |

**No drop-shadow on text, no glassmorphism, no gradient overlays.** Vintage fair aesthetic = flat with subtle depth.

## Shapes

| Element | Shape | Why |
|---------|-------|-----|
| `shapes.divider` | Checkered 24px × 24px | Carnival tablecloth pattern between sections |
| `shapes.banner` | Bunting (string lights) | Above-the-fold identity signal on every page |
| `shapes.bulb` | Asymmetric 50% 50% 50% 50% / 60% 60% 40% 40% | Real light-bulb silhouette (not perfect circle) |

**Use `rounded.button` (8px) sparingly.** Most cards and surfaces use `rounded.button` or have no rounded corners. Only badges get `rounded.badge` (12px) for pill shape.

## Components

### `nav` (sticky)
- Background: `colors.ink`
- Text: `colors.surface`
- Hover: `colors.primary` (mustard)
- Sticky top, `z-index: 100`
- Logo: `Abril Fatface`, `1.8rem`, `colors.primary` (with ketchup star accent)

### `button`
- Background: `colors.primary`
- Text: `colors.ink`
- Border: `1px solid colors.primary`
- Hover: bg → `colors.secondary`, text → `colors.surface`
- Rounded: `8px`

### `badge` (recipe badge, e.g. "VEGETARISCH", "AMERIKANISCH")
- Background: `colors.primary`
- Text: `colors.ink`
- Font: `typography.subhead`
- Uppercase, `letter-spacing: 1px`
- Rounded: `12px` (pill)

### `card` (recipe card, blog card)
- Background: `colors.surface_alt`
- Rounded: `8px`
- Elevation: `elevation.card`
- Border: `1px dashed colors.primary` (dotted carnival-fence pattern)

### `string_lights` (bunting)
- 10 bulbs per string
- Bulb colors: `primary`, `secondary`, `accent` (cycling)
- Animation: `glow 2s ease-in-out infinite alternate`
- Stagger delays: `[0, 0.3, 0.6, 0.9, 1.2, 1.5, 0.8, 0.4]` for the warm-random flicker
- Each bulb has `box-shadow: 0 0 8px ...` for the glow

### `recipe_meta` (prep time, cook time, etc.)
- Icon color: `colors.primary`
- Text color: `#666`
- Font: `typography.subhead`, `0.9rem`

### `affiliate_section`
- Background: `colors.surface_alt`
- Border: `2px solid colors.primary` (solid, not dashed)
- Rounded: `8px`
- Heading: `Abril Fatface`, `colors.ink`
- Mandatory disclosure: `*Affiliate-Link — wir erhalten eine kleine Provision, der Preis bleibt gleich.*`

### `faq_item` (universal fried-food FAQ + page-specific)
- Background: `colors.surface_alt`
- Border: `1px solid rgba(61,35,20,0.1)` (subtle ink-tinted)
- Rounded: `8px`
- Summary: `Josefin Sans`, `700`, `colors.ink`, `cursor: pointer`
- Answer paragraph: `colors: #555`, `line-height: 1.7`

### `scroll_reveal`
- Threshold: `0.1` (10% visible triggers animation)
- Transition: `transform 0.8s ease-out, opacity 0.8s ease-out`
- Used on: hero, categories, recipe sections, stats, newsletter (homepage), with delay classes `delay-1` through `delay-5` for staggered reveals

## Do's and Don'ts

### Do

- Use the three-font trio (Abril Fatface, Josefin Sans, Crimson Text) — that's the Golden Crumbs voice
- Use warm colors only — `mustard`, `ketchup`, `sweet-potato`, `cream`, `brown`, `charcoal`
- Keep motion subtle: string-light glow, scroll reveal, hover transitions
- Use the checkered divider between major sections
- Use the bunting string-lights as identity signal at top of every page
- Use `var(--mustard)` for links, focus rings, primary CTAs
- Use `var(--cream-pie)` for elevated cards
- Pair questions in English (for AI-citation) with answers in German (for German audience)
- Mark every new page with the universal fried-food FAQ section (cross-page internal linking density)
- Use the SEO-MASTER-PLAN's FAQ patterns as Q&A templates

### Don't

- Don't use pure black `#000000` — use `var(--brown)` on light, `var(--cream)` on dark
- Don't use pure white `#FFFFFF` — use `var(--cream)` for surfaces, `var(--cream-pie)` for elevated
- Don't use neon, AI-purple, or "modern gradient" — that's not the voice
- Don't use a sans-serif body font — Crimson Text is the body, always
- Don't drop the bunting from a page — it's the brand signal
- Don't use drop-shadows on text
- Don't use glassmorphism, blur effects, or backdrop-filter
- Don't use sans-serif for headlines — Abril Fatface is the display, always
- Don't use straight 50% border-radius on bulbs — use the asymmetric carnival-bulb shape
- Don't use emoji as image placeholders on production pages (Stock images are fine for v1)
- Don't claim statistics that aren't verified — see SOUL.md hard rule

## Animation Tokens

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `transition.fast` | `0.2s` | ease | Link color, button bg |
| `transition.normal` | `0.4s` | ease | Card hover lift |
| `transition.slow` | `0.8s` | ease-out | Scroll reveal, section entry |
| `transition.glow` | `2s` | ease-in-out infinite alternate | String-light bulbs |

## Component Tokens Reference

- `var(--mustard)` → `colors.primary`
- `var(--ketchup)` → `colors.secondary`
- `var(--sweet-potato)` → `colors.accent`
- `var(--cream)` → `colors.surface`
- `var(--cream-pie)` → `colors.surface_alt`
- `var(--brown)` → `colors.ink`
- `var(--charcoal)` → `colors.ink_alt`
- `var(--string-glow)` → `colors.glow`

## How to Apply

When adding a new page or component:

1. Copy the `:root` block from any existing page (it's identical across pages)
2. Use `var(--token)` for every color
3. Use `typography.{display|subhead|body}` for the right role
4. Add the `.string-lights` block at the top of `<body>` (after `<nav>`) — every page has it
5. Add `class="scroll-reveal"` to major sections for entry animation
6. For new recipe pages: add the universal fried-food FAQ section before the affiliate section
7. For new design components, lint with the official CLI:
   ```bash
   npx @google/design.md lint DESIGN.md
   ```

## Implementation Status

- [x] `index.html` — full design system applied, scroll-reveals, bunting, full palette
- [x] All 4 priority pages (funnel-cake, corn-dogs, fried-oreos, hush-puppies) — Recipe JSON-LD + FAQPage + universal FAQ + bunting + scroll-reveal
- [x] All other 75 pages — bunting, palette, typography, but recipe-specific enrichment not yet applied
- [ ] Per-page actual `<lastmod>` in sitemap (currently 2026-06-19 for all)
- [ ] `about.html` + `ueber.html` dedup (duplicate content)
- [ ] Newsletter-server `/home/sonny/` hard-coded path (functional bug)

## See also

- `PROJECT.md` — site context, roadmap, color/font history
- `SEO-MASTER-PLAN.md` — content strategy
- `AFFILIATE_STRATEGY.md` — affiliate link placements
- `mywiki/concepts/design-md` — the format spec this file follows
- `~/.agents/skills/design-md/SKILL.md` — workflow for DESIGN.md

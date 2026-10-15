---
name: FKN VAMOS
description: Streetwear shop that floats like a dive-computer HUD over a living Caribbean lagoon.
colors:
  night: "#03111d"
  deep: "#061c2c"
  deep-2: "#0a2638"
  abyss: "#04223a"
  ink: "#e7f3f4"
  muted: "#b3ccd3"
  lagoon: "#2fd6dc"
  coral: "#d63a1c"
  coral-deep: "#b32f15"
  sun: "#ffd84a"
  foam: "#f5fbfb"
  stock-green: "#3ddc84"
  glass: "rgb(255 255 255 / .05)"
  glass-2: "rgb(255 255 255 / .09)"
  line: "rgb(255 255 255 / .1)"
  line-2: "rgb(255 255 255 / .18)"
  disabled: "#22394a"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(4.5rem, 17vw, 15.5rem)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.05em"
    fontVariation: "\"opsz\" 96"
  headline:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.6rem, 6.6vw, 5.4rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
    fontVariation: "\"opsz\" 96"
  title:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.92rem"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
  data-caps:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.68rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "12px"
  thumb: "14px"
  md: "20px"
  lg: "28px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 4.5vw, 72px)"
  section: "clamp(80px, 10vw, 140px)"
  container: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.coral-deep}"
  button-glass:
    backgroundColor: "rgb(255 255 255 / .1)"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "52px"
  button-dark:
    backgroundColor: "{colors.glass-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "52px"
  button-dark-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night}"
  button-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "#9ab4bf"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "38px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night}"
  size-option:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 .9rem"
    height: "48px"
  size-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night}"
  cart-pill:
    backgroundColor: "#ffffff"
    textColor: "{colors.night}"
    rounded: "{rounded.pill}"
    height: "40px"
  cart-pill-filled:
    backgroundColor: "{colors.coral}"
    textColor: "#ffffff"
  stock-badge:
    backgroundColor: "rgb(3 17 29 / .6)"
    textColor: "#ffffff"
    typography: "{typography.data-caps}"
    rounded: "{rounded.pill}"
    padding: ".4rem .65rem"
  product-card-media:
    backgroundColor: "{colors.deep}"
    rounded: "{rounded.md}"
  sheet:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.night}"
    rounded: "{rounded.thumb}"
    padding: ".9rem 1.3rem"
---

# Design System: FKN VAMOS

## Overview

**Creative North Star: "The Lagoon HUD"**

The shop is a dive-computer readout floating over real Caribbean water. The Galion lagoon photo (alive in WebGL in the hero) is the ground; every piece of interface sits on it as a dark glass island with a 1px light rim, reading like instrumentation rather than a storefront. Night-lagoon blues carry the page after the photo, turquoise signals, coral asks for money.

Density is low on the landing and tight inside the tools: giant 800-weight display type and full-bleed photography up top, then compact, data-dense surfaces (mega-menu, search, cart, sheet) where prices, counts and stock read in monospace like gauges. Motion is physical and eased out: words rise behind masks, panels unclip, the bought piece flies into the cart pill.

The world rejects the black-ground hype grid and the default Shopify storefront (vague menus, no stock state). It is dark by construction (`color-scheme: dark`), never a light theme.

**Key Characteristics:**
- Real lagoon photography and WebGL water as the ground; UI floats as glass islands.
- Two-voice color: lagoon turquoise signals, coral buys. Nothing else is saturated.
- Bricolage Grotesque 800 at extreme sizes with tight negative tracking.
- Monospace strictly for data: prices, counts, stock, clock, keys.
- Pills and soft corners everywhere; borders are inset 1px rims, not strokes.

## Colors

A night-water palette of near-black blues lifted by one cool signal (lagoon) and one hot action (coral).

### Primary
- **Lagoon Signal** (lagoon): the system's signal color. Prices, active arrows, focus rings, selection, progress rails, the announcement strip, the footer wordmark, list bullets, the search caret. It marks "this is live / this is data", never "pay here".
- **Reef Coral** (coral): the buy color. Primary CTA, add-to-cart, pay, and the cart pill once it holds a piece. White text on it passes AA. **Coral Deep** (coral-deep) is its hover and the count text on the filled cart pill.

### Secondary
- **Sun Yellow** (sun): the "derniers" (last pieces) stock dot. The direction contract reserves it for featured labels; the build currently uses it only as the low-stock state.
- **Stock Green** (stock-green): the "dispo" stock dot. Coral doubles as the "épuisé" dot.

### Neutral
- **Night Lagoon** (night): page ground, theme-color, text on light pills.
- **Deep Water** (deep) and **Deeper Shelf** (deep-2): dialog surfaces (sheet, finder, cart) and nested tiles (cart foot, thumbnails, mobile category tiles).
- **Abyss** (abyss): ink for printed text and outlines on placeholder garment drawings.
- **Lagoon Ink** (ink): primary text; also the "selected" fill for chips, sizes and the toast.
- **Salt Haze** (muted): secondary text, counts, notes; AA on night and on the lagoon photo shade.
- **Foam** (foam): light print on dark placeholder garments.
- **Glass / Glass 2** (glass, glass-2): translucent white fills for grouped controls and hovered rows.
- **Rim / Rim 2** (line, line-2): 1px inset rims and hairline dividers.
- **Disabled Shelf** (disabled): disabled buy buttons, with #9ab4bf text.

### Named Rules
**The Two Voices Rule.** Lagoon signals, coral buys. A coral element must lead to a purchase or the cart; a lagoon element must never be the pay button.

**The Night Ground Rule.** Every surface is a shade of night water or white glass over it. No light-themed sections, no grey neutrals outside the blue family.

## Typography

**Display Font:** Bricolage Grotesque (with Helvetica Neue, Arial), variable opsz 12..96, used at opsz 96 for display.
**Body Font:** Manrope (with system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo)

**Character:** A loud, slightly quirky grotesque shouting the brand name over a calm, round UI sans; the mono is the HUD's instrument readout.

### Hierarchy
- **Display** (800, clamp(4.5rem, 17vw, 15.5rem), 0.8): hero "FKN / VAMOS!" and the footer "VAMOS!" wordmark (clamp to 21rem, lagoon). Lines rise from a mask on entry.
- **Headline** (800, clamp(2.6rem, 6.6vw, 5.4rem), 0.92, -0.04em): section titles ("Le drop", "Par pièce.", "Infos"); the category index rows run the same voice to 6rem. Words rise behind masks, staggered 70ms.
- **Title** (700, 1.02–1.15rem, 1.1–1.2): product names on cards, minis, hits, cart lines, FAQ questions (up to 1.45rem), mega-menu categories. Always Bricolage.
- **Body** (Manrope 500, 1rem, 1.6): running text; lede at clamp(1.02rem, 1.5vw, 1.25rem)/1.5, max 36ch; FAQ answers max 60ch.
- **Label** (Manrope 600–700, 0.85–0.95rem): buttons, nav links, chips, size options, small headings in lagoon ("Shop", footer column titles).
- **Data** (JetBrains Mono 500–600, 0.75–1.2rem, tabular figures): every price, count, quantity, cart total, kbd key and clock.
- **Data caps** (JetBrains Mono 500, 0.68–0.72rem, 0.08–0.12em tracking, uppercase): stock badges and hero HUD readouts only.

### Named Rules
**The Gauge Rule.** If it is a number or a machine state (price, count, stock, time, scroll %, keyboard key), it is JetBrains Mono with tabular figures. Words that are not data never use mono.

**The Shout Rule.** Display and headline sizes are Bricolage 800 with negative tracking (-0.035em to -0.05em). Display never drops below 700 weight.

## Layout

Full-bleed sections with a fluid gutter (spacing.gutter) and a content cap (spacing.container, plus gutters); the nav island caps at 1180px. Vertical rhythm between sections is spacing.section, with larger breaths around the manifesto (clamp(110px, 16vw, 220px)).

The hero is a 100svh stage: title and CTAs pinned bottom-left, featured product card bottom-right (hidden under 860px), HUD frame corners at all four edges. The drop is a horizontal snap rail of 4:5 cards that pins and scrubs with scroll on desktop and swipes on phones. The lookbook is a 12-column mosaic collapsing to two columns under 760px. Infos is a 1 : 1.45 split collapsing at 820px.

Breakpoints observed: 1120px (search collapses to icon), 1100px (mega-menu drops its story tile), 860px, 820px, 760px (nav to burger, full-screen circular menu, peek off), 720px (sheet becomes bottom drawer), 680px, 560px, 520px. Hover effects are gated on `(hover: hover) and (pointer: fine)`; touch gets press-scale feedback instead.

## Elevation & Depth

Depth comes from translucency and blur over the photo, not from cast shadows. Glass islands use backdrop-filter blur (10–24px, often saturate 1.4–1.5) plus a 1px inset light rim. Shadows exist only as soft, dark, negative-spread ambient drops under floating panels.

### Shadow Vocabulary
- **Rim** (`box-shadow: inset 0 0 0 1px rgb(255 255 255 / .1–.2)`): the edge of every glass island, tile, chip group and input.
- **Card lift** (`box-shadow: 0 1px 0 rgb(255 255 255 / .06) inset, 0 20px 40px -24px rgb(0 0 0 / .7)`): product card media.
- **Floating panel** (`box-shadow: 0 40px 80px -30px rgb(0 0 0 / .8)`): sheet, finder, mega-menu, combined with a rim.
- **Island** (`box-shadow: inset 0 0 0 1px rgb(255 255 255 / .12), 0 18px 40px -20px rgb(0 0 0 / .7)`): the nav bar once the hero photo is passed.

### Named Rules
**The Rim Not Stroke Rule.** Edges are inset box-shadow rims at 10–20% white, never solid `border` strokes around components. Hairline `border-top/bottom: 1px solid line` is reserved for dividing list rows and sections.

**The Glass Over Water Rule.** Anything floating over the photo or the page (nav, HUD readouts, badges, captions, close buttons) is translucent night glass with backdrop blur; opaque surfaces are reserved for dialogs.

## Shapes

Soft and pill-led. Every control is a full pill (rounded.pill); small media tiles and list rows use rounded.thumb (14–16px); product media and lookbook shots use rounded.md; dialogs and the mega-menu use rounded.lg. Size options are the one squarer control (rounded.sm). The HUD's 18px L-shaped frame corners are the only deliberately sharp geometry. Media is clipped with `clip-path: inset(... round ...)` for reveals; the mobile menu opens as a circle from the burger.

## Components

### Buttons
Confident, round and tactile; every press scales to 0.97.
- **Shape:** full pill (rounded.pill), 52px tall, 1.5rem side padding, arrow icon nudges 3px right on hover.
- **Primary:** coral with white label; hover coral-deep. Used for "Voir le drop", add to cart, pay.
- **Glass:** 10% white with 30% white rim and 12px blur; over photography only. Hover 20% white.
- **Dark:** glass-2 with rim-2; hover inverts to ink fill with night text. Secondary actions ("Acheter maintenant", "Suivre @fknvamos").
- **Disabled:** disabled shelf fill, #9ab4bf text, not-allowed cursor.
- **Focus:** 2px lagoon outline, 3px offset.

### Chips
- **Style:** grouped inside a glass pill tray with a rim; each chip transparent, muted text, 38px pill.
- **State:** selected chip inverts to ink fill and night text; hover lifts text to ink.

### Cards / Containers
- **Corner Style:** rounded.md for product media, 4:5 aspect.
- **Background:** deep water gradient (#0c2a3d to #061826) with a per-product tint glow rising from the bottom (`--t1`, `--t2` from product data).
- **Shadow Strategy:** card lift plus rim (see Elevation).
- **Behavior:** a cursor-following light (radial white at 16%) and a 1.05 image zoom on hover; sold-out pieces desaturate to 85% grey at 55% opacity, badge stays sharp.
- **Meta:** name in title type, price in lagoon data type, baseline-aligned below the media.

### Inputs / Fields
- **Search:** borderless 64px input in the finder dialog, Manrope 600 1.2rem, lagoon caret, results as 14px-rounded rows with 52px thumbnails; the active row gets glass-2 with a rim.
- **Size picker:** 48px tiles, rounded.sm, glass with rim-2; checked inverts to ink/night; disabled at 40% opacity; focus is the lagoon outline.
- **Quantity:** pill with rim-2, 36px circular steppers, mono tabular count.

### Navigation
- **Bar:** a centered floating pill (max 1180px), transparent over the hero, turning into a night-glass island (62% night, blur 20px, rim, island shadow) once scrolled. Mark at left (lagoon middle dot), nav pill center, search, Instagram and cart at right.
- **Active state:** a white pill slides under the current section link; active text turns night.
- **Announcement strip:** 32px lagoon band, night text, one message at a time rising in; collapses when scrolled or when the mega-menu opens.
- **Mega-menu:** rounded.lg glass panel (94% night, blur 24px) that unclips downward: category list (Bricolage titles, mono counts, lagoon arrow on active), 4:5 product minis, lookbook story tile.
- **Mobile:** 40px circular burger; full-screen glass menu revealed as an expanding circle; category tiles over product art and big Bricolage links with lagoon arrows.

### Cart Pill (signature)
White 40px pill with a night mono count bubble; once it holds a piece it turns coral with a white bubble and coral-deep count. On add, a clone of the product art flies in a 700ms arc into the pill, then the pill bumps (1.12, 0.96).

### Stock Badge (signature)
Night-glass pill, data-caps type, a 6px dot before the label: stock-green available, sun last pieces, coral sold out. Sits top-left on media.

### Placeholder Marks
Product art not yet supplied is drawn as an SVG garment silhouette in the product color with Bricolage print, plus a "Visuel à venir" tag (dashed white rim, night glass). Provisional prices carry a dashed-rim "Prix provisoire" pill. Both stay until the client supplies real assets.

### Sheet / Drawers
Product sheet is a centered rounded.lg dialog (940px, two columns) on desktop and a draggable bottom drawer under 720px. The cart is a right-hand drawer (440px) with rounded leading corners. Both enter on ease-drawer `cubic-bezier(.32, .72, 0, 1)` and sit over a blurred night backdrop.

## Do's and Don'ts

### Do:
- **Do** keep the lagoon photo or WebGL water visible behind the first viewport; the UI floats over it.
- **Do** put every price, count, stock state and key in JetBrains Mono with tabular figures.
- **Do** reserve coral (#d63a1c) for purchase and cart actions, with white text.
- **Do** draw edges as inset 1px white rims at 10–20% and floating surfaces as blurred night glass.
- **Do** use full pills for controls and rounded.md / rounded.lg for media and panels.
- **Do** gate hover effects behind `(hover: hover) and (pointer: fine)` and give touch a 0.95–0.97 press scale.
- **Do** keep reduced-motion fallbacks: fades only, no translation, no custom cursor.

### Don't:
- **Don't** introduce light-themed sections or neutral greys outside the night-water family.
- **Don't** use lagoon turquoise for buy buttons or coral for non-purchase signals.
- **Don't** set prose, labels or headings in mono; mono is for data only.
- **Don't** add hard offset shadows or solid outline strokes around components; depth is glass, rim and soft ambient drop.
- **Don't** fall back to a black hype grid or a default Shopify-style storefront layout.

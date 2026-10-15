---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: index.html (shop landing)

Mode: Persuade. Visitor arrives from Instagram on a phone, wants to see the drop, pick a size, pay via Stripe.
Proof/content: real photos for 3 products (tee, 2 caps) plus lifestyle shots; prices, sizes, other products and Stripe links are placeholders in data/products.js.
Constraint: static, GitHub Pages, Stripe Payment Links (one link per product, size passed as client_reference_id or per-size link). Cart is client-side only; multi-item checkout pays line by line or falls back to an Instagram DM order.
Competitor shown by the client: mundelmar.com (Shopify default storefront, vague "More" menu, no visible stock state, typos). This V1 must read clearly more advanced.

## Direction contract

THESIS: FKN VAMOS is the Caribbean lagoon seen from the board: the real Galion photo comes alive in WebGL and the shop floats over it like a dive computer HUD. Refuses the black-ground hype grid and the default Shopify storefront.
OWN-WORLD: night-lagoon ground (#03111d to #0a2638), lagoon turquoise #2fd6dc as the signal colour, coral #d63a1c for buy actions, sun yellow for featured labels, foam white. Bricolage Grotesque 800 display, Manrope UI, JetBrains Mono only for prices, counts and HUD data. Glass islands with 1px light rims; stock dots green / yellow / coral.
STORY: visitor sees FKN VAMOS over a moving lagoon, opens Shop (mega-menu with live product previews) or searches, picks a size in the sheet, adds to the cart (piece flies to the cart), pays through Stripe or orders by DM.
FIRST VIEWPORT: turquoise announcement strip rotating one message; floating glass bar (mark, Shop with mega-menu, Lookbook, Infos, search with Ctrl/Cmd K, Instagram, cart pill with count); giant FKN / VAMOS! over the lagoon photo at bottom-left with "Voir le drop" coral CTA; featured product card bottom-right on desktop.
FORM: user-kept incumbent lagoon world (user answer 2026-10-15: "Garder lagon, pousser"; replaces the earlier beach-towel contract, which was never built). No concept-seed roll: extension of the established world. Signature interactions: touchable WebGL water in the hero; mega-menu product previews; cursor-following category peek in the "Par pièce." index; add-to-cart flight.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

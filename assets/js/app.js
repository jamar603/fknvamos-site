(() => {
  "use strict";

  document.documentElement.classList.add("js");

  // Catalogue chargé en AJAX depuis data/products.json (voir loadCatalog en bas)
  let products = [];
  let shop = {};
  let faq = [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  let money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const STOCK = {
    dispo: { label: "Dispo", buy: true },
    derniers: { label: "Dernières pièces", buy: true },
    epuise: { label: "Épuisé", buy: false }
  };
  const stockOf = (p) => STOCK[p.stock] || STOCK.dispo;

  /* ---------- Visuels provisoires (remplacés par product.image) ---------- */
  const SHAPES = {
    tee: "M70 30 L95 20 Q120 34 145 20 L170 30 L205 62 L182 86 L165 74 L165 190 L75 190 L75 74 L58 86 L35 62 Z",
    hoodie: "M78 34 Q120 6 162 34 L200 58 L210 150 L186 154 L178 92 L172 196 L68 196 L62 92 L54 154 L30 150 L40 58 Z",
    shorts: "M62 50 L178 50 L190 170 L132 176 L120 104 L108 176 L50 170 Z",
    cap: "M48 128 Q52 58 120 54 Q188 58 192 128 Z M40 128 L214 128 Q218 146 196 146 L64 146 Q34 146 40 128 Z"
  };

  function ink(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return l > 150 ? "#04223a" : "#f5fbfb";
  }

  function garment(p, lazy = true) {
    if (p.image) return `<img src="${p.image}" alt="${p.name}" ${lazy ? 'loading="lazy"' : ""} decoding="async">`;
    const print = p.type === "shorts"
      ? `<text x="150" y="160" font-size="11">FKN</text>`
      : p.type === "cap"
        ? `<text x="120" y="104" font-size="16" text-anchor="middle">FKN</text>`
        : `<text x="120" y="112" font-size="19" text-anchor="middle">FKN</text><text x="120" y="132" font-size="19" text-anchor="middle">VAMOS</text>`;
    return `<svg class="garment" viewBox="0 0 240 210" role="img" aria-label="${p.name}, visuel provisoire">
      <path d="${SHAPES[p.type] || SHAPES.tee}" fill="${p.color}" stroke="#04223a" stroke-width="3" stroke-linejoin="round"/>
      <g fill="${ink(p.color)}" font-family="Bricolage Grotesque, sans-serif" font-weight="800">${print}</g>
    </svg>`;
  }

  function artStyle(p) {
    const [a, b] = p.towel || ["#12b5bf", "#ffd84a"];
    return `--t1:${a};--t2:${b}`;
  }

  const badge = (p) => `<span class="badge badge--${p.stock}">${stockOf(p).label}</span>`;
  // Marques provisoires : visibles tant que le client n'a pas fourni photo et prix réels
  const soon = (p) => (p.image ? "" : `<span class="soon">Visuel à venir</span>`);
  const live = () => products.some((p) => p.stripe);

  /* ---------- Paiement Stripe ---------- */
  function checkoutUrl(p, size) {
    const s = p.stripe;
    if (!s) return "";
    if (typeof s === "object") return s[size] || "";
    const url = new URL(s);
    url.searchParams.set("client_reference_id", `${p.id}__${size}`.replace(/[^\w-]/g, "_"));
    return url.toString();
  }

  function buy(p, size) {
    if (!size) return toast("Choisis ta taille d'abord.");
    const url = checkoutUrl(p, size);
    if (!url) return toast("Paiement pas encore branché pour ce produit. Écris-nous sur Instagram.");
    window.location.href = url;
  }

  function buyBlock(p, idPrefix) {
    const st = stockOf(p);
    const single = p.sizes.length === 1;
    const sizes = p.sizes.map((s, i) => `
      <label class="size">
        <input type="radio" name="${idPrefix}-size" value="${s}" ${single && i === 0 ? "checked" : ""} ${st.buy ? "" : "disabled"}>
        <span>${s}</span>
      </label>`).join("");
    return `
      <fieldset class="sizes" ${st.buy ? "" : "disabled"}>
        <legend>Taille</legend>
        <div class="sizes__row">${sizes}</div>
      </fieldset>
      <div class="buy">
        <button class="btn btn--buy" data-add="${p.id}" ${st.buy ? "" : "disabled"}>
          ${st.buy ? `Ajouter au panier · ${money.format(p.price)}` : "Épuisé"}
        </button>
        ${st.buy ? `<button class="btn btn--dark buy__now" data-buy="${p.id}">Acheter maintenant</button>` : ""}
      </div>`;
  }

  function wireBuy(root, p) {
    const picked = () => { const r = $("input[type=radio]:checked", root); return r && r.value; };
    const now = $("[data-buy]", root);
    if (now) now.addEventListener("click", (e) => { e.preventDefault(); buy(p, picked()); });
    const add = $("[data-add]", root);
    if (add) add.addEventListener("click", (e) => {
      e.preventDefault();
      const size = picked();
      if (!size) return toast("Choisis ta taille d'abord.");
      cart.add(p, size, $(".sheet__art img, .sheet__art svg, .feat__art img", root));
    });
  }

  /* ---------- Pièce phare (carte posée sur le hero) ---------- */
  function renderFeatured() {
    const slot = $("[data-featured]");
    const p = products.find((x) => x.featured) || products[0];
    if (!slot || !p) return;
    slot.innerHTML = `
      <button class="feat" data-open="${p.id}" aria-label="${p.name}, ${money.format(p.price)}, choisir ma taille">
        <span class="feat__art">${garment(p, false)}</span>
        <span>
          <span class="feat__name">${p.name}</span>
          <span class="feat__price">${money.format(p.price)}</span>
        </span>
        <span class="feat__go">Choisir ma taille <svg class="ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>
      </button>`;
  }

  /* ---------- Le drop ---------- */
  // Tri : les épuisés passent toujours en dernier
  let currentSort = "default";
  function sorted(list) {
    const out = (p) => (p.stock === "epuise" ? 1 : 0);
    const by = {
      default: () => 0,
      new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
      asc: (a, b) => a.price - b.price,
      desc: (a, b) => b.price - a.price
    }[currentSort] || (() => 0);
    return list.map((p, i) => ({ p, i })).sort((x, y) => out(x.p) - out(y.p) || by(x.p, y.p) || x.i - y.i).map((x) => x.p);
  }

  // Carte produit : zone de clic pleine, 2e photo au survol, ajout rapide par taille
  function cardHTML(p, feature) {
    const st = stockOf(p);
    const alt = (p.images || [])[0];
    const quick = st.buy ? `
      <div class="quick" role="group" aria-label="Ajout rapide, ${p.name}">
        <span class="quick__t">${p.sizes.length > 1 ? "Ajout rapide" : "Taille unique"}</span>
        <div class="quick__row">${p.sizes.map((sz) => `<button type="button" class="quick__btn" data-quick="${p.id}" data-size="${sz}" aria-label="Ajouter ${p.name}, taille ${sz}">${p.sizes.length > 1 ? sz : "Ajouter"}</button>`).join("")}</div>
      </div>` : "";
    const media = feature && p.look
      ? `<img class="card__look" src="${p.look}" alt="${p.name}, porté" loading="lazy" decoding="async">`
      : `${garment(p)}${alt ? `<img class="card__alt" src="${alt}" alt="" loading="lazy" decoding="async">` : ""}`;
    return `
      <article class="card ${p.stock === "epuise" ? "is-out" : ""} ${feature ? "is-feature" : ""} ${alt || feature ? "has-alt" : ""}">
        <button class="card__hit" data-open="${p.id}" aria-label="${p.name}, ${money.format(p.price)}, ${st.label}"></button>
        <div class="card__media" style="${artStyle(p)}">
          <div class="card__tags">${p.new ? `<span class="tag-new">Nouveau</span>` : ""}${badge(p)}</div>
          ${media}
          ${soon(p)}
          ${quick}
          ${feature ? `<div class="card__over"><p class="card__over-name">${p.name}</p><p class="card__over-sub">${p.sizes.length} tailles · ${money.format(p.price)}</p></div>` : ""}
        </div>
        <div class="card__meta">
          <p class="card__name">${p.name}</p>
          <p class="card__price">${money.format(p.price)}</p>
          <p class="card__sub">${p.sizes.length > 1 ? `${p.sizes[0]} – ${p.sizes[p.sizes.length - 1]}` : p.sizes[0]} · ${st.label}</p>
        </div>
      </article>`;
  }

  function renderGrid(filter = "all", animate = false) {
    const grid = $("[data-grid]");
    const list = sorted(products.filter((p) => filter === "all" || p.type === filter));
    const featureOn = filter === "all" && currentSort === "default" && currentView === "rail";
    grid.innerHTML = list.map((p) => `
      <li class="drop__item ${featureOn && p.featured && p.look ? "is-feature" : ""}">${cardHTML(p, featureOn && p.featured && p.look)}</li>`).join("");
    $("[data-pos-n]").textContent = String(list.length).padStart(2, "0");
    $("[data-empty]").hidden = list.length > 0;
    $("[data-count]").textContent = `${list.length} pièce${list.length > 1 ? "s" : ""}`;
    const tbc = $("[data-tbc]");
    if (tbc) tbc.hidden = !!shop.pricesFinal;
    currentFilter = filter;

    if (animate && !reduced) {
      $$(".drop__item", grid).forEach((el, i) => el.animate(
        [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 350, delay: i * 40, easing: "cubic-bezier(.23, 1, .32, 1)", fill: "backwards" }
      ));
    }
    layoutDrop();
  }

  let currentFilter = "all";
  let currentView = "rail";
  try { if (localStorage.getItem("fkn-view") === "grid") currentView = "grid"; } catch {}

  // Pastille qui glisse sous le filtre actif
  function movePillTo(chip) {
    const pill = $("[data-filter-pill]");
    if (!pill || !chip) return;
    pill.style.width = `${chip.offsetWidth}px`;
    pill.style.translate = `${chip.offsetLeft}px 0`;
    pill.classList.add("is-on");
  }
  function setFilter(type, animate = true) {
    $$("[data-filter]").forEach((c) => {
      const on = c.dataset.filter === type;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", String(on));
      if (on) movePillTo(c);
    });
    if (type !== currentFilter) renderGrid(type, animate);
  }
  function setView(v) {
    currentView = v;
    try { localStorage.setItem("fkn-view", v); } catch {}
    $$("[data-view]").forEach((b) => { const on = b.dataset.view === v; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
    drop.classList.toggle("is-grid", v === "grid");
    renderGrid(currentFilter, true);
  }

  // Aller au rail, filtré : depuis le méga-menu, l'index, le footer, le menu mobile
  function goToDrop(type) {
    closeOverlays();
    setFilter(type || "all");
    scrollToSection("drop");
  }

  function wireFilters() {
    $$("[data-filter]").forEach((chip) => chip.addEventListener("click", () => setFilter(chip.dataset.filter)));
    requestAnimationFrame(() => movePillTo($("[data-filter].is-on")));
    addEventListener("resize", () => movePillTo($("[data-filter].is-on")));
    if (document.fonts) document.fonts.ready.then(() => movePillTo($("[data-filter].is-on")));
    $("[data-sort]").addEventListener("change", (e) => { currentSort = e.target.value; renderGrid(currentFilter, true); });
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.view !== currentView) setView(b.dataset.view); }));
    drop.classList.toggle("is-grid", currentView === "grid");
    $$("[data-view]").forEach((b) => { const on = b.dataset.view === currentView; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
    // Ajout rapide depuis la carte
    $("[data-grid]").addEventListener("click", (e) => {
      const q = e.target.closest("[data-quick]");
      if (!q) return;
      const p = products.find((x) => x.id === q.dataset.quick);
      const card = q.closest(".card");
      cart.add(p, q.dataset.size, $(".card__media img, .card__media svg", card));
      q.classList.add("is-done");
      setTimeout(() => q.classList.remove("is-done"), 900);
    });
    // Flèches : une carte à la fois
    $$("[data-step]").forEach((b) => b.addEventListener("click", () => stepDrop(+b.dataset.step)));
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-filter-link]");
      if (!a) return;
      e.preventDefault();
      goToDrop(a.dataset.filterLink);
    });
  }

  // Desktop : la section se fige et le scroll vertical fait glisser le rail.
  // Mobile / tactile : rail natif avec snap, on swipe.
  const drop = $("[data-drop]");
  const track = $("[data-grid]");
  const viewport = $("[data-viewport]");
  const rail = $("[data-rail]");
  const pinMq = matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
  let pinned = false;
  let maxX = 0;

  function layoutDrop() {
    if (!drop) return;
    pinned = pinMq.matches && !reduced && currentView === "rail";
    drop.classList.toggle("is-pinned", pinned);
    if (pinned) {
      maxX = Math.max(0, track.scrollWidth - innerWidth);
      drop.style.height = `${innerHeight + maxX}px`;
    } else {
      maxX = 0;
      drop.style.height = "";
      track.style.transform = "";
    }
    updateDrop();
  }

  function updateDrop() {
    if (!drop) return;
    let prog;
    if (pinned) {
      prog = maxX ? clamp(-drop.getBoundingClientRect().top / maxX, 0, 1) : 0;
      track.style.transform = `translate3d(${(-prog * maxX).toFixed(1)}px, 0, 0)`;
    } else {
      const max = viewport.scrollWidth - viewport.clientWidth;
      prog = max > 0 ? viewport.scrollLeft / max : 0;
    }
    rail.style.transform = `scaleX(${prog.toFixed(4)})`;
    const n = $$(".drop__item", track).length;
    const pos = $("[data-pos]");
    if (pos) pos.textContent = String(n ? Math.min(n, Math.round(prog * (n - 1)) + 1) : 0).padStart(2, "0");
    const [prev, next] = $$("[data-step]");
    if (prev) { prev.disabled = prog <= 0.001; next.disabled = prog >= 0.999 || (!pinned && viewport.scrollWidth <= viewport.clientWidth); }
  }

  function stepDrop(dir) {
    const item = $(".drop__item:not(.is-feature)", track) || $(".drop__item", track);
    if (!item) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    const dx = (item.offsetWidth + gap) * dir;
    if (pinned) {
      const top = drop.getBoundingClientRect().top + scrollY;
      const cur = scrollY - top;
      scrollTo({ top: top + clamp(cur + dx, 0, maxX), behavior: reduced ? "auto" : "smooth" });
    } else viewport.scrollBy({ left: dx, behavior: reduced ? "auto" : "smooth" });
  }

  function wireDrop() {
    viewport.addEventListener("scroll", () => { if (!pinned) updateDrop(); }, { passive: true });
    pinMq.addEventListener("change", layoutDrop);
    // Clavier : amener la carte focalisée dans le rail figé
    track.addEventListener("focusin", (e) => {
      if (!pinned) return;
      const item = e.target.closest(".drop__item");
      if (!item) return;
      const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const x = clamp(item.offsetLeft - gutter, 0, maxX);
      scrollTo({ top: drop.offsetTop + x, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Fiche produit : modale / tiroir ---------- */
  const sheet = $("[data-sheet]");
  let closing = false;

  function openSheet(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const body = $("[data-sheet-body]");
    body.innerHTML = `
      <span class="sheet__grab" data-grab aria-hidden="true"></span>
      <div class="sheet__art" style="${artStyle(p)}">
        <div class="sheet__main" data-sheet-main>${garment(p, false)}</div>
        ${p.image && (p.images || []).length ? `<div class="sheet__thumbs" role="group" aria-label="Photos du produit">${[p.image, ...p.images].map((src, i) => `
          <button type="button" class="sheet__thumb ${i ? "" : "is-on"}" data-thumb="${src}" aria-label="Photo ${i + 1}" aria-pressed="${!i}"><img src="${src}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>` : ""}
      </div>
      <div class="sheet__info">
        ${badge(p)}
        <h2 id="sheet-title" class="sheet__name">${p.name}</h2>
        <p class="sheet__price">${money.format(p.price)}${shop.pricesFinal ? "" : ` <span class="tbc">Prix provisoire</span>`}</p>
        ${buyBlock(p, "sheet")}
        <ul class="sheet__facts">
          <li>${checkoutUrl(p, p.sizes[0]) ? "Paiement sécurisé Stripe : carte, Apple Pay, Google Pay" : "Paiement en ligne bientôt branché : commande possible par DM Instagram"}</li>
          <li>Livraison choisie à l'étape suivante</li>
          <li><a href="#faq-tailles" data-faq="tailles">Guide des tailles</a></li>
        </ul>
        ${related(p)}
      </div>`;
    wireBuy(body, p);
    $$("[data-thumb]", body).forEach((t) => t.addEventListener("click", () => {
      const main = $("[data-sheet-main] img", body);
      if (!main || main.getAttribute("src") === t.dataset.thumb) return;
      $$("[data-thumb]", body).forEach((x) => { x.classList.toggle("is-on", x === t); x.setAttribute("aria-pressed", String(x === t)); });
      const swap = () => { main.src = t.dataset.thumb; };
      if (reduced) return swap();
      main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }).finished.then(() => {
        swap();
        main.animate([{ opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1 }], { duration: 380, easing: "cubic-bezier(.23, 1, .32, 1)", fill: "forwards" });
      });
    }));
    sheet.style.transform = "";
    sheet.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
    document.documentElement.style.overflow = "hidden";
    history.replaceState(null, "", `#p/${p.id}`);
  }

  // « Avec ça » : trois autres pièces, même type d'abord
  function related(p) {
    const others = products.filter((x) => x.id !== p.id && x.stock !== "epuise")
      .sort((a, b) => (b.type === p.type) - (a.type === p.type)).slice(0, 3);
    if (!others.length) return "";
    return `<div class="also"><p class="also__t">Avec ça</p><div class="also__row">${others.map((x) => `
      <button class="also__item" data-open="${x.id}" aria-label="${x.name}, ${money.format(x.price)}">
        <span class="also__art" style="${artStyle(x)}">${garment(x)}${soon(x)}</span>
        <span class="also__name">${x.name}</span><span class="also__price">${money.format(x.price)}</span>
      </button>`).join("")}</div></div>`;
  }

  function closeSheet() {
    if (!sheet.open || closing) return;
    closing = true;
    sheet.style.transform = "";
    sheet.classList.add("is-closing");
    setTimeout(() => {
      sheet.close();
      sheet.classList.remove("is-closing");
      closing = false;
    }, reduced ? 0 : 230);
  }

  function wireSheet() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open]");
      if (!t) return;
      closeOverlays();
      openSheet(t.dataset.open);
    });
    $("[data-close]", sheet).addEventListener("click", closeSheet);
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
    sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
    sheet.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      history.replaceState(null, "", location.pathname + location.search);
    });
    wireDrag();
  }

  // Tiroir mobile : tirer vers le bas pour fermer. Un geste rapide suffit.
  function wireDrag() {
    let startY = 0, startT = 0, dy = 0, active = false;
    sheet.addEventListener("pointerdown", (e) => {
      if (active || innerWidth > 720 || !e.target.closest("[data-grab], .sheet__art")) return;
      if (sheet.scrollTop > 0) return;
      active = true; startY = e.clientY; startT = performance.now(); dy = 0;
      sheet.classList.add("is-dragging");
      sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener("pointermove", (e) => {
      if (!active) return;
      const raw = e.clientY - startY;
      dy = raw > 0 ? raw : -Math.sqrt(-raw) * 2; // friction vers le haut
      sheet.style.transform = `translateY(${dy.toFixed(1)}px)`;
    });
    const end = () => {
      if (!active) return;
      active = false;
      sheet.classList.remove("is-dragging");
      const velocity = dy / (performance.now() - startT);
      if (dy > 120 || (dy > 24 && velocity > 0.11)) closeSheet();
      else sheet.style.transform = "";
    };
    sheet.addEventListener("pointerup", end);
    sheet.addEventListener("pointercancel", end);
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg, action) {
    const el = $("[data-toast]");
    el.textContent = msg;
    if (action) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "toast__act"; b.textContent = action.label;
      b.addEventListener("click", () => { el.classList.remove("is-on"); action.run(); });
      el.appendChild(b);
    }
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 3600);
  }

  /* ---------- Scroll : header, hero, progression, manifeste ---------- */
  const top = $("[data-top]");
  const hero = $("[data-hero]");
  const heroMedia = $("[data-hero-media]");
  const heroContent = $("[data-hero-content]");
  const heroFeat = $("[data-featured]");
  const hud = $(".hud");
  const progress = $("[data-progress]");
  const scrollPct = $("[data-scroll-pct]");
  const words = [];
  let lit = -1;

  function splitWords() {
    const el = $("[data-words]");
    if (!el) return;
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    words.push(...$$(".w", el));
  }

  function onScroll() {
    const y = scrollY;
    const vh = innerHeight;
    const heroH = hero.offsetHeight;

    // Menu toujours visible : dès qu'on descend, il devient une île de verre
    top.classList.toggle("is-solid", y > 40);

    const max = document.documentElement.scrollHeight - vh;
    const pct = max > 0 ? y / max : 0;
    progress.style.transform = `scaleX(${pct.toFixed(4)})`;
    if (scrollPct) scrollPct.textContent = String(Math.round(pct * 100)).padStart(3, "0");

    // Hero : l'image descend moins vite que la page, le texte s'efface
    if (!reduced && y < heroH) {
      const p = y / heroH;
      heroMedia.style.transform = `translate3d(0, ${(y * 0.25).toFixed(1)}px, 0) scale(${(1 + p * 0.06).toFixed(4)})`;
      heroContent.style.transform = `translate3d(0, ${(y * -0.12).toFixed(1)}px, 0)`;
      heroContent.style.opacity = heroFeat.style.opacity = hud.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
    }

    updateDrop();

    // Manifeste : les mots s'allument au fil du scroll
    if (words.length && !reduced) {
      const r = words[0].parentElement.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.3), 0, 1);
      const n = Math.round(p * words.length);
      if (n !== lit) {
        words.forEach((w, i) => w.classList.toggle("is-on", i < n));
        lit = n;
      }
    }
  }

  function wireScroll() {
    let raf = 0;
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
    addEventListener("resize", () => { layoutDrop(); onScroll(); });
    onScroll();
  }

  /* ---------- Apparitions : lookbook (clip-path) et footer ---------- */
  function wireReveals() {
    const shots = $$("[data-shot]");
    shots.forEach((el, i) => el.style.setProperty("--delay", `${(i % 2) * 90}ms`));
    $$(".foot__word span").forEach((el, i) => el.style.setProperty("--i", i));
    const targets = [...shots, $(".foot__word")].filter(Boolean);
    if (reduced || !("IntersectionObserver" in window)) return targets.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Hero vivant : la mer du wallpaper animée en WebGL ----------
     Mer en perspective (bruit qui roule vers la plage), scintillement du soleil,
     écume qui respire, brume et rayons dans le ciel, profondeur 2.5D qui suit
     la souris avec un ressort, ondes au toucher. Le surfeur, les rochers et le
     treillis restent nets. Netteté renforcée (CAS) + grain fin pour l'image agrandie. */
  const VERT = `
    attribute vec2 p;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
      gl_Position = vec4(p, 0.0, 1.0);
    }`;

  const FRAG = `
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_img;
    uniform vec2 u_focus;
    uniform vec2 u_look;     // regard (souris + ressort), -0.5..0.5
    uniform vec2 u_cam;      // travelling lent de la caméra
    uniform float u_zoom;    // zoom cinéma (intro + respiration lente)
    uniform float u_time;
    uniform float u_intro;   // 0 → 1 : fondu d'ouverture
    uniform float u_scroll;  // 0 → 1 sur la hauteur du hero
    uniform vec4 u_rip[8];
    varying vec2 v_uv;

    const float H = 0.296;   // ligne du rivage dans la photo (Galion)

    float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 q) {
      vec2 i = floor(q), f = fract(q);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 q) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(q); q = q * 2.03 + 17.1; a *= 0.5; }
      return v;
    }
    float box(vec2 q, vec2 a, vec2 b, float f) {
      vec2 s = smoothstep(a - f, a, q) * (1.0 - smoothstep(b, b + f, q));
      return s.x * s.y;
    }
    // Zone qui ne doit pas bouger : le surfeur et sa planche
    float stillMask(vec2 q, float f) {
      return box(q, vec2(0.538, 0.525), vec2(0.62, 0.675), f);
    }
    float cellEdge(vec2 p, float t) {
      vec2 i = floor(p), f = fract(p);
      float d1 = 8.0, d2 = 8.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y));
          vec2 o = vec2(hash(i + g), hash(i + g + 19.7));
          o = 0.5 + 0.45 * sin(t + 6.2831 * o);
          float d = length(g + o - f);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
        }
      }
      return d2 - d1;
    }
    float swell(vec2 w, float t) {
      float a = fbm(vec2(w.x * 0.9, w.y * 1.4 - t * 0.55));
      float b = fbm(vec2(w.x * 1.7 + 3.0, w.y * 2.3 - t * 0.9) + a * 0.6);
      return a * 0.65 + b * 0.35;
    }
    // Lecture nette (CAS) : récupère le détail de l'image agrandie
    vec3 tap(vec2 st) {
      vec2 px = 1.0 / u_img;
      vec3 cc = texture2D(u_tex, st).rgb;
      vec3 cn = texture2D(u_tex, st + vec2(0.0, -px.y)).rgb;
      vec3 cs = texture2D(u_tex, st + vec2(0.0, px.y)).rgb;
      vec3 cw = texture2D(u_tex, st + vec2(-px.x, 0.0)).rgb;
      vec3 ce = texture2D(u_tex, st + vec2(px.x, 0.0)).rgb;
      vec3 mn = min(cc, min(min(cn, cs), min(cw, ce)));
      vec3 mx = max(cc, max(max(cn, cs), max(cw, ce)));
      vec3 amt = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-3), 0.0, 1.0)) * 0.2;
      return clamp(cc + (4.0 * cc - cn - cs - cw - ce) * amt * 0.25, 0.0, 1.0);
    }

    void main() {
      float ca = u_res.x / u_res.y;
      float ia = u_img.x / u_img.y;
      vec2 s = (ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0)) * 0.94 / u_zoom;
      vec2 c = clamp(u_focus, s * 0.5, 1.0 - s * 0.5);
      vec2 uv0 = c + (v_uv - 0.5) * s;

      float still = stillMask(uv0, 0.012);
      float sea = smoothstep(H - 0.004, H + 0.025, uv0.y);
      float depth = clamp((uv0.y - H) / (1.0 - H), 0.0, 1.0);
      float t = u_time * 0.75;   // rythme calme

      // Profondeur 2.5D : ciel lointain, premier plan proche, surfeur avec le premier plan
      float layer = mix(mix(0.12, 0.35, sea), 1.0, sea * depth);
      layer = mix(layer, 0.9, still);
      vec2 uv = uv0 + u_look * vec2(0.022, 0.014) * layer
              + vec2(0.0, u_scroll * 0.05 * (1.0 - layer))
              + u_cam * (0.6 + layer * 0.4);

      float water = sea * (1.0 - still);

      // Houle en perspective (pente → reflets)
      float z = 1.0 / (uv.y - H + 0.035);
      vec2 w = vec2((uv.x - 0.5) * z, z);
      float e = 0.04;
      float h0 = swell(w, t);
      vec2 grad = vec2(swell(w + vec2(e, 0.0), t) - h0, swell(w + vec2(0.0, e), t) - h0) / e;
      vec2 d = vec2(grad.x * 0.6, grad.y) * (0.003 * pow(depth, 1.25) + 0.0003);

      // Ondes au toucher
      vec2 asp = vec2(ca, 1.0);
      float ring = 0.0;
      for (int i = 0; i < 8; i++) {
        vec4 r = u_rip[i];
        float age = t - r.z;
        if (r.w <= 0.0 || age < 0.0 || age > 4.0) continue;
        vec2 dv = (v_uv - r.xy) * asp;
        float dist = length(dv);
        float front = age * 0.28;
        float env = (1.0 - smoothstep(front - 0.1, front + 0.02, dist)) * exp(-age * 1.1) * exp(-dist * 5.0);
        float wv = sin(dist * 70.0 - age * 8.5) * env * r.w;
        d += normalize(dv + 1e-5) * wv * 0.024;
        ring += wv;
      }

      // Mouvement continu : seule la houle, qui avance vers la plage, déforme l'eau.
      // Pas de fondu entre deux phases : aucun battement, un glissement fluide.
      vec3 col = tap(uv + d * water);

      // Scintillement du soleil sur la pente de la houle
      vec3 n = normalize(vec3(-grad.x * 1.4, 1.0, -grad.y * 0.9));
      vec3 sun = normalize(vec3(-0.35, 0.75, -0.55));
      float glint = pow(max(dot(n, sun), 0.0), 70.0) * (0.25 + depth) * 0.5;
      glint *= smoothstep(0.4, 0.8, noise(w * 4.0 + t * 0.6));
      col += vec3(1.0, 0.97, 0.88) * (glint + max(ring, 0.0) * 0.1) * water;

      // L'écume respire
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += (noise(w * 2.5 - vec2(0.0, t * 0.6)) - 0.5) * 0.05 * smoothstep(0.62, 0.85, lum) * water;

      // Caustiques sur le fond sableux, visibles là où l'eau est claire
      vec2 cp = w * vec2(1.6, 0.9) + d * 40.0;
      cp += vec2(noise(cp * 0.6 + t * 0.2), noise(cp * 0.6 - t * 0.2 + 5.0)) * 1.1;
      float ca1 = 1.0 - smoothstep(0.0, 0.32, cellEdge(cp, t * 0.7));
      float ca2 = 1.0 - smoothstep(0.0, 0.26, cellEdge(cp * 1.6 + 3.1, t * 0.95));
      float caus = pow(ca1 * ca2, 2.0) * 1.6 + pow(ca1, 3.0) * 0.15;
      float clear = smoothstep(0.3, 0.65, dot(col, vec3(0.2, 0.5, 0.3)));
      col += vec3(0.75, 1.0, 0.95) * caus * 0.09 * water * clear * smoothstep(0.05, 0.4, depth);

      // Rayons de lumière discrets dans le ciel
      vec2 ro = v_uv - vec2(0.18, -0.25);
      float rays = fbm(vec2(atan(ro.y, ro.x) * 9.0, t * 0.12)) * (1.0 - smoothstep(0.2, 1.3, length(ro)));
      col += vec3(1.0, 0.95, 0.85) * pow(rays, 3.0) * 0.06 * (1.0 - sea);

      // Étalonnage filmique : courbe douce, ombres froides, hautes lumières chaudes
      vec3 aces = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
      col = mix(col, aces, 0.35);
      lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += vec3(-0.012, 0.004, 0.022) * (1.0 - lum) + vec3(0.022, 0.012, -0.012) * lum;
      col *= mix(1.0, 0.86, smoothstep(0.45, 1.05, length((v_uv - 0.5) * vec2(ca * 0.75, 1.0))));
      col += (hash(gl_FragCoord.xy) - 0.5) * 0.018;   // grain fixe : pas de scintillement

      // Intro : la photo émerge de la nuit pendant que la caméra recule
      col = mix(vec3(0.012, 0.067, 0.114), col, smoothstep(0.0, 0.85, u_intro));

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`;

  function wireSea() {
    const canvas = $("[data-sea]");
    const img = $("[data-hero-img]");
    const hint = $("[data-hint]");
    const root = document.documentElement;
    if (!canvas || !img) { root.classList.add("no-gl"); return; }
    if (reduced) { root.classList.add("no-gl"); return; }

    const opts = { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" };
    const gl = canvas.getContext("webgl2", opts) || canvas.getContext("webgl", opts);
    if (!gl) { root.classList.add("no-gl"); return; }
    const isGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

    function shader(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    }

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn("Mer WebGL désactivée :", err.message);
      root.classList.add("no-gl");
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ["u_res", "u_img", "u_focus", "u_look", "u_cam", "u_zoom", "u_time", "u_intro", "u_scroll", "u_rip"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    const FOCUS = [0.57, 0.5];
    const HORIZON = 0.296;
    // Écran large : le surfeur passe dans l'eau libre, entre le titre et la carte phare
    const setFocus = () => { FOCUS[0] = innerWidth / innerHeight > 1.25 ? 0.46 : 0.57; gl.uniform2f(U.u_focus, FOCUS[0], FOCUS[1]); };
    setFocus();

    const ripples = new Float32Array(8 * 4);
    let next = 0;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;
    const addRipple = (x, y, strength) => { ripples.set([x, y, now(), strength], next * 4); next = (next + 1) % 8; };

    function horizonOnScreen() {
      const ca = canvas.width / canvas.height;
      const ia = img.naturalWidth / img.naturalHeight;
      const sy = (ca > ia ? ia / ca : 1) * 0.95;
      const cy = clamp(FOCUS[1], sy / 2, 1 - sy / 2);
      return clamp((HORIZON - cy) / sy + 0.5, 0, 1);
    }

    // Qualité adaptative : on baisse la résolution si l'appareil peine
    let dpr = Math.min(devicePixelRatio || 1, finePointer ? 2 : 1.5);
    function resize() {
      canvas.width = Math.round(hero.clientWidth * dpr);
      canvas.height = Math.round(hero.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.u_res, canvas.width, canvas.height);
      setFocus();
    }

    // Regard : ressort amorti (pas de suivi brut de la souris)
    const look = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let pointerSeen = 0;
    function stepSpring(dt) {
      if (performance.now() - pointerSeen > 2500) {
        const t = now();
        look.tx = Math.sin(t * 0.11) * 0.3;
        look.ty = Math.sin(t * 0.09 + 1.3) * 0.16;
      }
      // Ressort souple et bien amorti : le regard glisse, sans rebond
      const k = 14, c = 7.5;
      look.vx += ((look.tx - look.x) * k - look.vx * c) * dt;
      look.vy += ((look.ty - look.y) * k - look.vy * c) * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;
    }

    let running = false, raf = 0, last = performance.now(), scrollS = 0;
    let introStart = -1, frames = 0, slowAcc = 0;
    function frame(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      const t = now();
      if (introStart < 0) introStart = t;
      const ip = clamp((t - introStart) / 2.6, 0, 1);
      const intro = 1 - Math.pow(1 - ip, 4);   // ease-out marqué : arrivée douce
      stepSpring(dt);
      // Scroll lissé : la molette avance par crans, l'image, elle, glisse
      scrollS += (clamp(scrollY / hero.offsetHeight, 0, 1) - scrollS) * Math.min(1, dt * 8);

      gl.uniform1f(U.u_time, t);
      gl.uniform1f(U.u_intro, intro);
      gl.uniform1f(U.u_scroll, scrollS);
      gl.uniform2f(U.u_look, look.x, look.y);
      // Travelling lent façon drone : la caméra dérive et respire, sans à-coups
      gl.uniform2f(U.u_cam, Math.sin(t * 0.045) * 0.012, Math.sin(t * 0.037 + 1.1) * 0.006);
      const breathe = 0.5 - 0.5 * Math.cos(t * 0.06);          // cycle d'environ 100 s
      gl.uniform1f(U.u_zoom, 1 + (1 - intro) * 0.14 + breathe * 0.035 + scrollS * 0.05);
      gl.uniform4fv(U.u_rip, ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Surveillance : si la moyenne dépasse ~22 ms sur 90 images, on réduit la résolution
      if (ip >= 1) {
        frames++; slowAcc += dt;
        if (frames === 90) {
          if (slowAcc / frames > 0.022 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); resize(); }
          frames = 0; slowAcc = 0;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    }

    function start() {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      if (isGL2) {
        // Mipmaps : image nette et sans scintillement quand elle est réduite (mobile)
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.uniform2f(U.u_img, img.naturalWidth, img.naturalHeight);
      resize();
      canvas.classList.add("is-live");
      root.classList.add("gl-live");

      new IntersectionObserver(([e]) => setRunning(e.isIntersecting && !document.hidden)).observe(hero);
      document.addEventListener("visibilitychange", () => setRunning(!document.hidden && scrollY < hero.offsetHeight));
      addEventListener("resize", resize);

      // Interaction : la souris oriente le regard et laisse un sillage ; clic ou doigt = onde franche
      let trail = { x: -1, y: -1, t: 0 };
      const toUv = (e) => {
        const r = hero.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
      };
      const touched = () => hint && hint.classList.add("is-gone");
      hero.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button")) return;
        const [x, y] = toUv(e);
        addRipple(x, y, 1.1);
        touched();
      });
      if (finePointer) {
        hero.addEventListener("pointermove", (e) => {
          const [x, y] = toUv(e);
          pointerSeen = performance.now();
          look.tx = x - 0.5;
          look.ty = y - 0.5;
          const t = performance.now();
          if (Math.hypot(x - trail.x, y - trail.y) < 0.035 || t - trail.t < 90 || y < horizonOnScreen()) return;
          trail = { x, y, t };
          addRipple(x, y, 0.4);
          touched();
        });
        hero.addEventListener("pointerleave", () => { pointerSeen = 0; });
      }
    }

    const ready = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(start);
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener("load", ready, { once: true });
    img.addEventListener("error", () => root.classList.add("no-gl"), { once: true });
  }

  /* ---------- Interface futuriste : HUD, texte décodé, titres masqués ---------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_<>";

  // Le texte se « décode » : chaque lettre tire des glyphes au hasard puis se fige
  function scramble(el) {
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    if (reduced) { el.textContent = final; return; }
    const start = performance.now();
    const dur = 650;
    const step = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) {
        out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = final;
    };
    requestAnimationFrame(step);
  }

  function maskTitles() {
    $$("[data-mask]").forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.innerHTML = text.split(/\s+/).map((w, i) =>
        `<span class="mw" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(" ");
    });
  }

  function wireFuturist() {
    const hudDrop = $("[data-hud-drop]");
    if (hudDrop && shop.dropName) hudDrop.textContent = `N°01 / ${shop.dropName}`;

    // Heure locale du visiteur dans le HUD
    const clock = $("[data-clock]");
    const fmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const tick = () => { if (clock) clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);

    // Décodage du HUD à l'intro, puis des titres et kickers à leur entrée
    $$(".hud [data-scramble]").forEach((el) => setTimeout(() => scramble(el), 900));
    const targets = [...$$("[data-mask]"), ...$$("[data-scramble]").filter((el) => !el.closest(".hud"))];
    if (reduced || !("IntersectionObserver" in window)) return targets.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.hasAttribute("data-scramble")) scramble(e.target);
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -10% 0px" });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Menu : pastille de section active + menu mobile ---------- */
  let setMenuOpen = null;
  function wireNav() {
    const nav = $("[data-nav]");
    const pill = $("[data-pill]");
    const links = $$("[data-section]", nav);

    function movePill(link) {
      if (!link) { pill.classList.remove("is-on"); links.forEach((a) => a.classList.remove("is-active")); return; }
      links.forEach((a) => a.classList.toggle("is-active", a === link));
      pill.style.translate = `${link.offsetLeft}px 0`;
      pill.style.width = `${link.offsetWidth}px`;
      pill.classList.add("is-on");
    }

    // La section qui occupe le milieu de l'écran est la section active
    const sections = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
      const current = sections.find((sec) => visible.get(sec.id));
      movePill(current ? links.find((a) => a.dataset.section === current.id) : null);
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((sec) => io.observe(sec));
    addEventListener("resize", () => movePill(links.find((a) => a.classList.contains("is-active"))));

    // Menu mobile
    const burger = $("[data-burger]");
    const menu = $("[data-menu]");
    let open = false;
    function setMenu(on) {
      if (on === open) return;
      open = on;
      burger.setAttribute("aria-expanded", String(on));
      burger.setAttribute("aria-label", on ? "Fermer le menu" : "Ouvrir le menu");
      if (on) {
        menu.hidden = false;
        menu.classList.remove("is-closing");
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
        document.documentElement.style.overflow = "hidden";
        setTimeout(() => $("button, a", menu).focus({ preventScroll: true }), reduced ? 0 : 300);
      } else {
        menu.classList.add("is-closing");
        menu.classList.remove("is-open");
        document.documentElement.style.overflow = "";
        setTimeout(() => { if (!open) menu.hidden = true; }, reduced ? 0 : 360);
      }
    }
    setMenuOpen = setMenu;
    burger.addEventListener("click", () => setMenu(!open));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { setMenu(false); burger.focus(); } });
    matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Curseur, boutons magnétiques, lumière sur les cartes (souris uniquement) ----------
     Le point suit la souris sans délai ; l'anneau suit avec un ressort rapide.
     Le curseur natif n'est masqué qu'une fois le curseur maison affiché. */
  function spring(k = 170, c = 22) {
    return { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, k, c,
      step(dt) {
        this.vx += ((this.tx - this.x) * this.k - this.vx * this.c) * dt;
        this.vy += ((this.ty - this.y) * this.k - this.vy * this.c) * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      },
      snap(x, y) { this.x = this.tx = x; this.y = this.ty = y; this.vx = this.vy = 0; },
      rest() { return Math.abs(this.tx - this.x) + Math.abs(this.ty - this.y) + Math.abs(this.vx) + Math.abs(this.vy) < 0.05; }
    };
  }

  function wirePointerFx() {
    if (!finePointer || reduced) return;
    const root = document.documentElement;
    const cursor = $("[data-cursor]");
    const ring = $(".cursor__ring", cursor);
    const dot = $(".cursor__dot", cursor);
    const label = $("[data-cursor-label]");

    // L'anneau épouse les petits contrôles (comme un pointeur de tablette)
    const SNAP = ".top__nav a, .top__shop, .top__search, .top__ig, .top__cart, .top__burger, .chip, .sheet__close, .finder__esc, .qty button, .size span, .mega__cat, .foot__cols a, .foot__base a, .menu__find, .faq summary, .hero__play, .lb__btn, .quick__btn, .view__btn, .drop__arrow, .sheet__thumb, .sort";
    // … et s'ouvre en pastille qui dit ce que fait le clic
    const LABELS = [
      [".card, .feat, .mini, .hit, .also__item, .line__art", "Voir"],
      [".row", "Filtrer"],
      [".mega__story", "Lookbook"],
      ["[data-shot]", "Agrandir"]
    ];
    const SIZE = { free: 30, link: 54, label: 88, ghost: 76 };

    const pos = spring(520, 42);
    const size = spring(340, 32);
    const rad = spring(340, 32);
    const magnets = new Map();
    const radii = new WeakMap();
    let mx = 0, my = 0, raf = 0, last = performance.now(), seen = false;
    let snapEl = null, still = true, press = 1, pressT = 1;

    const radiusOf = (el) => {
      if (!radii.has(el)) radii.set(el, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8);
      return radii.get(el);
    };
    size.snap(SIZE.free, SIZE.free);
    rad.snap(SIZE.free / 2, 0);

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (snapEl) {
        const r = snapEl.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        // Centré sur le contrôle, avec un léger penchant vers la souris
        pos.tx = cx + (mx - cx) * 0.12;
        pos.ty = cy + (my - cy) * 0.12;
        size.tx = r.width + 10; size.ty = r.height + 10;
        rad.tx = Math.min(radiusOf(snapEl) + 5, (r.height + 10) / 2);
      } else {
        pos.tx = mx; pos.ty = my;
      }
      pos.step(dt); size.step(dt); rad.step(dt);
      press += (pressT - press) * Math.min(1, dt * 22);

      // Étirement dans le sens du mouvement (seulement pour l'anneau libre)
      const speed = Math.hypot(pos.vx, pos.vy);
      const st = still ? Math.min(speed / 4200, 0.32) : 0;
      const a = Math.atan2(pos.vy, pos.vx);
      const w = Math.max(0, size.x), h = Math.max(0, size.y);
      ring.style.width = `${w.toFixed(1)}px`;
      ring.style.height = `${h.toFixed(1)}px`;
      ring.style.borderRadius = `${Math.max(0, rad.x).toFixed(1)}px`;
      ring.style.transform = `translate3d(${(pos.x - w / 2).toFixed(1)}px, ${(pos.y - h / 2).toFixed(1)}px, 0) rotate(${a.toFixed(3)}rad) scale(${((1 + st) * press).toFixed(3)}, ${((1 - st * 0.45) * press).toFixed(3)}) rotate(${(-a).toFixed(3)}rad)`;

      let busy = !pos.rest() || !size.rest() || !rad.rest() || Math.abs(pressT - press) > 0.002;
      magnets.forEach((s, el) => {
        s.step(dt);
        el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
        if (!s.rest()) busy = true;
      });
      raf = busy ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    function setMode(m) {
      ["is-link", "is-label", "is-ghost", "is-snap", "is-text"].forEach((c) => cursor.classList.toggle(c, c === `is-${m}`));
      still = m === "free" || m === "link";
    }

    function updateState(target) {
      if (!target || !target.closest) return;
      const text = target.closest("input, textarea, select, [contenteditable]");
      const snap = !text && target.closest(SNAP);
      let lab = null;
      if (!text && !snap) for (const [sel, t] of LABELS) if (target.closest(sel)) { lab = t; break; }
      const water = !text && !snap && !lab && target.closest("[data-hero]") && !target.closest("a, button, .hero__feat") && !root.classList.contains("no-gl");
      const link = !text && !snap && !lab && !water && target.closest("a, button, summary, label");

      snapEl = snap || null;
      if (text) setMode("text");
      else if (snap) setMode("snap");
      else {
        const m = lab ? "label" : water ? "ghost" : link ? "link" : "free";
        setMode(m);
        if (lab && label.textContent !== lab) label.textContent = lab;
        if (water && label.textContent !== "Touche") label.textContent = "Touche";
        size.tx = size.ty = SIZE[m];
        rad.tx = SIZE[m] / 2;
      }

      const media = target.closest(".card__media");
      if (media) {
        const r = media.getBoundingClientRect();
        media.style.setProperty("--mx", `${(((mx - r.left) / r.width) * 100).toFixed(1)}%`);
        media.style.setProperty("--my", `${(((my - r.top) / r.height) * 100).toFixed(1)}%`);
      }
    }

    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!seen) {
        // Premier mouvement : on place l'anneau directement, puis on masque le curseur natif
        seen = true;
        pos.snap(mx, my);
        root.classList.add("has-cursor");
      }
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      cursor.classList.remove("is-hidden");
      updateState(e.target);
      kick();
    }, { passive: true });

    // Au scroll sans bouger la souris, l'élément survolé change : on met l'état à jour
    addEventListener("scroll", () => { if (seen) { updateState(document.elementFromPoint(mx, my)); kick(); } }, { passive: true });
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) cursor.classList.add("is-hidden"); });
    addEventListener("blur", () => cursor.classList.add("is-hidden"));

    // Clic : l'anneau se pince et une onde part du point touché
    document.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      pressT = 0.84; kick();
      const rp = document.createElement("span");
      rp.className = "cursor__ripple";
      rp.style.left = `${e.clientX}px`;
      rp.style.top = `${e.clientY}px`;
      cursor.appendChild(rp);
      rp.animate(
        [{ transform: "translate(-50%, -50%) scale(.25)", opacity: 0.8 }, { transform: "translate(-50%, -50%) scale(1)", opacity: 0 }],
        { duration: 560, easing: "cubic-bezier(.23, 1, .32, 1)" }
      ).finished.then(() => rp.remove());
    });
    document.addEventListener("pointerup", () => { pressT = 1; kick(); });

    // Les fenêtres (fiche, panier, recherche) s'ouvrent dans la couche du dessus : le curseur les suit
    const layers = $$("dialog");
    const mo = new MutationObserver(() => {
      const host = layers.find((d) => d.open) || document.body;
      if (cursor.parentNode !== host) host.appendChild(cursor);
      updateState(document.elementFromPoint(mx, my));
      kick();
    });
    layers.forEach((d) => mo.observe(d, { attributes: true, attributeFilter: ["open"] }));

    // Boutons magnétiques : attirés vers la souris, reviennent en ressort
    $$(".btn--primary, .btn--glass, .look__cta").forEach((el) => {
      const s = spring(150, 14);
      magnets.set(el, s);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        s.tx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        s.ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
        kick();
      });
      el.addEventListener("pointerleave", () => { s.tx = 0; s.ty = 0; kick(); });
    });
  }

  /* ---------- Fond du site : soleil filtré par les palmes ----------
     Ombres de palmes qui se balancent au vent, lumière chaude tachetée,
     le soleil glisse doucement au fil de la page. */
  const OCEAN_FRAG = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_depth;   // 0 → 1 : progression dans la page après la photo
    uniform float u_scroll;  // pixels défilés
    varying vec2 v_uv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 q) {
      vec2 i = floor(q), f = fract(q);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    // Une palme : tige courbée + folioles en peigne, bords flous (ombre portée)
    float frond(vec2 p, vec2 origin, float ang, float len, float t, float seed) {
      float a = ang + sin(t * 0.55 + seed) * 0.07 + sin(t * 1.6 + seed * 2.3) * 0.018;
      vec2 q = p - origin;
      float c = cos(a), s = sin(a);
      q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
      float u = q.x / len;
      if (u < 0.0 || u > 1.0) return 0.0;
      float y = q.y + 0.22 * u * u * len;                        // la tige retombe
      float halfW = len * 0.2 * sin(3.1416 * pow(u, 0.75));      // plus large au milieu
      float inside = 1.0 - smoothstep(halfW * 0.55, halfW * 1.2, abs(y));
      float lean = abs(y) / max(halfW, 1e-3);
      // Folioles fines, rabattues vers l'arrière, qui s'affinent en pointe
      float wave = sin(u * 105.0 - lean * 8.5 + sin(t * 2.1 + u * 9.0 + seed) * 0.4);
      float leaflets = smoothstep(0.05, 0.75, wave) * (1.0 - smoothstep(0.55, 1.05, lean) * 0.6);
      float spine = 1.0 - smoothstep(0.003, 0.014, abs(y));
      return max(inside * leaflets, spine * (1.0 - u * 0.6));
    }

    void main() {
      vec2 uv = v_uv;
      float ca = u_res.x / u_res.y;
      vec2 p = vec2(uv.x * ca, uv.y);
      float t = u_time;
      float drift = u_scroll * 0.00006;

      // Fond : nuit tropicale, du bleu lagon profond vers le bleu nuit
      vec3 top = vec3(0.022, 0.085, 0.13);
      vec3 bottom = vec3(0.01, 0.06, 0.1);
      vec3 col = mix(top, bottom, smoothstep(0.0, 1.0, uv.y * 0.7 + u_depth * 0.6));

      // Le soleil entre en haut à droite, glisse lentement au fil de la page
      vec2 sunPos = vec2(ca * (0.82 - u_depth * 0.35), -0.15);
      float sun = exp(-length((p - sunPos) * vec2(0.55, 0.9)) * 1.6);

      // Ombres des palmes, floues comme une vraie ombre portée de loin
      vec2 pp = p + vec2(0.0, drift);
      float sh = 0.0;
      sh = max(sh, frond(pp, vec2(ca + 0.12, -0.18), 2.55, 1.05, t, 0.0));
      sh = max(sh, frond(pp, vec2(ca + 0.12, -0.18), 2.05, 0.95, t, 1.7));
      sh = max(sh, frond(pp, vec2(ca + 0.12, -0.18), 3.05, 0.85, t, 3.1));
      sh = max(sh, frond(pp, vec2(ca * 0.55, -0.25), 1.45, 0.75, t, 4.4));
      sh = max(sh, frond(pp, vec2(ca * 0.55, -0.25), 1.95, 0.7, t, 5.9));
      sh = max(sh, frond(pp, vec2(-0.15, 1.15), -0.55, 0.9, t, 7.3));

      // Lumière tachetée : soleil, moins les ombres, avec un léger frémissement
      float flicker = 0.85 + 0.15 * noise(p * 3.0 + t * 0.4);
      float light = sun * (1.0 - sh * 0.82) * flicker;
      col += vec3(0.42, 0.78, 0.82) * light * 0.13;
      col += vec3(0.1, 0.45, 0.55) * sun * 0.04;

      // Brume chaude qui respire
      col += vec3(0.3, 0.6, 0.7) * (noise(p * 0.8 + vec2(t * 0.03, 0.0)) - 0.5) * 0.02;

      // Vignette, grain fin
      col *= mix(1.0, 0.75, smoothstep(0.35, 1.05, length((uv - 0.5) * vec2(ca * 0.6, 1.0))));
      col += (hash(gl_FragCoord.xy + fract(t) * 37.0) - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function wireOcean() {
    const canvas = $("[data-ocean]");
    if (!canvas) return;
    if (reduced) { canvas.classList.add("is-live"); return; } // dégradé CSS seul, immobile

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) { canvas.classList.add("is-live"); return; }

    function shader(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, OCEAN_FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn("Océan WebGL désactivé :", err.message);
      canvas.classList.add("is-live");
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uDepth = gl.getUniformLocation(prog, "u_depth");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");

    // Fond doux : on rend à résolution réduite, le navigateur agrandit (moins de calcul)
    let scale = finePointer ? 0.6 : 0.45;
    function resize() {
      canvas.width = Math.round(innerWidth * scale);
      canvas.height = Math.round(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    addEventListener("resize", resize);

    const t0 = performance.now();
    let raf = 0, running = false, frames = 0, acc = 0, last = performance.now();
    function frame(now) {
      const dt = (now - last) / 1000; last = now;
      const heroH = hero.offsetHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight - heroH);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform1f(uDepth, clamp((scrollY - heroH) / max, 0, 1));
      gl.uniform1f(uScroll, scrollY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // Si l'appareil peine, on baisse encore la résolution
      frames++; acc += dt;
      if (frames === 90) {
        if (acc / frames > 0.024 && scale > 0.3) { scale -= 0.1; resize(); }
        frames = 0; acc = 0;
      }
      raf = requestAnimationFrame(frame);
    }
    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    }
    // L'océan ne tourne que quand on a quitté (en partie) la photo
    const check = () => setRunning(!document.hidden && scrollY > hero.offsetHeight * 0.4);
    addEventListener("scroll", check, { passive: true });
    document.addEventListener("visibilitychange", check);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add("is-live");
    check();
  }

  /* ---------- Catégories (dérivées du catalogue) ---------- */
  const CATS = [
    { id: "tee", label: "T-shirts" },
    { id: "hoodie", label: "Hoodies" },
    { id: "shorts", label: "Shorts" },
    { id: "cap", label: "Casquettes" }
  ];
  const ofType = (t) => products.filter((p) => t === "all" || p.type === t);
  const fromPrice = (list) => {
    const live = list.filter((p) => p.stock !== "epuise");
    return (live.length ? live : list).reduce((m, p) => Math.min(m, p.price), Infinity);
  };
  const catList = () => [{ id: "all", label: "Tout le drop" }, ...CATS].filter((c) => ofType(c.id).length);
  const leadOf = (items) => items.find((p) => p.image) || items[0];

  /* ---------- Panier : mémorisé dans le navigateur, paiement par pièce ---------- */
  const cartEl = $("[data-cart]");
  const cart = {
    items: [],
    load() {
      try { this.items = JSON.parse(localStorage.getItem("fkn-cart") || "[]"); } catch { this.items = []; }
      if (!Array.isArray(this.items)) this.items = [];
      this.items = this.items.filter((it) => it && products.some((p) => p.id === it.id));
    },
    save() { try { localStorage.setItem("fkn-cart", JSON.stringify(this.items)); } catch {} },
    count() { return this.items.reduce((n, it) => n + it.qty, 0); },
    total() { return this.items.reduce((n, it) => n + it.qty * ((products.find((p) => p.id === it.id) || {}).price || 0), 0); },
    add(p, size, fromEl) {
      const line = this.items.find((it) => it.id === p.id && it.size === size);
      if (line) line.qty = Math.min(9, line.qty + 1);
      else this.items.push({ id: p.id, size, qty: 1 });
      this.save();
      const done = () => { renderCart(); bump(); };
      if (fromEl && !reduced) fly(fromEl, done); else done();
      closeSheet();
      toast(`${p.name} · ${size} ajouté.`, { label: "Voir le panier", run: openCart });
    },
    set(i, qty) {
      if (qty <= 0) this.items.splice(i, 1);
      else this.items[i].qty = Math.min(9, qty);
      this.save();
      renderCart();
    }
  };

  // La pièce vole jusqu'au panier
  function fly(el, done) {
    const target = $("[data-cart-open]");
    const a = el.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.removeAttribute("loading");
    Object.assign(ghost.style, {
      position: "fixed", left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
      margin: "0", zIndex: "100", borderRadius: "20px", objectFit: "cover", pointerEvents: "none"
    });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const s = 34 / Math.max(a.width, a.height);
    ghost.animate([
      { transform: "none", opacity: 1, borderRadius: "20px" },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(${(0.6 + s) / 2})`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.3, borderRadius: "50%" }
    ], { duration: 700, easing: "cubic-bezier(.5, 0, .2, 1)" }).finished.then(() => { ghost.remove(); done(); });
  }

  function bump() {
    const c = $("[data-cart-open]");
    c.classList.remove("is-bump");
    void c.offsetWidth;
    c.classList.add("is-bump");
  }

  function renderCart() {
    const n = cart.count();
    const btn = $("[data-cart-open]");
    $("[data-cart-count]").textContent = n;
    btn.classList.toggle("has-items", n > 0);
    btn.setAttribute("aria-label", `Panier, ${n} article${n > 1 ? "s" : ""}`);
    $("[data-cart-n]").textContent = n ? `(${n})` : "";
    $("[data-cart-list]").innerHTML = cart.items.map((it, i) => {
      const p = products.find((x) => x.id === it.id);
      const url = checkoutUrl(p, it.size);
      return `
        <li class="line">
          <button class="line__art" style="${artStyle(p)}" data-open="${p.id}" aria-label="Revoir ${p.name}">${garment(p)}</button>
          <div class="line__info">
            <p class="line__name">${p.name}</p>
            <p class="line__meta">Taille ${it.size} · ${money.format(p.price)}</p>
            <div class="line__row">
              <div class="qty" role="group" aria-label="Quantité, ${p.name}">
                <button type="button" data-qty="${i}" data-d="-1" aria-label="${it.qty === 1 ? "Retirer" : "Un de moins"}">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg></button>
                <span>${it.qty}</span>
                <button type="button" data-qty="${i}" data-d="1" aria-label="Un de plus" ${it.qty >= 9 ? "disabled" : ""}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg></button>
              </div>
              <a class="line__pay" ${url ? `href="${url}"` : `href="#" data-nopay`}>Payer cette pièce</a>
            </div>
          </div>
          <p class="line__total">${money.format(p.price * it.qty)}</p>
        </li>`;
    }).join("");
    $("[data-cart-total]").textContent = money.format(cart.total());
    $("[data-cart-empty]").hidden = n > 0;
    $("[data-cart-foot]").hidden = n === 0;
    cartEl.classList.remove("is-split");
    $("[data-cart-note]").textContent = "Livraison choisie à l'étape suivante.";
  }

  function openCart() {
    closeOverlays();
    $("[data-toast]").classList.remove("is-on");
    renderCart();
    cartEl.showModal();
    document.documentElement.style.overflow = "hidden";
  }
  function closeCart() {
    if (!cartEl.open || cartEl.classList.contains("is-closing")) return;
    cartEl.classList.add("is-closing");
    setTimeout(() => { cartEl.close(); cartEl.classList.remove("is-closing"); }, reduced ? 0 : 260);
  }

  // Résumé de commande copié pour un DM Instagram
  function orderText() {
    const lines = cart.items.map((it) => {
      const p = products.find((x) => x.id === it.id);
      return `- ${it.qty} x ${p.name} (taille ${it.size}) : ${money.format(p.price * it.qty)}`;
    });
    return `Salut FKN VAMOS ! Je veux commander :\n${lines.join("\n")}\nTotal : ${money.format(cart.total())}`;
  }
  async function orderByDm() {
    try { await navigator.clipboard.writeText(orderText()); toast("Commande copiée. Colle-la dans le DM Instagram."); }
    catch { toast("Ouvre Instagram et envoie-nous ta liste en DM."); }
    setTimeout(() => window.open(shop.instagram || "https://instagram.com/fknvamos", "_blank", "noopener"), 700);
  }

  function checkout() {
    const lines = cart.items.map((it) => ({ it, url: checkoutUrl(products.find((p) => p.id === it.id), it.size) }));
    if (!lines.length) return;
    if (lines.every((l) => !l.url)) {
      toast("Paiement en ligne pas encore branché : on passe par Instagram.");
      return orderByDm();
    }
    if (lines.length === 1 && lines[0].it.qty === 1) { window.location.href = lines[0].url; return; }
    // Plusieurs pièces : Stripe encaisse chaque lien séparément, on les affiche ligne par ligne
    cartEl.classList.add("is-split");
    $("[data-cart-note]").textContent = "Stripe encaisse chaque pièce séparément : clique « Payer cette pièce » sur chaque ligne.";
  }

  function wireCart() {
    cart.load();
    renderCart();
    $("[data-cart-open]").addEventListener("click", openCart);
    $$("[data-cart-close]").forEach((b) => b.addEventListener("click", closeCart));
    cartEl.addEventListener("click", (e) => {
      if (e.target === cartEl) return closeCart();
      const q = e.target.closest("[data-qty]");
      if (q) {
        const i = +q.dataset.qty;
        cart.set(i, cart.items[i].qty + +q.dataset.d);
        const again = $(`[data-qty="${i}"][data-d="${q.dataset.d}"]`, cartEl) || $("[data-qty]", cartEl) || $("[data-cart-close]", cartEl);
        again.focus();
      }
      if (e.target.closest("[data-nopay]")) {
        e.preventDefault();
        toast("Paiement pas encore branché pour cette pièce. Commande par DM.");
      }
    });
    cartEl.addEventListener("cancel", (e) => { e.preventDefault(); closeCart(); });
    cartEl.addEventListener("close", () => { if (!sheet.open) document.documentElement.style.overflow = ""; });
    $("[data-checkout]").addEventListener("click", checkout);
    $("[data-order-ig]").addEventListener("click", orderByDm);
    addEventListener("storage", (e) => { if (e.key === "fkn-cart") { cart.load(); renderCart(); } });
  }

  /* ---------- Méga-menu Shop ---------- */
  const mega = $("[data-mega]");
  const megaBtn = $("[data-mega-btn]");
  const scrim = $("[data-scrim]");
  let megaOpen = false, megaTimer = 0;

  function megaProducts(type) {
    const box = $("[data-mega-products]");
    if (box.dataset.type === type) return;
    box.dataset.type = type;
    box.innerHTML = ofType(type).slice(0, 4).map((p, i) => `
      <button class="mini ${p.stock === "epuise" ? "is-out" : ""}" data-open="${p.id}" style="--i:${i}" aria-label="${p.name}, ${money.format(p.price)}, ${stockOf(p).label}">
        <span class="mini__art" style="${artStyle(p)}">${garment(p)}${badge(p)}${soon(p)}</span>
        <span class="mini__name">${p.name}</span>
        <span class="mini__price">${money.format(p.price)}</span>
      </button>`).join("");
    $$("[data-mega-cat]").forEach((b) => b.classList.toggle("is-on", b.dataset.megaCat === type));
  }

  function renderMega() {
    $("[data-mega-cats]").innerHTML = catList().map((c) => `
      <a role="listitem" href="#drop" class="mega__cat" data-mega-cat="${c.id}" data-filter-link="${c.id}">
        <span class="mega__cat-l">${c.label}</span>
        <span class="mega__cat-n">${ofType(c.id).length}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
      </a>`).join("");
    $$("[data-mega-cat]").forEach((a) => {
      const show = () => megaProducts(a.dataset.megaCat);
      a.addEventListener("pointerenter", show);
      a.addEventListener("focus", show);
    });
    megaProducts("all");
  }

  function setMega(on) {
    clearTimeout(megaTimer);
    if (on === megaOpen) return;
    megaOpen = on;
    megaBtn.setAttribute("aria-expanded", String(on));
    top.classList.toggle("is-mega", on);
    scrim.classList.toggle("is-on", on);
    if (on) {
      mega.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => mega.classList.add("is-open")));
    } else {
      mega.classList.remove("is-open");
      setTimeout(() => { if (!megaOpen) mega.hidden = true; }, reduced ? 0 : 320);
    }
  }

  function wireMega() {
    renderMega();
    const hoverable = matchMedia("(hover: hover) and (pointer: fine)");
    megaBtn.addEventListener("click", () => goToDrop("all"));
    megaBtn.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" || innerWidth <= 760) return;
      e.preventDefault();
      setMega(true);
      setTimeout(() => $("[data-mega-cat]", mega).focus({ preventScroll: true }), 60);
    });
    // Survol avec intention : petit délai pour ne pas ouvrir en passant
    [megaBtn, mega].forEach((el) => {
      el.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !hoverable.matches) return;
        clearTimeout(megaTimer);
        megaTimer = setTimeout(() => setMega(true), megaOpen ? 0 : 90);
      });
      el.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(megaTimer);
        megaTimer = setTimeout(() => setMega(false), 220);
      });
    });
    scrim.addEventListener("click", () => setMega(false));
    $$("[data-mega-close]").forEach((a) => a.addEventListener("click", () => setMega(false)));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && megaOpen) { setMega(false); megaBtn.focus(); }
    });
    mega.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !mega.contains(e.relatedTarget) && e.relatedTarget !== megaBtn) setMega(false);
    });
  }

  /* ---------- Recherche instantanée (⌘K ou /) ---------- */
  const finder = $("[data-finder]");
  const findInput = $("[data-find-input]");
  const findList = $("[data-find-list]");
  let findSel = 0, findHits = [];
  const norm = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ALIASES = { tee: "tee t-shirt tshirt haut", hoodie: "hoodie sweat capuche pull", shorts: "short shorts bain", cap: "casquette cap chapeau" };

  function runFind() {
    const q = norm(findInput.value.trim());
    const words = q ? q.split(/\s+/) : [];
    findHits = products.filter((p) => words.every((w) => norm(`${p.name} ${ALIASES[p.type] || ""} ${stockOf(p).label}`).includes(w)));
    findSel = 0;
    findList.innerHTML = findHits.map((p, i) => `
      <li role="option" id="find-${i}" class="hit ${p.stock === "epuise" ? "is-out" : ""}" data-open="${p.id}" aria-selected="${i === 0}">
        <span class="hit__art" style="${artStyle(p)}">${garment(p)}</span>
        <span class="hit__name">${mark(p.name, words[0])}</span>
        <span class="hit__meta badge badge--${p.stock}">${stockOf(p).label}</span>
        <span class="hit__price">${money.format(p.price)}</span>
      </li>`).join("");
    $("[data-find-empty]").hidden = findHits.length > 0;
    if (findHits.length) findInput.setAttribute("aria-activedescendant", "find-0");
    else findInput.removeAttribute("aria-activedescendant");
  }
  function mark(name, w) {
    if (!w) return name;
    const i = norm(name).indexOf(w);
    if (i < 0) return name;
    return `${name.slice(0, i)}<mark>${name.slice(i, i + w.length)}</mark>${name.slice(i + w.length)}`;
  }
  function moveSel(d) {
    if (!findHits.length) return;
    findSel = (findSel + d + findHits.length) % findHits.length;
    $$(".hit", findList).forEach((el, i) => el.setAttribute("aria-selected", String(i === findSel)));
    findInput.setAttribute("aria-activedescendant", `find-${findSel}`);
    $(`#find-${findSel}`).scrollIntoView({ block: "nearest" });
  }
  function openFind() {
    closeOverlays();
    findInput.value = "";
    runFind();
    finder.showModal();
    findInput.focus();
  }
  function closeFind() {
    if (!finder.open || finder.classList.contains("is-closing")) return;
    finder.classList.add("is-closing");
    setTimeout(() => { finder.close(); finder.classList.remove("is-closing"); }, reduced ? 0 : 160);
  }

  function wireFinder() {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$("[data-kbd]").forEach((k) => (k.textContent = mac ? "⌘K" : "Ctrl K"));
    $("[data-find-tags]").innerHTML = catList().filter((c) => c.id !== "all").map((c) =>
      `<button type="button" class="chip" data-find-tag="${c.id}">${c.label}</button>`).join("");
    $$("[data-find-open]").forEach((b) => b.addEventListener("click", openFind));
    $("[data-find-close]").addEventListener("click", closeFind);
    findInput.addEventListener("input", runFind);
    findInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
      if (e.key === "Enter" && findHits[findSel]) { e.preventDefault(); closeOverlays(); openSheet(findHits[findSel].id); }
    });
    finder.addEventListener("click", (e) => {
      if (e.target === finder) return closeFind();
      const t = e.target.closest("[data-find-tag]");
      if (t) { findInput.value = ALIASES[t.dataset.findTag].split(" ")[0]; runFind(); findInput.focus(); }
    });
    finder.addEventListener("cancel", (e) => { e.preventDefault(); closeFind(); });
    addEventListener("keydown", (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        if (finder.open) closeFind(); else openFind();
      }
    });
  }

  // Une seule couche ouverte à la fois
  function closeOverlays() {
    if (megaOpen) setMega(false);
    if (finder.open) { finder.close(); finder.classList.remove("is-closing"); }
    if (cartEl.open) { cartEl.close(); cartEl.classList.remove("is-closing"); }
    if (setMenuOpen) setMenuOpen(false);
  }

  /* ---------- Index des catégories : l'aperçu suit la souris ---------- */
  function wireIndex() {
    const list = $("[data-index]");
    if (!list) return;
    list.innerHTML = catList().filter((c) => c.id !== "all").map((c, i) => {
      const items = ofType(c.id);
      const lead = leadOf(items);
      return `
        <li>
          <a class="row" href="#drop" data-filter-link="${c.id}" data-peek-id="${c.id}" style="--i:${i}">
            <span class="row__n">${items.length} pièce${items.length > 1 ? "s" : ""}</span>
            <span class="row__l">${c.label}</span>
            <span class="row__thumb" style="${artStyle(lead)}">${garment(lead)}</span>
            <span class="row__p">dès ${money.format(fromPrice(items))}</span>
            <svg class="row__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
          </a>
        </li>`;
    }).join("");

    if (!finePointer || reduced) return;
    const peek = $("[data-peek]");
    const peekIn = $("[data-peek-in]");
    const s = spring(220, 26);
    let raf = 0, last = 0, cur = "";
    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      s.step(dt);
      peek.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${clamp(s.vx * 0.01, -7, 7).toFixed(2)}deg)`;
      raf = s.rest() ? 0 : requestAnimationFrame(loop);
    };
    list.addEventListener("pointermove", (e) => {
      const row = e.target.closest("[data-peek-id]");
      if (!row) return;
      if (!peek.classList.contains("is-on")) s.snap(e.clientX, e.clientY);
      s.tx = e.clientX; s.ty = e.clientY;
      if (row.dataset.peekId !== cur) {
        cur = row.dataset.peekId;
        const lead = leadOf(ofType(cur));
        peekIn.setAttribute("style", artStyle(lead));
        peekIn.innerHTML = garment(lead, false);
      }
      peek.classList.add("is-on");
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    });
    list.addEventListener("pointerleave", () => { peek.classList.remove("is-on"); cur = ""; });
    addEventListener("scroll", () => peek.classList.remove("is-on"), { passive: true });
  }

  /* ---------- Menu mobile : catégories avec aperçu ---------- */
  function renderMenuCats() {
    $("[data-menu-cats]").innerHTML = catList().map((c, i) => {
      const items = ofType(c.id);
      const lead = leadOf(items);
      return `<a href="#drop" class="mcat" data-filter-link="${c.id}" style="--i:${i}">
        <span class="mcat__art" style="${artStyle(lead)}">${garment(lead)}</span>
        <span class="mcat__l">${c.label}</span><span class="mcat__n">${items.length}</span></a>`;
    }).join("");
  }

  /* ---------- Liens d'aide : ouvrir la bonne question ---------- */
  function wireFaqLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-faq]");
      if (!a) return;
      const d = document.getElementById(`faq-${a.dataset.faq}`);
      if (!d) return;
      e.preventDefault();
      const wait = sheet.open;
      if (wait) closeSheet();
      closeOverlays();
      d.open = true;
      setTimeout(() => d.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), wait ? 260 : 0);
    });
    const toTop = $("[data-to-top]");
    if (toTop) toTop.addEventListener("click", (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });
  }

  /* ---------- Bandeau : un message à la fois, pause au survol ---------- */
  function wireTicker() {
    const t = $("[data-ticker]");
    if (!t) return;
    const msgs = $$("span", t);
    let i = 0, paused = false;
    msgs[0].classList.add("is-on");
    t.setAttribute("aria-live", "off");
    t.addEventListener("pointerenter", () => (paused = true));
    t.addEventListener("pointerleave", () => (paused = false));
    setInterval(() => {
      if (paused || document.hidden || top.classList.contains("is-solid")) return;
      msgs[i].classList.replace("is-on", "is-off");
      const prev = msgs[i];
      setTimeout(() => prev.classList.remove("is-off"), 600);
      i = (i + 1) % msgs.length;
      msgs[i].classList.add("is-on");
    }, 3800);
  }

  /* ---------- Hero vidéo : surf en boucle sans coupure visible ----------
     Deux lecteurs identiques se relaient : une seconde avant la fin, le second
     repart du début par-dessus et se fond dans le premier. Le saut de boucle
     devient un fondu. Poster immédiat, 1440p sur grand écran, 720p sur téléphone,
     rien sur connexion économe. Pause hors écran ; bouton pause (accessibilité). */
  function wireHeroVideo() {
    const a = $("[data-hero-video]");
    if (!a) return;
    const btn = $("[data-video-toggle]");
    const lab = $("[data-video-label]");
    const conn = navigator.connection || {};
    if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")) return; // le poster suffit
    const big = Math.max(screen.width, screen.height) * (devicePixelRatio || 1) > 1600 && innerWidth > 900;
    const src = big ? a.dataset.srcHd : a.dataset.srcSd;
    const FADE = 1.1;   // durée du fondu, en secondes
    const HEAD = 0.25;  // on saute les premières images (souvent figées)

    a.loop = false;
    a.src = src;
    a.preload = "auto";
    const b = a.cloneNode(false);
    b.removeAttribute("data-hero-video");
    b.removeAttribute("poster");
    b.classList.add("is-relay");
    b.setAttribute("aria-hidden", "true");
    b.src = src;
    a.after(b);

    let front = a, back = b;      // front : celui qu'on voit
    let wanted = !reduced;        // mouvement réduit : la vidéo attend un clic
    let fading = false, raf = 0;

    const sync = () => {
      const on = wanted && !front.paused;
      btn.setAttribute("aria-pressed", String(!on));
      lab.textContent = on ? "Pause" : "Lecture";
      btn.classList.toggle("is-paused", !on);
    };
    const play = () => {
      const ps = [front.play()];
      if (fading) ps.push(back.play());
      Promise.all(ps).catch((e) => { if (e.name === "NotAllowedError") { wanted = false; sync(); } });
      if (!raf) raf = requestAnimationFrame(watch);
    };
    const pause = () => { front.pause(); back.pause(); cancelAnimationFrame(raf); raf = 0; };

    // Le relais : surveille la fin et lance le fondu au bon moment
    function watch() {
      raf = 0;
      if (!wanted) return;
      const d = front.duration;
      if (d && !fading && front.currentTime >= d - FADE - 0.05) {
        fading = true;
        back.currentTime = HEAD;
        back.style.zIndex = "1"; front.style.zIndex = "0";
        back.play().then(() => {
          back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE * 1000, easing: "cubic-bezier(.45, 0, .55, 1)", fill: "forwards" })
            .finished.then(() => {
              front.pause();
              front.currentTime = HEAD;
              front.getAnimations().forEach((x) => x.cancel());
              front.style.opacity = "0";
              [front, back] = [back, front];
              fading = false;
            });
        }).catch(() => { fading = false; });
      }
      raf = requestAnimationFrame(watch);
    }

    a.addEventListener("playing", () => { a.classList.add("is-live"); sync(); }, { once: true });
    [a, b].forEach((v) => {
      v.addEventListener("pause", sync);
      v.addEventListener("playing", sync);
      // Filet de sécurité : si un lecteur arrive au bout sans relais, il repart
      v.addEventListener("ended", () => { if (v === front && wanted) { v.currentTime = HEAD; v.play().catch(() => {}); } });
    });
    b.style.opacity = "0";

    btn.hidden = false;
    btn.addEventListener("click", () => {
      wanted = !wanted;
      if (wanted) play(); else pause();
      sync();
    });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && wanted && !document.hidden) play();
      else if (!e.isIntersecting) pause();
    }).observe(a);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause(); else if (wanted && scrollY < hero.offsetHeight) play();
    });
    sync();
  }

  /* ---------- Navigation : descente animée vers chaque section ----------
     Le menu amène la section entière sous la barre, avec une courbe douce ;
     la molette ou le doigt reprennent la main à tout moment. */
  let glide = 0;
  function headerOffset(id) {
    if (id === "drop") return 0; // le rail se fige en haut et garde sa marge
    const bar = $("[data-bar]");
    // Les sections sans marge haute (lookbook) gardent un peu d'air sous la barre
    const pad = parseFloat(getComputedStyle(document.getElementById(id)).paddingTop) || 0;
    return (bar ? bar.getBoundingClientRect().height + 10 : 70) + 18 + Math.max(0, 56 - pad);
  }
  function scrollToSection(id, after) {
    const el = document.getElementById(id);
    if (!el) return;
    cancelAnimationFrame(glide);
    const from = scrollY;
    const to = Math.max(0, Math.min(el.getBoundingClientRect().top + scrollY - headerOffset(id), document.documentElement.scrollHeight - innerHeight));
    const dist = Math.abs(to - from);
    if (reduced || dist < 4) { scrollTo({ top: to, behavior: "instant" }); after && after(); return; }
    const dur = clamp(420 + Math.sqrt(dist) * 14, 600, 1500);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const t0 = performance.now();
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";
    let stopped = false;
    const stop = () => { stopped = true; };
    addEventListener("wheel", stop, { once: true, passive: true });
    addEventListener("touchstart", stop, { once: true, passive: true });
    const step = (now) => {
      if (stopped) { html.style.scrollBehavior = ""; return; }
      const t = Math.min(1, (now - t0) / dur);
      scrollTo({ top: from + (to - from) * ease(t), behavior: "instant" });
      if (t < 1) glide = requestAnimationFrame(step);
      else {
        html.style.scrollBehavior = "";
        removeEventListener("wheel", stop);
        removeEventListener("touchstart", stop);
        // Le rail peut changer la hauteur de page : on recale une fois
        const fix = el.getBoundingClientRect().top - headerOffset(id);
        if (Math.abs(fix) > 2) scrollTo({ top: scrollY + fix, behavior: "instant" });
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
        after && after();
      }
    };
    glide = requestAnimationFrame(step);
  }

  // Arrivée sur Infos par le menu : toutes les réponses s'ouvrent en cascade
  function revealInfos() {
    $$("#infos details").forEach((d, i) => setTimeout(() => { d.open = true; }, reduced ? 0 : i * 110));
  }

  function wireSectionNav() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || a.hasAttribute("data-filter-link") || a.hasAttribute("data-faq") || a.hasAttribute("data-to-top")) return;
      const id = a.getAttribute("href").slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      closeOverlays();
      history.replaceState(null, "", `#${id}`);
      scrollToSection(id, id === "infos" ? revealInfos : null);
    });
  }

  /* ---------- Lookbook : parallaxe, inclinaison, visionneuse plein écran ---------- */
  function wireGallery() {
    const shots = $$("[data-shot]");
    if (!shots.length) return;
    const items = shots.map((f) => {
      const img = $("img", f);
      return { f, img, src: img.currentSrc || img.src, alt: img.alt, cap: $("figcaption", f)?.textContent || "" };
    });

    // Chaque photo devient un bouton qui ouvre la visionneuse
    items.forEach((it, i) => {
      it.f.setAttribute("tabindex", "0");
      it.f.setAttribute("role", "button");
      it.f.setAttribute("aria-label", `Agrandir : ${it.alt}`);
      it.f.addEventListener("click", () => openLb(i));
      it.f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(i); } });
    });

    // Parallaxe : l'image glisse dans son cadre au fil du scroll
    if (!reduced) {
      let raf = 0;
      const update = () => {
        raf = 0;
        const vh = innerHeight;
        items.forEach(({ f, img }) => {
          const r = f.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const p = clamp((r.top + r.height / 2) / (vh + r.height) , 0, 1) - 0.5;
          img.style.translate = `0 ${(p * -9).toFixed(2)}%`;
        });
      };
      addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
      update();
    }

    // Inclinaison 3D légère qui suit la souris
    if (finePointer && !reduced) {
      items.forEach(({ f }) => {
        f.addEventListener("pointermove", (e) => {
          const r = f.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          f.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
          f.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
          f.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
          f.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
        });
        f.addEventListener("pointerleave", () => { f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg"); });
      });
    }

    // Visionneuse : la photo s'envole de sa place jusqu'au plein écran (FLIP)
    const lb = $("[data-lb]");
    const stage = $("[data-lb-stage]");
    const lbImg = $("[data-lb-img]");
    const lbCap = $("[data-lb-cap]");
    const lbN = $("[data-lb-n]");
    let cur = 0, busy = false;

    function fitRect(it) {
      const pad = innerWidth < 720 ? 12 : 64;
      const top = innerWidth < 720 ? 64 : 72, bottom = innerWidth < 720 ? 96 : 88;
      const aw = innerWidth - pad * 2, ah = innerHeight - top - bottom;
      const ar = (it.img.naturalWidth || 1) / (it.img.naturalHeight || 1);
      let w = aw, hgt = aw / ar;
      if (hgt > ah) { hgt = ah; w = ah * ar; }
      return { x: (innerWidth - w) / 2, y: top + (ah - hgt) / 2, w, h: hgt };
    }
    function place(it) {
      const F = fitRect(it);
      Object.assign(lbImg.style, { left: `${F.x}px`, top: `${F.y}px`, width: `${F.w}px`, height: `${F.h}px` });
      return F;
    }
    // Départ : le cadre recadré de la mosaïque, exprimé dans le repère de l'image finale
    function fromShot(it, F) {
      const S = it.f.getBoundingClientRect();
      const s = Math.max(S.width / F.w, S.height / F.h);
      const vw = S.width / s, vh = S.height / s;
      const ix = (F.w - vw) / 2, iy = (F.h - vh) / 2;
      const dx = S.left + S.width / 2 - (F.x + F.w / 2);
      const dy = S.top + S.height / 2 - (F.y + F.h / 2);
      return {
        transform: `translate(${dx}px, ${dy}px) scale(${s})`,
        clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round ${20 / s}px)`
      };
    }
    function fill(i) {
      cur = (i + items.length) % items.length;
      const it = items[cur];
      lbImg.src = it.src; lbImg.alt = it.alt;
      lbCap.textContent = it.cap;
      lbN.textContent = `${cur + 1} / ${items.length}`;
      return it;
    }
    function openLb(i) {
      if (lb.open) return;
      closeOverlays();
      const it = fill(i);
      lb.showModal();
      document.documentElement.style.overflow = "hidden";
      const F = place(it);
      if (reduced) return;
      const a = fromShot(it, F);
      it.f.style.visibility = "hidden";
      busy = true;
      lbImg.animate([
        { transform: a.transform, clipPath: a.clipPath },
        { transform: "none", clipPath: "inset(0px 0px 0px 0px round 14px)" }
      ], { duration: 620, easing: "cubic-bezier(.32, .72, 0, 1)" }).finished.then(() => { busy = false; });
      lb.animate([{ backgroundColor: "rgb(1 8 14 / 0)" }, { backgroundColor: "rgb(1 8 14 / .94)" }], { duration: 400, easing: "ease" });
    }
    function closeLb() {
      if (!lb.open || busy) return;
      const it = items[cur];
      const done = () => {
        items.forEach((x) => (x.f.style.visibility = ""));
        lb.close();
        document.documentElement.style.overflow = "";
        it.f.focus({ preventScroll: true });
      };
      const r = it.f.getBoundingClientRect();
      if (reduced || r.bottom < 0 || r.top > innerHeight) return done();
      items.forEach((x) => (x.f.style.visibility = x === it ? "hidden" : ""));
      const F = place(it);
      const a = fromShot(it, F);
      busy = true;
      lb.classList.add("is-closing");
      lb.animate([{ backgroundColor: "rgb(1 8 14 / .94)" }, { backgroundColor: "rgb(1 8 14 / 0)" }], { duration: 420, easing: "ease", fill: "forwards" });
      lbImg.animate([
        { transform: "none", clipPath: "inset(0px 0px 0px 0px round 14px)" },
        { transform: a.transform, clipPath: a.clipPath }
      ], { duration: 480, easing: "cubic-bezier(.32, .72, 0, 1)", fill: "forwards" }).finished.then(() => {
        busy = false;
        lb.classList.remove("is-closing");
        lbImg.getAnimations().forEach((x) => x.cancel());
        lb.getAnimations().forEach((x) => x.cancel());
        done();
      });
    }
    function go(d) {
      if (busy) return;
      items[cur].f.style.visibility = "";
      busy = true;
      const out = lbImg.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-d * 40}px) scale(.98)` }],
        { duration: reduced ? 1 : 180, easing: "ease-in", fill: "forwards" });
      out.finished.then(() => {
        const it = fill(cur + d);
        place(it);
        it.f.style.visibility = "hidden";
        out.cancel();
        lbImg.animate([{ opacity: 0, transform: `translateX(${d * 60}px) scale(.98)` }, { opacity: 1, transform: "none" }],
          { duration: reduced ? 1 : 420, easing: "cubic-bezier(.23, 1, .32, 1)" }).finished.then(() => { busy = false; });
      });
    }

    $("[data-lb-close]").addEventListener("click", closeLb);
    $("[data-lb-prev]").addEventListener("click", () => go(-1));
    $("[data-lb-next]").addEventListener("click", () => go(1));
    lb.addEventListener("cancel", (e) => { e.preventDefault(); closeLb(); });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLb(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });
    addEventListener("resize", () => { if (lb.open) place(items[cur]); });
    // Glisser pour changer de photo (tactile)
    let sx = 0, sy = 0;
    stage.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener("pointerup", (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 90 && e.pointerType !== "mouse") closeLb();
    });
  }

  /* ---------- Infos boutique ---------- */
  function fillShop() {
    // Tant qu'aucun lien Stripe n'est branché, on ne promet pas le paiement en ligne
    if (!live()) $$("[data-pay]").forEach((el) => (el.textContent = "Paiement en ligne bientôt · commande par DM"));
    if (shop.dropName) $$("[data-drop-name]").forEach((el) => (el.textContent = shop.dropName));
    if (shop.instagram) $$("[data-ig]").forEach((a) => (a.href = shop.instagram));
    if (shop.email) $("[data-email-line]").innerHTML = ` ou par mail : <a href="mailto:${shop.email}">${shop.email}</a>`;
    $("[data-year]").textContent = new Date().getFullYear();
  }

  /* ---------- FAQ : générée depuis le JSON ---------- */
  function renderFaq() {
    const box = $("[data-faq-list]");
    if (!box || !faq.length) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    box.innerHTML = faq.map((f) => `
      <details id="faq-${esc(f.id)}">
        <summary>${esc(f.q)}</summary>
        <div class="faq__body">${String(f.a).split(/\n+/).map((para) => `<p>${esc(para)}</p>`).join("")}</div>
      </details>`).join("");
  }

  /* ---------- AJAX : chargement du catalogue JSON ----------
     fetch + délai max de 8 s + 2 essais. Pendant le chargement, le rail montre
     des cartes squelettes ; en cas d'échec, un message avec « Réessayer ». */
  async function loadCatalog(tries = 2) {
    const url = document.documentElement.dataset.catalog || "data/products.json";
    for (let i = 0; i < tries; i++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(url, { cache: "no-cache", signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.products)) throw new Error("format : « products » manquant");
        return data;
      } catch (err) {
        if (i === tries - 1) throw err;
        await new Promise((r) => setTimeout(r, 600));
      } finally {
        clearTimeout(timer);
      }
    }
  }

  function showLoadError(err) {
    const box = $("[data-load-error]");
    if (!box) return;
    const local = location.protocol === "file:";
    $("[data-load-msg]", box).textContent = local
      ? "Le catalogue ne se charge pas en ouvrant le fichier directement. Lance le site avec Live Server (VS Code) ou en ligne."
      : "Le catalogue n'a pas pu se charger. Vérifie ta connexion puis réessaie.";
    box.hidden = false;
    $("[data-grid]").innerHTML = "";
    console.warn("Catalogue :", err.message);
  }

  let started = false;
  function start(data) {
    products = data.products.filter((p) => p && p.id && Array.isArray(p.sizes) && p.sizes.length);
    shop = data.shop || {};
    faq = Array.isArray(data.faq) ? data.faq : [];
    money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: shop.currency || "EUR", maximumFractionDigits: 0 });
    document.documentElement.classList.add("is-loaded");
    $("[data-grid]").removeAttribute("aria-busy");
    $("[data-load-error]").hidden = true;
    renderFaq();
    if (started) return; // un « Réessayer » ne recâble pas tout
    started = true;
    fillShop();
    renderFeatured();
    renderGrid();
    wireFilters();
    wireCart();
    wireMega();
    wireFinder();
    wireIndex();
    renderMenuCats();
    addEventListener("load", layoutDrop);
    // Lien direct vers une fiche : #p/id-du-produit
    const m = location.hash.match(/^#p\/(.+)$/);
    if (m) openSheet(decodeURIComponent(m[1]));
  }

  // Tout ce qui ne dépend pas du catalogue démarre tout de suite, même hors ligne
  function startStatic() {
    wireTicker();
    wireDrop();
    wireSheet();
    splitWords();
    maskTitles();
    wireScroll();
    wireReveals();
    wireSea();
    wireFuturist();
    wireNav();
    wireFaqLinks();
    wireSectionNav();
    wireGallery();
    wireHeroVideo();
    wirePointerFx();
    wireOcean();
  }

  const boot = () => loadCatalog().then(start).catch(showLoadError);
  $("[data-load-retry]")?.addEventListener("click", () => {
    $("[data-load-error]").hidden = true;
    $("[data-grid]").innerHTML = skeletons;
    boot();
  });
  const skeletons = $("[data-grid]") ? $("[data-grid]").innerHTML : "";
  startStatic();
  boot();
})();

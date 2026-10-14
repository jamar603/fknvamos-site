(() => {
  "use strict";

  const products = window.FKN_PRODUCTS || [];
  const shop = window.FKN_SHOP || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: shop.currency || "EUR", maximumFractionDigits: 0 });
  const STOCK = {
    dispo: { label: "Dispo", buy: true },
    derniers: { label: "Dernières pièces", buy: true },
    epuise: { label: "Épuisé", buy: false }
  };

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
    return l > 150 ? "#0a1440" : "#f6f7fb";
  }

  function garment(p) {
    if (p.image) return `<img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">`;
    const print = p.type === "shorts"
      ? `<text x="150" y="160" font-size="11">FKN</text>`
      : p.type === "cap"
        ? `<text x="120" y="104" font-size="16" text-anchor="middle">FKN</text>`
        : `<text x="120" y="112" font-size="19" text-anchor="middle">FKN</text><text x="120" y="132" font-size="19" text-anchor="middle">VAMOS</text>`;
    return `<svg class="garment" viewBox="0 0 240 210" role="img" aria-label="${p.name}, visuel provisoire">
      <path d="${SHAPES[p.type] || SHAPES.tee}" fill="${p.color}" stroke="#0a1440" stroke-width="3" stroke-linejoin="round"/>
      <g fill="${ink(p.color)}" font-family="Shrikhand, cursive">${print}</g>
    </svg>`;
  }

  function towelStyle(p) {
    const [a, b] = p.towel || ["#ef3b2d", "#f6f7fb"];
    return `--t1:${a};--t2:${b}`;
  }

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

  /* ---------- Bloc achat (taille + bouton) ---------- */
  function buyBlock(p, idPrefix) {
    const st = STOCK[p.stock] || STOCK.dispo;
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
      <button class="btn btn--red buy" data-buy="${p.id}" ${st.buy ? "" : "disabled"}>
        ${st.buy ? `Acheter · ${money.format(p.price)}` : "Épuisé"}
      </button>`;
  }

  function wireBuy(root, p) {
    const btn = $("[data-buy]", root);
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const picked = $("input[type=radio]:checked", root);
      buy(p, picked && picked.value);
    });
  }

  /* ---------- Produit en vedette (hero) ---------- */
  function renderFeatured() {
    const slot = $("[data-featured]");
    const p = products.find((x) => x.featured) || products[0];
    if (!slot || !p) return;
    slot.innerHTML = `
      <article class="feat towel" style="${towelStyle(p)}">
        <div class="towel__art">${garment(p)}</div>
        <div class="feat__info">
          <span class="flag flag--${p.stock}">${(STOCK[p.stock] || STOCK.dispo).label}</span>
          <h2 class="feat__name">${p.name}</h2>
          ${buyBlock(p, "feat")}
        </div>
      </article>`;
    wireBuy(slot, p);
  }

  /* ---------- Grille ---------- */
  function renderGrid(filter = "all") {
    const grid = $("[data-grid]");
    const list = products.filter((p) => filter === "all" || p.type === filter);
    grid.innerHTML = list.map((p, i) => `
      <li class="towels__item" style="--i:${i}">
        <button class="towel towel--card ${p.stock === "epuise" ? "is-out" : ""}" style="${towelStyle(p)}" data-open="${p.id}"
          aria-label="${p.name}, ${money.format(p.price)}, ${(STOCK[p.stock] || STOCK.dispo).label}">
          <span class="flag flag--${p.stock}">${(STOCK[p.stock] || STOCK.dispo).label}</span>
          <span class="towel__art">${garment(p)}</span>
          <span class="towel__tag">
            <span class="towel__name">${p.name}</span>
            <span class="towel__price">${money.format(p.price)}</span>
          </span>
        </button>
      </li>`).join("");
    $("[data-empty]").hidden = list.length > 0;
  }

  function wireFilters() {
    $$("[data-filter]").forEach((chip) => chip.addEventListener("click", () => {
      $$("[data-filter]").forEach((c) => { c.classList.remove("is-on"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-on");
      chip.setAttribute("aria-pressed", "true");
      renderGrid(chip.dataset.filter);
    }));
  }

  /* ---------- Fiche produit ---------- */
  const sheet = $("[data-sheet]");
  function openSheet(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const body = $("[data-sheet-body]");
    body.innerHTML = `
      <div class="sheet__art towel" style="${towelStyle(p)}"><div class="towel__art">${garment(p)}</div></div>
      <div class="sheet__info">
        <span class="flag flag--${p.stock}">${(STOCK[p.stock] || STOCK.dispo).label}</span>
        <h2 id="sheet-title" class="sheet__name">${p.name}</h2>
        <p class="sheet__price">${money.format(p.price)}</p>
        ${buyBlock(p, "sheet")}
        <p class="sheet__note">Paiement sécurisé Stripe. Tu choisis ta livraison à l'étape suivante.</p>
      </div>`;
    wireBuy(body, p);
    sheet.showModal();
    history.replaceState(null, "", `#p/${p.id}`);
  }

  function wireSheet() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open]");
      if (t) openSheet(t.dataset.open);
    });
    sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
    const m = location.hash.match(/^#p\/(.+)$/);
    if (m) openSheet(decodeURIComponent(m[1]));
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("[data-toast]");
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 3600);
  }

  /* ---------- Coucher de soleil au scroll ---------- */
  function wireSunset() {
    const foot = $("[data-sunset]");
    if (!foot || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = foot.getBoundingClientRect();
      const vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.25)));
      foot.style.setProperty("--p", p.toFixed(3));
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------- Infos boutique ---------- */
  function fillShop() {
    if (shop.dropName) $$("[data-drop-name]").forEach((el) => (el.textContent = shop.dropName));
    if (shop.instagram) $$("[data-ig]").forEach((a) => (a.href = shop.instagram));
    if (shop.email) $("[data-email-line]").innerHTML = ` ou par mail : <a href="mailto:${shop.email}">${shop.email}</a>`;
    $("[data-year]").textContent = new Date().getFullYear();
  }

  fillShop();
  renderFeatured();
  renderGrid();
  wireFilters();
  wireSheet();
  wireSunset();
})();

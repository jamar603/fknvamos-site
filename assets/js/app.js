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
    return l > 150 ? "#04223a" : "#f5fbfb";
  }

  function garment(p) {
    if (p.image) return `<img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">`;
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
      <button class="btn btn--dark buy" data-buy="${p.id}" ${st.buy ? "" : "disabled"}>
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

  /* ---------- Produit vedette ---------- */
  function badge(p) {
    return `<span class="badge badge--${p.stock}">${(STOCK[p.stock] || STOCK.dispo).label}</span>`;
  }

  function renderFeatured() {
    const slot = $("[data-featured]");
    const p = products.find((x) => x.featured) || products[0];
    if (!slot || !p) return;
    slot.innerHTML = `
      <article class="feat">
        <div class="art reveal" style="${artStyle(p)}">${garment(p)}</div>
        <div class="feat__info reveal" style="--d:1">
          <p class="eyebrow">Pièce phare du drop</p>
          ${badge(p)}
          <h2 class="feat__name">${p.name}</h2>
          <p class="feat__price">${money.format(p.price)}</p>
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
      <li class="grid__item" style="--i:${i}">
        <button class="card ${p.stock === "epuise" ? "is-out" : ""}" data-open="${p.id}"
          aria-label="${p.name}, ${money.format(p.price)}, ${(STOCK[p.stock] || STOCK.dispo).label}">
          <span class="card__inner">
            ${badge(p)}
            <span class="art" style="${artStyle(p)}">${garment(p)}</span>
            <span class="card__shine"></span>
          </span>
          <span class="card__meta">
            <span class="card__name">${p.name}</span>
            <span class="card__price">${money.format(p.price)}</span>
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
      <div class="art" style="${artStyle(p)}">${garment(p)}</div>
      <div class="sheet__info">
        ${badge(p)}
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

  /* ---------- Animations ---------- */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // Titre découpé en lettres pour l'entrée en cascade
  function splitTitle() {
    $$("[data-split]").forEach((el) => {
      const text = el.textContent;
      el.setAttribute("aria-label", text);
      let i = 0;
      el.innerHTML = text.split(" ").map((word) => `<span class="word" aria-hidden="true">${
        [...word].map((c) => `<span class="ch" style="--i:${i++}">${c}</span>`).join("")
      }</span>`).join(" ");
    });
  }

  // Header transparent sur le hero, givré ensuite
  function wireHeader() {
    const top = $("[data-top]");
    const hero = $("[data-hero]");
    if (!top || !hero) return;
    new IntersectionObserver(([e]) => top.classList.toggle("is-solid", !e.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px"
    }).observe(hero);
  }

  // Apparition des blocs au scroll
  function wireReveal() {
    const els = $$(".reveal");
    if (reduced || !("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  // Hero : zoom d'entrée, parallax souris + scroll, contenu qui s'efface
  function wireHeroMotion() {
    const hero = $("[data-hero]");
    const img = $("[data-hero-img]");
    const content = $(".hero__content", hero);
    const lagonImg = $("[data-parallax]");
    const footWord = $(".foot__word");
    if (!hero || !img) return;

    const start = performance.now();
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    if (finePointer) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        target.x = (e.clientX - r.left) / r.width - 0.5;
        target.y = (e.clientY - r.top) / r.height - 0.5;
      });
      hero.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });
    }

    const tick = (now) => {
      const vh = innerHeight;
      const sy = scrollY;
      const intro = clamp((now - start) / 2600, 0, 1);
      const ease = 1 - Math.pow(1 - intro, 4);

      if (sy < vh * 1.2) {
        cur.x = lerp(cur.x, target.x, 0.06);
        cur.y = lerp(cur.y, target.y, 0.06);
        const p = clamp(sy / vh, 0, 1);
        img.style.setProperty("--px", `${(-cur.x * 28).toFixed(2)}px`);
        img.style.setProperty("--py", `${(-cur.y * 18 + sy * 0.35).toFixed(2)}px`);
        img.style.setProperty("--s", (1.2 - ease * 0.14 + p * 0.06).toFixed(4));
        if (content) {
          content.style.transform = `translate3d(0, ${(sy * -0.18).toFixed(1)}px, 0)`;
          content.style.opacity = (1 - p * 1.4).toFixed(3);
        }
      }

      if (lagonImg) {
        const r = lagonImg.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          const offset = (r.top + r.height / 2 - vh / 2) * -parseFloat(lagonImg.dataset.parallax);
          lagonImg.style.setProperty("--y", `${offset.toFixed(1)}px`);
        }
      }

      if (footWord) {
        const r = footWord.getBoundingClientRect();
        if (r.top < vh) footWord.style.setProperty("--fy", `${(Math.max(0, r.top - vh * 0.55) * 0.25).toFixed(1)}px`);
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Reflets du soleil qui scintillent sur l'eau (canvas)
  function wireGlints() {
    const canvas = $("[data-glints]");
    const hero = $("[data-hero]");
    if (!canvas || !hero || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, glints = [], running = false, raf = 0;

    const HORIZON = 0.34; // part du hero occupée par le ciel et les mornes

    function seed() {
      const count = Math.round(clamp((w * h) / 9000, 60, 220));
      glints = Array.from({ length: count }, () => {
        const depth = Math.random(); // 0 = loin (petit), 1 = près (grand)
        return {
          x: Math.random() * w,
          y: h * (HORIZON + depth * (1 - HORIZON)),
          r: 0.6 + depth * depth * 3.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.8,
          drift: (0.05 + depth * 0.25) * (Math.random() < 0.5 ? -1 : 1)
        };
      });
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(now) {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const g of glints) {
        const a = Math.pow(Math.max(0, Math.sin(t * g.speed + g.phase)), 6);
        if (a < 0.02) { g.x += g.drift; continue; }
        g.x += g.drift;
        if (g.x < -10) g.x = w + 10; else if (g.x > w + 10) g.x = -10;

        // halo étiré à l'horizontale, comme un reflet sur la houle
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 4);
        grad.addColorStop(0, `rgba(255,255,240,${(a * 0.9).toFixed(3)})`);
        grad.addColorStop(1, "rgba(255,255,240,0)");
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.scale(2.4, 0.7);
        ctx.translate(-g.x, -g.y);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // éclat en croix sur les reflets proches
        if (g.r > 2.2 && a > 0.5) {
          ctx.strokeStyle = `rgba(255,255,255,${(a * 0.7).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(g.x - g.r * 5, g.y); ctx.lineTo(g.x + g.r * 5, g.y);
          ctx.moveTo(g.x, g.y - g.r * 2.5); ctx.lineTo(g.x, g.y + g.r * 2.5);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    }

    resize();
    addEventListener("resize", resize);
    new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(hero);
    document.addEventListener("visibilitychange", () => setRunning(!document.hidden && hero.getBoundingClientRect().bottom > 0));
  }

  // Cartes produit : inclinaison 3D + reflet qui suit la souris
  function wireTilt() {
    if (!finePointer) return;
    const grid = $("[data-grid]");
    grid.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const inner = $(".card__inner", card);
      const r = inner.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      inner.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
      inner.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
      inner.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      inner.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    });
    grid.addEventListener("pointerout", (e) => {
      const card = e.target.closest(".card");
      if (!card || card.contains(e.relatedTarget)) return;
      const inner = $(".card__inner", card);
      inner.style.setProperty("--rx", "0deg");
      inner.style.setProperty("--ry", "0deg");
    });
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
  splitTitle();
  wireHeader();
  wireReveal();
  if (!reduced) {
    wireHeroMotion();
    wireGlints();
    wireTilt();
  }
})();

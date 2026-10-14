(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const products = window.FKN_PRODUCTS || [];
  const shop = window.FKN_SHOP || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: shop.currency || "EUR", maximumFractionDigits: 0 });
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
      <button class="btn btn--buy" data-buy="${p.id}" ${st.buy ? "" : "disabled"}>
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

  /* ---------- Pièce phare (carte posée sur le hero) ---------- */
  function renderFeatured() {
    const slot = $("[data-featured]");
    const p = products.find((x) => x.featured) || products[0];
    if (!slot || !p) return;
    slot.innerHTML = `
      <button class="feat" data-open="${p.id}" aria-label="${p.name}, ${money.format(p.price)}, choisir ma taille">
        <span class="feat__art">${garment(p, false)}</span>
        <span>
          <span class="feat__label">Pièce phare</span>
          <span class="feat__name">${p.name}</span>
          <span class="feat__price">${money.format(p.price)}</span>
        </span>
        <span class="feat__go">Choisir ma taille <span aria-hidden="true">→</span></span>
      </button>`;
  }

  /* ---------- Le drop ---------- */
  function renderGrid(filter = "all", animate = false) {
    const grid = $("[data-grid]");
    const list = products.filter((p) => filter === "all" || p.type === filter);
    grid.innerHTML = list.map((p) => `
      <li class="drop__item">
        <button class="card ${p.stock === "epuise" ? "is-out" : ""}" data-open="${p.id}"
          aria-label="${p.name}, ${money.format(p.price)}, ${stockOf(p).label}">
          <span class="card__media" style="${artStyle(p)}">
            ${badge(p)}
            ${garment(p)}
          </span>
          <span class="card__meta">
            <span class="card__name">${p.name}</span>
            <span class="card__price">${money.format(p.price)}</span>
          </span>
        </button>
      </li>`).join("");
    $("[data-empty]").hidden = list.length > 0;
    $("[data-count]").textContent = `${list.length} pièce${list.length > 1 ? "s" : ""}`;

    if (animate && !reduced) {
      $$(".drop__item", grid).forEach((el, i) => el.animate(
        [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 350, delay: i * 40, easing: "cubic-bezier(.23, 1, .32, 1)", fill: "backwards" }
      ));
    }
    layoutDrop();
  }

  function wireFilters() {
    $$("[data-filter]").forEach((chip) => chip.addEventListener("click", () => {
      if (chip.classList.contains("is-on")) return;
      $$("[data-filter]").forEach((c) => { c.classList.remove("is-on"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-on");
      chip.setAttribute("aria-pressed", "true");
      renderGrid(chip.dataset.filter, true);
    }));
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
    pinned = pinMq.matches && !reduced;
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
      <div class="sheet__art" style="${artStyle(p)}">${garment(p, false)}</div>
      <div class="sheet__info">
        ${badge(p)}
        <h2 id="sheet-title" class="sheet__name">${p.name}</h2>
        <p class="sheet__price">${money.format(p.price)}</p>
        ${buyBlock(p, "sheet")}
        <p class="sheet__note">Paiement sécurisé Stripe. Tu choisis ta livraison à l'étape suivante.</p>
      </div>`;
    wireBuy(body, p);
    sheet.style.transform = "";
    sheet.showModal();
    document.documentElement.style.overflow = "hidden";
    history.replaceState(null, "", `#p/${p.id}`);
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
      if (t) openSheet(t.dataset.open);
    });
    $("[data-close]", sheet).addEventListener("click", closeSheet);
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
    sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
    sheet.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      history.replaceState(null, "", location.pathname + location.search);
    });
    wireDrag();
    const m = location.hash.match(/^#p\/(.+)$/);
    if (m) openSheet(decodeURIComponent(m[1]));
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
  function toast(msg) {
    const el = $("[data-toast]");
    el.textContent = msg;
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
    if (!canvas || !img) return;
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
    gl.uniform2f(U.u_focus, FOCUS[0], FOCUS[1]);

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
        setTimeout(() => $("a", menu).focus({ preventScroll: true }), reduced ? 0 : 300);
      } else {
        menu.classList.add("is-closing");
        menu.classList.remove("is-open");
        document.documentElement.style.overflow = "";
        setTimeout(() => { if (!open) menu.hidden = true; }, reduced ? 0 : 360);
      }
    }
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

    const ringS = spring(420, 38);
    const magnets = new Map();
    let mx = 0, my = 0, raf = 0, last = performance.now(), seen = false;

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      ringS.step(dt);
      ring.style.transform = `translate3d(${ringS.x.toFixed(1)}px, ${ringS.y.toFixed(1)}px, 0)`;
      let busy = !ringS.rest();
      magnets.forEach((s, el) => {
        s.step(dt);
        el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
        if (!s.rest()) busy = true;
      });
      raf = busy ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    // État selon l'élément sous la souris : « Voir » sur les produits, anneau élargi sur les liens
    function updateState(target) {
      if (!target || !target.closest) return;
      const card = target.closest(".card, .feat");
      const link = target.closest("a, button, summary, label, [data-hero]");
      cursor.classList.toggle("is-label", !!card);
      cursor.classList.toggle("is-link", !card && !!link);
      if (card && label.textContent !== "Voir") label.textContent = "Voir";

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
        ringS.snap(mx, my);
        root.classList.add("has-cursor");
      }
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ringS.tx = mx; ringS.ty = my;
      cursor.classList.remove("is-hidden");
      updateState(e.target);
      kick();
    }, { passive: true });

    // Au scroll sans bouger la souris, l'élément survolé change : on met l'état à jour
    addEventListener("scroll", () => { if (seen) updateState(document.elementFromPoint(mx, my)); }, { passive: true });
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) cursor.classList.add("is-hidden"); });
    addEventListener("blur", () => cursor.classList.add("is-hidden"));
    document.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

    // La fiche produit s'ouvre dans la couche du dessus : le curseur la suit
    const sheetEl = $("[data-sheet]");
    new MutationObserver(() => {
      const host = sheetEl.open ? sheetEl : document.body;
      if (cursor.parentNode !== host) host.appendChild(cursor);
    }).observe(sheetEl, { attributes: true, attributeFilter: ["open"] });

    // Boutons magnétiques : attirés vers la souris, reviennent en ressort
    $$(".btn--primary, .btn--glass, .top__cta, .look__cta").forEach((el) => {
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
      vec3 top = vec3(0.04, 0.15, 0.18);
      vec3 bottom = vec3(0.012, 0.055, 0.085);
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
      col += vec3(1.0, 0.82, 0.58) * light * 0.34;
      col += vec3(0.25, 0.75, 0.8) * sun * 0.05;

      // Brume chaude qui respire
      col += vec3(0.9, 0.7, 0.5) * (noise(p * 0.8 + vec2(t * 0.03, 0.0)) - 0.5) * 0.025;

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
  wireDrop();
  wireSheet();
  splitWords();
  maskTitles();
  wireScroll();
  wireReveals();
  wireSea();
  wireFuturist();
  wireNav();
  wirePointerFx();
  wireOcean();
  addEventListener("load", layoutDrop);
})();

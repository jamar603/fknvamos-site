# FKN VAMOS — site boutique

Site vitrine et boutique de la marque streetwear **FKN VAMOS** ([@fknvamos](https://instagram.com/fknvamos)).
Thème « lagon caraïbe » : hero plein écran sur la photo `assets/img/header-galion.jpg`, avec parallax, reflets animés sur l'eau (canvas) et titre animé lettre par lettre.

Le site est 100 % statique (HTML, CSS, JS). Pas de build, pas de serveur. Le paiement passe par **Stripe Payment Links**.

## Structure

```
fknvamos-site/
├── index.html              page unique (hero, drop, plage, infos, footer)
├── data/
│   └── products.js         CATALOGUE : le seul fichier à modifier pour les produits
├── assets/
│   ├── css/styles.css      tout le style
│   ├── js/app.js           rendu des produits, fiche produit, paiement, animations
│   └── img/                favicon + photos produits à ajouter
├── .vscode/                extensions conseillées (Live Server, Prettier)
├── .github/workflows/      déploiement automatique GitHub Pages
├── PRODUCT.md              brief produit
└── .impeccable/            notes de design (outil Impeccable)
```

## Lancer en local (VS Code)

1. Ouvrir le dossier : `code C:\Users\jamar\Projects\fknvamos-site`
2. Installer l'extension conseillée **Live Server** (VS Code la propose automatiquement).
3. Clic droit sur `index.html` puis **Open with Live Server**. Le site s'ouvre sur http://127.0.0.1:5500.

## Modifier les produits

Tout se passe dans `data/products.js`. Chaque produit a un nom, un prix, des tailles, un état de stock
(`dispo`, `derniers`, `epuise`) et un lien Stripe.

Photos : déposer l'image dans `assets/img/` puis remplir `image: "assets/img/mon-produit.jpg"`.
Sans photo, un visuel provisoire dessiné s'affiche.

## Brancher Stripe

1. Dans le dashboard Stripe : **Payment Links** puis **Nouveau**, un lien par produit.
2. Activer la collecte de l'adresse de livraison dans le lien.
3. Coller le lien dans `stripe: "https://buy.stripe.com/..."`.
   La taille choisie est transmise dans `client_reference_id` (visible dans chaque paiement Stripe).
4. Option : un lien par taille → `stripe: { S: "https://...", M: "https://..." }`.

Tant qu'un produit n'a pas de lien, le bouton Acheter affiche un message qui renvoie vers Instagram.

## Mettre sur GitHub

```bash
git remote add origin https://github.com/<ton-compte>/fknvamos-site.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source : GitHub Actions**.
Chaque push sur `main` met le site en ligne sur `https://<ton-compte>.github.io/fknvamos-site/`.
Nom de domaine perso : Settings → Pages → Custom domain.

## À récupérer chez le client

- Logo (SVG si possible) et photos produits
- Liste réelle des produits, prix, tailles, stock
- Comptes Stripe et liens de paiement
- Infos livraison, retours, guide des tailles, email de contact
- Photos lifestyle pour la section « Sur la plage »

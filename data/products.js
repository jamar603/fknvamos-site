/*
  CATALOGUE FKN VAMOS
  -------------------
  C'est le SEUL fichier à modifier pour changer les produits.

  Champs d'un produit :
    id        identifiant unique, sans espace (ex: "tee-sunrise")
    name      nom affiché
    type      "tee" | "hoodie" | "shorts" | "cap"  (sert au filtre et au visuel provisoire)
    price     prix en euros (nombre)
    color     couleur du visuel provisoire (hex)
    towel     2 couleurs des rayures de la serviette sous le produit
    image     chemin d'une vraie photo (ex: "assets/img/tee-sunrise.jpg"). Laisser "" pour le visuel provisoire.
    sizes     tailles proposées
    stock     "dispo" | "derniers" | "epuise"
    stripe    lien Stripe Payment Link.
              - Un seul lien : "https://buy.stripe.com/xxxx"
                (la taille est envoyée dans client_reference_id)
              - Un lien par taille : { S: "https://buy.stripe.com/aaa", M: "https://buy.stripe.com/bbb" }
    featured  true pour le produit mis en avant en haut de page (un seul)

  TOUT CE QUI SUIT EST PROVISOIRE : noms, prix et liens sont à remplacer par ceux du client.
*/

window.FKN_PRODUCTS = [
  {
    id: "tee-vamos-classic",
    name: "Tee Vamos Classic",
    type: "tee",
    price: 35,
    color: "#f6f7fb",
    towel: ["#ef3b2d", "#f6f7fb"],
    image: "",
    sizes: ["S", "M", "L", "XL"],
    stock: "dispo",
    stripe: "",
    featured: true
  },
  {
    id: "hoodie-marea",
    name: "Hoodie Marea",
    type: "hoodie",
    price: 65,
    color: "#0a1440",
    towel: ["#ffd23f", "#1238d6"],
    image: "",
    sizes: ["S", "M", "L", "XL"],
    stock: "derniers",
    stripe: ""
  },
  {
    id: "short-orilla",
    name: "Short Orilla",
    type: "shorts",
    price: 40,
    color: "#ffd23f",
    towel: ["#1238d6", "#f6f7fb"],
    image: "",
    sizes: ["S", "M", "L"],
    stock: "dispo",
    stripe: ""
  },
  {
    id: "cap-socorrista",
    name: "Casquette Socorrista",
    type: "cap",
    price: 28,
    color: "#ef3b2d",
    towel: ["#f6f7fb", "#0a1440"],
    image: "",
    sizes: ["Unique"],
    stock: "dispo",
    stripe: ""
  },
  {
    id: "tee-sol",
    name: "Tee Sol",
    type: "tee",
    price: 35,
    color: "#ffd23f",
    towel: ["#ef3b2d", "#ffd23f"],
    image: "",
    sizes: ["S", "M", "L", "XL"],
    stock: "epuise",
    stripe: ""
  },
  {
    id: "hoodie-faro",
    name: "Hoodie Faro",
    type: "hoodie",
    price: 65,
    color: "#ef3b2d",
    towel: ["#0a1440", "#ef3b2d"],
    image: "",
    sizes: ["M", "L", "XL"],
    stock: "dispo",
    stripe: ""
  }
];

/* Infos boutique — à compléter avec le client */
window.FKN_SHOP = {
  dropName: "Drop Été 26",
  instagram: "https://instagram.com/fknvamos",
  email: "",               // ex: "contact@fknvamos.com"
  currency: "EUR"
};

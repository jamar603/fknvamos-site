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

  Photos réelles : Tee FKN VAMOS!, Casquette Con Todo!, Casquette FKN VAMOS!.
  PROVISOIRE : prix, tailles, liens Stripe, et les autres produits (visuel dessiné).
*/

window.FKN_PRODUCTS = [
  {
    id: "tee-fkn-vamos",
    name: "Tee FKN VAMOS!",
    type: "tee",
    price: 35,
    color: "#111111",
    towel: ["#12b5bf", "#04223a"],
    image: "assets/img/tee-fkn-vamos.jpg",
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
    id: "cap-con-todo",
    name: "Casquette Con Todo!",
    type: "cap",
    price: 28,
    color: "#111111",
    towel: ["#f6f7fb", "#0a1440"],
    image: "assets/img/cap-con-todo.jpg",
    sizes: ["Unique"],
    stock: "dispo",
    stripe: ""
  },
  {
    id: "cap-fkn-vamos",
    name: "Casquette FKN VAMOS!",
    type: "cap",
    price: 28,
    color: "#111111",
    towel: ["#2f7fe0", "#f6f7fb"],
    image: "assets/img/cap-fkn-vamos.jpg",
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

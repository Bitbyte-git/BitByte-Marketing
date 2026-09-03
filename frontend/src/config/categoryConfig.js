// categoryConfig.js
// Shared subcategory list — Navbar, Super Admin product form, AllCollection.jsx
// moonu file-um idha irundhu than data edukkum. Puthu subcategory add pannanumna
// idhula oru line add pannina podhum — moonu place-layum automatic-a varum.

export const CATEGORY_SUBCATEGORIES = {
  rings: {
    gold: ["Plain Gold Rings", "Gemstone Gold Rings", "Engagement Rings", "Couple Rings", "Kids Rings"],
    silver: ["Plain Silver Rings", "Oxidised Silver Rings", "Adjustable Silver Rings", "Designer Silver Rings", "Couple Silver Rings", "Stone Silver Rings", "Kids Silver Rings", "Men's Silver Rings"],
  },
  earrings: {
    gold: ["Stud Earrings", "Jhumka Earrings", "Hoop Earrings", "Drop Earrings", "Sui Dhaga Earrings", "Kids Earrings"],
    silver: ["Stud Earrings", "Drop Earrings", "Jhumka Earrings", "Hoop Earrings", "Oxidised Earrings", "Chandbali Earrings", "Ear Cuffs", "Kids Silver Earrings"],
  },
  bangles: {
    gold: ["Plain Gold Bangles", "Traditional Bangles", "Kada Bangles", "Kids Bangles"],
    silver: ["Plain Silver Bangles", "Oxidised Bangles", "Designer Bangles", "Kada Bangles", "Stone Bangles", "Beaded Bangles", "Adjustable Bangles", "Kids Bangles"],
  },
  bracelets: {
    gold: [],
    silver: ["Chain Bracelets", "Charms Bracelets", "Cuff Bracelets", "ID Bracelets", "Beaded Bracelets", "Mangalsutra Bracelets", "Kids Bracelets", "Men's Bracelets"],
  },
  pendants: {
    gold: ["Religious Pendants", "Initial Pendants", "Gemstone Pendants", "Kids Pendants"],
    silver: ["Religious Pendants", "Initial Pendants", "Heart Pendants", "Kids Pendants", "Motif Pendants", "Oxidised Pendants", "Stone Pendants", "Personalised Pendants"],
  },
  chains: {
    gold: ["Plain Gold Chains", "Rope Chains", "Box Chains", "Figaro Chains", "Beaded Chains"],
    silver: ["Plain Silver Chains", "Rope Chains", "Box Chains", "Figaro Chains", "Beaded Chains"],
  },
  necklaces: {
    gold: ["Plain Gold Necklaces", "Traditional Necklaces", "Temple Necklaces", "Chain Necklaces", "Mangalsutra Necklaces"],
    silver: ["Chains", "Pendant Necklaces", "Choker Necklaces", "Oxidised Necklaces", "Layered Necklaces", "Beaded Necklaces", "Statement Necklaces", "Mangalsutra Necklaces"],
  },
  mangalsutra: {
    gold: ["Traditional Mangalsutra", "Beaded Mangalsutra", "Short Mangalsutra", "Gold Mangalsutra Set"],
    silver: ["Silver Mangalsutra", "Silver Black Bead Mangalsutra", "Silver Short Mangalsutra"],
  },
  anklets: {
    gold: [],
    silver: ["Plain Silver Anklets", "Oxidised Anklets", "Beaded Anklets", "Charm Anklets", "Designer Anklets", "Pair Anklets", "Kids Anklets", "Temple Anklets"],
  },
  coins: {
    gold: ["Gold Coins", "Gold Bars", "Gift Coins", "Religious Coins", "Collectible Coins"],
    silver: ["1g Silver Coins", "2g Silver Coins", "5g Silver Coins", "10g Silver Coins", "20g Silver Coins", "50g Silver Coins", "100g Silver Coins"],
  },
  // nosepin, toerings, cufflinks, brooches, tiepins — subcategory venumna appuram add pannalam
  nosepin: { gold: [], silver: [] },
  toerings: { gold: [], silver: [] },
  cufflinks: { gold: [], silver: [] },
  brooches: { gold: [], silver: [] },
  tiepins: { gold: [], silver: [] },
};

// Category-level metadata — Navbar mega menu title/icon/route ku
export const CATEGORY_META = {
  rings:      { title: "Rings",      icon: "◌" },
  earrings:   { title: "Earrings",   icon: "♢" },
  bangles:    { title: "Bangles",    icon: "◯" },
  bracelets:  { title: "Bracelets",  icon: "◌" },
  pendants:   { title: "Pendants",   icon: "♤" },
  chains:     { title: "Chains",     icon: "⌁" },
  necklaces:  { title: "Necklaces",  icon: "♧" },
  mangalsutra:{ title: "Mangalsutra",icon: "♧" },
  anklets:    { title: "Anklets",    icon: "⌁" },
  coins:      { title: "Coins",      icon: "◎" },
};

export function getSubcategories(category, metal) {
  return CATEGORY_SUBCATEGORIES[category]?.[metal] || [];
}
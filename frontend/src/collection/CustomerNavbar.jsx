import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { getCartCountDB } from "../collection/card_section";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

function Icon({ name, size = 20, filled = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const paths = {
    truck: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 11h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="17" cy="18" r="1.7" />
      </>
    ),
    hallmark: (
      <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z" />
    ),
    refresh: (
      <>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M18.2 9A7 7 0 0 0 6 7.8" />
        <path d="M5.8 15A7 7 0 0 0 18 16.2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
    ),
    heart: (
      <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.6-4.2 4.3-6 8-6s6.4 1.8 8 6" />
      </>
    ),
    cart: (
      <>
        <path d="M4 4h2l2.4 11.5h9.8L21 7H7" />
        <circle cx="10" cy="20" r="1.6" />
        <circle cx="18" cy="20" r="1.6" />
      </>
    ),
    userPlus: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c1.3-4.4 3.7-6.4 7-6.4s5.7 2 7 6.4" />
        <path d="M18 8v6" />
        <path d="M15 11h6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
        <path d="M15 7l5 5-5 5" />
        <path d="M20 12H8" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    mic: (
      <>
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function productImage(product) {
  const image = product?.images?.[0]?.image;
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "...";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/-`;
}

const menuItems = [
  { label: "All Jewellery", route: "/collection/all" },
  { label: "Gold", route: "/collection/all?metal=gold" },
  { label: "Diamond", route: "/collection/all?metal=diamond" },
  { label: "Platinum", route: "/collection/all?metal=platinum" },
  { label: "Silver", route: "/collection/all?metal=silver" },
  { label: "Coins", route: "/collection/coins" },
  { label: "Offers", route: "/collection/offers" },
  { label: "Team369-Live", route: "/bj-live" },
  { label: "Wedding", route: "/collection/all?wedding=true" },
  { label: "Gifting", route: "/collection/gifting" },
  { label: "New Arrivals", route: "/collection/new-arrivals" },
];

const allJewelleryMega = [
  {
    title: "Gold Jewellery",
    icon: "◌",
    viewAll: ["View All Gold", "/collection/all?metal=gold"],
    links: [
      ["Gold Rings", "/collection/all?metal=gold&category=rings"],
      ["Gold Earrings", "/collection/all?metal=gold&category=earrings"],
      ["Gold Necklaces", "/collection/all?metal=gold&category=necklaces"],
      ["Gold Pendants", "/collection/all?metal=gold&category=pendants"],
      ["Gold Bangles", "/collection/all?metal=gold&category=bangles"],
      ["Gold Chains", "/collection/all?metal=gold&category=chains"],
      ["Gold Mangalsutra", "/collection/all?metal=gold&category=mangalsutra"],
      ["Gold Anklets", "/collection/all?metal=gold&category=anklets"],
    ],
  },
  {
    title: "Diamond Jewellery",
    icon: "◇",
    viewAll: ["View All Diamonds", "/collection/all?metal=diamond"],
    links: [
      ["Diamond Rings", "/collection/all?metal=diamond&category=rings"],
      ["Diamond Earrings", "/collection/all?metal=diamond&category=earrings"],
      ["Diamond Necklaces", "/collection/all?metal=diamond&category=necklaces"],
      ["Diamond Pendants", "/collection/all?metal=diamond&category=pendants"],
      ["Diamond Bracelets", "/collection/all?metal=diamond&category=bracelets"],
      ["Diamond Bangles", "/collection/all?metal=diamond&category=bangles"],
      [
        "Diamond Mangalsutra",
        "/collection/all?metal=diamond&category=mangalsutra",
      ],
      [
        "Solitaire Collection",
        "/collection/all?metal=diamond&search=solitaire",
      ],
    ],
  },
  {
    title: "Platinum Jewellery",
    icon: "P",
    viewAll: ["View All Platinum", "/collection/all?metal=platinum"],
    links: [
      ["Platinum Rings", "/collection/all?metal=platinum&category=rings"],
      ["Platinum Earrings", "/collection/all?metal=platinum&category=earrings"],
      [
        "Platinum Necklaces",
        "/collection/all?metal=platinum&category=necklaces",
      ],
      ["Platinum Pendants", "/collection/all?metal=platinum&category=pendants"],
      [
        "Platinum Bracelets",
        "/collection/all?metal=platinum&category=bracelets",
      ],
      ["Platinum Chains", "/collection/all?metal=platinum&category=chains"],
      [
        "Platinum Mangalsutra",
        "/collection/all?metal=platinum&category=mangalsutra",
      ],
      ["Men's Platinum", "/collection/all?metal=platinum&gender=men"],
    ],
  },
  {
    title: "Silver Jewellery",
    icon: "◒",
    viewAll: ["View All Silver", "/collection/all?metal=silver"],
    links: [
      ["Silver Rings", "/collection/all?metal=silver&category=rings"],
      ["Silver Earrings", "/collection/all?metal=silver&category=earrings"],
      ["Silver Necklaces", "/collection/all?metal=silver&category=necklaces"],
      ["Silver Pendants", "/collection/all?metal=silver&category=pendants"],
      ["Silver Bracelets", "/collection/all?metal=silver&category=bracelets"],
      ["Silver Bangles", "/collection/all?metal=silver&category=bangles"],
      ["Silver Anklets", "/collection/all?metal=silver&category=anklets"],
      ["Silver Coins & Items", "/collection/coins?metal=silver"],
    ],
  },
  {
    title: "Coins & Bars",
    icon: "◎",
    viewAll: ["View All Coins", "/collection/coins"],
    links: [
      ["Gold Coins", "/collection/coins?metal=gold"],
      ["Silver Coins", "/collection/coins?metal=silver"],
      ["Gold Bars", "/collection/coins?metal=gold"],
      ["Silver Bars", "/collection/coins?metal=silver"],
      ["Collectible Coins", "/collection/coins"],
      ["Gift Coins", "/collection/gifting"],
      ["Temple Coins", "/collection/coins?search=temple"],
    ],
  },
  {
    title: "Wedding Jewellery",
    icon: "◡",
    viewAll: ["View All Wedding", "/collection/all?wedding=true"],
    links: [
      ["Bridal Sets", "/collection/all?wedding=true&search=bridal"],
      ["Temple Jewellery", "/collection/all?wedding=true&search=temple"],
      ["Kundan Jewellery", "/collection/all?wedding=true&search=kundan"],
      ["Polki Jewellery", "/collection/all?wedding=true&search=polki"],
      ["Antique Jewellery", "/collection/all?wedding=true&search=antique"],
      ["Wedding Bangles", "/collection/all?wedding=true&category=bangles"],
    ],
  },
  {
    title: "Daily Wear",
    icon: "✣",
    viewAll: ["View All Daily Wear", "/collection/all?dailywear=true"],
    links: [
      ["Daily Wear Rings", "/collection/all?dailywear=true&category=rings"],
      [
        "Daily Wear Earrings",
        "/collection/all?dailywear=true&category=earrings",
      ],
      [
        "Daily Wear Pendants",
        "/collection/all?dailywear=true&category=pendants",
      ],
      ["Daily Wear Chains", "/collection/all?dailywear=true&category=chains"],
      ["Light Weight Jewellery", "/collection/all?dailywear=true&search=light"],
      ["Minimal Collection", "/collection/all?dailywear=true&search=minimal"],
    ],
  },
  {
    title: "Gifting Collection",
    icon: "□",
    viewAll: ["View All Gifting", "/collection/gifting"],
    links: [
      ["Gift For Her", "/collection/gifting?gender=women"],
      ["Gift For Him", "/collection/gifting?gender=men"],
      ["Kids Jewellery", "/collection/all?gender=kids"],
      ["Corporate Gifts", "/collection/gifting?search=corporate"],
      ["Anniversary Gifts", "/collection/gifting?occasion=Anniversary"],
      ["Birthday Gifts", "/collection/gifting?occasion=Birthday"],
    ],
  },
  {
    title: "Mangalsutra",
    icon: "♧",
    viewAll: ["View All Mangalsutra", "/collection/all?category=mangalsutra"],
    links: [
      [
        "Traditional Mangalsutra",
        "/collection/all?category=mangalsutra&search=traditional",
      ],
      [
        "Diamond Mangalsutra",
        "/collection/all?category=mangalsutra&metal=diamond",
      ],
      [
        "Beaded Mangalsutra",
        "/collection/all?category=mangalsutra&search=beaded",
      ],
      [
        "Short Mangalsutra",
        "/collection/all?category=mangalsutra&search=short",
      ],
      ["Gold Mangalsutra", "/collection/all?category=mangalsutra&metal=gold"],
      [
        "Black Bead Mangalsutra",
        "/collection/all?category=mangalsutra&search=black",
      ],
    ],
  },
  {
    title: "Other Jewellery",
    icon: "☆",
    viewAll: ["View All Others", "/collection/all"],
    links: [
      ["Nose Pins", "/collection/all?category=nosepin"],
      ["Anklets", "/collection/all?category=anklets"],
      ["Toe Rings", "/collection/all?search=toe"],
      ["Cufflinks", "/collection/all?search=cufflinks"],
      ["Brooches", "/collection/all?search=brooch"],
      ["Tie Pins", "/collection/all?search=tie"],
    ],
  },
];

const metalMega = {
  Gold: [
    [
      "Gold Rings",
      "◌",
      "/collection/all?metal=gold&category=rings",
      [
        "Plain Gold Rings",
        "Diamond Gold Rings",
        "Gemstone Gold Rings",
        "Engagement Rings",
        "Couple Rings",
        "Kids Rings",
      ],
    ],
    [
      "Gold Earrings",
      "♢",
      "/collection/all?metal=gold&category=earrings",
      [
        "Stud Earrings",
        "Jhumka Earrings",
        "Hoop Earrings",
        "Drop Earrings",
        "Sui Dhaga Earrings",
        "Kids Earrings",
      ],
    ],
    [
      "Gold Necklaces",
      "♧",
      "/collection/all?metal=gold&category=necklaces",
      [
        "Plain Gold Necklaces",
        "Traditional Necklaces",
        "Temple Necklaces",
        "Chain Necklaces",
        "Diamond Necklaces",
        "Mangalsutra Necklaces",
      ],
    ],
    [
      "Gold Pendants",
      "♤",
      "/collection/all?metal=gold&category=pendants",
      [
        "Religious Pendants",
        "Diamond Pendants",
        "Initial Pendants",
        "Gemstone Pendants",
        "Kids Pendants",
      ],
    ],
    [
      "Gold Bangles",
      "◯",
      "/collection/all?metal=gold&category=bangles",
      [
        "Plain Gold Bangles",
        "Diamond Bangles",
        "Traditional Bangles",
        "Kada Bangles",
        "Kids Bangles",
      ],
    ],
    [
      "Gold Chains",
      "⌁",
      "/collection/all?metal=gold&category=chains",
      [
        "Plain Gold Chains",
        "Rope Chains",
        "Box Chains",
        "Figaro Chains",
        "Beaded Chains",
      ],
    ],
    [
      "Gold Mangalsutra",
      "♧",
      "/collection/all?metal=gold&category=mangalsutra",
      [
        "Traditional Mangalsutra",
        "Diamond Mangalsutra",
        "Beaded Mangalsutra",
        "Short Mangalsutra",
        "Gold Mangalsutra Set",
      ],
    ],
    [
      "Gold Coins & Bars",
      "◎",
      "/collection/coins?metal=gold",
      [
        "Gold Coins",
        "Gold Bars",
        "Gift Coins",
        "Religious Coins",
        "Collectible Coins",
      ],
    ],
  ],
  Diamond: [
    [
      "Diamond Rings",
      "◇",
      "/collection/all?metal=diamond&category=rings",
      [
        "Solitaire Rings",
        "Engagement Rings",
        "Wedding Rings",
        "Cocktail Rings",
        "Fashion Rings",
        "Cluster Rings",
        "Men's Diamond Rings",
        "Kids Diamond Rings",
      ],
    ],
    [
      "Diamond Earrings",
      "♢",
      "/collection/all?metal=diamond&category=earrings",
      [
        "Stud Earrings",
        "Drop Earrings",
        "Hoop Earrings",
        "Jhumka Earrings",
        "Sui Dhaga Earrings",
        "Chandbali Earrings",
        "Party Wear Earrings",
        "Kids Diamond Earrings",
      ],
    ],
    [
      "Diamond Pendants",
      "♤",
      "/collection/all?metal=diamond&category=pendants",
      [
        "Solitaire Pendants",
        "Halo Pendants",
        "Religious Pendants",
        "Initial Pendants",
        "Heart Pendants",
        "Shape Pendants",
        "Fancy Pendants",
        "Kids Diamond Pendants",
      ],
    ],
    [
      "Diamond Necklaces",
      "♧",
      "/collection/all?metal=diamond&category=necklaces",
      [
        "Solitaire Necklaces",
        "Tennis Necklaces",
        "Cluster Necklaces",
        "Bridal Necklaces",
        "Choker Necklaces",
        "Long Necklaces",
        "Mang tikka / Neck Sets",
        "Contemporary Necklaces",
      ],
    ],
    [
      "Diamond Bracelets",
      "◌",
      "/collection/all?metal=diamond&category=bracelets",
      [
        "Tennis Bracelets",
        "Chain Bracelets",
        "Bangle Bracelets",
        "Charm Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Men's Bracelets",
      ],
    ],
    [
      "Diamond Bangles",
      "◇",
      "/collection/all?metal=diamond&category=bangles",
      [
        "Line Bangles",
        "Bracelet Bangles",
        "Openable Bangles",
        "Kada Bangles",
        "Designer Bangles",
        "Party Wear Bangles",
      ],
    ],
    [
      "Diamond Mangalsutra",
      "♧",
      "/collection/all?metal=diamond&category=mangalsutra",
      [
        "Single Line Mangalsutra",
        "Tanmaniya Mangalsutra",
        "Pendant Mangalsutra",
        "Beaded Mangalsutra",
        "Diamond Mangalsutra Set",
        "Contemporary Mangalsutra",
      ],
    ],
    [
      "Diamond By Shape",
      "◇",
      "/collection/all?metal=diamond",
      [
        "Round Diamond",
        "Princess Cut",
        "Oval Diamond",
        "Pear Shape",
        "Emerald Cut",
        "Cushion Cut",
        "Marquise Cut",
      ],
    ],
  ],
  Platinum: [
    [
      "Platinum Rings",
      "◌",
      "/collection/all?metal=platinum&category=rings",
      [
        "Men's Platinum Rings",
        "Women's Platinum Rings",
        "Couple Platinum Rings",
        "Engagement Platinum Rings",
        "Wedding Platinum Rings",
        "Fashion Platinum Rings",
        "Kids Platinum Rings",
      ],
    ],
    [
      "Platinum Earrings",
      "♢",
      "/collection/all?metal=platinum&category=earrings",
      [
        "Stud Earrings",
        "Drop Earrings",
        "Hoop Earrings",
        "Jhumka Earrings",
        "Sui Dhaga Earrings",
        "Chandbali Earrings",
        "Ear Cuffs",
      ],
    ],
    [
      "Platinum Pendants",
      "♤",
      "/collection/all?metal=platinum&category=pendants",
      [
        "Initial Pendants",
        "Religious Pendants",
        "Heart Pendants",
        "Solitaire Pendants",
        "Shape Pendants",
        "Fancy Pendants",
        "Kids Pendants",
      ],
    ],
    [
      "Platinum Necklaces",
      "♧",
      "/collection/all?metal=platinum&category=necklaces",
      [
        "Chains",
        "Solitaire Necklaces",
        "Layered Necklaces",
        "Symbol Necklaces",
        "Choker Necklaces",
        "Long Necklaces",
        "Mangalsutra Necklaces",
      ],
    ],
    [
      "Platinum Bracelets",
      "◌",
      "/collection/all?metal=platinum&category=bracelets",
      [
        "Chain Bracelets",
        "Tennis Bracelets",
        "Bangle Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Charm Bracelets",
        "Men's Bracelets",
      ],
    ],
    [
      "Platinum Bangles",
      "◯",
      "/collection/all?metal=platinum&category=bangles",
      [
        "Plain Bangles",
        "Diamond Bangles",
        "Openable Bangles",
        "Designer Bangles",
        "Kada Bangles",
        "Slim Bangles",
        "Stackable Bangles",
      ],
    ],
    [
      "Platinum Chains",
      "⌁",
      "/collection/all?metal=platinum&category=chains",
      [
        "Men's Chains",
        "Women's Chains",
        "Rope Chains",
        "Box Chains",
        "Figaro Chains",
        "Snake Chains",
        "Bead Chains",
      ],
    ],
    [
      "Platinum Collection",
      "◇",
      "/collection/all?metal=platinum",
      [
        "Love Collection",
        "Infinity Collection",
        "Minimal Collection",
        "Men's Collection",
        "Wedding Collection",
        "Kids Collection",
        "Office Wear Collection",
      ],
    ],
  ],
  Silver: [
    [
      "Silver Rings",
      "◌",
      "/collection/all?metal=silver&category=rings",
      [
        "Plain Silver Rings",
        "Oxidised Silver Rings",
        "Adjustable Silver Rings",
        "Designer Silver Rings",
        "Couple Silver Rings",
        "Stone Silver Rings",
        "Kids Silver Rings",
        "Men's Silver Rings",
      ],
    ],
    [
      "Silver Earrings",
      "♢",
      "/collection/all?metal=silver&category=earrings",
      [
        "Stud Earrings",
        "Drop Earrings",
        "Jhumka Earrings",
        "Hoop Earrings",
        "Oxidised Earrings",
        "Chandbali Earrings",
        "Ear Cuffs",
        "Kids Silver Earrings",
      ],
    ],
    [
      "Silver Pendants",
      "♤",
      "/collection/all?metal=silver&category=pendants",
      [
        "Religious Pendants",
        "Initial Pendants",
        "Heart Pendants",
        "Kids Pendants",
        "Motif Pendants",
        "Oxidised Pendants",
        "Stone Pendants",
        "Personalised Pendants",
      ],
    ],
    [
      "Silver Necklaces",
      "♧",
      "/collection/all?metal=silver&category=necklaces",
      [
        "Chains",
        "Pendant Necklaces",
        "Choker Necklaces",
        "Oxidised Necklaces",
        "Layered Necklaces",
        "Beaded Necklaces",
        "Statement Necklaces",
        "Mangalsutra Necklaces",
      ],
    ],
    [
      "Silver Bracelets",
      "◌",
      "/collection/all?metal=silver&category=bracelets",
      [
        "Chain Bracelets",
        "Charms Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Beaded Bracelets",
        "Mangalsutra Bracelets",
        "Kids Bracelets",
        "Men's Bracelets",
      ],
    ],
    [
      "Silver Bangles",
      "◯",
      "/collection/all?metal=silver&category=bangles",
      [
        "Plain Silver Bangles",
        "Oxidised Bangles",
        "Designer Bangles",
        "Kada Bangles",
        "Stone Bangles",
        "Beaded Bangles",
        "Adjustable Bangles",
        "Kids Bangles",
      ],
    ],
    [
      "Silver Anklets",
      "⌁",
      "/collection/all?metal=silver&category=anklets",
      [
        "Plain Silver Anklets",
        "Oxidised Anklets",
        "Beaded Anklets",
        "Charm Anklets",
        "Designer Anklets",
        "Pair Anklets",
        "Kids Anklets",
        "Temple Anklets",
      ],
    ],
    [
      "Silver Articles",
      "♙",
      "/collection/all?metal=silver",
      [
        "Pooja Articles",
        "Silver Utensils",
        "Home Decor",
        "Gift Articles",
        "Return Gifts",
        "Corporate Gifts",
        "Kids Articles",
      ],
    ],
  ],
};

const specialMega = {
  Coins: [
    [
      "Gold Coins",
      "◎",
      "/collection/coins?metal=gold",
      [
        "24K Gold Coins",
        "22K Gold Coins",
        "18K Gold Coins",
        "10g Gold Coins",
        "20g Gold Coins",
        "1/2 Sovereign Coins",
        "1 Sovereign Coins",
        "2 Sovereign Coins",
      ],
    ],
    [
      "Gold Bars",
      "▣",
      "/collection/coins?metal=gold",
      [
        "1g Gold Bars",
        "2g Gold Bars",
        "5g Gold Bars",
        "10g Gold Bars",
        "20g Gold Bars",
        "50g Gold Bars",
        "100g Gold Bars",
        "500g Gold Bars",
      ],
    ],
    [
      "Silver Coins",
      "◎",
      "/collection/coins?metal=silver",
      [
        "999 Silver Coins",
        "925 Silver Coins",
        "10g Silver Coins",
        "20g Silver Coins",
        "50g Silver Coins",
        "100g Silver Coins",
        "250g Silver Coins",
        "500g Silver Coins",
      ],
    ],
    [
      "Silver Bars",
      "▣",
      "/collection/coins?metal=silver",
      [
        "10g Silver Bars",
        "20g Silver Bars",
        "50g Silver Bars",
        "100g Silver Bars",
        "250g Silver Bars",
        "500g Silver Bars",
        "1kg Silver Bars",
        "5kg Silver Bars",
      ],
    ],
    [
      "Collectible Coins",
      "◎",
      "/collection/coins",
      [
        "Lakshmi Coins",
        "Ganesha Coins",
        "Krishna Coins",
        "Rama Coins",
        "Hanuman Coins",
        "Swami Coins",
        "Religious Coins",
        "Limited Edition Coins",
      ],
    ],
    [
      "Festival Coins",
      "◉",
      "/collection/coins?occasion=Festival",
      [
        "Diwali Coins",
        "Dhanteras Coins",
        "Akshaya Tritiya Coins",
        "Navratri Coins",
        "Pongal Coins",
        "Ganesh Chaturthi Coins",
        "Birthday Coins",
      ],
    ],
    [
      "Gift Coins",
      "□",
      "/collection/gifting",
      [
        "Baby Gift Coins",
        "Wedding Gift Coins",
        "Anniversary Coins",
        "Corporate Gift Coins",
        "Return Gift Coins",
        "Naming Ceremony Coins",
        "Housewarming Coins",
      ],
    ],
    [
      "Investment Coins",
      "↗",
      "/collection/coins?search=investment",
      [
        "24K Investment Coins",
        "22K Investment Coins",
        "Low Premium Coins",
        "High Resale Coins",
        "Popular Investment Coins",
        "Certified Investment Coins",
      ],
    ],
  ],
  Wedding: [
    [
      "Bridal Necklaces",
      "♧",
      "/collection/all?wedding=true&category=necklaces",
      [
        "Temple Necklaces",
        "Kundan Necklaces",
        "Antique Necklaces",
        "Polki Necklaces",
        "Traditional Necklaces",
        "Long Haaram",
        "Choker Necklaces",
        "Rani Haar",
      ],
    ],
    [
      "Bridal Earrings",
      "♢",
      "/collection/all?wedding=true&category=earrings",
      [
        "Jhumka Earrings",
        "Kundan Earrings",
        "Temple Earrings",
        "Chandbali Earrings",
        "Polki Earrings",
        "Long Earrings",
        "Stud Earrings",
        "Drop Earrings",
      ],
    ],
    [
      "Bridal Rings",
      "◌",
      "/collection/all?wedding=true&category=rings",
      [
        "Engagement Rings",
        "Wedding Rings",
        "Kundan Rings",
        "Diamond Rings",
        "Temple Rings",
        "Couple Rings",
        "Antique Rings",
        "Polki Rings",
      ],
    ],
    [
      "Bridal Bangles",
      "◯",
      "/collection/all?wedding=true&category=bangles",
      [
        "Gold Bangles",
        "Kundan Bangles",
        "Antique Bangles",
        "Polki Bangles",
        "Kada Bangles",
        "Temple Bangles",
        "Designer Bangles",
        "Bangle Sets",
      ],
    ],
    [
      "Bridal Sets",
      "♕",
      "/collection/all?wedding=true",
      [
        "Necklace Sets",
        "Earring Sets",
        "Bangle Sets",
        "Complete Bridal Sets",
        "Kundan Sets",
        "Temple Sets",
        "Polki Sets",
        "Antique Sets",
      ],
    ],
    [
      "Mangalsutra",
      "♧",
      "/collection/all?wedding=true&category=mangalsutra",
      [
        "Traditional Mangalsutra",
        "Diamond Mangalsutra",
        "Beaded Mangalsutra",
        "Pendant Mangalsutra",
        "Short Mangalsutra",
        "Gold Mangalsutra",
        "Black Bead Mangalsutra",
        "Mangalsutra Sets",
      ],
    ],
    [
      "Maang Tikka",
      "♙",
      "/collection/all?wedding=true&search=maang",
      [
        "Kundan Maang Tikka",
        "Polki Maang Tikka",
        "Temple Maang Tikka",
        "Antique Maang Tikka",
        "Diamond Maang Tikka",
        "Pearl Maang Tikka",
      ],
    ],
    [
      "Groom Jewellery",
      "♔",
      "/collection/all?wedding=true&gender=men",
      [
        "Chains for Men",
        "Bracelets for Men",
        "Rings for Men",
        "Pendants for Men",
        "Cufflinks",
        "Brooches",
      ],
    ],
  ],
  Gifting: [
    [
      "Gifts For Her",
      "□",
      "/collection/gifting?gender=women",
      [
        "Necklaces",
        "Earrings",
        "Rings",
        "Bracelets",
        "Pendants",
        "Bangles",
        "Mangalsutra",
        "Nose Pins",
      ],
    ],
    [
      "Gifts For Him",
      "♙",
      "/collection/gifting?gender=men",
      [
        "Chains",
        "Bracelets",
        "Rings",
        "Pendants",
        "Cufflinks",
        "Tie Pins",
        "Men's Kada",
        "Coins & Bars",
      ],
    ],
    [
      "Gifts For Kids",
      "☻",
      "/collection/all?gender=kids",
      [
        "Baby Jewellery",
        "Chains",
        "Earrings",
        "Bracelets",
        "Nazariya",
        "Anklets",
        "Pendants",
        "ID Bracelets",
      ],
    ],
    [
      "Gifts For Couple",
      "♡",
      "/collection/gifting?search=couple",
      [
        "Couple Rings",
        "Couple Pendants",
        "Matching Bracelets",
        "His & Her Sets",
        "Engagement Gifts",
        "Anniversary Gifts",
        "Personalised Gifts",
      ],
    ],
    [
      "Gifts For Parents",
      "♚",
      "/collection/gifting?search=parents",
      [
        "Gold Coins",
        "Religious Pendants",
        "Chains",
        "Bracelets",
        "Rings",
        "Pooja Articles",
        "Silver Articles",
        "Health Pendants",
      ],
    ],
    [
      "Occasion Gifts",
      "▣",
      "/collection/gifting?occasion=Birthday",
      [
        "Birthday Gifts",
        "Anniversary Gifts",
        "Wedding Gifts",
        "Housewarming Gifts",
        "Festive Gifts",
        "Graduation Gifts",
        "Promotion Gifts",
        "Baby Shower Gifts",
      ],
    ],
    [
      "Corporate Gifts",
      "▤",
      "/collection/gifting?search=corporate",
      [
        "Gold Coins",
        "Silver Coins",
        "Desk Accessories",
        "Pen Sets",
        "Customized Coins",
        "Mementos",
        "Trophies",
        "Premium Sets",
      ],
    ],
    [
      "Religious Gifts",
      "♙",
      "/collection/gifting?search=religious",
      [
        "Gold Idols",
        "Silver Idols",
        "Pooja Items",
        "Religious Pendants",
        "Yantra Pendants",
        "Mala & Chains",
        "Temple Jewellery",
        "Spiritual Coins",
      ],
    ],
  ],
};

const buildSections = (list) =>
  list.map(([title, icon, route, links]) => ({
    title,
    icon,
    viewAll: [
      `View All ${title.replace(/^Gold |^Diamond |^Platinum |^Silver /, "")}`,
      route,
    ],
    links: links.map((label) => [
      label,
      `${route}${route.includes("?") ? "&" : "?"}search=${encodeURIComponent(label)}`,
    ]),
  }));

const megaByLabel = {
  "All Jewellery": allJewelleryMega,
  Gold: buildSections(metalMega.Gold),
  Diamond: buildSections(metalMega.Diamond),
  Platinum: buildSections(metalMega.Platinum),
  Silver: buildSections(metalMega.Silver),
  Coins: buildSections(specialMega.Coins),
  Wedding: buildSections(specialMega.Wedding),
  Gifting: buildSections(specialMega.Gifting),
};

const megaIconFor = (title) => {
  if (title.includes("Gold")) return "G";
  if (title.includes("Diamond")) return "D";
  if (title.includes("Platinum")) return "P";
  if (title.includes("Silver")) return "S";
  if (title.includes("Coin")) return "C";
  if (title.includes("Wedding") || title.includes("Bridal")) return "W";
  if (title.includes("Gift")) return "G";
  if (title.includes("Mangalsutra")) return "M";
  return title.charAt(0);
};

export default function CustomerNavbar() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [rates, setRates] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const megaRefs = useRef({});
  const recognitionRef = useRef(null);

  const scrollMega = (label, dir) => {
    const el = megaRefs.current[label];
    if (el) el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  useEffect(() => {
    const updateCount = async () => setCartCount(await getCartCountDB());
    updateCount();
    window.addEventListener("bb_cart_update", updateCount);
    return () => window.removeEventListener("bb_cart_update", updateCount);
  }, []);

  useEffect(() => {
    const updateWishCount = async () => {
      try {
        const res = await api.get("/wishlist/");
        setWishlistCount(res.data.count || 0);
      } catch {
        setWishlistCount(0);
      }
    };
    updateWishCount();
    window.addEventListener("bb_wishlist_update", updateWishCount);
    return () =>
      window.removeEventListener("bb_wishlist_update", updateWishCount);
  }, []);

  useEffect(() => {
    api
      .get("/metal-rates/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setRates(data || null);
      })
      .catch(() => setRates(null));
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        setSearchQuery(transcript);
        setShowSearchDrop(true);
      }
    };

    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(
          `/jewelry-products/?search=${encodeURIComponent(query)}`,
        );
        setSearchResults(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
        setShowSearchDrop(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setShowSearchDrop(false);
    navigate(`/collection/all?search=${encodeURIComponent(query)}`);
  };

  const startVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceSupported(false);
      return;
    }

    if (voiceListening) {
      recognition.stop();
      setVoiceListening(false);
      return;
    }

    try {
      setShowSearchDrop(false);
      setVoiceListening(true);
      recognition.start();
    } catch {
      setVoiceListening(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        .exact-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: var(--bb-bg);
          color: var(--bb-ink);
          box-shadow: 0 8px 28px rgba(7,59,63,0.08);
        }

        .exact-nav-spacer {
          height: 174px;
        }

        .exact-strip {
          height: 42px;
          background: var(--bb-soft-aqua);
          color: var(--bb-teal-dark);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
          overflow: hidden;
        }

        .exact-strip-track {
          display: flex;
          align-items: center;
          height: 100%;
          width: max-content;
          animation: marquee-scroll 28s linear infinite;
        }

        .exact-strip:hover .exact-strip-track {
          animation-play-state: paused;
        }

        .exact-strip-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding: 0 48px;
        }

        .exact-strip-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--bb-teal-dark);
          opacity: 0.4;
          flex-shrink: 0;
        }

        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .exact-inner {
          width: 100%;
          margin: 0;
          padding-left: clamp(28px, 4vw, 76px);
          padding-right: clamp(28px, 4vw, 76px);
        }

        .exact-main {
          position: relative;
          z-index: 4;
          height: 86px;
          border-bottom: 1px solid var(--bb-surface);
          background: var(--bb-bg);
        }

        .exact-main .exact-inner {
          height: 100%;
          display: grid;
          grid-template-columns: clamp(118px, 11vw, 170px) minmax(260px, 1fr) max-content max-content;
          gap: clamp(10px, 1.2vw, 20px);
          align-items: center;
          justify-content: stretch;
        }

        .team-brand {
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          color: var(--bb-ruby);
          min-width: 0;
        }

        .team-mark {
          width: 160px;
          height: 50px;
          border-radius: 0;
          object-fit: contain;
          display: block;
          background: transparent;
          box-shadow: none;
          flex: 0 0 auto;
        }

        .team-brand strong {
          display: none;
        }

        .exact-search-wrap {
          position: relative;
          z-index: 10020;
        }

        .exact-search {
          height: 44px;
          border-radius: 999px;
          border: 1.5px solid var(--bb-soft-aqua);
          background: var(--bb-bg);
          display: grid;
          grid-template-columns: 42px 1fr 44px;
          align-items: center;
          color: var(--bb-muted);
          box-shadow: 0 4px 16px rgba(7,59,63,0.09);
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .exact-search:focus-within {
          border-color: var(--bb-teal);
          box-shadow: 0 4px 20px rgba(7,59,63,0.18);
        }

        .exact-search input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--bb-ink);
          font-size: 14px;
          padding-right: 8px;
        }

        .exact-search input::placeholder {
          color: var(--bb-muted);
        }

        .exact-search svg {
          margin: 0 auto;
          color: var(--bb-teal-dark);
        }

        .exact-voice-btn {
          width: 34px;
          height: 34px;
          margin-right: 5px;
          border: 0;
          border-radius: 999px;
          background: var(--bb-mist-aqua);
          color: var(--bb-teal-dark);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }

        .exact-voice-btn:hover {
          background: var(--bb-soft-aqua);
          transform: translateY(-1px);
        }

        .exact-voice-btn.is-listening {
          background: var(--bb-teal-dark);
          color: var(--bb-bg);
          box-shadow: 0 0 0 6px rgba(12,64,68,0.13);
          animation: voice-pulse 900ms ease-in-out infinite alternate;
        }

        .exact-voice-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          transform: none;
          box-shadow: none;
        }

        @keyframes voice-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }

        .exact-results {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          z-index: 10030;
          border-radius: 18px;
          border: 1px solid var(--bb-soft-aqua);
          background: rgba(253,253,252,0.99);
          box-shadow: 0 26px 70px rgba(7,59,63,0.22);
          padding: 8px;
          max-height: 360px;
          overflow: auto;
        }

        .exact-result {
          width: 100%;
          border: 0;
          border-radius: 14px;
          background: transparent;
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 12px;
          padding: 9px;
          cursor: pointer;
          text-align: left;
        }

        .exact-result:hover {
          background: var(--bb-mist-aqua);
        }

        .exact-result img,
        .exact-fallback {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          object-fit: cover;
          background: var(--bb-champagne);
        }

        .exact-result strong {
          display: block;
          color: var(--bb-ink);
          font-size: 14px;
        }

        .exact-result span span {
          display: block;
          color: var(--bb-muted);
          font-size: 12px;
          margin-top: 4px;
          font-weight: 800;
        }

        .rate-pill,
        .summary-pill {
          height: 42px;
          border-radius: 999px;
          border: 1px solid var(--bb-soft-aqua);
          background: var(--bb-bg);
          color: var(--bb-teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,59,63,0.10);
        }

        .rate-dropdown {
          position: relative;
          display: flex;
          align-items: center;
          justify-self: end;
          min-width: 0;
        }

        .rate-dropdown-toggle {
          height: 42px;
          border-radius: 999px;
          border: none;
          background: #073B3F;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          padding: 0 16px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,59,63,0.22);
          max-width: clamp(180px, 22vw, 292px);
          min-width: 0;
          overflow: hidden;
        }

        .rate-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rate-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          border-radius: 22px;
          background: var(--bb-bg);
          border: 1px solid rgba(31, 23, 18, 0.08);
          box-shadow: 0 28px 60px rgba(31, 23, 18, 0.12);
          z-index: 20;
          overflow: hidden;
        }

        .rate-dropdown-panel::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 18px;
          width: 12px;
          height: 12px;
          background: var(--bb-bg);
          transform: rotate(45deg);
          border-left: 1px solid rgba(31, 23, 18, 0.08);
          border-top: 1px solid rgba(31, 23, 18, 0.08);
        }

        .rate-item {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(31, 23, 18, 0.06);
          transition: background 150ms ease;
        }

        .rate-item:last-child {
          border-bottom: none;
        }

        .rate-item:hover {
          background: rgba(204, 168, 129, 0.16);
        }

        .rate-item-title {
          color: var(--bb-ink);
          font-weight: 800;
          font-size: 12px;
        }

        .rate-item-value {
          color: var(--bb-gold-deep);
          font-weight: 900;
          font-size: 12px;
          white-space: nowrap;
        }

        .summary-pill {
          border: 1px solid #073B3F;
          padding: 0 15px;
          cursor: pointer;
          background: rgba(255,255,255,0.7);
          color: #073B3F;
          box-shadow: none;
        }

        .exact-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          justify-self: end;
          gap: clamp(8px, 0.9vw, 14px);
          min-width: 0;
        }

        .exact-icon {
          position: relative;
          border: 0;
          background: transparent;
          color: var(--bb-ink);
          width: 28px;
          height: 36px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 160ms ease, transform 160ms ease;
        }

        .exact-icon:hover {
          color: var(--bb-teal);
          transform: translateY(-2px);
        }

        .exact-badge {
          position: absolute;
          top: 0;
          right: -5px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--bb-ruby);
          color: var(--bb-bg);
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
        }

        .exact-menu {
          position: relative;
          z-index: 2;
          height: 46px;
          border-bottom: 1px solid var(--bb-mist-aqua);
          background: var(--bb-bg);
        }

        .exact-menu .exact-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: clamp(12px, 1.7vw, 30px);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .exact-menu .exact-inner::-webkit-scrollbar { display: none; }

        .exact-menu-item {
          height: 100%;
          display: flex;
          align-items: center;
          position: static;
        }

        .exact-menu-button {
          border: 0;
          background: transparent;
          color: var(--bb-ink);
          height: 100%;
          cursor: pointer;
          font-size: clamp(12px, 0.8vw, 13px);
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          line-height: 1;
          position: relative;
        }

        .exact-menu-button::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          border-radius: 999px;
          background: var(--bb-teal);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 180ms ease;
        }

        .exact-menu-button:hover::after,
        .exact-menu-item:hover .exact-menu-button::after {
          transform: scaleX(1);
        }

        .exact-mega {
          position: relative;
          top: unset;
          left: unset;
          right: unset;
          z-index: 9998;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #cca881 #f3ede7;
          width: 100%;
          min-width: 0;
          gap: 0;
          padding: 20px 44px 16px;
          border: 1px solid #e6ded5;
          border-top: 0;
          border-radius: 0 0 12px 12px;
          background: rgba(253,253,252,0.99);
          box-shadow: 0 24px 60px rgba(7,59,63,0.14);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
        }

        .exact-mega::-webkit-scrollbar {
          height: 5px;
        }

        .exact-mega::-webkit-scrollbar-track {
          background: #f3ede7;
          border-radius: 999px;
        }

        .exact-mega::-webkit-scrollbar-thumb {
          background: #cca881;
          border-radius: 999px;
        }

        .exact-menu-item.is-open .exact-mega {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }

        .exact-menu-item.is-open .exact-mega-wrap {
          pointer-events: auto;
        }

        .exact-mega-section {
          flex: 0 0 200px;
          min-height: 220px;
          padding: 0 22px 8px 16px;
          border-right: 1px solid #e6ded5;
          display: flex;
          flex-direction: column;
        }

        .exact-mega-section:last-child {
          border-right: 0;
        }

        /* remove old nth-child rules — last-child handles it now */
        .exact-mega-section:nth-child(5n) {
          border-right: 1px solid #e6ded5;
        }

        .exact-mega-section:nth-child(n + 6) {
          padding-top: 0;
        }

        .exact-mega-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.2;
        }

        .exact-mega-title span {
          color: #b57720;
          font-family: Inter, system-ui, sans-serif;
          font-size: 24px;
          line-height: 1;
        }

        .exact-mega-link {
          border: 0;
          background: transparent;
          width: 100%;
          min-height: 28px;
          padding: 0;
          color: var(--bb-ink);
          display: block;
          text-align: left;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
          cursor: pointer;
          transition: color 160ms ease, transform 160ms ease;
        }

        .exact-mega-link:hover {
          color: #9F6130;
          transform: translateX(3px);
        }

        .exact-mega-view {
          border: 0;
          background: transparent;
          margin-top: auto;
          padding: 12px 0 0;
          min-height: 34px;
          color: #073B3F;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          text-transform: none;
          letter-spacing: 0;
          cursor: pointer;
        }

        .exact-mega-view:hover {
          color: #9F6130;
        }

        .exact-mega-scroll-btn {
          position: absolute;
          top: 0;
          bottom: 5px;
          width: 44px;
          border: none;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          z-index: 3;
          transition: opacity 150ms ease;
        }

        .exact-mega-scroll-btn.left {
          left: 0;
          background: linear-gradient(to right, rgba(253,253,252,1) 55%, rgba(253,253,252,0));
          color: #073B3F;
          border-radius: 0 0 0 12px;
        }

        .exact-mega-scroll-btn.right {
          right: 0;
          background: linear-gradient(to left, rgba(253,253,252,1) 55%, rgba(253,253,252,0));
          color: #073B3F;
          border-radius: 0 0 12px 0;
        }

        .exact-mega-scroll-btn:hover {
          opacity: 0.7;
        }

        .exact-menu-item.is-open .exact-mega-scroll-btn {
          display: flex;
        }

        .exact-mega-wrap {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 9998;
          pointer-events: none;
        }

        .exact-mobile-toggle {
          display: none;
        }

        .exact-mobile-menu {
          display: none;
        }

        @media (max-width: 1180px) {
          .exact-nav-spacer {
            height: 136px;
          }

          .exact-inner {
            padding-left: 18px;
            padding-right: 18px;
          }

          .exact-main {
            height: 94px;
          }

          .exact-main .exact-inner {
            grid-template-columns: minmax(110px, auto) minmax(0, 1fr) auto;
            grid-template-areas:
              "brand search actions"
              "brand search actions";
            gap: 10px;
          }

          .team-brand { grid-area: brand; }
          .exact-search-wrap { grid-area: search; min-width: 0; }
          .exact-actions { grid-area: actions; }
          .rate-dropdown { display: none; }
          .exact-menu { display: none; }
          .exact-mobile-toggle { display: grid; }

          .exact-mobile-menu.open {
            display: block;
            padding: 0 16px 14px;
            background: var(--bb-bg);
            border-bottom: 1px solid var(--bb-soft-aqua);
            max-height: 70vh;
            overflow-y: auto;
          }

          .mobile-menu-rates {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 0;
            border-bottom: 1px solid var(--bb-soft-aqua);
            font-size: 12px;
            font-weight: 900;
            color: var(--bb-teal-dark);
            flex-wrap: wrap;
          }

          .mobile-menu-rates span {
            background: #073B3F;
            color: #fff;
            border-radius: 999px;
            padding: 5px 12px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
          }

          .mobile-menu-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            padding: 12px 0 4px;
          }

          .exact-mobile-menu button {
            border: 1px solid var(--bb-soft-aqua);
            border-radius: 12px;
            background: var(--bb-surface);
            color: var(--bb-teal-dark);
            padding: 12px;
            font-weight: 900;
            text-align: left;
            font-size: 13px;
            width: 100%;
          }

          .exact-mobile-menu button:active {
            background: var(--bb-mist-aqua);
          }
        }
        @media (max-width: 1020px) and (min-width: 901px) {
          .summary-pill {
            width: 42px;
            padding: 0;
          }

          .summary-pill .summary-text {
            display: none;
          }

          .exact-actions {
            gap: 8px;
          }
        }

        @media (max-width: 900px) {
          .exact-nav-spacer {
            height: 142px;
          }

          .exact-main {
            height: 96px;
          }

          .exact-main .exact-inner {
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "brand actions"
              "search search";
            gap: 10px 12px;
            justify-content: space-between;
            align-content: center;
          }

          .team-brand { grid-area: brand; }
          .exact-search-wrap { grid-area: search; min-width: 0; }
          .exact-actions { grid-area: actions; }
          .mobile-menu-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .exact-inner {
            width: 100%;
            padding-left: 14px;
            padding-right: 14px;
          }

          .exact-strip {
            height: 36px;
            font-size: 11px;
          }

          .exact-strip-item {
            padding: 0 28px;
          }

          .exact-nav-spacer {
            height: 132px;
          }

          .exact-main {
            height: 92px;
          }

          .team-mark {
            width: 90px;
            height: 38px;
          }

          .summary-pill {
            display: none;
          }

          .exact-actions {
            gap: 6px;
          }

          .exact-icon {
            width: 26px;
          }
        }

        @media (max-width: 400px) {
          .exact-nav-spacer {
            height: 126px;
          }

          .exact-main {
            height: 88px;
          }

          .exact-search input {
            font-size: 13px;
          }

          .exact-inner {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mobile-menu-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="exact-nav">
        <div className="exact-strip">
          <div className="exact-strip-track">
            {/* First set */}
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> FREE INSURED SHIPPING ON ALL
              ORDERS ABOVE Rs.4,999
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> BIS HALLMARKED JEWELLERY
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="refresh" size={14} /> 15 DAYS EASY RETURNS
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> 100% GENUINE & CERTIFIED GOLD
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> SECURE PAYMENTS GUARANTEED
            </span>
            <span className="exact-strip-dot" />
            {/* Duplicate for seamless loop */}
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> FREE INSURED SHIPPING ON ALL
              ORDERS ABOVE Rs.4,999
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> BIS HALLMARKED JEWELLERY
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="refresh" size={14} /> 15 DAYS EASY RETURNS
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> 100% GENUINE & CERTIFIED GOLD
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> SECURE PAYMENTS GUARANTEED
            </span>
            <span className="exact-strip-dot" />
          </div>
        </div>

        <div className="exact-main">
          <div className="exact-inner">
            <button
              className="team-brand"
              type="button"
              onClick={() => navigate("/customer")}
            >
              <img
                src="/luxiva-logo.svg"
                alt="LUXIVA"
                className="team-mark"
                loading="eager"
              />
            </button>

            <div className="exact-search-wrap">
              <div className="exact-search">
                <Icon name="search" size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() =>
                    searchResults.length && setShowSearchDrop(true)
                  }
                  onBlur={() => setTimeout(() => setShowSearchDrop(false), 180)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  placeholder="Search gold & diamond jewellery..."
                />
                <button
                  className={`exact-voice-btn ${voiceListening ? "is-listening" : ""}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={startVoiceSearch}
                  disabled={!voiceSupported}
                  title={
                    voiceSupported
                      ? voiceListening
                        ? "Stop voice search"
                        : "Search by voice"
                      : "Voice search is not supported in this browser"
                  }
                  aria-label={
                    voiceListening ? "Stop voice search" : "Search by voice"
                  }
                >
                  <Icon name="mic" size={17} />
                </button>
              </div>

              {showSearchDrop && (
                <div className="exact-results">
                  {searchLoading && (
                    <div
                      style={{
                        padding: 12,
                        color: "var(--bb-muted)",
                        fontWeight: 900,
                      }}
                    >
                      Searching...
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div
                      style={{
                        padding: 12,
                        color: "var(--bb-muted)",
                        fontWeight: 900,
                      }}
                    >
                      No products found
                    </div>
                  )}
                  {searchResults.map((product) => (
                    <button
                      className="exact-result"
                      type="button"
                      key={product.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setShowSearchDrop(false);
                        setSearchQuery("");
                        navigate(
                          `/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`,
                        );
                      }}
                    >
                      {productImage(product) ? (
                        <img src={productImage(product)} alt="" />
                      ) : (
                        <div className="exact-fallback" />
                      )}
                      <span>
                        <strong>{product.name}</strong>
                        <span>
                          {product.metal?.toUpperCase()} - {product.category} -{" "}
                          {money(product.price)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="rate-dropdown"
              onMouseEnter={() => setRatesOpen(true)}
              onMouseLeave={() => setRatesOpen(false)}
              onFocus={() => setRatesOpen(true)}
              onBlur={() => setRatesOpen(false)}
            >
              <button
                type="button"
                className="rate-dropdown-toggle"
                aria-expanded={ratesOpen}
                aria-haspopup="true"
              >
                <Icon name="calendar" size={16} />
                <span className="rate-label">
                  Today's Gold Rate 22K - {money(rates?.gold_22k)}
                </span>
                <span
                  style={{
                    transform: ratesOpen ? "rotate(270deg)" : "rotate(90deg)",
                    display: "inline-block",
                    transition: "transform 150ms ease",
                  }}
                >
                  ▾
                </span>
              </button>

              {ratesOpen && (
                <div className="rate-dropdown-panel">
                  <div className="rate-item">
                    <div className="rate-item-title">Gold 24K</div>
                    <div className="rate-item-value">
                      {money(rates?.gold_24k)}
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-item-title">Silver</div>
                    <div className="rate-item-value">
                      {money(rates?.silver_999)}
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-item-title">Diamond 18K</div>
                    <div className="rate-item-value">
                      {money(rates?.diamond_18k)}
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-item-title">Diamond 22K</div>
                    <div className="rate-item-value">
                      {money(rates?.diamond_22k)}
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-item-title">Platinum</div>
                    <div className="rate-item-value">
                      {money(rates?.platinum_92)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="exact-actions">
              <button
                className="summary-pill"
                type="button"
                onClick={() => navigate("/order-summary")}
              >
                <Icon name="star" size={15} />{" "}
                <span className="summary-text">Order Summary</span>
              </button>

              <button
                className="exact-icon"
                type="button"
                onClick={() => navigate("/wishlist")}
                aria-label="Wishlist"
              >
                <Icon name="heart" filled={wishlistCount > 0} />
                {wishlistCount > 0 && (
                  <span className="exact-badge">{wishlistCount}</span>
                )}
              </button>

              <button
                className="exact-icon"
                type="button"
                onClick={() => navigate("/profile")}
                aria-label="Profile"
              >
                <Icon name="user" />
              </button>

              <button
                className="exact-icon"
                type="button"
                onClick={() => navigate("/cart")}
                aria-label="Cart"
              >
                <Icon name="cart" />
                {cartCount > 0 && (
                  <span className="exact-badge">{cartCount}</span>
                )}
              </button>

              <button
                className="exact-icon"
                type="button"
                onClick={() => navigate("/create-customer")}
                aria-label="Create Customer"
                title="Create Customer"
              >
                <Icon name="userPlus" />
                {/* no text label, pure SVG icon like the rest */}
              </button>


              <button
                className="exact-icon"
                type="button"
                onClick={logout}
                aria-label="Logout"
              >
                <Icon name="logout" />
              </button>

              <button
                className="exact-icon exact-mobile-toggle"
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label="Menu"
              >
                <Icon name={mobileOpen ? "close" : "menu"} />
              </button>
            </div>
          </div>
        </div>

        <nav className="exact-menu">
          <div className="exact-inner">
            {menuItems.map((item) => {
              const sections = megaByLabel[item.label];

              return (
                <div
                  className={`exact-menu-item ${activeMega === item.label ? "is-open" : ""}`}
                  key={item.label}
                  onMouseEnter={() =>
                    setActiveMega(sections ? item.label : null)
                  }
                  onMouseLeave={() => setActiveMega(null)}
                >
                  <button
                    className="exact-menu-button"
                    type="button"
                    onClick={() => {
                      setActiveMega(null);
                      navigate(item.route);
                    }}
                  >
                    {item.label}
                  </button>
                  {sections && (
                    <div className="exact-mega-wrap">
                      <button
                        className="exact-mega-scroll-btn left"
                        type="button"
                        aria-label="Scroll left"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => scrollMega(item.label, -1)}
                      >‹</button>
                      <div
                        className="exact-mega"
                        ref={el => { megaRefs.current[item.label] = el; }}
                        onClick={() => setActiveMega(null)}
                      >
                        {sections.map((section) => (
                          <section
                            className="exact-mega-section"
                            key={section.title}
                          >
                            <div className="exact-mega-title">
                              <span>{megaIconFor(section.title)}</span>
                              {section.title}
                            </div>
                            {section.links.map(([label, route]) => (
                              <Link
                                className="exact-mega-link"
                                key={label}
                                to={route}
                              >
                                {label}
                              </Link>
                            ))}
                            <Link
                              className="exact-mega-view"
                              to={section.viewAll[1]}
                            >
                              {section.viewAll[0]} -&gt;
                            </Link>
                          </section>
                        ))}
                      </div>
                      <button
                        className="exact-mega-scroll-btn right"
                        type="button"
                        aria-label="Scroll right"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => scrollMega(item.label, 1)}
                      >›</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className={`exact-mobile-menu ${mobileOpen ? "open" : ""}`}>
          {rates && (
            <div className="mobile-menu-rates">
              <span>Gold 22K — {money(rates?.gold_22k)}</span>
              <span>Silver — {money(rates?.silver_999)}</span>
            </div>
          )}
          <div className="mobile-menu-grid">
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  setMobileOpen(false);
                  navigate(item.route);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="exact-nav-spacer" aria-hidden="true" />
    </>
  );
}

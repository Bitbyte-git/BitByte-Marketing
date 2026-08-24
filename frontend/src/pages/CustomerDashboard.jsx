import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CustomerFooter from "../collection/CustomerFooter";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const categoryRail = [
  {
    label: "Necklaces",
    route: "/collection/necklaces",
    image: "/diamond_necklas.jpg",
  },
  {
    label: "Earrings",
    route: "/collection/earrings",
    image: "/diamond Earings.jpg",
  },
  { label: "Rings", route: "/collection/rings", image: "/diamond_ring.jpg" },
  {
    label: "Bracelets",
    route: "/collection/bracelets",
    image: "/wedding_bracelet.jpg",
  },
  {
    label: "Pendants",
    route: "/collection/all?category=pendants",
    image: "/platinum_necklas.jpg",
  },
  {
    label: "Silver",
    route: "/collection/all?metal=silver",
    image: "/silver-coin.jpg.jpeg",
  },
  {
    label: "Kids",
    route: "/collection/all?gender=kids",
    image: "/Kids Jewllery.jpg",
  },
  { label: "Coins", route: "/collection/coins", image: "/gold-coin.jpg.jpeg" },
  {
    label: "Wedding",
    route: "/collection/all?occasion=wedding",
    image: "/wedding_necklaces.jpg",
  },
  {
    label: "Bangles",
    route: "/collection/bangles",
    image: "/diamond bangales.jpg",
  },
  {
    label: "Men's",
    route: "/collection/all?gender=men",
    image: "/Men's Jewellery.jpg",
  },
  { label: "Chains", route: "/collection/chains", image: "/dimand_chain.jpg" },
  {
    label: "Platinum",
    route: "/collection/all?metal=platinum",
    image: "/platinum_ring.jpg",
  },
];

const autoCategoryRail = Array.from({ length: 3 }, () => categoryRail).flat();

const promises = [
  ["BIS Hallmarked", "Certified jewellery"],
  ["Secure Payments", "Safe checkout flow"],
  ["Easy Returns", "15 days policy"],
  ["Live Rate Logic", "Backend powered prices"],
];

const promoCards = [
  {
    title: "Gold Coin 100mg",
    route: "/collection/coins?metal=gold&weight=100mg",
    image: "/coin/100mg.gold.png",
  },
  {
    title: "Gold Coin 200mg",
    route: "/collection/coins?metal=gold&weight=200mg",
    image: "/coin/200mg.gold.png",
  },
  {
    title: "Gold Coin 250mg",
    route: "/collection/coins?metal=gold&weight=250mg",
    image: "/coin/250mg.gold.png",
  },
  {
    title: "Silver Coin 100mg",
    route: "/collection/coins?metal=silver&weight=100mg",
    image: "/coin/100mg.silver.png",
  },
  {
    title: "Silver Coin 150mg",
    route: "/collection/coins?metal=silver&weight=150mg",
    image: "/coin/150mg.silver.png",
  },
  {
    title: "Silver Coin 200mg",
    route: "/collection/coins?metal=silver&weight=200mg",
    image: "/coin/200mg.silver.png",
  },
  {
    title: "Silver Coin 250mg",
    route: "/collection/coins?metal=silver&weight=250mg",
    image: "/coin/250mg.silver.png",
  },
  {
    title: "Silver Coin 500mg",
    route: "/collection/coins?metal=silver&weight=500mg",
    image: "/coin/500mg.silver.png",
  },
];

const autoPromoCards = [...promoCards, ...promoCards];

function coinSizeClass(route = "") {
  const match = route.match(/weight=(\d+)mg/i);
  return match ? `coin-size-${match[1]}` : "coin-size-default";
}

function coinMetalClass(card) {
  const text = `${card?.route || ""} ${card?.title || ""}`.toLowerCase();
  if (text.includes("silver")) return "coin-metal-silver";
  return "coin-metal-gold";
}

const serviceItems = [
  ["Free Insured Shipping", "On orders above Rs. 4,999"],
  ["Easy Returns", "15 days return policy"],
  ["Secure Payments", "100% safe checkout"],
  ["Lifetime Exchange", "On gold jewellery"],
  ["BIS Hallmarked", "Certified jewellery"],
];

const liveNewsItems = [];
const heroGoldNewsItems = [
  {
    icon: "UP",
    title: "Gold prices rise for the 3rd consecutive day in Tamil Nadu",
    time: "2 mins ago",
  },
  {
    icon: "RBI",
    title: "RBI keeps interest rates unchanged - Impact on gold prices",
    time: "1 hour ago",
  },
  {
    icon: "BIS",
    title: "Hallmarking rules updated by BIS - What you need to know",
    time: "3 hours ago",
  },
  {
    icon: "TN",
    title: "Wedding season demand boosts gold sales in TN",
    time: "5 hours ago",
  },
];
function resolveImage(image) {
  if (!image) return null;
  if (typeof image === "object") {
    image = image.image || image.url || image.src || "";
  }
  if (typeof image !== "string") return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
}

function productImage(product) {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  return resolveImage(firstImage?.image || firstImage || product?.image);
}

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.slug ||
      value.label ||
      value.value ||
      fallback
    );
  }
  return fallback;
}

function slugText(value, fallback = "all") {
  return safeText(value, fallback)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || fallback;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rs. 0";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function shortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function HomeBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [newsPinned, setNewsPinned] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get("/home-banners/")
      .then((res) => {
        if (!alive || !Array.isArray(res.data)) return;
        setBanners(
          res.data
            .filter((b) => b.is_active !== false)
            .sort((a, b) => a.slot - b.slot),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % banners.length),
      4200,
    );
    return () => clearInterval(timer);
  }, [banners.length]);

  // Always render the container to prevent layout shift.
  // Show skeleton until loaded, then show banners (or nothing if none).
  if (loaded && !banners.length) return null;

  return (
    <div className="store-banner">
      {!loaded && <div className="store-banner-skeleton" />}
      {banners.map((banner, index) => (
        <img
          key={banner.id || banner.slot}
          src={resolveImage(banner.image)}
          alt=""
          className={index === active ? "active" : ""}
        />
      ))}
      {banners.length > 1 && (
        <div className="store-dots">
          {banners.map((banner, index) => (
            <button
              key={banner.id || banner.slot}
              type="button"
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      )}
      <div className={`hero-news-popover ${newsPinned ? "open" : ""}`}>
        <button
          className="hero-news-trigger"
          type="button"
          aria-expanded={newsPinned}
          onClick={() => setNewsPinned((open) => !open)}
        >
          <span className="hero-news-trigger-dot" />
          Gold News
        </button>
        <aside className="hero-news-card" aria-label="Gold news updates">
          <div className="hero-news-card-top">
            <span>
              <i /> Live
            </span>
            <strong>Tamil Nadu</strong>
          </div>
          <h2>Gold News</h2>
          <p>Stay updated with the latest gold market news from Tamil Nadu</p>
          <div className="hero-news-card-list">
            {heroGoldNewsItems.map((item) => (
              <article className="hero-news-card-item" key={item.title}>
                <span className="hero-news-card-icon">{item.icon}</span>
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.time}</em>
                </span>
              </article>
            ))}
          </div>
          <button className="hero-news-view-all" type="button">
            More Updates Stay Here
          </button>
        </aside>
      </div>
    </div>
  );
}

function ProductCard({ product, wishIds, onWishlist, onOpen }) {
  const name = safeText(product.name, "Jewellery Product");
  const image = productImage(product);
  const category = safeText(product.category, "Luxiva Collection").replaceAll("_", " ");

  return (
    <article className="product-card" onClick={() => onOpen(product)}>
      <div className="product-img">
        <span className="product-badge">Featured</span>
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <img
            src="/logo.png"
            alt={name}
            style={{ objectFit: "contain", padding: 26 }}
          />
        )}
        <button
          className={`wish-btn ${wishIds.has(product.id) ? "active" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onWishlist(product);
          }}
          aria-label="Wishlist"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishIds.has(product.id) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
          </svg>
        </button>
        <span className="product-quick-view">View piece <b>↗</b></span>
      </div>
      <div className="product-body">
        <span className="product-category">{category}</span>
        <h3>{name}</h3>
        <div className="product-price-row">
          <span className="product-price"><small>Our price</small>{money(product.price)}</span>
          <button
            className="product-cart-btn"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
            }}
            aria-label="Add to cart"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const catTrackRef = useRef(null);
  const promoTrackRef = useRef(null);
  const promoRafRef = useRef(null);
  const promoLastTimeRef = useRef(0);
  const promoAutoPausedRef = useRef(false);
  const catAutoPausedRef = useRef(false);
  const catRafRef = useRef(null);
  const catOffsetRef = useRef(0);
  const catLoopWidthRef = useRef(0);
  const [profile, setProfile] = useState(null);
  const [rates, setRates] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [wishIds, setWishIds] = useState(new Set());

  useEffect(() => {
    let alive = true;

    async function load() {
      const [profileRes, rateRes, annRes, productRes, wishRes] =
        await Promise.allSettled([
          api.get("/dashboard/"),
          api.get("/metal-rates/"),
          api.get("/announcements/"),
          api.get("/jewelry-products/"),
          api.get("/wishlist/"),
        ]);

      if (!alive) return;

      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      if (rateRes.status === "fulfilled") {
        const data = Array.isArray(rateRes.value.data)
          ? rateRes.value.data[0]
          : rateRes.value.data;
        setRates(data || null);
      }
      if (annRes.status === "fulfilled" && Array.isArray(annRes.value.data)) {
        setAnnouncements(
          annRes.value.data
            .filter((a) => a.is_active !== false)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 2),
        );
      }
      if (
        productRes.status === "fulfilled" &&
        Array.isArray(productRes.value.data)
      ) {
        const activeProducts = productRes.value.data.filter(
          (p) => p.is_active !== false,
        );
        setFeatured(activeProducts.slice(0, 10));
      }
      if (wishRes.status === "fulfilled") {
        const items = Array.isArray(wishRes.value.data?.items)
          ? wishRes.value.data.items
          : Array.isArray(wishRes.value.data)
            ? wishRes.value.data
            : [];
        setWishIds(
          new Set(items.map((item) => item.product_id || item.product)),
        );
      }
    }

    load();
    const timer = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const setCategoryOffset = (value) => {
    const track = catTrackRef.current;
    const loopWidth = catLoopWidthRef.current;
    if (!track || loopWidth <= 0) return;

    let next = value;
    while (next >= loopWidth * 2) next -= loopWidth;
    while (next < loopWidth) next += loopWidth;

    catOffsetRef.current = next;
    track.style.transform = `translate3d(${-next}px, 0, 0)`;
  };

  const moveCategoryRail = (direction) => {
    const track = catTrackRef.current;
    if (!track || catLoopWidthRef.current <= 0) return;
    setCategoryOffset(
      catOffsetRef.current +
        direction * Math.floor(track.parentElement.offsetWidth * 0.72),
    );
  };

  const movePromoCarousel = (direction) => {
    const viewport = promoTrackRef.current;
    if (!viewport) return;
    const card = viewport.querySelector(".coin-story-card");
    if (!card) return;
    const grid = viewport.querySelector(".coin-story-track");
    const gap = parseFloat(getComputedStyle(grid || viewport).gap || "0") || 16;
    viewport.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const viewport = promoTrackRef.current;
    if (!viewport) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return undefined;

    const pixelsPerSecond = 34;

    const normalizeScroll = () => {
      const loopWidth = viewport.scrollWidth / 2;
      if (loopWidth <= 0) return;
      if (viewport.scrollLeft >= loopWidth) viewport.scrollLeft -= loopWidth;
      if (viewport.scrollLeft <= 0) viewport.scrollLeft += loopWidth;
    };

    const tick = (now) => {
      if (!promoLastTimeRef.current) promoLastTimeRef.current = now;
      const elapsed = Math.min(now - promoLastTimeRef.current, 80);
      promoLastTimeRef.current = now;

      if (
        !promoAutoPausedRef.current &&
        viewport.scrollWidth > viewport.clientWidth
      ) {
        viewport.scrollLeft += (pixelsPerSecond * elapsed) / 1000;
        normalizeScroll();
      }

      promoRafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", normalizeScroll);
    requestAnimationFrame(() => {
      viewport.scrollLeft = 0;
    });
    promoRafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", normalizeScroll);
      if (promoRafRef.current) cancelAnimationFrame(promoRafRef.current);
      promoLastTimeRef.current = 0;
    };
  }, []);
  useEffect(() => {
    const track = catTrackRef.current;
    if (!track) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return undefined;

    let lastTime = performance.now();
    const pixelsPerSecond = 24;

    const measureLoop = () => {
      const firstItem = track.children[0];
      const secondSetItem = track.children[categoryRail.length];
      if (!firstItem || !secondSetItem) return;

      const loopWidth = secondSetItem.offsetLeft - firstItem.offsetLeft;
      if (loopWidth <= 0) return;

      catLoopWidthRef.current = loopWidth;
      if (catOffsetRef.current <= 0) catOffsetRef.current = loopWidth;
      setCategoryOffset(catOffsetRef.current);
    };

    const tick = (now) => {
      const elapsed = Math.min(now - lastTime, 80);
      lastTime = now;
      if (catLoopWidthRef.current <= 0) measureLoop();

      if (!catAutoPausedRef.current && catLoopWidthRef.current > 0) {
        setCategoryOffset(
          catOffsetRef.current + (pixelsPerSecond * elapsed) / 1000,
        );
      }

      catRafRef.current = requestAnimationFrame(tick);
    };

    measureLoop();
    window.addEventListener("resize", measureLoop);
    catRafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", measureLoop);
      if (catRafRef.current) cancelAnimationFrame(catRafRef.current);
    };
  }, []);

  const rateLine = useMemo(() => {
    if (!rates) return "Live rates loading";
    return `Gold 22K ${money(rates.gold_22k)} / gm  |  Silver ${money(rates.silver_999)} / gm`;
  }, [rates]);

  const openProduct = (product) => {
    navigate(
      `/product-display?category=${slugText(product.category)}&metal=${slugText(product.metal)}&id=${product.id}`,
    );
  };

  const toggleWishlist = async (product) => {
    try {
      await api.post("/wishlist/", { product: product.id });
      setWishIds((prev) => new Set([...prev, product.id]));
      window.dispatchEvent(new Event("bb_wishlist_update"));
    } catch {
      try {
        await api.delete("/wishlist/", { data: { product: product.id } });
        setWishIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        window.dispatchEvent(new Event("bb_wishlist_update"));
      } catch {}
    }
  };

  return (
    <div className="storefront">
      <style>{`
        .storefront {
          min-height: 100vh;
          background: #FDFDFC;
          color: #111817;
          overflow-x: hidden;
          width: 100%;
        }

        .store-shell {
          width: calc(100% - 48px);
          max-width: 1560px;
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
        }

        .store-hero-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .store-btn {
          min-height: 48px;
          border-radius: 999px;
          border: 1px solid #073B3F;
          padding: 0 28px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .store-btn:hover {
          transform: translateY(-2px);
        }

        .store-btn.primary {
          background: #073B3F;
          color: #fff;
          box-shadow: 0 18px 38px rgba(7,59,63,0.24);
        }

        .store-btn.secondary {
          background: rgba(255,255,255,0.7);
          color: #073B3F;
        }


        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Category carousel animations ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        @keyframes cat-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes cat-soft-glow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(7,59,63,0.13);
            filter: saturate(1);
          }
          50% {
            box-shadow: 0 16px 36px rgba(7,59,63,0.22);
            filter: saturate(1.08);
          }
        }

        @keyframes ring-spin {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }

        @keyframes cat-shine {
          from { transform: translateX(-150%) rotate(18deg); }
          to { transform: translateX(150%) rotate(18deg); }
        }

        @keyframes arrow-pulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(7,59,63,0.14); }
          50%       { box-shadow: 0 4px 22px rgba(7,59,63,0.34); }
        }

        .store-category-card {
          --cat-img-size: clamp(88px, 7.3vw, 140px);
          --cat-basis: calc((100% - 98px) / 8);
          position: relative;
          z-index: 4;
          margin-top: 0;
          border-radius: 0;
          background: rgba(253,253,252,0.96);
          border-top: 1px solid #D1DFDE;
          border-bottom: 1px solid #D1DFDE;
          box-shadow: 0 8px 32px rgba(7,59,63,0.08);
          padding: clamp(14px, 1.8vw, 22px) clamp(42px, 4vw, 60px);
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }

        .store-cat-track {
          display: flex;
          gap: clamp(6px, 0.8vw, 14px);
          width: 100%;
          overflow: visible;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .store-cat-track::-webkit-scrollbar { display: none; }

        .store-cat-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1.5px solid #073B3F;
          background: #fff;
          color: #073B3F;
          font-size: 16px;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 5;
          box-shadow: 0 4px 14px rgba(7,59,63,0.18);
          transition: background 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }

        .store-cat-arrow:hover {
          background: #073B3F;
          color: #fff;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(7,59,63,0.30);
        }

        .store-cat-arrow.prev { left: 12px; }
        .store-cat-arrow.next { right: 12px; }

        .store-cat {
          border: 0;
          background: transparent;
          border-radius: 16px;
          padding: clamp(8px, 1vw, 12px) 4px;
          cursor: pointer;
          color: #073B3F;
          flex: 0 0 var(--cat-basis);
          position: relative;
          animation: cat-fade-up 480ms ease both;
          transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
          min-width: 0;
          box-sizing: border-box;
          overflow: hidden;
        }

        .store-cat::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          width: calc(var(--cat-img-size) + 12px);
          height: calc(var(--cat-img-size) + 12px);
          border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(204,168,129,0), rgba(204,168,129,0.72), rgba(7,59,63,0.58), rgba(204,168,129,0));
          opacity: 0;
          transform: translateX(-50%);
          transition: opacity 180ms ease;
          animation: ring-spin 4.6s linear infinite;
          z-index: 0;
        }

        .store-cat::after {
          content: '';
          position: absolute;
          top: 12px;
          left: 50%;
          width: var(--cat-img-size);
          height: var(--cat-img-size);
          border-radius: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.44), transparent);
          opacity: 0;
          pointer-events: none;
          z-index: 2;
          transform: translateX(-150%) rotate(18deg);
        }

        .store-cat:nth-child(1)  { animation-delay: 40ms; }
        .store-cat:nth-child(2)  { animation-delay: 80ms; }
        .store-cat:nth-child(3)  { animation-delay: 120ms; }
        .store-cat:nth-child(4)  { animation-delay: 160ms; }
        .store-cat:nth-child(5)  { animation-delay: 200ms; }
        .store-cat:nth-child(6)  { animation-delay: 240ms; }
        .store-cat:nth-child(7)  { animation-delay: 280ms; }
        .store-cat:nth-child(8)  { animation-delay: 320ms; }
        .store-cat:nth-child(9)  { animation-delay: 360ms; }
        .store-cat:nth-child(10) { animation-delay: 400ms; }
        .store-cat:nth-child(11) { animation-delay: 440ms; }
        .store-cat:nth-child(12) { animation-delay: 480ms; }
        .store-cat:nth-child(13) { animation-delay: 520ms; }

        .store-cat:hover {
          transform: translateY(-7px);
        }

        .store-cat:hover::before {
          opacity: 1;
        }

        .store-cat:hover::after {
          opacity: 1;
          animation: cat-shine 760ms ease;
        }

        .store-cat img {
          width: var(--cat-img-size);
          height: var(--cat-img-size);
          min-width: var(--cat-img-size);
          min-height: var(--cat-img-size);
          margin: 0 auto 12px;
          border-radius: 50%;
          object-fit: cover;
          background: #F3E8DE;
          display: block;
          box-shadow: 0 6px 20px rgba(7,59,63,0.12);
          position: relative;
          z-index: 1;
          animation: cat-soft-glow 3.8s ease-in-out infinite;
          transition: transform 280ms ease, box-shadow 280ms ease, outline-color 280ms ease;
          outline: 3px solid transparent;
          outline-offset: 3px;
          aspect-ratio: 1 / 1;
        }

        .store-cat:hover img {
          transform: scale(1.08) rotate(-1.5deg);
          box-shadow: 0 18px 42px rgba(7,59,63,0.22);
          outline-color: rgba(204,168,129,0.42);
        }

        .store-cat span {
          position: relative;
          z-index: 1;
          display: block;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
          transition: color 160ms ease, transform 160ms ease;
        }

        .store-cat:hover span {
          color: #9F6130;
          transform: translateY(2px);
        }

        .store-section {
          padding: 28px 0;
        }

        .store-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .store-heading h2 {
          color: #1a1a1a;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.7rem;
          font-weight: 600;
          line-height: 1;
        }

        .store-kicker {
          color: #0C4044;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .store-heading .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #073B3F;
          font-size: 13px;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 0.02em;
        }

        .store-heading .view-all-link:hover { text-decoration: underline; }

        .store-promo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .store-promo {min-height: 260px;
          border: 0;
          border-radius: 18px;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
          position: relative;
          background: #111;
          box-shadow: 0 8px 30px rgba(7,59,63,0.18);
          transition: transform 260ms ease, box-shadow 260ms ease;
        }

        .store-promo:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(7,59,63,0.26);
        }

        .store-promo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.82;
          transition: transform 440ms ease, opacity 260ms ease;
        }

        .store-promo:hover img {
          transform: scale(1.06);
          opacity: 0.72;
        }

        .store-promo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(10,10,10,0.82) 0%,
            rgba(10,10,10,0.28) 45%,
            rgba(10,10,10,0.02) 100%
          );
        }

        .store-promo-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1;
          padding: 20px 22px;
        }

        .store-promo-content h3 {
          margin: 4px 0 8px;
          color: #fff;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          line-height: 1.15;
          font-weight: 500;
        }

        .store-promo-content p {
          color: rgba(255,255,255,0.82);
          line-height: 1.5;
          font-size: 13px;
        }

        .store-promo-content .store-kicker {
          color: rgba(255,255,255,0.70);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }

        .store-link {
          display: inline-flex;
          margin-top: 14px;
          gap: 6px;
          color: #fff;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.88;
        }

        .store-link:hover {
          opacity: 1;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Product card animations ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        @keyframes card-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer-sweep {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(220%) skewX(-12deg); }
        }

        @keyframes cart-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.28); }
          70%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        .product-card {
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #eef0ef;
          box-shadow:
            0 2px 8px rgba(7,59,63,0.06),
            0 8px 24px rgba(7,59,63,0.08),
            0 0 0 1px rgba(209,223,222,0.4);
          cursor: pointer;
          animation: card-fade-up 500ms ease both;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        /* stagger each card */
        .product-card:nth-child(1)  { animation-delay: 60ms; }
        .product-card:nth-child(2)  { animation-delay: 110ms; }
        .product-card:nth-child(3)  { animation-delay: 160ms; }
        .product-card:nth-child(4)  { animation-delay: 210ms; }
        .product-card:nth-child(5)  { animation-delay: 260ms; }
        .product-card:nth-child(6)  { animation-delay: 310ms; }
        .product-card:nth-child(7)  { animation-delay: 360ms; }
        .product-card:nth-child(8)  { animation-delay: 410ms; }
        .product-card:nth-child(9)  { animation-delay: 460ms; }
        .product-card:nth-child(10) { animation-delay: 510ms; }

        .product-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 4px 12px rgba(7,59,63,0.08),
            0 16px 40px rgba(7,59,63,0.16),
            0 0 0 1px rgba(189,207,206,0.7);
          border-color: #BDCFCE;
        }

        .product-img {
          position: relative;
          aspect-ratio: 1;
          background: #f5f5f3;
          overflow: hidden;
        }

        /* shimmer overlay on hover */
        .product-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.38) 50%,
            transparent 60%
          );
          transform: translateX(-100%) skewX(-12deg);
          pointer-events: none;
        }

        .product-card:hover .product-img::after {
          animation: shimmer-sweep 650ms ease forwards;
        }

        .product-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 440ms ease;
        }

        .product-card:hover .product-img img {
          transform: scale(1.07);
        }

        .wish-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 26px;
          height: 26px;
          border: 1px solid rgba(0,0,0,0.10);
          border-radius: 50%;
          background: #fff;
          color: #555;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
        }

        .wish-btn:hover {
          color: #C92035;
          border-color: #C92035;
          transform: scale(1.15);
        }

        .wish-btn.active {
          background: #fff;
          color: #C92035;
          border-color: #C92035;
        }

        .product-body {
          padding: 12px 13px 13px;
        }

        .product-body h3 {
          color: #1a1a1a;
          font-size: 13px;
          line-height: 1.3;
          font-weight: 600;
          margin: 0 0 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 180ms ease;
        }

        .product-price {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 700;
        }

        .product-card:hover .product-body h3 { color: #073B3F; }

        .product-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-top: 3px;
        }

        .product-cart-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #D1DFDE;
          background: #fff;
          color: #073B3F;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
        }

        .product-cart-btn:hover {
          background: #073B3F;
          border-color: #073B3F;
          color: #fff;
          animation: cart-pop 340ms ease forwards;
        }

        .product-stars {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 5px;
          font-size: 12px;
          color: #f5a623;
        }

        .product-stars span {
          color: #7A8987;
          font-size: 11px;
          font-weight: 600;
          margin-left: 3px;
        }

        /* Premium featured collection */
        .featured-section { position: relative; padding: clamp(42px, 5vw, 76px) 0; }
        .featured-section::before { content: ''; position: absolute; left: 50%; top: 0; width: 100vw; height: 100%; transform: translateX(-50%); z-index: -1; background: radial-gradient(circle at 8% 25%, rgba(204,168,129,.12), transparent 25%), linear-gradient(180deg,#fff,#f8faf8 52%,#fff); border-top: 1px solid rgba(209,223,222,.7); border-bottom: 1px solid rgba(209,223,222,.55); }
        .featured-section .store-heading { align-items: flex-end; margin-bottom: clamp(24px,3vw,38px); }
        .featured-heading-copy { max-width: 620px; }
        .featured-kicker { display: flex; align-items: center; gap: 10px; margin-bottom: 13px; color: #A2764C; font-size: 9px; font-weight: 800; letter-spacing: .2em; }
        .featured-kicker i { width: 25px; height: 1px; background: #C59A68; }
        .featured-section .store-heading h2 { color: #073B3F; font-size: clamp(32px,3vw,46px); letter-spacing: -.025em; }
        .featured-heading-copy p { margin-top: 11px; color: #7A8987; font-size: 13px; }
        .featured-section .store-heading .view-all-link { min-height: 44px; padding: 0 17px; gap: 18px; border: 1px solid #BDCFCE; border-radius: 999px; background: rgba(255,255,255,.78); text-transform: uppercase; font-size: 9px; letter-spacing: .12em; transition: background .2s,color .2s,border-color .2s,transform .2s; }
        .featured-section .store-heading .view-all-link i { font-size: 15px; font-style: normal; }
        .featured-section .store-heading .view-all-link:hover { color: #fff; background: #073B3F; border-color: #073B3F; text-decoration: none; transform: translateY(-2px); }
        .featured-section .product-grid { gap: clamp(14px,1.4vw,22px); }
        .featured-section .product-card { position: relative; border-radius: 22px; border-color: rgba(209,223,222,.86); background: linear-gradient(160deg,#fff 45%,#fbfaf7); box-shadow: 0 2px 4px rgba(7,59,63,.03),0 14px 34px rgba(7,59,63,.09); }
        .featured-section .product-card:hover { transform: translateY(-9px); border-color: rgba(197,154,104,.65); box-shadow: 0 5px 12px rgba(7,59,63,.06),0 26px 55px rgba(7,59,63,.16); }
        .featured-section .product-img { background: linear-gradient(145deg,#f5f2ec,#ecefeb); }
        .featured-section .product-img::before { content:''; position:absolute; inset:auto 0 0; z-index:1; height:38%; background:linear-gradient(transparent,rgba(5,35,36,.24)); opacity:0; transition:opacity .28s; pointer-events:none; }
        .featured-section .product-card:hover .product-img::before { opacity:1; }
        .featured-section .wish-btn { z-index:3; width:36px; height:36px; border-color:rgba(255,255,255,.7); background:rgba(255,255,255,.88); backdrop-filter:blur(10px); }
        .product-badge { position:absolute; z-index:3; top:13px; left:13px; padding:7px 10px; border-radius:999px; color:#fff; background:rgba(7,59,63,.88); backdrop-filter:blur(9px); font-size:8px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
        .product-quick-view { position:absolute; z-index:2; left:15px; right:15px; bottom:14px; display:flex; align-items:center; justify-content:space-between; color:#fff; font-size:9px; font-weight:700; letter-spacing:.11em; text-transform:uppercase; opacity:0; transform:translateY(8px); transition:opacity .22s,transform .22s; }
        .featured-section .product-card:hover .product-quick-view { opacity:1; transform:translateY(0); }
        .featured-section .product-body { padding:17px 17px 18px; }
        .product-category { display:block; margin-bottom:7px; color:#A2764C; font-size:8px; line-height:1; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
        .featured-section .product-body h3 { color:#173230; font-family:Georgia,"Times New Roman",serif; font-size:16px; margin-bottom:12px; }
        .featured-section .product-price { display:flex; flex-direction:column; gap:2px; color:#102C2C; font-size:15px; font-weight:800; }
        .product-price small { color:#91A09D; font-size:8px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
        .featured-section .product-cart-btn { width:39px; height:39px; border-width:1px; background:#F6F9F8; }

        @media (max-width: 680px) {
          .featured-section .store-heading { align-items: stretch; }
          .featured-section .store-heading .view-all-link { align-self: flex-start; }
          .featured-heading-copy p { max-width: 340px; line-height: 1.55; }
        }

        @media (max-width: 480px) {
          .featured-section .product-body { padding: 12px; }
          .featured-section .product-body h3 { font-size: 14px; margin-bottom: 10px; }
          .featured-section .product-price { font-size: 13px; }
          .featured-section .product-cart-btn { width: 34px; height: 34px; }
          .product-badge { top: 8px; left: 8px; padding: 5px 7px; font-size: 7px; }
          .featured-section .wish-btn { top: 8px; right: 8px; width: 31px; height: 31px; }
          .product-quick-view { display: none; }
        }

        .service-strip { display: none; }

        .store-banner {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 6;
          overflow: visible;
          background: #D1DFDE;
          contain: layout size;
        }

        .store-banner-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            #D1DFDE 25%,
            #e8f0ef 50%,
            #D1DFDE 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
        }

        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .store-banner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          opacity: 0;
          filter: none;
          animation: none;
          transform: none;
          transition: opacity 700ms ease;
          display: block;
        }

        .store-banner img.active {
          opacity: 1;
        }

        .store-dots {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }

        .store-dots button {
          width: 8px;
          height: 8px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,0.60);
          cursor: pointer;
          transition: width 200ms ease, background 200ms ease;
        }


        .hero-news-popover {
          position: absolute;
          top: clamp(18px, 2.4vw, 34px);
          right: clamp(18px, 3vw, 52px);
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .hero-news-trigger {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 18px;
          border: 1px solid rgba(7,59,63,0.24);
          border-radius: 999px;
          background: #064D4D;
          color: #fff;
          box-shadow: 0 14px 34px rgba(7,59,63,0.22);
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .hero-news-trigger:hover,
        .hero-news-popover.open .hero-news-trigger {
          transform: translateY(-1px);
          background: #073B3F;
          box-shadow: 0 18px 42px rgba(7,59,63,0.28);
        }

        .hero-news-trigger-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #24E985;
          box-shadow: 0 0 0 6px rgba(36,233,133,0.14);
        }

        .hero-news-card {
          width: clamp(300px, 23vw, 360px);
          max-height: min(520px, calc(100vh - 220px));
          overflow: auto;
          padding: 22px 24px 20px;
          border: 1px solid rgba(193, 134, 48, 0.72);
          border-radius: 18px;
          background: rgba(255, 251, 244, 0.96);
          color: #101817;
          box-shadow: 0 26px 70px rgba(7,59,63,0.20);
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          visibility: hidden;
          transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          backdrop-filter: blur(10px);
        }

        .hero-news-popover:hover .hero-news-card,
        .hero-news-popover:focus-within .hero-news-card,
        .hero-news-popover.open .hero-news-card {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          visibility: visible;
        }

        .hero-news-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
          color: #11201F;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .hero-news-card-top span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 27px;
          padding: 0 12px;
          border-radius: 6px;
          background: #064D4D;
          color: #fff;
        }

        .hero-news-card-top i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #24E985;
        }

        .hero-news-card h2 {
          margin: 0 0 8px;
          color: #101817;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(28px, 2vw, 36px);
          line-height: 1;
          text-transform: uppercase;
          font-weight: 700;
        }

        .hero-news-card p {
          margin: 0 0 15px;
          color: #344542;
          font-size: 14px;
          line-height: 1.35;
        }

        .hero-news-card-list {
          border-top: 1px solid rgba(193, 134, 48, 0.42);
        }

        .hero-news-card-item {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(193, 134, 48, 0.32);
        }

        .hero-news-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #064D4D;
          color: #F4C86B;
          font-size: 13px;
          font-weight: 900;
        }

        .hero-news-card-item strong {
          display: block;
          color: #121A19;
          font-size: 14px;
          line-height: 1.18;
          font-weight: 900;
        }

        .hero-news-card-item em {
          display: block;
          margin-top: 6px;
          color: #63716F;
          font-style: normal;
          font-size: 12px;
          font-weight: 800;
        }

        .hero-news-view-all {
          width: 100%;
          min-height: 48px;
          margin-top: 16px;
          border: 0;
          border-radius: 999px;
          background: #064D4D;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(7,59,63,0.16);
        }

        .hero-news-view-all span {
          margin-left: 6px;
        }
        .store-dots button.active {
          width: 28px;
          background: #fff;
        }

        .newsletter {
          display: grid;
          grid-template-columns: auto 1fr minmax(0, auto);
          gap: clamp(14px, 2.5vw, 40px);
          align-items: center;
          border-radius: clamp(12px, 2vw, 20px);
          padding: clamp(22px, 3vw, 40px) clamp(22px, 4vw, 52px);
          background: #D1E8E4;
          border: none;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          width: 100%;
        }

        .newsletter-icon-wrap {
          width: clamp(52px, 5vw, 68px);
          height: clamp(52px, 5vw, 68px);
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(7,59,63,0.12);
        }

        .newsletter h2 {
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.4rem, 2.4vw, 2.2rem);
          font-weight: 600;
          margin: 0 0 6px;
        }

        .newsletter p {
          margin: 0;
          color: #2d5a5e;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(12px, 1.1vw, 14px);
          font-weight: 400;
          line-height: 1.5;
        }

        .newsletter-form {
          display: flex;
          gap: 0;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(7,59,63,0.15);
          width: clamp(260px, 30vw, 440px);
          flex-shrink: 1;
          min-width: 0;
        }

        .newsletter-form input {
          flex: 1;
          border: 0;
          background: transparent;
          outline: none;
          padding: 0 18px;
          color: #111817;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          min-height: 48px;
        }

        .newsletter-form input::placeholder {
          color: #9bb5b2;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .newsletter-form button {
          border: 0;
          border-radius: 0;
          background: #073B3F;
          color: #fff;
          min-height: 48px;
          padding: 0 clamp(16px, 2vw, 28px);
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.06em;
          cursor: pointer;
          white-space: nowrap;
          transition: background 160ms ease;
        }

        .newsletter-form button:hover { background: #0C4044; }

        .announcement-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-top: 16px;
        }

        .announcement {
          border-radius: 18px;
          background: #fff;
          border: 1px solid #D1DFDE;
          padding: 18px;
          box-shadow: 0 10px 28px rgba(7,59,63,0.06);
        }

        .announcement strong {
          color: #073B3F;
        }

        .announcement p {
          margin-top: 8px;
          color: #7A8987;
          font-size: 14px;
          line-height: 1.55;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Responsive ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */

        @media (prefers-reduced-motion: reduce) {
          .store-cat,
          .store-cat::before,
          .store-cat::after,
          .store-cat img,
          .store-cat-arrow {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (min-width: 1440px) {
          .store-category-card { --cat-img-size: clamp(128px, 7vw, 150px); }
          .store-promo { min-height: 300px; }
          .store-promo-content h3 { font-size: 26px; }
          .product-grid { grid-template-columns: repeat(5, 1fr); gap: 18px; }
        }

        @media (max-width: 1280px) {
          .store-shell { width: calc(100% - 40px); }
          .product-grid { grid-template-columns: repeat(5, 1fr); }
        }

        @media (max-width: 1100px) {
          .store-shell { width: calc(100% - 36px); }
          .product-grid { grid-template-columns: repeat(4, 1fr); }
          .store-promo-grid {
            display: flex;
            gap: 16px;
          }

          .store-promo { min-height: 200px; }
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .store-category-card { --cat-img-size: clamp(88px, 11vw, 104px); --cat-basis: calc((100% - 60px) / 6); padding-inline: 50px; }
          .store-banner { aspect-ratio: 16 / 6.5; }
          .hero-news-popover { top: 14px; right: 18px; }
          .hero-news-card { width: min(340px, calc(100vw - 36px)); }
        }

        @media (max-width: 768px) {
          .store-shell { width: calc(100% - 28px); }
          .store-banner { aspect-ratio: 16 / 7; }
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .newsletter {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .newsletter-icon-wrap { margin: 0 auto; }
          .newsletter-form { width: 100%; }
          .announcement-row { grid-template-columns: 1fr; }
        }

        @media (max-width: 680px) {
          .store-shell { width: calc(100% - 24px); }
          .store-banner { aspect-ratio: 16 / 8; }
          .store-category-card { --cat-img-size: clamp(68px, 16vw, 82px); --cat-basis: calc((100% - 30px) / 4); padding: 14px 42px; }
          .store-cat span { font-size: 11px; }
          .store-promo-grid { display: flex; gap: 16px; }
          .store-promo {
            min-height: 190px;
            flex: 0 0 min(80vw, 300px);
          }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .newsletter { padding: 20px 16px; grid-template-columns: 1fr; text-align: center; }
          .newsletter-icon-wrap { margin: 0 auto; }
          .newsletter-form { width: 100%; }
          .store-heading { flex-direction: column; align-items: flex-start; }
          .store-section { padding: 18px 0; }
          .store-heading h2 { font-size: 1.4rem; }
          .announcement-row { grid-template-columns: 1fr; }
          .hero-news-popover { top: 10px; right: 10px; align-items: flex-end; }
          .hero-news-trigger { min-height: 36px; padding: 0 13px; font-size: 12px; }
          .hero-news-card { width: calc(100vw - 24px); max-height: min(440px, 78vh); padding: 16px; border-radius: 14px; }
          .hero-news-card h2 { font-size: 26px; }
          .hero-news-card p { font-size: 13px; }
          .hero-news-card-item { grid-template-columns: 44px 1fr; gap: 11px; padding: 11px 0; }
          .hero-news-card-icon { width: 44px; height: 44px; font-size: 11px; }
          .hero-news-card-item strong { font-size: 13px; }
          .hero-news-view-all { min-height: 42px; font-size: 13px; }
        }

        @media (max-width: 480px) {
          .store-shell { width: calc(100% - 16px); }
          .store-category-card { --cat-img-size: clamp(58px, 18vw, 72px); --cat-basis: calc((100% - 18px) / 3); padding: 12px 36px; }
          .store-cat span { font-size: 10px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .product-body { padding: 9px 10px 10px; }
          .store-promo-content h3 { font-size: 17px; }
          .store-heading h2 { font-size: 1.2rem; }
          .store-promo { flex: 0 0 min(88vw, 280px); }
          .newsletter h2 { font-size: 1.2rem; }
        }

        .promo-carousel-section {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          padding: clamp(30px, 3.4vw, 54px) 0 clamp(28px, 3vw, 44px);
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(253,253,252,1), rgba(243,243,240,0.72) 18%, rgba(243,232,222,0.34) 50%, rgba(243,243,240,0.72) 82%, rgba(253,253,252,1));
          border-top: 1px solid rgba(189,207,206,0.55);
          border-bottom: 1px solid rgba(189,207,206,0.55);
        }

        .promo-carousel-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: clamp(18px, 2.2vw, 30px);
          padding: 0 clamp(24px, 8.8vw, 176px);
          box-sizing: border-box;
        }

        .promo-carousel-head h2 {
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(26px, 2vw, 34px);
          font-weight: 600;
          line-height: 1;
          margin: 4px 0 0;
        }

        .promo-carousel-controls {
          display: none;
        }

        .promo-carousel-viewport {
          position: relative;
          overflow-x: auto;
          scrollbar-width: none;
          width: 100%;
          overscroll-behavior-inline: contain;
          -webkit-overflow-scrolling: touch;
        }

        .promo-carousel-viewport::-webkit-scrollbar {
          display: none;
        }

        .coin-story-track {
          --promo-gap: clamp(18px, 3.8vw, 84px);
          display: flex;
          align-items: flex-start;
          gap: var(--promo-gap);
          width: max-content;
          padding: 8px clamp(24px, 8.8vw, 176px) 20px;
        }

        .coin-story-card {
          --shine-core: rgba(255,255,255,1);
          --shine-mid: rgba(255,235,166,0.9);
          --shine-edge: rgba(229,160,24,0.78);
          --shine-soft: rgba(187,137,88,0.1);
          --shine-glow-strong: rgba(229,160,24,0.82);
          --shine-glow-mid: rgba(255,235,166,0.58);
          --shine-glow-soft: rgba(204,168,129,0.26);
          flex: 0 0 auto;
          width: clamp(136px, 13vw, 214px);
          border: 0;
          background: transparent;
          color: #111817;
          cursor: pointer;
          text-align: center;
          padding: 0;
          animation: coin-wave-float 7.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }

        .coin-story-card.coin-metal-silver {
          --shine-core: rgba(255,255,255,1);
          --shine-mid: rgba(235,244,246,0.95);
          --shine-edge: rgba(189,207,206,0.88);
          --shine-soft: rgba(122,137,135,0.14);
          --shine-glow-strong: rgba(235,244,246,0.9);
          --shine-glow-mid: rgba(209,223,222,0.68);
          --shine-glow-soft: rgba(122,137,135,0.3);
        }

        .coin-story-card:nth-child(2n) {
          animation-delay: -0.9s;
        }

        .coin-story-card:nth-child(3n) {
          animation-delay: -1.8s;
        }

        .coin-story-card:nth-child(4n) {
          animation-delay: -2.7s;
        }

        .coin-story-card:nth-child(5n) {
          animation-delay: -3.6s;
        }

        .coin-story-card:nth-child(6n) {
          animation-delay: -4.5s;
        }

        @keyframes coin-wave-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          20% { transform: translate3d(3px, -10px, 0) rotate(-0.7deg); }
          42% { transform: translate3d(0, -16px, 0) rotate(0.4deg); }
          64% { transform: translate3d(-3px, -8px, 0) rotate(0.7deg); }
          82% { transform: translate3d(0, 3px, 0) rotate(-0.25deg); }
        }

        .coin-story-image {
          position: relative;
          width: clamp(124px, 11.8vw, 194px);
          aspect-ratio: 1;
          margin: 10px auto 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 50% 48%, rgba(255,255,255,0.08) 0 10%, transparent 38%),
            radial-gradient(circle at 50% 50%, #0b0b0a 0 58%, #000 72%, #000 100%);
          box-shadow:
            0 20px 34px rgba(12,64,68,0.13),
            inset 0 0 26px rgba(204,168,129,0.13);
          overflow: hidden;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .coin-story-image::before {
          content: "";
          position: absolute;
          width: 190%;
          height: 16px;
          left: -145%;
          top: 18%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, var(--shine-core) 0 2px, var(--shine-mid) 3px, transparent 9px),
            linear-gradient(90deg, transparent 0%, var(--shine-soft) 20%, var(--shine-mid) 44%, var(--shine-core) 50%, var(--shine-edge) 56%, var(--shine-soft) 80%, transparent 100%);
          box-shadow:
            0 0 12px var(--shine-glow-strong),
            0 0 28px var(--shine-glow-mid),
            0 0 46px var(--shine-glow-soft);
          opacity: 0;
          z-index: 6;
          pointer-events: none;
          transform: rotate(43deg) translate3d(0, 0, 0);
          transform-origin: center;
          animation: coin-sun-streak 5.4s ease-in-out infinite;
        }

        @keyframes coin-sun-streak {
          0%, 58%, 100% {
            left: -150%;
            top: 20%;
            opacity: 0;
          }
          64% {
            opacity: 0.95;
          }
          72% {
            left: 70%;
            top: 66%;
            opacity: 1;
          }
          78% {
            left: 118%;
            top: 82%;
            opacity: 0;
          }
        }

        .coin-story-image img {
          width: var(--coin-img-size, 92%);
          height: var(--coin-img-size, 92%);
          object-fit: contain;
          object-position: center;
          border-radius: 50%;
          display: block;
          position: relative;
          z-index: 4;
          transform: translateY(calc(var(--coin-offset-y, 18px) + 15px)) scale(1);
          filter:
            drop-shadow(0 10px 12px rgba(0,0,0,0.28))
            drop-shadow(0 0 8px rgba(204,168,129,0.22));
          transition: transform 220ms ease, filter 220ms ease;
        }

        .coin-story-card.coin-size-100 {
          --coin-img-size: 44%;
          --coin-offset-y: 40px;
        }

        .coin-story-card.coin-size-150 {
          --coin-img-size: 54%;
          --coin-offset-y: 34px;
        }

        .coin-story-card.coin-size-200 {
          --coin-img-size: 66%;
          --coin-offset-y: 26px;
        }

        .coin-story-card.coin-size-250 {
          --coin-img-size: 76%;
          --coin-offset-y: 18px;
        }

        .coin-story-card.coin-size-500 {
          --coin-img-size: 92%;
          --coin-offset-y: 8px;
        }

        .coin-story-card:hover .coin-story-image {
          transform: translateY(-6px) scale(1.03);
          box-shadow:
            0 26px 46px rgba(12,64,68,0.18),
            0 0 0 1px rgba(204,168,129,0.22),
            0 0 34px rgba(229,160,24,0.28),
            inset 0 0 34px rgba(204,168,129,0.2);
        }

        .coin-story-card:hover .coin-story-image img {
          transform: translateY(calc(var(--coin-offset-y, 18px) + 15px)) scale(1.06);
          filter:
            drop-shadow(0 12px 16px rgba(0,0,0,0.34))
            drop-shadow(0 0 16px rgba(229,160,24,0.42));
        }

        .coin-story-card span {
          display: block;
          color: #000;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(13px, 0.94vw, 16px);
          font-weight: 800;
          letter-spacing: 0.04em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        @media (max-width: 680px) {
          .promo-carousel-section { padding: 30px 0 24px; }
          .promo-carousel-head { margin-bottom: 18px; }
          .promo-carousel-head { padding-inline: 22px; }
          .coin-story-track {
            --promo-gap: clamp(18px, 5vw, 28px);
            padding-inline: 22px;
            padding-bottom: 12px;
          }
          .coin-story-card { width: clamp(118px, 35vw, 146px); }
          .coin-story-image { width: clamp(108px, 32vw, 132px); margin-bottom: 12px; }
          .coin-story-card.coin-size-100 { --coin-img-size: 44%; --coin-offset-y: 28px; }
          .coin-story-card.coin-size-150 { --coin-img-size: 54%; --coin-offset-y: 24px; }
          .coin-story-card.coin-size-200 { --coin-img-size: 66%; --coin-offset-y: 18px; }
          .coin-story-card.coin-size-250 { --coin-img-size: 76%; --coin-offset-y: 13px; }
          .coin-story-card.coin-size-500 { --coin-img-size: 92%; --coin-offset-y: 6px; }
          .coin-story-card span { font-size: 11px; letter-spacing: 0.03em; }
        }

        @media (min-width: 681px) and (max-width: 1024px) {
          .coin-story-track {
            --promo-gap: clamp(28px, 4vw, 52px);
            padding-inline: 46px;
          }
          .promo-carousel-head { padding-inline: 46px; }
          .coin-story-card { width: clamp(146px, 17vw, 176px); }
          .coin-story-image { width: clamp(134px, 15.8vw, 164px); }
        }

        @media (min-width: 1440px) {
          .coin-story-track {
            --promo-gap: clamp(58px, 5vw, 104px);
            padding-inline: clamp(96px, 8vw, 180px);
          }
          .promo-carousel-head { padding-inline: clamp(96px, 8vw, 180px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .coin-story-card {
            animation: none;
          }
        }
      `}</style>
      <HomeBannerSlider />
      <div
        className="store-category-card"
        onMouseEnter={() => {
          catAutoPausedRef.current = true;
        }}
        onMouseLeave={() => {
          catAutoPausedRef.current = false;
        }}
        onFocus={() => {
          catAutoPausedRef.current = true;
        }}
        onBlur={() => {
          catAutoPausedRef.current = false;
        }}
      >
        <button
          className="store-cat-arrow prev"
          type="button"
          onClick={() => moveCategoryRail(-1)}
        >
          {"<"}
        </button>
        <div className="store-cat-track" ref={catTrackRef}>
          {autoCategoryRail.map((item, index) => {
            const isDuplicate =
              index < categoryRail.length || index >= categoryRail.length * 2;
            return (
              <button
                className="store-cat"
                type="button"
                key={`${item.label}-${index}`}
                tabIndex={isDuplicate ? -1 : 0}
                aria-hidden={isDuplicate ? "true" : undefined}
                onClick={() => navigate(item.route)}
              >
                <img src={item.image} alt={isDuplicate ? "" : item.label} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <button
          className="store-cat-arrow next"
          type="button"
          onClick={() => moveCategoryRail(1)}
        >
          {">"}
        </button>
      </div>

      <div className="store-shell">
        <section className="store-section promo-carousel-section">
          <div className="promo-carousel-head">
            <div>
              <span className="store-kicker">Curated Collections</span>
              <h2>Shop Coins by Moment</h2>
            </div>
          </div>
          <div
            className="promo-carousel-viewport"
            ref={promoTrackRef}
            onMouseEnter={() => {
              promoAutoPausedRef.current = true;
            }}
            onMouseLeave={() => {
              promoAutoPausedRef.current = false;
            }}
            onFocus={() => {
              promoAutoPausedRef.current = true;
            }}
            onBlur={() => {
              promoAutoPausedRef.current = false;
            }}
          >
            <div className="coin-story-track">
              {autoPromoCards.map((card, index) => (
                <button
                  className={`coin-story-card ${coinSizeClass(card.route)} ${coinMetalClass(card)}`}
                  type="button"
                  key={`${card.title}-${index}`}
                  onClick={() => navigate(card.route)}
                >
                  <span className="coin-story-image">
                    <img src={card.image} alt="" />
                  </span>
                  <span>{card.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="store-section featured-section">
          <div className="store-heading">
            <div className="featured-heading-copy">
              <span className="featured-kicker"><i /> THE LUXIVA EDIT</span>
              <h2>Featured Jewellery</h2>
              <p>Exceptional pieces, selected for their beauty and craftsmanship.</p>
            </div>
            <button
              className="view-all-link"
              type="button"
              onClick={() => navigate("/collection/all")}
            >
              <span>Explore the collection</span>
              <i>↗</i>
            </button>
          </div>

          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishIds={wishIds}
                onWishlist={toggleWishlist}
                onOpen={openProduct}
              />
            ))}
          </div>
        </section>

        <section className="store-section">
          <div className="newsletter">
            <div className="newsletter-icon-wrap">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#073B3F"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <h2>Join The Luxiva Circle</h2>
              <p>
                Be the first to know about new collections, exclusive offers
                &amp; more.
              </p>
            </div>
            <form
              className="newsletter-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <input placeholder="Enter your email address" />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>
        </section>
      </div>

      <CustomerFooter />
    </div>
  );
}



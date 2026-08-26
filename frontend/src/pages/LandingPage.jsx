import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import CustomerFooter from '../collection/CustomerFooter'

const heroImages = [
  '/diamond_woman.jpg',
  '/gold_Woman.jpg',
  '/black_necklaces.png',
]

const collections = [
  {
    title: 'Gold Jewellery',
    caption: 'Daily wear, wedding sets, coins',
    image: '/gold-women.png',
    route: '/collection/all?metal=gold',
    accent: '#b98219',
  },
  {
    title: 'Diamond Edit',
    caption: 'Rings, earrings, necklaces',
    image: '/diamond_woman.jpg',
    route: '/collection/all?metal=diamond',
    accent: '#617a8f',
  },
  {
    title: 'Platinum Pieces',
    caption: 'Modern minimal premium wear',
    image: '/platinum_ring.jpg',
    route: '/collection/all?metal=platinum',
    accent: '#788392',
  },
  {
    title: 'Silver Coins',
    caption: 'Trusted purity, simple checkout',
    image: '/silver-coin.jpg.jpeg',
    route: '/silver-coins',
    accent: '#8c929b',
  },
]

const quickLinks = [
  { label: 'Rings', route: '/collection/rings', image: '/diamond_ring.jpg' },
  { label: 'Necklaces', route: '/collection/necklaces', image: '/diamond_necklas.jpg' },
  { label: 'Bangles', route: '/collection/bangles', image: '/wedding_bangesh.jpg' },
  { label: 'Chains', route: '/collection/chains', image: '/wedding_chain.jpg' },
  { label: 'Earrings', route: '/collection/earrings', image: '/diamond Earings.jpg' },
  { label: 'Coins', route: '/collection/coins', image: '/gold-coin.jpg.jpeg' },
]

const stats = [
  ['Live Rates', 'Gold, silver, diamond and platinum pricing from your backend'],
  ['Smart Cart', 'Wishlist, cart, product detail and checkout routes already connected'],
  ['Role Login', 'Customer, promotor, dealer, admin and super admin dashboards'],
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeHero, setActiveHero] = useState(0)
  const [ratesOpen, setRatesOpen] = useState(false)

  const rateItems = [
    { label: 'Gold 24K', value: 'Rs. 15000/-', color: '#d4af37' },
    { label: 'Silver', value: 'Rs. 245/-', color: '#6b7280' },
    { label: 'Diamond 18K', value: 'Rs. 10997/-', color: '#3b82f6' },
    { label: 'Diamond 22K', value: 'Rs. 13430/-', color: '#60a5fa' },
    { label: 'Platinum', value: 'Rs. 5400/-', color: '#9ca3af' },
  ]

  return (
    <main className="bb-page" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes landingNavDrop {
          from { opacity: 0; transform: translateY(-18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes landingFadeLift {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes landingScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(18px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes landingShimmer {
          from { transform: translateX(-130%) skewX(-18deg); }
          to { transform: translateX(130%) skewX(-18deg); }
        }

        @keyframes landingSoftPulse {
          0%, 100% { box-shadow: 0 14px 35px rgba(180, 120, 20, 0.18); }
          50% { box-shadow: 0 18px 44px rgba(180, 120, 20, 0.32); }
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(251, 247, 241, 0.86);
          border-bottom: 1px solid rgba(234, 223, 211, 0.82);
          backdrop-filter: blur(18px);
          animation: landingNavDrop 520ms ease both;
        }

        .landing-hero {
          min-height: calc(100vh - 78px);
          display: grid;
          grid-template-columns: minmax(0, 0.96fr) minmax(360px, 1.04fr);
          gap: 48px;
          align-items: center;
          padding: 46px 0 58px;
        }

        .rate-dropdown {
          position: relative;
        }

        .rate-button {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          background: linear-gradient(90deg, #d6a84d, #b47c13);
          color: #fff;
          font-weight: 700;
          font-size: 0.94rem;
          cursor: pointer;
          box-shadow: 0 14px 35px rgba(180, 120, 20, 0.18);
          animation: landingSoftPulse 3.4s ease-in-out infinite;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .rate-button::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 42%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent);
          transform: translateX(-130%) skewX(-18deg);
        }

        .rate-button:hover {
          transform: translateY(-2px);
        }

        .rate-button:hover::after {
          animation: landingShimmer 760ms ease;
        }

        .rate-dropdown-panel {
          position: absolute;
          top: calc(100% + 14px);
          right: 0;
          width: 280px;
          border-radius: 24px;
          padding: 14px 0;
          background: #fff;
          border: 1px solid rgba(31, 23, 18, 0.09);
          box-shadow: 0 24px 48px rgba(31, 23, 18, 0.12);
          z-index: 40;
          transform-origin: top right;
          animation: landingScaleIn 180ms ease both;
        }

        .rate-dropdown-panel::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 22px;
          width: 16px;
          height: 16px;
          background: #fff;
          transform: rotate(45deg);
          border-left: 1px solid rgba(31, 23, 18, 0.09);
          border-top: 1px solid rgba(31, 23, 18, 0.09);
        }

        .rate-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 18px;
          min-height: 52px;
          border-bottom: 1px solid rgba(31, 23, 18, 0.06);
          background: transparent;
          cursor: default;
          transition: background 150ms ease;
        }

        .rate-item:last-child {
          border-bottom: none;
        }

        .rate-item:hover {
          background: rgba(246, 233, 206, 0.7);
        }

        .rate-item-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #312e2b;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .rate-item-value {
          color: #8b5e34;
          font-weight: 800;
          font-size: 0.95rem;
        }

        .landing-title {
          margin-top: 18px;
          max-width: 680px;
          font-size: clamp(3.1rem, 8vw, 6.9rem);
          line-height: 0.92;
          font-weight: 700;
          color: var(--bb-ink);
          animation: landingFadeLift 700ms 80ms ease both;
        }

        .landing-copy {
          margin-top: 24px;
          max-width: 560px;
          color: var(--bb-muted);
          font-size: 1.06rem;
          line-height: 1.8;
          animation: landingFadeLift 700ms 160ms ease both;
        }

        .landing-actions {
          animation: landingFadeLift 700ms 240ms ease both;
        }

        .hero-stage {
          position: relative;
          min-height: 620px;
          border-radius: 36px;
          overflow: hidden;
          background: #e9d6bf;
          box-shadow: var(--bb-shadow-lg);
          isolation: isolate;
          animation: landingScaleIn 760ms 180ms ease both;
          transition: transform 380ms ease, box-shadow 380ms ease;
        }

        .hero-stage:hover {
          transform: translateY(-6px);
          box-shadow: 0 40px 100px rgba(7, 59, 63, 0.22);
        }

        .hero-stage img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 500ms ease;
        }

        .hero-stage img.active {
          opacity: 1;
          animation: bbImageDrift 9s ease-in-out infinite;
        }

        .hero-stage::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(31, 23, 18, 0.02) 0%, rgba(31, 23, 18, 0.54) 100%);
          z-index: 1;
        }

        .hero-product-strip {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .hero-thumb {
          height: 82px;
          border: 1px solid rgba(255,255,255,0.38);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          background: rgba(255,255,255,0.18);
          box-shadow: 0 10px 26px rgba(0,0,0,0.18);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .hero-thumb:hover,
        .hero-thumb.active {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.88);
          box-shadow: 0 16px 32px rgba(0,0,0,0.26);
        }

        .hero-thumb img {
          position: static;
          opacity: 1;
          animation: none;
          object-fit: cover;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .trust-item {
          border-radius: 22px;
          padding: 18px;
          animation: bbFadeUp 520ms ease both;
        }

        .trust-item strong {
          display: block;
          margin-bottom: 7px;
          color: var(--bb-ink);
          font-size: 0.92rem;
        }

        .trust-item span {
          color: var(--bb-muted);
          font-size: 0.82rem;
          line-height: 1.5;
        }

        .section-shell {
          padding: 34px 0 74px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
          animation: landingFadeLift 620ms ease both;
        }

        .section-heading h2 {
          font-size: clamp(2rem, 4vw, 3.4rem);
          line-height: 1;
          color: var(--bb-ink);
        }

        .collection-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .collection-card {
          position: relative;
          min-height: 360px;
          border-radius: 26px;
          overflow: hidden;
          cursor: pointer;
          background: var(--bb-surface);
          box-shadow: var(--bb-shadow-sm);
          animation: landingFadeLift 620ms ease both;
          transform: translateZ(0);
          transition: transform 260ms cubic-bezier(.2,.8,.2,1), box-shadow 260ms ease;
        }

        .collection-card::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 2;
          width: 48%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent);
          transform: translateX(-140%) skewX(-18deg);
          pointer-events: none;
        }

        .collection-card:hover {
          transform: translateY(-10px) scale(1.015);
          box-shadow: 0 28px 70px rgba(7, 59, 63, 0.18);
        }

        .collection-card:hover::before {
          animation: landingShimmer 900ms ease;
        }

        .collection-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
          transition: transform 520ms ease;
        }

        .collection-card:hover img {
          transform: scale(1.06);
        }

        .collection-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(31,23,18,0.02) 25%, rgba(31,23,18,0.74) 100%);
        }

        .collection-card-content {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          z-index: 1;
          color: #fff;
          transition: transform 260ms ease;
        }

        .collection-card:hover .collection-card-content {
          transform: translateY(-6px);
        }

        .collection-card-content small {
          display: inline-flex;
          margin-bottom: 10px;
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.88);
          font-weight: 800;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-top: 26px;
        }

        .quick-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          padding: 10px;
          cursor: pointer;
          animation: landingFadeLift 560ms ease both;
          transition: transform 200ms ease, border-color 180ms ease, box-shadow 200ms ease;
        }

        .quick-card:hover {
          transform: translateY(-6px);
          border-color: rgba(185, 130, 25, 0.42);
          box-shadow: var(--bb-shadow-md);
        }

        .quick-card img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 14px;
          background: var(--bb-surface-soft);
          transition: transform 360ms ease;
        }

        .quick-card:hover img {
          transform: scale(1.06);
        }

        .quick-card span {
          display: block;
          padding: 11px 4px 2px;
          color: var(--bb-ink);
          font-size: 0.88rem;
          font-weight: 800;
          text-align: center;
          transition: color 180ms ease;
        }

        .quick-card:hover span {
          color: var(--bb-gold-deep);
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-nav,
          .landing-title,
          .landing-copy,
          .landing-actions,
          .hero-stage,
          .trust-item,
          .section-heading,
          .collection-card,
          .quick-card,
          .rate-button,
          .hero-stage img.active {
            animation: none !important;
          }

          .hero-stage,
          .collection-card,
          .quick-card,
          .hero-thumb,
          .collection-card img,
          .quick-card img {
            transition: none !important;
          }
        }

        @media (max-width: 980px) {
          .landing-hero {
            grid-template-columns: 1fr;
            gap: 28px;
            padding-top: 34px;
          }

          .hero-stage {
            min-height: 520px;
          }

          .collection-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .quick-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .landing-nav-inner {
            height: auto !important;
            padding: 12px 0;
            gap: 10px;
            align-items: flex-start !important;
            flex-direction: column;
          }

          .landing-nav-actions {
            width: 100%;
            display: flex !important;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }

          .landing-nav-actions > div {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            width: 100%;
          }

          .rate-dropdown {
            flex: 1;
            min-width: 0;
          }

          .rate-button {
            width: 100%;
            font-size: 0.82rem;
            padding: 10px 14px;
            justify-content: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .landing-nav-actions .bb-btn {
            padding: 0 14px;
            flex: 1;
            min-width: 0;
          }

          .landing-title {
            font-size: clamp(2.8rem, 16vw, 4.2rem);
          }

          .hero-stage {
            min-height: 430px;
            border-radius: 26px;
          }

          .trust-grid,
          .collection-grid,
          .quick-grid {
            grid-template-columns: 1fr;
          }

          .hero-product-strip {
            grid-template-columns: repeat(3, 1fr);
            left: 12px;
            right: 12px;
            bottom: 12px;
          }
        }

        @media (max-width: 400px) {
          .rate-button {
            font-size: 0.75rem;
            padding: 8px 10px;
            gap: 6px;
          }

          .hero-stage {
            min-height: 340px;
          }
        }
      `}</style>

      <nav className="landing-nav">
        <div
          className="bb-container landing-nav-inner"
          style={{
            minHeight: 78,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              border: 0,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              color: 'var(--bb-ink)',
            }}
          >
            <img src={logo} alt="LUXIVA" style={{ width: 58, height: 58, objectFit: 'contain' }} />
            <span style={{ display: 'grid', textAlign: 'left', lineHeight: 1.1 }}>
              <strong style={{ fontSize: 17, letterSpacing: 0 }}>LUXIVA</strong>
              <small style={{ color: 'var(--bb-muted)', fontWeight: 700 }}>E-commerce</small>
            </span>
          </button>

          <div className="landing-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="rate-dropdown"
              onMouseEnter={() => setRatesOpen(true)}
              onMouseLeave={() => setRatesOpen(false)}
              onFocus={() => setRatesOpen(true)}
              onBlur={() => setRatesOpen(false)}
            >
              <button
                type="button"
                className="rate-button"
                aria-expanded={ratesOpen}
                aria-haspopup="true"
              >
                <span>Today's Gold Rate 22K — Rs. 13800/-</span>
                <span style={{ fontSize: 14, transform: ratesOpen ? 'rotate(270deg)' : 'rotate(90deg)', display: 'inline-block', transition: 'transform 150ms ease' }}>▾</span>
              </button>

              {ratesOpen && (
                <div className="rate-dropdown-panel">
                  {rateItems.map(item => (
                    <div key={item.label} className="rate-item">
                      <div className="rate-item-title" style={{ color: item.color }}>
                        {item.label}
                      </div>
                      <div className="rate-item-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="bb-btn bb-btn-secondary" type="button" onClick={() => navigate('/collection/all')}>
              Explore
            </button>
            <button className="bb-btn bb-btn-primary" type="button" onClick={() => navigate('/login')}>
              Login
            </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="bb-container landing-hero">
        <div>
          <div className="bb-kicker">Jewellery commerce with hierarchy intelligence</div>
          <h1 className="bb-display landing-title">A brighter way to shop fine jewellery.</h1>
          <p className="landing-copy">
            Discover gold, diamond, silver and platinum collections with live rate logic,
            wishlist, cart, order flow and role-based dashboards already connected to your backend.
          </p>

          <div className="landing-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 }}>
            <button className="bb-btn bb-btn-primary" type="button" onClick={() => navigate('/customer')}>
              Start Shopping
            </button>
            <button className="bb-btn bb-btn-secondary" type="button" onClick={() => navigate('/login')}>
              Staff Login
            </button>
          </div>

          <div className="trust-grid">
            {stats.map(([title, detail], index) => (
              <div className="bb-card trust-item" key={title} style={{ animationDelay: `${index * 80}ms` }}>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-stage" aria-label="Featured jewellery showcase">
          {heroImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt=""
              className={index === activeHero ? 'active' : ''}
              aria-hidden={index !== activeHero}
            />
          ))}

          <div
            style={{
              position: 'absolute',
              left: 24,
              top: 24,
              zIndex: 2,
              borderRadius: 999,
              padding: '10px 14px',
              color: '#fff',
              background: 'rgba(31, 23, 18, 0.42)',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(14px)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Live product discovery
          </div>

          <div className="hero-product-strip">
            {heroImages.map((image, index) => (
              <button
                type="button"
                className={`hero-thumb ${index === activeHero ? 'active' : ''}`}
                key={image}
                onClick={() => setActiveHero(index)}
                aria-label={`Show featured look ${index + 1}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="bb-container">
          <div className="section-heading">
            <div>
              <div className="bb-kicker">Shop by metal</div>
              <h2 className="bb-display">Collections that feel premium from the first click.</h2>
            </div>
            <button className="bb-btn bb-btn-secondary" type="button" onClick={() => navigate('/collection/all')}>
              View All
            </button>
          </div>

          <div className="collection-grid">
            {collections.map((item, index) => (
              <article
                className="collection-card"
                key={item.title}
                style={{ animationDelay: `${index * 90}ms` }}
                onClick={() => navigate(item.route)}
                onKeyDown={event => {
                  if (event.key === 'Enter') navigate(item.route)
                }}
                role="button"
                tabIndex={0}
              >
                <img src={item.image} alt={item.title} />
                <div className="collection-card-content">
                  <small style={{ color: '#fff', borderColor: `${item.accent}99` }}>Curated</small>
                  <h3 className="bb-display" style={{ color: '#fff', fontSize: 28, lineHeight: 1 }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.78)', marginTop: 8, fontWeight: 700 }}>
                    {item.caption}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="quick-grid">
            {quickLinks.map((item, index) => (
              <button
                className="bb-card quick-card"
                type="button"
                key={item.label}
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => navigate(item.route)}
              >
                <img src={item.image} alt={item.label} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <CustomerFooter />
    </main>
  )
}

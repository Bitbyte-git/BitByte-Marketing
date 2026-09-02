import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import CustomerNavbar from './CustomerNavbar'
import CustomerFooter from '../collection/CustomerFooter'



export default function EarringsCollection() {
  const navigate = useNavigate()
  
 


const bg = '#FDF5EE'
const text = '#020617'
const subtext = '#64748b'
const border = 'rgba(0,0,0,0.1)'
const cardBg = 'rgba(0,0,0,0.03)'



const collections = [
  {
    id: 'gold',
    title: 'Gold Earrings',
    subtitle: '5 Exclusive Designs',
    description: 'Premium gold earrings with bridal, festive, and everyday elegant designs.',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.35)',
    border: 'rgba(251,191,36,0.4)',
    bg: 'rgba(251,191,36,0.06)',
    img: '/img/gold/gold-earrings-2.png',
    tag: '22K & 24K',
    route: '/gold-earrings',
    icon: '🏅',
    shimmer: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.15), transparent)',
    iconBg: '251,191,36',
  },
  {
    id: 'silver',
    title: 'Silver Earrings',
    subtitle: '5 Exclusive Designs',
    description: 'Handcrafted silver earrings with modern, traditional, and premium styles.',
    color: '#c0c0c0',
    glow: 'rgba(192,192,192,0.25)',
    border: 'rgba(192,192,192,0.4)',
    bg: 'rgba(192,192,192,0.05)',
    img: '/img/silver/silver-Earrings-4.png',
    tag: 'Silver 999',
    route: '/silver-earrings',
    icon: '🥈',
    shimmer: 'linear-gradient(90deg, transparent, rgba(192,192,192,0.15), transparent)',
    iconBg: '192,192,192',
  },
  // {
  //   id: 'diamond',
  //   title: 'Diamond Earrings',
  //   subtitle: '5 Exclusive Designs',
  //   description: 'Stunning diamond earrings with brilliant cuts and luxury craftsmanship.',
  //   color: '#a5f3fc',
  //   glow: 'rgba(165,243,252,0.3)',
  //   border: 'rgba(165,243,252,0.4)',
  //   bg: 'rgba(165,243,252,0.05)',
  //   img: '/diamond Earings.jpg',
  //   tag: 'VVS & VS1',
  //   route: '/diamond-earrings',
  //   icon: '💎',
  //   shimmer: 'linear-gradient(90deg, transparent, rgba(165,243,252,0.15), transparent)',
  //   iconBg: '165,243,252',
  // },
  // {
  //   id: 'platinum',
  //   title: 'Platinum Earrings',
  //   subtitle: '5 Exclusive Designs',
  //   description: 'Rare platinum earrings with superior strength and timeless elegance.',
  //   color: '#e2e8f0',
  //   glow: 'rgba(226,232,240,0.25)',
  //   border: 'rgba(226,232,240,0.4)',
  //   bg: 'rgba(226,232,240,0.05)',
  //   img: '/platinam_Earrings.jpg',
  //   tag: 'Pt 950',
  //   route: '/platinum-earrings',
  //   icon: '⭐',
  //   shimmer: 'linear-gradient(90deg, transparent, rgba(226,232,240,0.15), transparent)',
  //   iconBg: '226,232,240',
  // },
]

return (
  <div style={{ minHeight: '100vh', background: bg, color: text, 
  fontFamily: '"Montserrat", sans-serif', 
  position: 'relative', overflow: 'hidden' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');
      @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      @keyframes pulse-ring { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }

      .earring-card { animation: fadeInUp 0.6s ease both; }
      .earring-card:nth-child(1) { animation-delay: 0.1s; }
      .earring-card:nth-child(2) { animation-delay: 0.2s; }
      .earring-card:nth-child(3) { animation-delay: 0.3s; }
      .earring-card:nth-child(4) { animation-delay: 0.4s; }

      .card-shimmer {
        position:absolute; top:0; left:-100%; width:60%; height:100%;
        background:var(--shimmer); transform:skewX(-15deg);
        animation:shimmer 2.5s ease infinite; opacity:0; transition:opacity 0.3s;
      }
      .earring-card-wrap:hover .card-shimmer { opacity:1; }
      .explore-btn { position:relative; overflow:hidden; }
      .explore-btn::after {
        content:''; position:absolute; inset:0;
        background:rgba(255,255,255,0.1);
        transform:translateX(-100%); transition:transform 0.3s ease;
      }
      .explore-btn:hover::after { transform:translateX(0); }
    `}</style>

    <CustomerNavbar />

      <div style={{ position: 'relative', zIndex: 10, padding: '60px 40px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'fadeInUp 0.5s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '30px', padding: '6px 20px', marginBottom: '20px' }}>
            <span className="sparkle-dot" style={{ fontSize: '12px' }}>✦</span>
            <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Our Collections</span>
            <span className="sparkle-dot" style={{ fontSize: '12px', animationDelay: '1s' }}>✦</span>
          </div>

          <h1 style={{ color: text, fontSize: '42px', fontWeight: 900, 
  margin: '0 0 12px', letterSpacing: '-1px',
  fontFamily: '"Playfair Display", Georgia, serif' }}>
            💎 <span style={{ background: 'linear-gradient(90deg,#a78bfa,#fbbf24,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Earrings Collections</span>
          </h1>

          <p style={{ color: subtext, fontSize: '15px', margin: 0, maxWidth: '520px', marginInline: 'auto', lineHeight: '1.6' }}>
            Explore handcrafted gold and silver earrings with premium finishing and elegant designs.
          </p>
        </div>

  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
  {collections.map((col) => (
    <div
      key={col.id}
      onClick={() => navigate(col.route)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.querySelector('img').style.transform = 'scale(1.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.querySelector('img').style.transform = 'scale(1)' }}
      style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease', marginBottom: '75px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {/* Image */}
      <div style={{ height: 280, background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
        <img
          src={col.img}
          alt={col.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onError={e => e.currentTarget.style.display = 'none'}
        />
        {col.tag && (
          <div style={{ position: 'absolute', top: 12, left: 0, background: '#2ecc71', color: '#fff', padding: '5px 12px 5px 10px', fontSize: 11, fontWeight: 700, clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)', zIndex: 2 }}>
            {col.tag}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 16, color: '#999', zIndex: 2 }}>🔗</div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 16, color: '#1a1a1a', fontWeight: 700, marginBottom: 4,
  fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
  {col.title}
</div>
        <div style={{ fontSize: 12, color: '#7c5c4a' }}>{col.subtitle}</div>
      </div>
    </div>
  ))}
</div>

        <div style={{ textAlign: 'center', marginTop: '60px', animation: 'fadeInUp 0.8s ease 0.4s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', color: subtext, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg,transparent,${subtext})` }} />
            Bharathi Jewellers • Premium Earrings
            <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg,${subtext},transparent)` }} />
          </div>
        </div>
      </div>

              {/* ── FOOTER ── */}
        <CustomerFooter />
    </div>
  )
}
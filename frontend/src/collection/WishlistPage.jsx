import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const METAL_LABELS = {
  gold: 'Gold',
  silver: 'Silver',
  diamond: 'Diamond',
  platinum: 'Platinum',
}

const CATEGORY_LABELS = {
  rings: 'Rings',
  bangles: 'Bangles',
  earrings: 'Earrings',
  chains: 'Chains',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
  pendants: 'Pendants',
  coins: 'Coins',
  mangalsutra: 'Mangalsutra',
}

function getImageUrl(src) {
  if (!src) return '/img/gold/gold-bangles-1.png'
  if (/^https?:\/\//i.test(src)) return src
  return `${API_BASE}${src.startsWith('/') ? '' : '/'}${src}`
}

function money(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount.toLocaleString('en-IN')
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist/')
      setItems(Array.isArray(res.data.items) ? res.data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWishlist() }, [])

  const grouped = useMemo(() => {
    const metals = new Set(items.map(item => item.product_metal).filter(Boolean))
    return {
      count: items.length,
      metals: Array.from(metals).map(m => METAL_LABELS[m] || m).join(' / ') || 'Jewellery',
    }
  }, [items])

  const removeFromWishlist = async (productId) => {
    try {
      setRemovingId(productId)
      await api.post('/wishlist/', { product_id: productId })
      setItems(prev => prev.filter(i => i.product_id !== productId))
      window.dispatchEvent(new Event('bb_wishlist_update'))
    } catch {
      setRemovingId(null)
    } finally {
      setRemovingId(null)
    }
  }

  const openProduct = item => {
    const params = new URLSearchParams()
    if (item.product_category) params.set('category', item.product_category)
    if (item.product_metal) params.set('metal', item.product_metal)
    if (item.product_id) params.set('id', item.product_id)
    navigate(`/product-display?${params.toString()}`)
  }

  return (
    <div className="wishlist-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800&display=swap');

        .wishlist-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 8%, rgba(209,223,222,0.72), transparent 28%),
            linear-gradient(135deg, #FDFDFC 0%, #F3E8DE 46%, #E7EDEC 100%);
          color: #111817;
          font-family: "Montserrat", system-ui, sans-serif;
        }

        .wishlist-shell {
          width: 100%;
          padding: clamp(30px, 4vw, 58px) clamp(16px, 4vw, 54px) 72px;
        }

        .wishlist-hero {
          width: 100%;
          border: 1px solid rgba(189,207,206,0.9);
          border-radius: 30px;
          background: rgba(253,253,252,0.82);
          box-shadow: 0 26px 80px rgba(12,64,68,0.1);
          padding: clamp(24px, 4vw, 44px);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
          backdrop-filter: blur(18px);
        }

        .wishlist-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          color: #9F6130;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2.8px;
          text-transform: uppercase;
        }

        .wishlist-kicker::before {
          content: "";
          width: 9px;
          height: 9px;
          border: 2px solid #BB8958;
          transform: rotate(45deg);
          background: #F3E8DE;
        }

        .wishlist-hero h1 {
          margin: 0;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(40px, 5vw, 72px);
          line-height: 0.96;
          letter-spacing: 0;
        }

        .wishlist-hero p {
          margin: 16px 0 0;
          color: #52625f;
          max-width: 640px;
          font-size: 15px;
          line-height: 1.8;
        }

        .wishlist-stat {
          min-width: 220px;
          border: 1px solid rgba(204,168,129,0.48);
          border-radius: 24px;
          background: linear-gradient(135deg, #F3E8DE, #E7EDEC);
          padding: 22px 24px;
          text-align: right;
        }

        .wishlist-stat strong {
          display: block;
          color: #073B3F;
          font-size: 40px;
          line-height: 1;
          font-family: "Playfair Display", Georgia, serif;
        }

        .wishlist-stat span {
          display: block;
          margin-top: 7px;
          color: #7A8987;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(22px, 2.2vw, 34px);
          width: 100%;
        }

        .wishlist-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(189,207,206,0.86);
          border-radius: 24px;
          background: rgba(253,253,252,0.94);
          box-shadow: 0 18px 44px rgba(12,64,68,0.08);
          cursor: pointer;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }

        .wishlist-card:hover {
          transform: translateY(-8px);
          border-color: rgba(187,137,88,0.55);
          box-shadow: 0 30px 70px rgba(12,64,68,0.16);
        }

        .wishlist-image {
          position: relative;
          aspect-ratio: 1.08 / 1;
          min-height: 320px;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 35%, rgba(255,255,255,0.9), rgba(243,232,222,0.48) 44%, rgba(231,237,236,0.82));
        }

        .wishlist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.01);
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
        }

        .wishlist-card:hover .wishlist-image img {
          transform: scale(1.08);
        }

        .wishlist-ribbon {
          position: absolute;
          top: 14px;
          left: 0;
          z-index: 2;
          background: #073B3F;
          color: #FDFDFC;
          padding: 7px 18px 7px 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%);
        }

        .wishlist-remove {
          position: absolute;
          top: 13px;
          right: 13px;
          z-index: 3;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(201,32,53,0.32);
          background: rgba(253,253,252,0.92);
          color: #C92035;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(17,24,23,0.12);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .wishlist-remove:hover {
          transform: scale(1.06);
          background: #fff1f3;
        }

        .wishlist-content {
          padding: 18px 18px 20px;
        }

        .wishlist-price {
          color: #111817;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0;
          margin-bottom: 9px;
        }

        .wishlist-name {
          margin: 0;
          color: #073B3F;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 25px;
          font-weight: 700;
          line-height: 1.08;
          min-height: 54px;
        }

        .wishlist-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(189,207,206,0.7);
          color: #7A8987;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .wishlist-view {
          color: #0C4044;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .wishlist-empty,
        .wishlist-loading {
          border: 1px solid rgba(189,207,206,0.85);
          border-radius: 30px;
          background: rgba(253,253,252,0.86);
          box-shadow: 0 24px 70px rgba(12,64,68,0.1);
          padding: 76px 24px;
          text-align: center;
        }

        .wishlist-empty h2,
        .wishlist-loading h2 {
          margin: 0 0 10px;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(32px, 4vw, 48px);
        }

        .wishlist-empty p,
        .wishlist-loading p {
          margin: 0 auto 24px;
          max-width: 500px;
          color: #52625f;
          line-height: 1.7;
        }

        .wishlist-btn {
          border: 0;
          border-radius: 999px;
          padding: 14px 26px;
          background: linear-gradient(135deg, #073B3F, #0C4044);
          color: #FDFDFC;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1.1px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 18px 36px rgba(12,64,68,0.2);
        }

        @media (max-width: 1180px) {
          .wishlist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 860px) {
          .wishlist-hero { align-items: flex-start; flex-direction: column; }
          .wishlist-stat { width: 100%; text-align: left; }
          .wishlist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 560px) {
          .wishlist-shell { padding: 22px 12px 52px; }
          .wishlist-grid { grid-template-columns: 1fr; }
          .wishlist-name { min-height: 0; }
        }
      `}</style>

      <main className="wishlist-shell">
        <section className="wishlist-hero">
          <div>
            <div className="wishlist-kicker">Saved Selection</div>
            <h1>My Wishlist</h1>
            <p>
              Your shortlisted jewellery, ready to compare, revisit and move into checkout when the choice feels right.
            </p>
          </div>
          <div className="wishlist-stat">
            <strong>{grouped.count}</strong>
            <span>{grouped.count === 1 ? 'Saved item' : 'Saved items'}</span>
            <span>{grouped.metals}</span>
          </div>
        </section>

        {loading ? (
          <section className="wishlist-loading">
            <h2>Preparing Your Selection</h2>
            <p>Loading the pieces you saved from the collection.</p>
          </section>
        ) : items.length === 0 ? (
          <section className="wishlist-empty">
            <h2>Your Wishlist Is Empty</h2>
            <p>Browse the collection and save the jewellery pieces you want to revisit before ordering.</p>
            <button className="wishlist-btn" type="button" onClick={() => navigate('/collection/all')}>
              Browse Collections
            </button>
          </section>
        ) : (
          <section className="wishlist-grid" aria-label="Wishlist products">
            {items.map(item => {
              const price = money(item.product_price)
              const metal = METAL_LABELS[item.product_metal] || item.product_metal || 'Jewellery'
              const category = CATEGORY_LABELS[item.product_category] || item.product_category || 'Collection'

              return (
                <article className="wishlist-card" key={item.id || item.product_id} onClick={() => openProduct(item)}>
                  <div className="wishlist-image">
                    <img
                      src={getImageUrl(item.product_image)}
                      alt={item.product_name || 'Saved jewellery'}
                      onError={e => { e.currentTarget.src = '/img/gold/gold-bangles-1.png' }}
                    />
                    <div className="wishlist-ribbon">{metal}</div>
                    <button
                      className="wishlist-remove"
                      type="button"
                      disabled={removingId === item.product_id}
                      onClick={e => {
                        e.stopPropagation()
                        removeFromWishlist(item.product_id)
                      }}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="#C92035" aria-hidden="true">
                        <path d="M12 21s-7.4-4.8-9.6-9.2C.7 8.4 2.8 4.5 6.5 4.2 8.7 4 10.4 5 12 6.8 13.6 5 15.3 4 17.5 4.2c3.7.3 5.8 4.2 4.1 7.6C19.4 16.2 12 21 12 21z" />
                      </svg>
                    </button>
                  </div>
                  <div className="wishlist-content">
                    <div className="wishlist-price">{price ? `₹${price}` : 'Contact for Price'}</div>
                    <h2 className="wishlist-name">{item.product_name || 'Jewellery Piece'}</h2>
                    <div className="wishlist-meta">
                      <span>{category}</span>
                      <span className="wishlist-view">View Details</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </main>

      <CustomerFooter />
    </div>
  )
}


import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo.png'
import { addToCartDB } from '../collection/card_section'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: Math.random() * 45 + 10,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: Math.random() * 12 + 15,
  opacity: Math.random() * 0.18 + 0.04,
}))

const CATEGORY_LABELS = {
  rings: 'Rings', bangles: 'Bangles', earrings: 'Earrings',
  chains: 'Chains', necklaces: 'Necklaces', bracelets: 'Bracelets',
  pendants: 'Pendants', coins: 'Coins', mangalsutra: 'Mangalsutra',
}

const METAL_LABELS = {
  gold: 'Gold', silver: 'Silver', diamond: 'Diamond', platinum: 'Platinum',
}

const PURITY_LABELS = {
  gold: { '22k': '91.6', '24k': '999' },
  silver: { '999': '999' },
  diamond: { '18k': '750', '22k': '916' },
  platinum: { '92': '920' },
}

const TAG_COLORS = {
  Bestseller: { bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.5)', color: '#34d399' },
  Bridal: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Premium: { bg: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.6)', color: '#fbbf24' },
  Statement: { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.5)', color: '#a78bfa' },
  Minimal: { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.5)', color: '#22d3ee' },
  Stackable: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', color: '#ffd700' },
  New: { bg: 'rgba(244,114,182,0.2)', border: 'rgba(244,114,182,0.5)', color: '#f472b6' },
  Antique: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', color: '#fbbf24' },
}

function MoreFromCollection({ currentProductId, category, metal, gender, occasion, liveRate }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])

  const calcLivePrice = p => {
    if (!liveRate) return parseFloat(p.price) || null
    const netWt = parseFloat(p.net_weight) || 0
    const makingChargePct = parseFloat(p.making_charge) || 0
    const discountPct = parseFloat(p.wastage_charge) || 0
    const stoneVal = parseFloat(p.stone_value) || 0
    let todayRate = 0
    if (p.metal === 'gold') todayRate = p.grade === '24k' ? liveRate.gold_24k : liveRate.gold_22k
    else if (p.metal === 'silver') todayRate = liveRate.silver_999
    else if (p.metal === 'diamond') todayRate = p.grade === '18k' ? liveRate.diamond_18k : liveRate.diamond_22k
    else if (p.metal === 'platinum') todayRate = liveRate.platinum_92
    if (!todayRate || !netWt) return parseFloat(p.price) || null
    const makingPerGram = todayRate * (makingChargePct / 100)
    const rateWithMaking = todayRate + makingPerGram
    const discountPerGram = rateWithMaking * (discountPct / 100)
    return Math.round(((netWt * (rateWithMaking - discountPerGram)) + stoneVal) * 1.03)
  }

  const calcOriginalPrice = p => {
    if (!liveRate) return parseFloat(p.original_price) || null
    const netWt = parseFloat(p.net_weight) || 0
    const makingChargePct = parseFloat(p.making_charge) || 0
    const stoneVal = parseFloat(p.stone_value) || 0
    let todayRate = 0
    if (p.metal === 'gold') todayRate = p.grade === '24k' ? liveRate.gold_24k : liveRate.gold_22k
    else if (p.metal === 'silver') todayRate = liveRate.silver_999
    else if (p.metal === 'diamond') todayRate = p.grade === '18k' ? liveRate.diamond_18k : liveRate.diamond_22k
    else if (p.metal === 'platinum') todayRate = liveRate.platinum_92
    if (!todayRate || !netWt) return parseFloat(p.original_price) || null
    const makingPerGram = todayRate * (makingChargePct / 100)
    return Math.round(((netWt * (todayRate + makingPerGram)) + stoneVal) * 1.03)
  }

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get(`/jewelry-products/?category=${category}&metal=${metal}`)
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : []
          setProducts(list.filter(p => String(p.id) !== String(currentProductId)).slice(0, 4))
        })
        .catch(() => {})
    })
  }, [category, metal, currentProductId])

  if (products.length === 0) return null

  const getImageUrl = img => {
    if (!img) return null
    const p = typeof img === 'object' ? (img.image || img.url || '') : img
    if (!p) return null
    if (p.startsWith('http://') || p.startsWith('https://')) return p
    return `https://bitbyte-backend-f66f.onrender.com/${p.replace(/^\/+/, '')}`
  }

  const collectionRoute = `/collection/all?category=${category}&metal=${metal}${gender && gender !== 'all' ? `&gender=${gender}` : ''}${occasion ? `&occasion=${occasion}` : ''}`

  return (
    <section className="more-collection-section">
      <style>{`
        .more-collection-section { position: relative; z-index: 5; width: 100%; padding: 70px clamp(18px,4vw,54px) 90px; background: radial-gradient(circle at 85% 12%, rgba(209,223,222,0.58), transparent 26%), linear-gradient(180deg,#FDFDFC 0%,#F3F3F0 100%); }
        .more-collection-inner { width: 100%; max-width: 1500px; margin: 0 auto; }
        .more-collection-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
        .more-kicker { display: inline-flex; align-items: center; gap: 10px; margin: 0 0 10px; color: #9F6130; font-size: 12px; font-weight: 900; letter-spacing: 2.8px; text-transform: uppercase; }
        .more-kicker::before { content: ""; width: 9px; height: 9px; border: 2px solid #BB8958; background: #F3E8DE; transform: rotate(45deg); }
        .more-collection-head h2 { margin: 0; color: #073B3F; font-family: "Playfair Display", Georgia, serif; font-size: clamp(34px,4vw,54px); line-height: 0.98; letter-spacing: 0; }
        .more-subcopy { margin: 12px 0 0; color: #52625f; font-size: 14px; line-height: 1.7; max-width: 560px; }
        .more-view-btn { border: 1px solid rgba(12,64,68,0.28); border-radius: 999px; background: #FDFDFC; color: #073B3F; padding: 14px 22px; font-size: 12px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; cursor: pointer; white-space: nowrap; box-shadow: 0 14px 30px rgba(12,64,68,0.08); transition: transform 0.22s ease, background 0.22s ease, color 0.22s ease; }
        .more-view-btn:hover { transform: translateY(-3px); background: #073B3F; color: #FDFDFC; }
        .more-products-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: clamp(22px,2.2vw,34px); }
        .more-product-card { position: relative; overflow: hidden; border: 1px solid rgba(189,207,206,0.86); border-radius: 24px; background: rgba(253,253,252,0.95); box-shadow: 0 18px 44px rgba(12,64,68,0.08); cursor: pointer; transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease; }
        .more-product-card:hover { transform: translateY(-8px); border-color: rgba(187,137,88,0.58); box-shadow: 0 30px 70px rgba(12,64,68,0.16); }
        .more-product-image { position: relative; aspect-ratio: 1.08 / 1; min-height: 320px; overflow: hidden; background: radial-gradient(circle at 50% 38%, rgba(255,255,255,0.92), rgba(243,232,222,0.44) 42%, rgba(231,237,236,0.82)); }
        .more-product-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.35s ease; }
        .more-product-card:hover .more-product-image img { transform: scale(1.08); filter: saturate(1.05); }
        .more-ribbon { position: absolute; top: 14px; left: 0; z-index: 2; background: #073B3F; color: #FDFDFC; padding: 7px 18px 7px 14px; font-size: 11px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; clip-path: polygon(0 0,90% 0,100% 50%,90% 100%,0 100%); }
        .more-hover-cta { position: absolute; left: 16px; right: 16px; bottom: 16px; transform: translateY(14px); opacity: 0; border-radius: 999px; background: rgba(253,253,252,0.94); color: #073B3F; border: 1px solid rgba(12,64,68,0.18); padding: 11px 14px; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-align: center; text-transform: uppercase; transition: transform 0.24s ease, opacity 0.24s ease; box-shadow: 0 16px 30px rgba(17,24,23,0.16); }
        .more-product-card:hover .more-hover-cta { transform: translateY(0); opacity: 1; }
        .more-product-body { padding: 18px 18px 20px; }
        .more-product-name { margin: 0; color: #073B3F; font-family: "Cormorant Garamond", Georgia, serif; font-size: 25px; font-weight: 700; line-height: 1.08; min-height: 54px; }
        .more-price-row { display: flex; align-items: flex-end; gap: 9px; margin-top: 16px; padding-top: 15px; border-top: 1px solid rgba(189,207,206,0.68); flex-wrap: wrap; }
        .more-price { color: #073B3F; font-size: 21px; font-weight: 900; }
        .more-old-price { color: #9F6130; font-size: 13px; font-weight: 700; text-decoration: line-through; opacity: 0.72; }
        .more-offer { margin-left: auto; border-radius: 999px; background: rgba(12,64,68,0.1); border: 1px solid rgba(12,64,68,0.15); color: #0C4044; padding: 6px 9px; font-size: 11px; font-weight: 900; white-space: nowrap; }
        @media (max-width: 1180px) { .more-products-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
        @media (max-width: 860px) { .more-collection-head { align-items: flex-start; flex-direction: column; } .more-products-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
        @media (max-width: 560px) { .more-collection-section { padding: 48px 12px 68px; } .more-products-grid { grid-template-columns: 1fr; } .more-product-name { min-height: 0; } }
      `}</style>
      <div className="more-collection-inner">
        <div className="more-collection-head">
          <div>
            <p className="more-kicker">You May Also Like</p>
            <h2>More from this Collection</h2>
            <p className="more-subcopy">Selected pieces from the same {CATEGORY_LABELS[category] || category} family, matched with the current metal and backend pricing logic.</p>
          </div>
          <button className="more-view-btn" type="button" onClick={() => navigate(collectionRoute)}>View All</button>
        </div>

        <div className="more-products-grid">
          {products.map(p => {
            const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
            const price = calcLivePrice(p) || 0
            const originalPrice = calcOriginalPrice(p) || 0
            const discountPct = parseFloat(p.wastage_charge) || 0
            const hasDiscount = discountPct > 0 && originalPrice > price && price > 0
            return (
              <article
                className="more-product-card"
                key={p.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  navigate(`/product-display?category=${p.category}&metal=${p.metal}&id=${p.id}`)
                }}
              >
                <div className="more-product-image">
                  <span className="more-ribbon">{p.metal?.toUpperCase()} {p.grade?.toUpperCase()}</span>
                  {firstImg ? <img src={firstImg} alt={p.name} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#073B3F', fontWeight: 900 }}>Team 369</div>}
                  <div className="more-hover-cta">View Details</div>
                </div>
                <div className="more-product-body">
                  <h3 className="more-product-name">{p.name}</h3>
                  <div className="more-price-row">
                    <span className="more-price">{price > 0 ? `Rs. ${price.toLocaleString('en-IN')}` : 'Contact'}</span>
                    {hasDiscount && <span className="more-old-price">Rs. {originalPrice.toLocaleString('en-IN')}</span>}
                    {hasDiscount && <span className="more-offer">{discountPct}% Off</span>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
function ProductInfoAndBreakup({ product, metal }) {
  const [liveRate, setLiveRate] = useState(null)

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/metal-rates/')
        .then(res => {
          const d = res.data
          setLiveRate({
            gold_22k: parseFloat(d.gold_22k) || 0,
            gold_24k: parseFloat(d.gold_24k) || 0,
            silver_999: parseFloat(d.silver_999) || 0,
            diamond_18k: parseFloat(d.diamond_18k) || 0,
            diamond_22k: parseFloat(d.diamond_22k) || 0,
            platinum_92: parseFloat(d.platinum_92) || 0,
          })
        })
        .catch(() => {})
    })
  }, [])

  if (!product) return null

  const purityLabel = PURITY_LABELS[metal]?.[product.grade] || product.grade?.toUpperCase() || '-'
  const metalLabel = METAL_LABELS[metal] || metal
  const netWt = parseFloat(product.net_weight) || 0
  const crossWt = parseFloat(product.cross_weight) || 0
  const stoneWt = parseFloat(product.stone_weight) || 0
  const stoneVal = parseFloat(product.stone_value) || 0
  const productDesc = product?.desc || product?.description || product?.short_description || 'A carefully finished jewellery piece selected for premium everyday wear, gifting, and celebrations.'

  let todayRate = 0
  if (liveRate) {
    if (metal === 'gold') todayRate = product.grade === '24k' ? liveRate.gold_24k : liveRate.gold_22k
    else if (metal === 'silver') todayRate = liveRate.silver_999
    else if (metal === 'diamond') todayRate = product.grade === '18k' ? liveRate.diamond_18k : liveRate.diamond_22k
    else if (metal === 'platinum') todayRate = liveRate.platinum_92
  }

  const inr = n => n !== null && n !== undefined ? `Rs. ${Math.round(n).toLocaleString('en-IN')}` : '-'
  const displayWeight = netWt > 0 ? `${netWt} g net` : crossWt > 0 ? `${crossWt} g gross` : '-'

  const infoHighlights = [
    { label: 'Metal & Purity', value: `${metalLabel} ${purityLabel}`, note: 'Purity mapped from product grade' },
    { label: 'Weight', value: displayWeight, note: crossWt > 0 && netWt > 0 ? `${crossWt} g gross weight` : 'Measured product weight' },
    { label: 'Stone Value', value: stoneVal > 0 ? inr(stoneVal) : 'Included', note: stoneWt > 0 ? `${stoneWt} stone weight` : 'As per product record' },
    { label: 'Today Rate', value: todayRate ? `${inr(todayRate)} / g` : 'Live rate pending', note: 'Fetched from backend rate logic' },
  ]

  return (
    <section className="product-info-premium">
      <style>{`
        .product-info-premium { position: relative; z-index: 5; padding: 66px clamp(18px,4vw,72px) 78px; background: linear-gradient(180deg,#FDFDFC 0%,#F3F3F0 100%); }
        .pi-inner { width: 100%; max-width: 1500px; margin: 0 auto; }
        .pi-head { display: grid; grid-template-columns: minmax(0,0.9fr) minmax(300px,0.55fr); gap: 28px; align-items: end; margin-bottom: 26px; border-top: 1px solid rgba(189,207,206,0.86); padding-top: 52px; }
        .pi-kicker { display: inline-flex; align-items: center; gap: 10px; margin: 0 0 12px; color: #9F6130; font-size: 12px; font-weight: 900; letter-spacing: 2.4px; text-transform: uppercase; }
        .pi-kicker::before { content: ""; width: 26px; height: 1px; background: #BB8958; }
        .pi-head h2 { margin: 0; color: #073B3F; font-family: "Playfair Display", Georgia, serif; font-size: clamp(36px,4.8vw,62px); line-height: 0.98; letter-spacing: 0; }
        .pi-head p { margin: 0; color: #52625f; font-size: 14px; line-height: 1.8; font-weight: 600; }
        .pi-panel { position: relative; overflow: hidden; border-radius: 8px; border: 1px solid rgba(189,207,206,0.78); background: linear-gradient(120deg, rgba(253,253,252,0.96) 0%, rgba(231,237,236,0.84) 54%, rgba(243,232,222,0.88) 100%); box-shadow: 0 28px 76px rgba(12,64,68,0.11); }
        .pi-panel::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(253,253,252,0.52) 48%, transparent 100%), repeating-linear-gradient(135deg, rgba(12,64,68,0.035) 0 1px, transparent 1px 18px); pointer-events: none; }
        .pi-grid { position: relative; display: grid; grid-template-columns: minmax(0,1fr) minmax(320px,0.44fr); gap: 22px; padding: clamp(22px,3.5vw,42px); }
        .pi-spec-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
        .pi-spec-card, .pi-story, .pi-assurance { border: 1px solid rgba(12,64,68,0.13); background: rgba(253,253,252,0.90); border-radius: 8px; box-shadow: 0 18px 44px rgba(12,64,68,0.07); }
        .pi-spec-card { min-height: 138px; padding: 20px; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
        .pi-spec-card:hover { transform: translateY(-4px); border-color: rgba(187,137,88,0.52); box-shadow: 0 26px 56px rgba(12,64,68,0.12); }
        .pi-spec-card span, .pi-story span, .pi-assurance span { display: block; color: #7A8987; font-size: 11px; font-weight: 900; letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 10px; }
        .pi-spec-card strong { display: block; color: #073B3F; font-size: clamp(20px,2.2vw,30px); line-height: 1.05; font-family: "Playfair Display", Georgia, serif; margin-bottom: 10px; }
        .pi-spec-card small { color: #52625f; line-height: 1.55; font-size: 12px; font-weight: 700; }
        .pi-story { margin-top: 14px; padding: 24px; min-height: 184px; }
        .pi-story h3, .pi-assurance h3 { margin: 0 0 12px; color: #111817; font-family: "Playfair Display", Georgia, serif; font-size: 28px; line-height: 1.05; }
        .pi-story p {
          margin: 0;
          color: #52625f;
          font-size: 14px;
          line-height: 1.85;
          max-height: 112px;
          overflow-y: auto;
          padding-right: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(12,64,68,0.34) rgba(231,237,236,0.72);
        }
        .pi-story p::-webkit-scrollbar { width: 5px; }
        .pi-story p::-webkit-scrollbar-track { background: rgba(231,237,236,0.72); border-radius: 999px; }
        .pi-story p::-webkit-scrollbar-thumb { background: rgba(12,64,68,0.34); border-radius: 999px; }
        .pi-assurance { height: 100%; padding: 24px; background: #073B3F; color: #FDFDFC; display: flex; flex-direction: column; justify-content: space-between; gap: 24px; }
        .pi-assurance span { color: #CCA881; }
        .pi-assurance h3 { color: #FDFDFC; font-size: 34px; }
        .pi-assurance p { margin: 0; color: rgba(253,253,252,0.72); font-size: 14px; line-height: 1.8; }
        .pi-assurance-list { display: grid; gap: 10px; }
        .pi-assurance-list div { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid rgba(253,253,252,0.16); background: rgba(253,253,252,0.08); border-radius: 999px; padding: 11px 14px; color: #FDFDFC; font-size: 12px; font-weight: 900; }
        .pi-assurance-list b { color: #D1DFDE; font-weight: 900; }
        .pi-assurance-list em { font-style: normal; color: rgba(253,253,252,0.82); text-align: right; }
        @media (max-width: 980px) { .pi-head, .pi-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .pi-spec-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pi-inner">
        <div className="pi-head">
          <div>
            <p className="pi-kicker">Product Information</p>
            <h2>Details That Matter Before You Buy</h2>
          </div>
          <p>Every key value is connected to the backend product record and live rate logic, so customers can understand purity, weight, value, and assurance without guessing.</p>
        </div>

        <div className="pi-panel">
          <div className="pi-grid">
            <div>
              <div className="pi-spec-grid">
                {infoHighlights.map(item => (
                  <article className="pi-spec-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>
              <article className="pi-story">
                <span>Product Description</span>
                <h3>{product?.name || `${metalLabel} Jewellery`}</h3>
                <p>{productDesc}</p>
              </article>
            </div>
            <aside className="pi-assurance">
              <div>
                <span>Purchase Confidence</span>
                <h3>Clear, Certified, Carefully Priced.</h3>
                <p>Use this section to verify the product essentials before moving to cart.</p>
              </div>
              <div className="pi-assurance-list">
                <div><b>BIS</b><em>Hallmark assurance</em></div>
                <div><b>GST</b><em>Included at checkout</em></div>
                <div><b>Ship</b><em>Free insured delivery</em></div>
                <div><b>Return</b><em>15 day easy returns</em></div>
              </div>
            </aside>
          </div>
        </div>

      </div>
    </section>
  )
}
export default function ProductDisplay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const canvasRef = useRef(null)

  const productId = searchParams.get('id')
  const category = searchParams.get('category') || 'rings'
  const metal = searchParams.get('metal') || 'gold'

  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState(1)
  const [mainImage, setMainImage] = useState(null)
  const [showAdded, setShowAdded] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPixel, setZoomPixel] = useState({ x: 0, y: 0 })
  const [zoomLensStyle, setZoomLensStyle] = useState({})
  const [wishlisted, setWishlisted] = useState(false)
  const [liveRate, setLiveRate] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const imageRef = useRef(null)
  const mainImageRef = useRef(null)

  const isGold = metal === 'gold'
  const accentColor = isGold ? '#fbbf24' : '#c0c0c0'
  const accentSoft = isGold ? 'rgba(251,191,36,0.18)' : 'rgba(192,192,192,0.18)'
  const accentGlow = isGold ? 'rgba(251,191,36,0.32)' : 'rgba(192,192,192,0.32)'

  const bg = '#FDF5EE'
  const text = '#1c1410'
  const subtext = '#de8856'
  const border = 'rgba(180, 130, 80, 0.18)'
  const glass = '#f0e9de'
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)'
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  const getImageUrl = img => {
    if (!img) return null
    let imagePath = typeof img === 'object'
      ? (img.image || img.url || img.file || img.path || img.image_url || img.product_image || '')
      : img
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') return null
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
    return `${API_BASE}/${imagePath.replace(/^\/+/, '')}`
  }

  useEffect(() => {
    if (!productId) return
    import('../api').then(({ default: api }) => {
      api.get('/wishlist/').then(res => {
        const found = res.data.items.find(i => i.product_id === parseInt(productId))
        setWishlisted(!!found)
      }).catch(() => { })
    })
  }, [productId])

  useEffect(() => {
    import('../api').then(({ default: api }) => {
      api.get('/metal-rates/').then(res => {
        const d = res.data
        setLiveRate({
          gold_22k: parseFloat(d.gold_22k) || 0,
          gold_24k: parseFloat(d.gold_24k) || 0,
          silver_999: parseFloat(d.silver_999) || 0,
          diamond_18k: parseFloat(d.diamond_18k) || 0,
          diamond_22k: parseFloat(d.diamond_22k) || 0,
          platinum_92: parseFloat(d.platinum_92) || 0,
        })
      }).catch(() => {})
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    import('../api').then(({ default: api }) => {
      api.get(`/jewelry-products/?category=${category}&metal=${metal}`)
        .then(res => {
          setProducts(Array.isArray(res.data) ? res.data : [])
          setLoading(false)
        })
        .catch(err => {
          setProducts([])
          setLoading(false)
        })
    })
  }, [category, metal])

  const product = useMemo(() => {
    if (!products.length) return null
    if (productId) {
      const found = products.find(item => String(item.id) === String(productId))
      if (found) return found
    }
    return products[0]
  }, [products, productId])

  const productImages = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map(img => getImageUrl(img)).filter(Boolean)
    }
    return []
  }, [product, metal])

  useEffect(() => {
    if (productImages.length > 0) setMainImage(productImages[0])
  }, [productImages])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, particles = []
    const mouse = { x: null, y: null, radius: 150 }
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const mouseMove = e => { mouse.x = e.x; mouse.y = e.y }
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', mouseMove)
    resize()
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height
        this.size = Math.random() * 4 + 2
        this.speedX = (Math.random() - 0.5) * 0.3; this.speedY = (Math.random() - 0.5) * 0.3
      }
      update() {
        this.x += this.speedX; this.y += this.speedY
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x; const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius && dist > 0) {
            const f = (mouse.radius - dist) / mouse.radius
            this.x += (dx / dist) * f * 2; this.y += (dy / dist) * f * 2
          }
        }
      }
      draw() {
        ctx.fillStyle = isGold ? (dark ? 'rgba(251,191,36,0.75)' : 'rgba(217,119,6,0.6)') : (dark ? 'rgba(192,192,192,0.75)' : 'rgba(100,116,139,0.6)')
        ctx.save(); ctx.translate(this.x, this.y); ctx.beginPath()
        const spikes = 5; const outerR = this.size; const innerR = this.size * 0.4
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR; const a = (i * Math.PI) / spikes - Math.PI / 2
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        ctx.closePath(); ctx.fill(); ctx.restore()
      }
    }
    const init = () => { particles = []; for (let i = 0; i < 60; i++) particles.push(new Particle()) }
    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x; const dy = particles[a].y - particles[b].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 150) {
            ctx.strokeStyle = isGold ? `rgba(251,191,36,${(1 - d / 150) * 0.35})` : `rgba(192,192,192,${(1 - d / 150) * 0.35})`
            ctx.lineWidth = 0.5; ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke()
          }
        }
      }
    }
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw() }); connect(); animId = requestAnimationFrame(animate) }
    init(); animate()
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('mousemove', mouseMove); cancelAnimationFrame(animId) }
  }, [dark, metal])

  // const loadRazorpay = () => new Promise(resolve => {
  //   const script = document.createElement('script')
  //   script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  //   script.onload = () => resolve(true); script.onerror = () => resolve(false)
  //   document.body.appendChild(script)
  // })

const handleBuy = () => {
    if (requireLogin()) return
    if (!product || !displayPrice) return
    navigate('/order-confirm', {
      state: {
        product,
        qty,
        displayPrice,
        metal,
        category,
      }
    })
  }

const calcLivePriceMain = () => {
  if (!liveRate || !product) return Number(product?.price) || null
  const netWt = parseFloat(product.net_weight) || 0
  const makingChargePct = parseFloat(product.making_charge) || 0
  const discountPct = parseFloat(product.wastage_charge) || 0
  const stoneVal = parseFloat(product.stone_value) || 0
  let todayRate = 0
  if (metal === 'gold') todayRate = product.grade === '24k' ? liveRate.gold_24k : liveRate.gold_22k
  else if (metal === 'silver') todayRate = liveRate.silver_999
  else if (metal === 'diamond') todayRate = product.grade === '18k' ? liveRate.diamond_18k : liveRate.diamond_22k
  else if (metal === 'platinum') todayRate = liveRate.platinum_92
  if (!todayRate || !netWt) return Number(product?.price) || null
  const makingPerGram = todayRate * (makingChargePct / 100)
  const rateWithMaking = todayRate + makingPerGram
  const discountPerGram = rateWithMaking * (discountPct / 100)
  const effectiveRate = rateWithMaking - discountPerGram
  return Math.round(((netWt * effectiveRate) + stoneVal) * 1.03)
}

const calcOriginalPriceMain = () => {
  if (!liveRate || !product) return Number(product?.original_price) || null
  const netWt = parseFloat(product.net_weight) || 0
  const makingChargePct = parseFloat(product.making_charge) || 0
  const stoneVal = parseFloat(product.stone_value) || 0
  let todayRate = 0
  if (metal === 'gold') todayRate = product.grade === '24k' ? liveRate.gold_24k : liveRate.gold_22k
  else if (metal === 'silver') todayRate = liveRate.silver_999
  else if (metal === 'diamond') todayRate = product.grade === '18k' ? liveRate.diamond_18k : liveRate.diamond_22k
  else if (metal === 'platinum') todayRate = liveRate.platinum_92
  if (!todayRate || !netWt) return Number(product?.original_price) || null
  const makingPerGram = todayRate * (makingChargePct / 100)
  const rateWithMaking = todayRate + makingPerGram
  return Math.round(((netWt * rateWithMaking) + stoneVal) * 1.03)
}

const displayPrice = calcLivePriceMain()
const displayOriginalPrice = calcOriginalPriceMain()

  const requireLogin = () => {
    if (localStorage.getItem('token')) return false
    navigate('/login')
    return true
  }

  const calculatedWeightText = product?.net_weight ? `${parseFloat(product.net_weight)} gm` : '—'
  const productName = product?.name || product?.title || 'Jewellery Product'
  const productDesc = product?.desc || product?.description || product?.short_description || 'Premium handcrafted jewellery from BitByte Jewellers.'
  const productTag = product?.tag || product?.label || (isGold ? 'Premium' : 'Minimal')
  const tagStyle = TAG_COLORS[productTag] || { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', color: text }

  const handleMouseMove = (e) => {
    const frameRect = imageRef.current?.getBoundingClientRect()
    const imgRect = mainImageRef.current?.getBoundingClientRect()
    if (!frameRect || !imgRect || !mainImage) return

    // ── image area kulla than mouse irukka nu check pannurom — illana zoom hide ──
    const insideImage = e.clientX >= imgRect.left && e.clientX <= imgRect.right &&
                         e.clientY >= imgRect.top && e.clientY <= imgRect.bottom
    if (!insideImage) {
      setShowZoom(false)
      return
    }
    setShowZoom(true)

    const lensSize = 172
    const zoomScale = 2.65
    const frameX = e.clientX - frameRect.left
    const frameY = e.clientY - frameRect.top
    const imgX = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left))
    const imgY = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top))

    setZoomPixel({ x: frameX, y: frameY })
    setZoomLensStyle({
      backgroundImage: `url(${mainImage})`,
      backgroundSize: `${imgRect.width * zoomScale}px ${imgRect.height * zoomScale}px`,
      backgroundPosition: `${(lensSize / 2) - (imgX * zoomScale)}px ${(lensSize / 2) - (imgY * zoomScale)}px`,
    })
  }

  const handleAddToCart = async () => {
    if (requireLogin()) return
    if (!product) return
    const result = await addToCartDB(product.id, qty)
    if (result) { setShowAdded(true); setTimeout(() => setShowAdded(false), 1600) }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Montserrat", sans-serif', position: 'relative', overflow: 'hidden', transition: 'background 0.8s ease, color 0.4s ease' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', border: `4px solid ${border}`, borderTopColor: accentColor, margin: '0 auto 18px', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ margin: 0, color: accentColor }}>Loading product...</h2>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF5EE', color: text, display: 'grid', placeItems: 'center', fontFamily: '"Inter",system-ui,sans-serif', padding: 20 }}>
        <div style={{ maxWidth: 520, textAlign: 'center', background: glass, border: `1px solid ${border}`, borderRadius: 28, padding: 35, backdropFilter: 'blur(18px)' }}>
          <h1 style={{ color: accentColor, marginTop: 0 }}>Product not found</h1>
          <p style={{ color: subtext }}>This product is not available now. Please go back and select another product.</p>
          <button onClick={() => { const role = localStorage.getItem('role'); if (role === 'customer') navigate('/customer'); else if (role === 'admin') navigate('/admin'); else if (role === 'super_admin') navigate('/super-admin'); else navigate('/') }}
            style={{ border: 'none', borderRadius: 999, padding: '13px 24px', background: accentColor, color: isGold ? '#111827' : '#020617', fontWeight: 900, cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFDFC', color: '#111817', fontFamily: '"Inter",system-ui,sans-serif', position: 'relative', overflow: 'hidden', transition: 'background 0.8s ease, color 0.4s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes float-orb { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes antigravity { 0%{transform:translateY(110vh) rotate(0deg);opacity:0} 10%{opacity:var(--op)} 90%{opacity:var(--op)} 100%{transform:translateY(-20vh) rotate(360deg);opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shine { 0%{left:-80%} 100%{left:120%} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px ${accentGlow}} 50%{box-shadow:0 0 45px ${accentGlow}} }
        .pd-main { animation:fadeInUp 0.55s ease both; }
        .pd-image-card:hover .pd-main-img { transform:scale(1.01); }
        .pd-shine { position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);transform:skewX(-20deg);opacity:0; }
        .pd-image-card:hover .pd-shine { opacity:1;animation:shine 0.7s ease; }
        .thumb:hover { transform:translateY(-4px) scale(1.03); }
        .weight-btn:hover,.action-btn:hover,.top-btn:hover { transform:translateY(-2px); }
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield;appearance:textfield; }

        /* ── PREMIUM PRODUCT PAGE STYLES ── */

        /* breadcrumb */
        .pd-breadcrumb { display:flex;align-items:center;gap:8px;margin-bottom:28px; }
.pd-breadcrumb span { font-size:12px;letter-spacing:0.2px;text-transform:none;font-weight:400;cursor:pointer;color:#aaa;transition:color 0.2s; }
.pd-breadcrumb span:last-child { color:#555;cursor:default;font-weight:500; }
        .pd-breadcrumb span:not(:last-child):hover { color:#555; }
        .pd-breadcrumb-sep { font-size:11px;color:#ddd; }

        /* image frame */
        .pd-img-frame {
          border: 1px solid #ede9e3;
          border-radius: 4px;
          overflow: hidden;
          background: #f7f4f0;
          position: relative;
        }

        /* thumbnail strip */
        .pd-thumb {
          width: 78px; height: 78px;
          border-radius: 4px;
          border: 1.5px solid #ede9e3;
          background: #f7f4f0;
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .pd-thumb:hover { border-color: #b8860b; transform: translateY(-2px); }
        .pd-thumb.active { border-color: #b8860b; box-shadow: 0 0 0 3px rgba(184,134,11,0.15); }

        /* spec pills */
        .pd-spec {
          background: #fff;
          border: 1px solid #ede9e3;
          border-radius: 4px;
          padding: 14px 18px;
          transition: border-color 0.2s;
        }
        .pd-spec:hover { border-color: rgba(184,134,11,0.4); }

        /* price box */
        .pd-price-box {
          background: linear-gradient(135deg, rgba(184,134,11,0.06), rgba(184,134,11,0.02));
          border: 1px solid rgba(184,134,11,0.2);
          border-radius: 6px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        /* CTA buttons */
        .pd-btn-cart {
          flex: 1;
          border: none;
          border-radius: 2px;
          padding: 16px 24px;
          background: linear-gradient(135deg, ${accentColor}, ${isGold ? '#f59e0b' : '#94a3b8'});
          color: #1a1a1a;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: pulseGlow 2.2s ease-in-out infinite;
        }
        .pd-btn-cart:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .pd-btn-cart:disabled { opacity: 1; }

        .pd-btn-buy {
          flex: 1;
          border: none;
          border-radius: 2px;
          padding: 16px 24px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pd-btn-buy:hover { transform: translateY(-2px); filter: brightness(1.05); }

        /* trust badges */
        .pd-trust-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          border-top: 1px solid #ede9e3;
          border-bottom: 1px solid #ede9e3;
          margin: 60px 0 0;
          position: relative;
          z-index: 5;
          background: #fff;
        }
        .pd-trust-item {
          padding: 32px 24px;
          text-align: center;
          border-right: 1px solid #ede9e3;
          transition: background 0.2s;
        }
        .pd-trust-item:last-child { border-right: none; }
        .pd-trust-item:hover { background: #fef9f0; }

        .pd-page-shell {
          position: relative;
          z-index: 5;
          width: 100%;
          padding: clamp(34px, 4vw, 58px) clamp(18px, 4.5vw, 72px) 72px;
          background:
            radial-gradient(circle at 13% 22%, rgba(209,223,222,0.7), transparent 27%),
            linear-gradient(135deg, #FDFDFC 0%, #F3E8DE 48%, #E7EDEC 100%);
        }

        .pd-breadcrumb {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto 28px !important;
          padding: 0 4px;
        }

        .pd-showcase {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          display: grid !important;
          grid-template-columns: minmax(520px, 1.02fr) minmax(430px, 0.9fr) !important;
          gap: clamp(28px, 4vw, 62px) !important;
          align-items: start !important;
        }

        .pd-image-card {
          align-self: start;
          background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(243,232,222,0.78)) !important;
          border: 1px solid rgba(189,207,206,0.85);
          border-radius: 30px;
          padding: clamp(18px, 2.2vw, 30px);
          box-shadow: 0 28px 80px rgba(12,64,68,0.12), 0 1px 0 rgba(255,255,255,0.8) inset;
          overflow: hidden;
        }

        .pd-image-card::before {
          content: "";
          position: absolute;
          inset: 18px;
          border: 1px solid rgba(204,168,129,0.28);
          border-radius: 24px;
          pointer-events: none;
        }

        .pd-img-frame {
          min-height: clamp(520px, 56vw, 650px) !important;
          height: auto !important;
          border: 0 !important;
          border-radius: 26px !important;
          background:
            radial-gradient(circle at 50% 48%, rgba(255,255,255,0.96), rgba(243,232,222,0.34) 48%, rgba(231,237,236,0.72) 100%) !important;
          box-shadow: inset 0 0 0 1px rgba(218,194,169,0.55), inset 0 -45px 90px rgba(12,64,68,0.06);
          padding: clamp(22px, 3vw, 46px) !important;
          overflow: hidden !important;
          position: relative !important;
        }

        .pd-main-img {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: clamp(470px, 50vw, 590px) !important;
          object-fit: contain !important;
          filter: drop-shadow(0 32px 48px rgba(7,59,63,0.18)) !important;
        }

        .pd-zoom-lens {
          position: absolute;
          width: 172px;
          height: 172px;
          border-radius: 50%;
          border: 2px solid #CCA881;
          box-shadow: 0 0 0 6px rgba(253,253,252,0.72), 0 18px 42px rgba(12,64,68,0.22);
          background-repeat: no-repeat;
          pointer-events: none;
          z-index: 5;
          transform: translateZ(0);
        }

        .pd-thumb {
          width: 86px !important;
          height: 86px !important;
          border-radius: 16px !important;
          border: 1px solid rgba(189,207,206,0.9) !important;
          background: rgba(253,253,252,0.9) !important;
          box-shadow: 0 10px 24px rgba(12,64,68,0.08);
        }

        .pd-thumb.active {
          border-color: #BB8958 !important;
          box-shadow: 0 0 0 4px rgba(204,168,129,0.22), 0 16px 32px rgba(12,64,68,0.13) !important;
        }

        .pd-detail-card {
          position: sticky;
          top: 178px;
          align-self: start;
          background: rgba(253,253,252,0.9);
          border: 1px solid rgba(189,207,206,0.85);
          border-radius: 30px;
          padding: clamp(26px, 3vw, 42px) !important;
          box-shadow: 0 30px 90px rgba(12,64,68,0.12);
          backdrop-filter: blur(18px);
        }

        .pd-title {
          color: #073B3F !important;
          font-size: clamp(40px, 4vw, 62px) !important;
          line-height: 0.98 !important;
          letter-spacing: 0 !important;
          max-width: 660px;
        }

        .pd-product-copy {
          margin: 0 0 24px;
          color: #4c5a58;
          font-size: 15px;
          line-height: 1.8;
          max-width: 620px;
          max-height: 118px;
          overflow-y: auto;
          padding-right: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(12,64,68,0.34) rgba(231,237,236,0.72);
        }

        .pd-product-copy::-webkit-scrollbar {
          width: 5px;
        }

        .pd-product-copy::-webkit-scrollbar-track {
          background: rgba(231,237,236,0.72);
          border-radius: 999px;
        }

        .pd-product-copy::-webkit-scrollbar-thumb {
          background: rgba(12,64,68,0.34);
          border-radius: 999px;
        }

        .pd-rating-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 0 22px;
          flex-wrap: wrap;
        }

        .pd-rating-stars {
          color: #E5A018;
          font-size: 15px;
          letter-spacing: 2px;
        }

        .pd-rate-chip {
          border: 1px solid rgba(12,64,68,0.16);
          background: rgba(231,237,236,0.85);
          color: #073B3F;
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
        }

        .pd-spec {
          background: rgba(255,255,255,0.82) !important;
          border: 1px solid rgba(189,207,206,0.9) !important;
          border-radius: 18px !important;
          padding: 18px 20px !important;
          box-shadow: 0 12px 30px rgba(12,64,68,0.07);
        }

        .pd-price-box {
          background: linear-gradient(135deg, rgba(243,232,222,0.96), rgba(231,237,236,0.86)) !important;
          border: 1px solid rgba(204,168,129,0.52) !important;
          border-radius: 24px !important;
          padding: 24px 28px !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.75), 0 20px 46px rgba(159,97,48,0.09);
        }

        .pd-qty-wrap {
          border: 1px solid rgba(189,207,206,0.95) !important;
          border-radius: 18px !important;
          background: #FDFDFC !important;
          box-shadow: 0 14px 28px rgba(12,64,68,0.07);
        }

        .pd-btn-cart,
        .pd-btn-buy {
          border-radius: 18px !important;
          min-height: 58px;
          box-shadow: 0 18px 36px rgba(12,64,68,0.13);
          animation: none !important;
        }

        .pd-btn-cart {
          background: linear-gradient(135deg, #073B3F, #0C4044) !important;
          color: #FDFDFC !important;
        }

        .pd-btn-buy {
          background: linear-gradient(135deg, #BB8958, #9F6130) !important;
          color: #FDFDFC !important;
        }

        .pd-assurance-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .pd-assurance-item {
          border: 1px solid rgba(189,207,206,0.75);
          background: rgba(231,237,236,0.58);
          border-radius: 16px;
          padding: 13px 12px;
          color: #073B3F;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.35;
          text-align: center;
        }

        .pd-gallery-note {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .pd-gallery-note span {
          border: 1px solid rgba(12,64,68,0.12);
          background: rgba(253,253,252,0.82);
          color: #073B3F;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }

        @media (max-width:900px) {
          .pd-grid { grid-template-columns: 1fr !important; }
          .pd-page-shell { padding: 24px 14px 54px; }
          .pd-detail-card { position: relative; top: auto; }
          .pd-gallery-note, .pd-assurance-row { grid-template-columns: 1fr; }
          .pd-trust-grid { grid-template-columns: repeat(2,1fr) !important; }
          .pd-img-frame { min-height: 440px !important; }
          .pd-main-img { max-height: 400px !important; }
          .pd-zoom-lens { display: none; }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <main className="pd-page-shell">

        {/* ── BREADCRUMB ── */}
        <div className="pd-breadcrumb">
          <span onClick={() => navigate('/customer')}>Home</span>
          <span className="pd-breadcrumb-sep">›</span>
          <span onClick={() => navigate(`/collection/all?metal=${metal}`)}>{METAL_LABELS[metal] || metal}</span>
          <span className="pd-breadcrumb-sep">›</span>
          <span onClick={() => navigate(`/collection/all?metal=${metal}&category=${category}`)}>{CATEGORY_LABELS[category] || category}</span>
          <span className="pd-breadcrumb-sep">›</span>
          <span>{productName}</span>
        </div>

        <section className="pd-grid pd-main pd-showcase">

          {/* ── IMAGE SIDE ── */}
          <div className="pd-image-card" style={{ position: 'relative' }}>
            <div className="pd-shine" />

            {/* Main image frame */}
<div className="pd-img-frame" ref={imageRef} onMouseMove={handleMouseMove} onMouseLeave={() => setShowZoom(false)} style={{ height: 480, display: 'grid', placeItems: 'center', cursor: 'zoom-in' }}>

              {/* Tag ribbon */}
              {productTag && !(!product.is_active) && (
                <div style={{ position: 'absolute', top: 16, left: 0, background: '#8B1A1A', color: '#fff', padding: '5px 16px 5px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)', zIndex: 20 }}>
                  {productTag}
                </div>
              )}

              {/* NEW: Sold Out stamp — Amazon/Flipkart style */}
              {!product.is_active && (
                <div style={{
                  position: 'absolute', top: 16, left: 0, zIndex: 20,
                  background: '#C92035', color: '#fff',
                  padding: '6px 18px 6px 14px', fontSize: 11, fontWeight: 900,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)',
                  boxShadow: '0 8px 18px rgba(201,32,53,0.35)',
                }}>
                  Sold Out
                </div>
              )}

              {/* Wishlist */}
              <button
                onClick={async () => {
                  if (!product) return
                  const api = (await import('../api')).default
                  try {
                    const res = await api.post('/wishlist/', { product_id: product.id })
                    setWishlisted(res.data.action === 'added')
                    window.dispatchEvent(new Event('bb_wishlist_update'))
                  } catch (err) { console.error(err) }
                }}
                style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', border: wishlisted ? '1.5px solid #c0392b' : '1px solid #ddd', background: wishlisted ? 'rgba(192,57,43,0.1)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, transition: 'all 0.2s ease' }}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg width="18" height="18" viewBox="0 0 32 32" fill={wishlisted ? '#c0392b' : 'none'} stroke={wishlisted ? '#c0392b' : '#aaa'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 27s-11-7.5-11-14.5a6.5 6.5 0 0111-4.7 6.5 6.5 0 0111 4.7c0 7-11 14.5-11 14.5z"/>
                </svg>
              </button>

              {mainImage && (
                <img ref={mainImageRef} className="pd-main-img" src={mainImage} onError={e => { e.currentTarget.style.display = 'none' }}
                  style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', filter: product.is_active ? 'drop-shadow(0 20px 36px rgba(0,0,0,0.14))' : 'drop-shadow(0 20px 36px rgba(0,0,0,0.14)) grayscale(0.55) opacity(0.85)', transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)' }} />
              )}

              {showZoom && mainImage && (
                <div className="pd-zoom-lens" style={{ left: zoomPixel.x - 86, top: zoomPixel.y - 86, borderColor: accentColor, ...zoomLensStyle }} />
              )}
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {productImages.map((img, index) => (
                <button key={index} className={`pd-thumb${mainImage === img ? ' active' : ''}`} onClick={() => setMainImage(img)}>
                  <img src={img} alt={`${productName} ${index + 1}`}
                    onError={e => { const fb = isGold ? '/img/gold/gold-ring-1.png' : '/img/silver/silver-ring-1.png'; if (e.currentTarget.src !== window.location.origin + fb) e.currentTarget.src = fb }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
            <div className="pd-gallery-note">
              <span>BIS checked</span>
              <span>Insured delivery</span>
              <span>15 day return</span>
            </div>
          </div>

          {/* ── DETAIL SIDE ── */}
          <div className="pd-detail-card">

            {/* Metal + Category eyebrow */}
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#b8860b' }}>
              ✦ {METAL_LABELS[metal] || metal} {CATEGORY_LABELS[category] || category}
            </p>

            {/* Product name */}
            <h1 className="pd-title" style={{ margin: '0 0 20px', fontSize: 34, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.3px', color: text, fontFamily: '"Playfair Display", Georgia, serif' }}>
              {productName}
            </h1>

            <div className="pd-rating-row">
              <div>
                <div className="pd-rating-stars">★★★★★</div>
                <div style={{ marginTop: 5, color: '#7A8987', fontSize: 12, fontWeight: 700 }}>Premium selected jewellery</div>
              </div>
              <div className="pd-rate-chip">Live rate pricing</div>
            </div>

            <p className="pd-product-copy">{productDesc}</p>

            {/* Thin gold divider */}
            <div style={{ width: 56, height: 2, background: 'linear-gradient(90deg,#b8860b,#e0c97a)', marginBottom: 24 }} />

            {/* Spec pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Metal', value: METAL_LABELS[metal] || metal },
                { label: 'Category', value: CATEGORY_LABELS[category] || category },
                { label: 'Weight', value: calculatedWeightText },
              ].map(s => (
                <div key={s.label} className="pd-spec">
                  <div style={{ color: '#aaa', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ color: text, fontSize: 18, fontWeight: 600, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Price box */}
            <div className="pd-price-box">
              <div style={{ color: '#7A8987', fontSize: 10, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Today's Price</div>

              {(() => {
                const discountPct = parseFloat(product?.wastage_charge) || 0
                const originalAmt = displayOriginalPrice || 0
                const hasDiscount = discountPct > 0 && originalAmt > 0 && displayPrice
                return (
                  <>
                    {hasDiscount && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ background: 'rgba(12,64,68,0.1)', border: '1px solid rgba(12,64,68,0.22)', color: '#0C4044', fontSize: 11, fontWeight: 900, padding: '6px 12px', borderRadius: 999, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          {discountPct}% Off
                        </span>
                      </div>
                    )}
<div style={{ color: '#073B3F', fontSize: 36, fontWeight: 900, letterSpacing: '0', lineHeight: 1.05, fontFamily: '"Montserrat", sans-serif' }}>
  {displayPrice ? `₹${displayPrice.toLocaleString('en-IN')}` : 'Contact for Price'}
</div>
                    {hasDiscount && (
                      <>
                        <div style={{ color: '#9F6130', fontSize: 16, fontWeight: 700, textDecoration: 'line-through', marginTop: 8, opacity: 0.78 }}>
                          ₹{originalAmt.toLocaleString('en-IN')}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 10, borderRadius: 999, background: 'rgba(231,237,236,0.9)', border: '1px solid rgba(12,64,68,0.14)', color: '#0C4044', fontSize: 12, fontWeight: 900, padding: '8px 12px', letterSpacing: '0.3px' }}>
                          You save ₹{(originalAmt - displayPrice).toLocaleString('en-IN')}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}

              {!product.is_active && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 4, padding: '10px 16px', marginTop: 12, color: '#f87171', fontWeight: 700, fontSize: 12, textAlign: 'center', letterSpacing: '0.5px' }}>
                  ⚠️ Currently Unavailable
                </div>
              )}
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="pd-qty-wrap" style={{ display: 'flex', alignItems: 'center', border: `1px solid ${border}`, borderRadius: 2, overflow: 'hidden', background: inputBg }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: text, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>-</button>
                <input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} style={{ width: 55, height: 44, border: 'none', outline: 'none', textAlign: 'center', background: 'transparent', color: text, fontWeight: 700, fontSize: 16 }} />
                <button onClick={() => setQty(q => q + 1)} style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: text, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>+</button>
              </div>
              <span style={{ color: subtext, fontWeight: 600, fontSize: 13, letterSpacing: '0.5px' }}>Quantity</span>
            </div>

            {/* CTA buttons */}
            {product.is_active ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="pd-btn-cart" onClick={handleAddToCart}>
                  {showAdded ? '✓ Added to Cart' : '🛒 Add to Cart'}
                </button>
                <button className="pd-btn-buy" onClick={handleBuy}
                  style={{ background: 'linear-gradient(135deg,#1a1a1a,#333)', color: '#fff', cursor: 'pointer' }}>
                  💳 Buy Now
                </button>
              </div>
            ) : (
              <div style={{
                border: '1px solid rgba(201,32,53,0.25)',
                background: 'linear-gradient(135deg, rgba(201,32,53,0.05), rgba(201,32,53,0.02))',
                borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#C92035', display: 'inline-block'
                  }} />
                  <span style={{ color: '#C92035', fontWeight: 900, fontSize: 13, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Currently Unavailable
                  </span>
                </div>
                <p style={{ margin: '4px 0 14px', color: '#6b6b6b', fontSize: 13.5 }}>
                  This item is temporarily out of stock. We'll notify you the moment it's back.
                </p>

                {notifyMsg ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.2)',
                    borderRadius: 10, padding: '12px 16px', color: '#073B3F', fontSize: 13.5, fontWeight: 700
                  }}>
                    ✓ {notifyMsg}
                  </div>
                ) : (
                  <button onClick={async () => {
                    const api = (await import('../api')).default
                    try {
                      const res = await api.post('/notify-me/', { product_id: product.id })
                      setNotifyMsg(res.data.message)
                    } catch (err) { setNotifyMsg('Something went wrong. Please try again.') }
                  }}
                    style={{
                      width: '100%', padding: '14px 0', border: 'none', borderRadius: 10,
                      background: 'linear-gradient(135deg,#1f6feb,#2563eb)', color: '#fff',
                      fontWeight: 800, fontSize: 15, cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(37,99,235,0.28)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    🔔 Notify Me
                  </button>
                )}
              </div>
            )}
            <div className="pd-assurance-row">
              <div className="pd-assurance-item">Secure payment</div>
              <div className="pd-assurance-item">Easy exchange</div>
              <div className="pd-assurance-item">Certified purity</div>
            </div>
          </div>
        </section>
      </main>
      {/* ── TRUST BADGES ── */}
      <div className="pd-trust-grid">
        {[
          {
            label: 'BIS Hallmark Jewellery',
            sub: 'Authenticity Guaranteed, Purity Assured',
            svg: (
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <polygon points="32,5 42,17 57,17 57,32 42,47 32,59 22,47 7,32 7,17 22,17" fill="rgba(251,191,36,0.15)" stroke="#d97706" strokeWidth="2.5"/>
                <polygon points="32,12 40,22 52,22 52,32 40,42 32,52 24,42 12,32 12,22 24,22" fill="rgba(251,191,36,0.08)" stroke="#d97706" strokeWidth="1.5"/>
                <polyline points="22,32 28,38 42,24" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="50" x2="48" y2="50" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            label: 'Fast Shipping',
            sub: 'Swift & Secure Delivery to Your Doorstep',
            svg: (
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <rect x="4" y="24" width="36" height="22" rx="4" fill="rgba(251,191,36,0.15)" stroke="#d97706" strokeWidth="2.5"/>
                <path d="M40 30 L56 30 L56 46 L40 46 Z" fill="rgba(251,191,36,0.15)" stroke="#d97706" strokeWidth="2.5"/>
                <path d="M40 36 L52 36" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="50" r="5" fill="#d97706"/>
                <circle cx="46" cy="50" r="5" fill="#d97706"/>
              </svg>
            ),
          },
          {
            label: 'Free Insured Shipping',
            sub: 'Your Precious Jewellery, Protected Every Step',
            svg: (
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <path d="M32 6 C32 6 12 14 12 30 L12 44 C12 50 22 57 32 60 C42 57 52 50 52 44 L52 30 C52 14 32 6 32 6Z" fill="rgba(251,191,36,0.15)" stroke="#d97706" strokeWidth="2.5"/>
                <path d="M22 34 C25 39 29 44 32 47 C35 44 41 37 44 30" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="44" cy="22" r="9" fill="rgba(251,191,36,0.2)" stroke="#d97706" strokeWidth="2"/>
                <polyline points="40,22 43,25 49,18" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
          },
          {
            label: 'Return Policy',
            sub: '15 Days Easy Returns Guaranteed',
            svg: (
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="25" fill="rgba(251,191,36,0.15)" stroke="#d97706" strokeWidth="2.5"/>
                <path d="M32 16 A16 16 0 1 1 16 32" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <polyline points="14,26 16,32 22,29" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="900" fill="#d97706">15</text>
              </svg>
            ),
          },
        ].map((item, i) => (
          <div key={i} className="pd-trust-item">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>{item.svg}</div>
            <div style={{ color: '#7c2d12', fontWeight: 700, fontSize: 13, marginBottom: 6, letterSpacing: '0.3px', fontFamily: '"Playfair Display", Georgia, serif' }}>{item.label}</div>
            <div style={{ color: '#92400e', fontSize: 12, lineHeight: 1.6, opacity: 0.75, maxWidth: 160, margin: '0 auto', fontFamily: '"Montserrat", sans-serif' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PRODUCT INFO + PRICE BREAKUP ── */}
      <ProductInfoAndBreakup product={product} metal={metal} />

      {/* ── MORE FROM THIS COLLECTION ── */}
      <MoreFromCollection currentProductId={productId} category={category} metal={metal} gender={product?.gender} occasion={product?.occasion} liveRate={liveRate} />

      {/* ── ZOOM PANEL ── */}
      <CustomerFooter />
    </div>
  )
}


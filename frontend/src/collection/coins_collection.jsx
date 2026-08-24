import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin-transparent.png'
import CustomerFooter from '../collection/CustomerFooter'

const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

function getImageUrl(img) {
  if (!img) return null
  const path = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`
}

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '-'
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function normalizeProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  return []
}

function textValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    return String(value.name || value.title || value.slug || value.label || value.value || '')
  }
  return ''
}

function productIsCoin(product) {
  const category = textValue(product.category).toLowerCase()
  const name = textValue(product.name).toLowerCase()
  const tag = textValue(product.tag).toLowerCase()
  return category.includes('coin') || name.includes('coin') || tag.includes('coin')
}

function productMatchesMetal(product, metalFilter) {
  if (!metalFilter) return true
  const metal = textValue(product.metal).toLowerCase()
  const name = textValue(product.name).toLowerCase()
  return metal === metalFilter || metal.includes(metalFilter) || name.includes(metalFilter)
}

function coinMatchesWeight(product, weightFilter) {
  if (!weightFilter) return true

  const compactFilter = String(weightFilter).toLowerCase().replace(/\s+/g, '')
  const numeric = parseFloat(compactFilter)
  const targetGrams = compactFilter.includes('mg')
    ? numeric / 1000
    : compactFilter.includes('g')
      ? numeric
      : null

  const text = [
    product.name,
    product.tag,
    product.grade,
    product.net_weight,
    product.cross_weight,
  ].filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, '')

  if (text.includes(compactFilter)) return true

  const productWeight = Number(product.net_weight || product.cross_weight)
  if (!Number.isFinite(productWeight) || !Number.isFinite(numeric)) return false

  if (targetGrams !== null && Math.abs(productWeight - targetGrams) < 0.0001) return true
  if (Math.abs(productWeight - numeric) < 0.0001) return true
  if (compactFilter.includes('mg') && Math.abs((productWeight * 1000) - numeric) < 0.1) return true

  return false
}

function getCoinPrice(product, rates) {
  const metal = textValue(product.metal).toLowerCase()
  const grade = textValue(product.grade).toLowerCase()
  const rate = metal === 'silver'
    ? Number(rates.silver_999)
    : grade === '24k'
      ? Number(rates.gold_24k)
      : Number(rates.gold_22k)

  const netWeight = Number(product.net_weight) || 0
  const makingPct = Number(product.making_charge) || 0
  const discountPct = Number(product.wastage_charge) || 0
  const stoneValue = Number(product.stone_value) || 0

  if (!rate || !netWeight) {
    return {
      price: Number(product.price) || 0,
      original: Number(product.original_price) || 0,
      rate,
      discountPct,
    }
  }

  const making = rate * (makingPct / 100)
  const rateWithMaking = rate + making
  const discount = rateWithMaking * (discountPct / 100)
  const price = Math.round(((netWeight * (rateWithMaking - discount)) + stoneValue) * 1.03)
  const original = Math.round(((netWeight * rateWithMaking) + stoneValue) * 1.03)

  return { price, original, rate, discountPct }
}

function CoinCard({ product, rates, navigate, wishlisted, onWishlist }) {
  const [hovered, setHovered] = useState(false)
  const images = product.images?.map(getImageUrl).filter(Boolean) || []
  const image = hovered && images[1] ? images[1] : images[0]
  const metal = textValue(product.metal).toLowerCase()
  const isGold = metal.includes('gold')
  const { price, original, rate, discountPct } = getCoinPrice(product, rates)
  const hasDiscount = discountPct > 0 && original > price && price > 0

  const openProduct = () => {
    navigate(`/product-display?category=coins&metal=${isGold ? 'gold' : 'silver'}&id=${product.id}`)
  }

  return (
    <article
      className={`coin-premium-card ${isGold ? 'gold' : 'silver'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={openProduct}
    >
      <div className="coin-premium-image">
        {image ? <img src={image} alt={product.name} /> : <img className="coin-placeholder" src={isGold ? goldCoin : silverCoin} alt="" />}

        <div className="coin-badges">
          <span>{isGold ? (textValue(product.grade).toLowerCase() === '24k' ? 'Gold 24K' : 'Gold 22K') : 'Silver 999'}</span>
          {product.tag && <span>{product.tag}</span>}
          {hasDiscount && <span>{Math.round(discountPct)}% Off</span>}
        </div>

        <button
          className={`coin-wish ${wishlisted ? 'active' : ''}`}
          type="button"
          onClick={event => {
            event.stopPropagation()
            onWishlist(product.id)
          }}
          aria-label="Wishlist"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
          </svg>
        </button>

        <button className="coin-view" type="button" onClick={openProduct}>View Coin</button>
      </div>

      <div className="coin-premium-info">
        <div className="coin-meta">
          <span>{product.net_weight ? `${product.net_weight}g` : 'Certified Coin'}</span>
          <span>Incl. 3% GST</span>
        </div>
        <h3>{product.name}</h3>
        <div className="coin-price-row">
          <strong>{formatMoney(price)}</strong>
          {hasDiscount && <del>{formatMoney(original)}</del>}
        </div>
        <div className="coin-rate-line">
          {rate ? `${formatMoney(rate)} / gm` : 'Rate from backend'}
        </div>
      </div>
    </article>
  )
}

export default function CoinsCollection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const metalFilter = searchParams.get('metal') || 'silver'
  const gradeFilter = searchParams.get('grade')
  const weightFilter = searchParams.get('weight')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState({})
  const [wishlistedIds, setWishlistedIds] = useState(new Set())
  const [sortBy, setSortBy] = useState('featured')

  const isGold = metalFilter === 'gold'

  useEffect(() => {
    api.get('/metal-rates/')
      .then(res => {
        const d = Array.isArray(res.data) ? res.data[0] : res.data
        setRates({
          gold_22k: Number(d?.gold_22k) || 0,
          gold_24k: Number(d?.gold_24k) || 0,
          silver_999: Number(d?.silver_999) || 0,
        })
      })
      .catch(() => {})

    api.get('/wishlist/')
      .then(res => {
        const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []
        setWishlistedIds(new Set(items.map(item => item.product_id || item.product)))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const loadCoins = async () => {
      setLoading(true)
      try {
        let url = `/jewelry-products/?category=coins&metal=${encodeURIComponent(metalFilter)}`
        if (gradeFilter) url += `&grade=${encodeURIComponent(gradeFilter)}`
        const res = await api.get(url)
        let list = normalizeProductList(res.data)

        if (!list.length) {
          const fallbackRes = await api.get('/jewelry-products/')
          list = normalizeProductList(fallbackRes.data)
        }

        list = list.filter(product => productIsCoin(product) && productMatchesMetal(product, metalFilter))

        if (gradeFilter) {
          const grade = gradeFilter.toLowerCase()
          list = list.filter(product => textValue(product.grade).toLowerCase().includes(grade))
        }

        if (weightFilter) {
          list = list.filter(product => coinMatchesWeight(product, weightFilter))
        }

        setProducts(list)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadCoins()
  }, [metalFilter, gradeFilter, weightFilter])

  const sortedProducts = useMemo(() => {
    const list = [...products]
    if (sortBy === 'price-low') {
      list.sort((a, b) => getCoinPrice(a, rates).price - getCoinPrice(b, rates).price)
    }
    if (sortBy === 'price-high') {
      list.sort((a, b) => getCoinPrice(b, rates).price - getCoinPrice(a, rates).price)
    }
    if (sortBy === 'weight-low') {
      list.sort((a, b) => (Number(a.net_weight) || 0) - (Number(b.net_weight) || 0))
    }
    if (sortBy === 'weight-high') {
      list.sort((a, b) => (Number(b.net_weight) || 0) - (Number(a.net_weight) || 0))
    }
    return list
  }, [products, rates, sortBy])

  const toggleWishlist = async productId => {
    setWishlistedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })

    try {
      await api.post('/wishlist/', { product: productId })
      window.dispatchEvent(new Event('bb_wishlist_update'))
    } catch {
      try {
        await api.delete('/wishlist/', { data: { product: productId } })
        window.dispatchEvent(new Event('bb_wishlist_update'))
      } catch {}
    }
  }

  const selectMetal = (metal, grade = '') => {
    let url = `/collection/coins?metal=${metal}`
    if (grade) url += `&grade=${grade}`
    if (weightFilter) url += `&weight=${encodeURIComponent(weightFilter)}`
    navigate(url)
  }

  const coinWeights = ['50 mg', '100 mg', '250 mg', '500 mg', '1 g', '2 g', '5 g', '10 g', '20 g', '50 g', '100 g']

  const coinQuickLinks = [
    { label: 'Silver 100mg', metal: 'silver', weight: '100 mg', image: '/coin/100mg.silver.png' },
    { label: 'Silver 250mg', metal: 'silver', weight: '250 mg', image: '/coin/250mg.silver.png' },
    { label: 'Silver 500mg', metal: 'silver', weight: '500 mg', image: '/coin/500mg.silver.png' },
    { label: 'Silver Coins', metal: 'silver', image: '/silver-coin.jpg.jpeg' },
    { label: 'Gold 100mg', metal: 'gold', grade: '22k', weight: '100 mg', image: '/coin/100mg.gold.png' },
    { label: 'Gold 200mg', metal: 'gold', grade: '22k', weight: '200 mg', image: '/coin/200mg.gold.png' },
    { label: 'Gold 250mg', metal: 'gold', grade: '22k', weight: '250 mg', image: '/coin/250mg.gold.png' },
    { label: 'Gold Coins', metal: 'gold', grade: '22k', image: '/gold-coin.jpg.jpeg' },
  ]

  const selectWeight = weight => {
    let url = `/collection/coins?metal=${metalFilter}`
    if (gradeFilter) url += `&grade=${gradeFilter}`
    if (weight) url += `&weight=${encodeURIComponent(weight)}`
    navigate(url)
  }

  const liveRate = isGold
    ? gradeFilter === '24k'
      ? rates.gold_24k
      : rates.gold_22k
    : rates.silver_999

  return (
    <div className="coins-page">
      <style>{`
        .coins-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 4% 3%, rgba(204,168,129,0.16), transparent 24%),
            linear-gradient(180deg, #FDFDFC 0%, #F3F3F0 42%, #FDFDFC 100%);
          color: #111817;
          font-family: Inter, "Montserrat", system-ui, sans-serif;
        }

        .coins-shell {
          width: 100%;
          padding-left: clamp(26px, 3.4vw, 72px);
          padding-right: clamp(26px, 3.4vw, 72px);
        }

        .coins-hero {
          padding: 52px 0 30px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
          gap: 28px;
        }

        .coins-title-panel {
          min-height: 280px;
          border-radius: 34px;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(231,237,236,0.98), rgba(253,253,252,0.78)),
            url('${isGold ? '/banners/Gold coin2.png' : '/banners/Silver coin.png'}');
          background-size: cover;
          background-position: center right;
          border: 1px solid #D1DFDE;
          box-shadow: 0 24px 68px rgba(7,59,63,0.1);
          padding: clamp(30px, 4vw, 56px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .coins-kicker {
          color: #0C4044;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .coins-title-panel h1 {
          margin: 12px 0 12px;
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(3.2rem, 5.8vw, 6rem);
          line-height: 0.95;
          font-weight: 500;
          letter-spacing: 0;
        }

        .coins-title-panel p {
          color: #7A8987;
          font-size: 17px;
          font-weight: 800;
        }

        .coins-rate-panel {
          border-radius: 34px;
          background: #073B3F;
          color: #FDFDFC;
          padding: 28px;
          min-height: 280px;
          box-shadow: 0 24px 68px rgba(7,59,63,0.16);
          display: grid;
          align-content: space-between;
          overflow: hidden;
          position: relative;
        }

        .coins-rate-panel img {
          position: absolute;
          right: -34px;
          bottom: -42px;
          width: 170px;
          opacity: 0.2;
        }

        .coins-rate-panel strong {
          display: block;
          margin-top: 10px;
          font-size: 38px;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 500;
        }

        .coins-rate-panel span {
          color: rgba(253,253,252,0.72);
          font-weight: 800;
        }

        .coins-toolbar {
          margin-bottom: 30px;
          border-radius: 26px;
          border: 1px solid #D1DFDE;
          background: rgba(253,253,252,0.92);
          box-shadow: 0 16px 44px rgba(7,59,63,0.08);
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: center;
        }

        .coin-collection-rail {
          margin-bottom: 30px;
          padding: 22px 24px;
          border: 1px solid #D1DFDE;
          border-radius: 26px;
          background: rgba(253,253,252,0.94);
          box-shadow: 0 16px 44px rgba(7,59,63,0.07);
        }

        .coin-collection-rail-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .coin-collection-rail-head span {
          color: #BB8958;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .coin-collection-rail-head h2 {
          margin: 5px 0 0;
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(25px, 2vw, 34px);
          font-weight: 500;
        }

        .coin-collection-rail-track {
          display: grid;
          grid-template-columns: repeat(9, minmax(94px, 1fr));
          gap: clamp(10px, 1.2vw, 20px);
          align-items: start;
        }

        .coin-quick-link {
          min-width: 0;
          border: 0;
          background: transparent;
          color: #173E40;
          text-align: center;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .coin-quick-link-image,
        .coin-quick-view-all {
          width: clamp(76px, 5.4vw, 96px);
          height: clamp(76px, 5.4vw, 96px);
          margin: 0 auto 10px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .coin-quick-link-image {
          overflow: hidden;
          border: 2px solid #EEF2F1;
          background: radial-gradient(circle, #FFFFFF 12%, #E7EDEC 100%);
          box-shadow: 0 10px 26px rgba(7,59,63,0.09);
        }

        .coin-quick-link-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .coin-quick-link.active .coin-quick-link-image {
          border-color: #CCA881;
          box-shadow: 0 0 0 4px rgba(204,168,129,0.16), 0 13px 30px rgba(7,59,63,0.12);
        }

        .coin-quick-link:hover .coin-quick-link-image,
        .coin-quick-link:hover .coin-quick-view-all {
          transform: translateY(-4px);
        }

        .coin-quick-view-all {
          border: 1px solid #E8CDAE;
          background: #FFF5E8;
          color: #9B622E;
          font-family: Georgia, serif;
          font-size: 28px;
        }

        .coin-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .coin-chip {
          border: 1px solid #D1DFDE;
          border-radius: 999px;
          background: #F3F3F0;
          color: #073B3F;
          min-height: 40px;
          padding: 0 17px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .coin-chip.active {
          background: #0C4044;
          color: #FDFDFC;
          border-color: #0C4044;
        }

        .coin-chip.clear {
          color: #C92035;
          border-color: #C92035;
          background: #FDFDFC;
        }

        .coin-sort {
          height: 42px;
          border-radius: 999px;
          border: 1px solid #D1DFDE;
          background: #FDFDFC;
          color: #073B3F;
          padding: 0 42px 0 16px;
          font-weight: 900;
          outline: none;
        }

        .coins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: clamp(18px, 1.8vw, 28px);
          padding-bottom: 64px;
        }

        .coins-catalog-layout {
          display: grid;
          grid-template-columns: 286px minmax(0, 1fr);
          gap: clamp(22px, 2vw, 34px);
          align-items: start;
        }

        .coins-results {
          min-width: 0;
        }

        .coin-sidebar {
          position: sticky;
          top: 18px;
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          border: 1px solid #D1DFDE;
          border-radius: 26px;
          background: rgba(253,253,252,0.96);
          box-shadow: 0 18px 48px rgba(7,59,63,0.09);
          scrollbar-width: thin;
          scrollbar-color: #BDCFCE transparent;
        }

        .coin-sidebar-head {
          padding: 24px 24px 20px;
          border-bottom: 1px solid #E1E9E8;
          background: linear-gradient(135deg, rgba(231,237,236,0.8), rgba(253,253,252,0.96));
        }

        .coin-sidebar-head span,
        .coin-filter-title {
          display: block;
          color: #BB8958;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .coin-sidebar-head h2 {
          margin: 6px 0 4px;
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          font-weight: 500;
        }

        .coin-sidebar-head p {
          color: #7A8987;
          font-size: 13px;
          font-weight: 800;
        }

        .coin-filter-group {
          padding: 21px 22px;
          border-bottom: 1px solid #E1E9E8;
        }

        .coin-filter-options {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .coin-filter-option {
          width: 100%;
          min-height: 43px;
          padding: 0 13px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #264E50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          text-align: left;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
        }

        .coin-filter-option:hover {
          background: #F3F7F6;
          border-color: #D1DFDE;
          transform: translateX(2px);
        }

        .coin-filter-option.active {
          background: #0C4044;
          border-color: #0C4044;
          color: #FDFDFC;
          box-shadow: 0 10px 24px rgba(7,59,63,0.14);
        }

        .coin-filter-option i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #CCA881;
          flex: 0 0 auto;
        }

        .coin-weight-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .coin-weight-option {
          min-height: 39px;
          border: 1px solid #D1DFDE;
          border-radius: 11px;
          background: #F8FAF9;
          color: #264E50;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .coin-weight-option.active {
          border-color: #BB8958;
          background: #FBF3EB;
          color: #8B582D;
          box-shadow: inset 0 0 0 1px #BB8958;
        }

        .coin-sidebar-clear {
          width: calc(100% - 44px);
          min-height: 44px;
          margin: 20px 22px 22px;
          border: 1px solid #0C4044;
          border-radius: 13px;
          background: #FDFDFC;
          color: #073B3F;
          font-weight: 950;
          cursor: pointer;
        }

        .coin-premium-card {
          width: 100%;
          max-width: 320px;
          border-radius: 18px;
          background: #FDFDFC;
          border: 1px solid #D1DFDE;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 18px 48px rgba(7,59,63,0.09);
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        .coin-premium-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 76px rgba(7,59,63,0.16);
          border-color: #BDCFCE;
        }

        .coin-premium-image {
          position: relative;
          aspect-ratio: 1 / 0.88;
          min-height: 0;
          background:
            radial-gradient(circle at center, rgba(204,168,129,0.22), transparent 38%),
            #F3E8DE;
          overflow: hidden;
        }

        .coin-premium-card.silver .coin-premium-image {
          background:
            radial-gradient(circle at center, rgba(189,207,206,0.38), transparent 40%),
            #E7EDEC;
        }

        .coin-premium-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 520ms ease;
        }

        .coin-premium-image .coin-placeholder {
          object-fit: contain;
          padding: 34px;
        }

        .coin-premium-card:hover .coin-premium-image img {
          transform: scale(1.065);
        }

        .coin-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: grid;
          gap: 8px;
        }

        .coin-badges span {
          width: max-content;
          border-radius: 999px;
          background: #0C4044;
          color: #FDFDFC;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 20px rgba(7,59,63,0.16);
        }

        .coin-premium-card.gold .coin-badges span:first-child {
          background: #BB8958;
        }

        .coin-wish {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(7,59,63,0.12);
          background: rgba(253,253,252,0.92);
          color: #073B3F;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 2;
        }

        .coin-wish.active {
          background: #C92035;
          color: #FDFDFC;
        }

        .coin-view {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          min-height: 40px;
          border: 0;
          border-radius: 999px;
          background: rgba(7,59,63,0.92);
          color: #FDFDFC;
          font-weight: 900;
          letter-spacing: 0.04em;
          cursor: pointer;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .coin-premium-card:hover .coin-view {
          opacity: 1;
          transform: translateY(0);
        }

        .coin-premium-info {
          padding: 14px 14px 16px;
        }

        .coin-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #7A8987;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .coin-premium-info h3 {
          min-height: 40px;
          margin: 8px 0;
          color: #111817;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          line-height: 1.1;
          font-weight: 500;
        }

        .coin-price-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .coin-price-row strong {
          color: #073B3F;
          font-size: 17px;
          font-weight: 950;
        }

        .coin-price-row del {
          color: #7A8987;
          font-size: 14px;
          font-weight: 800;
        }

        .coin-rate-line {
          margin-top: 9px;
          color: #7A8987;
          font-size: 12px;
          font-weight: 800;
        }

        .coins-empty,
        .coins-loading {
          min-height: 360px;
          border-radius: 30px;
          background: #FDFDFC;
          border: 1px solid #D1DFDE;
          display: grid;
          place-items: center;
          text-align: center;
          box-shadow: 0 18px 48px rgba(7,59,63,0.08);
          margin-bottom: 80px;
        }

        .coin-loader {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 4px solid #D1DFDE;
          border-top-color: #073B3F;
          animation: spinSlow 900ms linear infinite;
          margin: 0 auto 16px;
        }

        @media (max-width: 1280px) {
          .coins-grid {
            grid-template-columns: repeat(auto-fill, minmax(230px, 300px));
          }
        }

        @media (max-width: 920px) {
          .coins-hero,
          .coins-toolbar {
            grid-template-columns: 1fr;
          }

          .coins-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }

          .coins-catalog-layout {
            grid-template-columns: 1fr;
          }

          .coin-sidebar {
            position: static;
            max-height: none;
          }

          .coin-sidebar-body {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .coin-collection-rail-track {
            display: flex;
            overflow-x: auto;
            padding: 4px 2px 10px;
            scroll-snap-type: x proximity;
            scrollbar-width: thin;
          }

          .coin-quick-link {
            flex: 0 0 104px;
            scroll-snap-align: start;
          }

          .coin-filter-group {
            border-bottom: 0;
          }

          .coin-premium-card {
            max-width: none;
          }
        }

        @media (max-width: 620px) {
          .coins-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .coins-title-panel,
          .coins-rate-panel {
            border-radius: 24px;
          }

          .coins-grid {
            grid-template-columns: 1fr;
          }

          .coin-sidebar-body {
            grid-template-columns: 1fr;
          }

          .coin-filter-group:first-child {
            border-bottom: 1px solid #E1E9E8;
          }

          .coin-premium-card {
            max-width: none;
          }
        }
      `}</style>

      <main className="coins-shell">
        <section className="coins-hero">
          <div className="coins-title-panel">
            <div className="coins-kicker">Certified Coin Collection</div>
            <h1>{isGold ? 'Gold Coins' : 'Silver Coins'}</h1>
            <p>
              {loading ? 'Curating coin products...' : `${sortedProducts.length} coin designs available`}
              {weightFilter ? ` - ${weightFilter}` : ''}
            </p>
          </div>

          <aside className="coins-rate-panel">
            <img src={isGold ? goldCoin : silverCoin} alt="" />
            <div>
              <span>Live backend rate</span>
              <strong>{formatMoney(liveRate)}</strong>
              <span>{isGold ? `${(gradeFilter || '22k').toUpperCase()} gold per gram` : 'Silver 999 per gram'}</span>
            </div>
            <span>Coin prices use saved product prices or live-rate calculation when weight is available.</span>
          </aside>
        </section>

        <section className="coins-toolbar">
          <div className="coin-filter-row">
            <button className={`coin-chip ${!isGold ? 'active' : ''}`} type="button" onClick={() => selectMetal('silver')}>
              Silver 999
            </button>
            <button className={`coin-chip ${isGold && gradeFilter !== '24k' ? 'active' : ''}`} type="button" onClick={() => selectMetal('gold', '22k')}>
              Gold 22K
            </button>
            <button className={`coin-chip ${isGold && gradeFilter === '24k' ? 'active' : ''}`} type="button" onClick={() => selectMetal('gold', '24k')}>
              Gold 24K
            </button>
            {weightFilter && (
              <>
                <button className="coin-chip active" type="button">{weightFilter}</button>
                <button
                  className="coin-chip clear"
                  type="button"
                  onClick={() => {
                    let url = `/collection/coins?metal=${metalFilter}`
                    if (gradeFilter) url += `&grade=${gradeFilter}`
                    navigate(url)
                  }}
                >
                  Clear weight
                </button>
              </>
            )}
          </div>

          <select className="coin-sort" value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="weight-low">Weight: Low to High</option>
            <option value="weight-high">Weight: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </section>

        <section className="coin-collection-rail" aria-label="Quick coin collections">
          <div className="coin-collection-rail-head">
            <div>
              <span>Explore by weight</span>
              <h2>Popular Coin Collections</h2>
            </div>
          </div>
          <div className="coin-collection-rail-track">
            {coinQuickLinks.map(item => {
              const active = metalFilter === item.metal && (!item.grade || gradeFilter === item.grade) && (!item.weight || weightFilter === item.weight)
              const params = new URLSearchParams({ metal: item.metal })
              if (item.grade) params.set('grade', item.grade)
              if (item.weight) params.set('weight', item.weight)
              return (
                <button
                  key={item.label}
                  className={`coin-quick-link ${active ? 'active' : ''}`}
                  type="button"
                  onClick={() => navigate(`/collection/coins?${params.toString()}`)}
                >
                  <span className="coin-quick-link-image"><img src={item.image} alt="" /></span>
                  <span>{item.label}</span>
                </button>
              )
            })}
            <button className="coin-quick-link" type="button" onClick={() => navigate('/collection/coins')}>
              <span className="coin-quick-view-all">→</span>
              <span>View All</span>
            </button>
          </div>
        </section>

        <div className="coins-catalog-layout">
          <aside className="coin-sidebar" aria-label="Coin catalogue filters">
            <div className="coin-sidebar-head">
              <span>Refine collection</span>
              <h2>Shop By</h2>
              <p>{loading ? 'Loading catalogue...' : `${sortedProducts.length} curated coin${sortedProducts.length === 1 ? '' : 's'}`}</p>
            </div>

            <div className="coin-sidebar-body">
              <div className="coin-filter-group">
                <span className="coin-filter-title">Metal &amp; purity</span>
                <div className="coin-filter-options">
                  <button className={`coin-filter-option ${!isGold ? 'active' : ''}`} type="button" onClick={() => selectMetal('silver')}>
                    <span>Silver 999</span><i />
                  </button>
                  <button className={`coin-filter-option ${isGold && gradeFilter !== '24k' ? 'active' : ''}`} type="button" onClick={() => selectMetal('gold', '22k')}>
                    <span>Gold 22K</span><i />
                  </button>
                  <button className={`coin-filter-option ${isGold && gradeFilter === '24k' ? 'active' : ''}`} type="button" onClick={() => selectMetal('gold', '24k')}>
                    <span>Gold 24K</span><i />
                  </button>
                </div>
              </div>

              <div className="coin-filter-group">
                <span className="coin-filter-title">Coin weight</span>
                <div className="coin-weight-options">
                  {coinWeights.map(weight => (
                    <button
                      key={weight}
                      className={`coin-weight-option ${weightFilter === weight ? 'active' : ''}`}
                      type="button"
                      onClick={() => selectWeight(weightFilter === weight ? '' : weight)}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="coin-sidebar-clear" type="button" onClick={() => navigate('/collection/coins?metal=silver')}>
              Clear all filters
            </button>
          </aside>

          <div className="coins-results">
            {loading ? (
              <section className="coins-loading">
                <div>
                  <div className="coin-loader" />
                  <strong>Loading coin catalogue...</strong>
                </div>
              </section>
            ) : sortedProducts.length === 0 ? (
              <section className="coins-empty">
                <div>
                  <img src={isGold ? goldCoin : silverCoin} alt="" style={{ width: 92, height: 92, objectFit: 'contain', opacity: 0.42, marginBottom: 18 }} />
                  <h2 style={{ color: '#073B3F', fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 500 }}>No coins found</h2>
                  <p style={{ marginTop: 10, color: '#7A8987', fontWeight: 800 }}>
                    {weightFilter ? `${weightFilter} coins are not added yet.` : 'No coins are available yet.'}
                  </p>
                  <button className="coin-chip active" style={{ marginTop: 20 }} type="button" onClick={() => selectWeight('')}>
                    Clear weight filter
                  </button>
                </div>
              </section>
            ) : (
              <section className="coins-grid">
                {sortedProducts.map(product => (
                  <CoinCard
                    key={product.id}
                    product={product}
                    rates={rates}
                    navigate={navigate}
                    wishlisted={wishlistedIds.has(product.id)}
                    onWishlist={toggleWishlist}
                  />
                ))}
              </section>
            )}
          </div>
        </div>
      </main>

      <CustomerFooter />
    </div>
  )
}


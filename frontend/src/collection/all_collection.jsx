import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import CustomerFooter from './CustomerFooter'

const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

const categoryTiles = [
  { label: 'Necklaces', category: 'necklaces', count: '478+', image: '/diamond_necklas.jpg' },
  { label: 'Earrings', category: 'earrings', count: '965+', image: '/diamond Earings.jpg' },
  { label: 'Rings', category: 'rings', count: '678+', image: '/diamond_ring.jpg' },
  { label: 'Bracelets', category: 'bracelets', count: '412+', image: '/wedding_bracelet.jpg' },
  { label: 'Pendants', category: 'pendants', count: '329+', image: '/platinum_necklas.jpg' },
  { label: 'Chains', category: 'chains', count: '286+', image: '/wedding_chain.jpg' },
  { label: 'Mangalsutra', category: 'mangalsutra', count: '193+', image: '/black_necklaces.png' },
  { label: 'Bangles', category: 'bangles', count: '551+', image: '/wedding_bangesh.jpg' },
  { label: 'Necklace Set', category: 'necklaces', count: '241+', image: '/wedding_necklaces.jpg' },
  { label: 'Nose Pin', category: 'nosepin', count: '156+', image: '/diamond Earings.jpg' },
]

const goldRail = [
  { label: 'Necklaces', category: 'necklaces', image: '/gold-women.png' },
  { label: 'Earrings', category: 'earrings', image: '/diamond Earings.jpg' },
  { label: 'Rings', category: 'rings', image: '/diamond_ring.jpg' },
  { label: 'Bangles', category: 'bangles', image: '/wedding_bangesh.jpg' },
  { label: 'Chains', category: 'chains', image: '/wedding_chain.jpg' },
  { label: 'Pendants', category: 'pendants', image: '/wedding_necklaces.jpg' },
  { label: 'Mangalsutra', category: 'mangalsutra', image: '/black_necklaces.png' },
  { label: 'Gold Coins', route: '/collection/coins?metal=gold', image: '/gold-coin.jpg.jpeg' },
]

const filterCategories = [
  ['All Jewellery', '/collection/all'],
  ['Necklaces', '/collection/all?category=necklaces'],
  ['Earrings', '/collection/all?category=earrings'],
  ['Rings', '/collection/all?category=rings'],
  ['Bracelets', '/collection/all?category=bracelets'],
  ['Pendants', '/collection/all?category=pendants'],
  ['Chains', '/collection/all?category=chains'],
  ['Mangalsutra', '/collection/all?category=mangalsutra'],
  ['Bangles', '/collection/all?category=bangles'],
  ['Necklace Set', '/collection/all?category=necklaces'],
  ['Nose Pin', '/collection/all?category=nosepin'],
  ['Anklets', '/collection/all?category=anklets'],
  ['Coin & Bars', '/collection/coins'],
]

const goldFilterCategories = [
  ['All Gold Jewellery', '/collection/all?metal=gold'],
  ['Gold Necklaces', '/collection/all?metal=gold&category=necklaces'],
  ['Gold Earrings', '/collection/all?metal=gold&category=earrings'],
  ['Gold Rings', '/collection/all?metal=gold&category=rings'],
  ['Gold Bangles', '/collection/all?metal=gold&category=bangles'],
  ['Gold Chains', '/collection/all?metal=gold&category=chains'],
  ['Gold Pendants', '/collection/all?metal=gold&category=pendants'],
  ['Mangalsutra', '/collection/all?metal=gold&category=mangalsutra'],
  ['Gold Nose Pin', '/collection/all?metal=gold&category=nosepin'],
  ['Gold Anklets', '/collection/all?metal=gold&category=anklets'],
  ['Coin & Bars', '/collection/coins?metal=gold'],
]

const promos = [
  { title: 'Daily Wear', text: 'Elegant designs for everyday beauty.', route: '/collection/all?dailywear=true', image: '/dailywera.png' },
  { title: 'Wedding Collection', text: 'Make your big day even more special.', route: '/collection/all?wedding=true', image: '/wedding_necklaces.jpg' },
  { title: 'Diamond Collection', text: 'Brilliance that lasts forever.', route: '/collection/all?metal=diamond', image: '/diamond_ring.jpg' },
  { title: 'Silver Collection', text: 'Pure. Elegant. Timeless.', route: '/collection/all?metal=silver', image: '/silver-coin.jpg.jpeg' },
]

const trustItems = [
  ['100% BIS Hallmarked', 'hallmark'],
  ['Lifetime Exchange', 'exchange'],
  ['Secure Payments', 'lock'],
  ['Free Shipping Above Rs.4,999', 'truck'],
]


const metalCopy = {
  gold: {
    title: 'Gold Jewellery',
    crumb: 'Gold',
    subtitle: 'Timeless gold jewellery crafted with purity and perfection.',
    accent: '#a36b18',
    bannerTitle: 'Shine in Every Moment',
    bannerText: 'Explore our exclusive gold collections designed to celebrate you.',
    bannerImage: '/wedding_necklaces.jpg',
    sideImage: '/gold_Woman.jpg',
    sideTitle: 'Heritage. Purity. Timeless Gold.',
  },
  diamond: {
    title: 'Diamond Jewellery',
    crumb: 'Diamond',
    subtitle: 'Radiant pieces designed for brilliance, elegance and everyday luxury.',
    accent: '#65758a',
    bannerTitle: 'Brilliance for Every Occasion',
    bannerText: 'Discover rings, earrings and necklaces with lasting sparkle.',
    bannerImage: '/diamond_woman.jpg',
    sideImage: '/diamond-women.png',
    sideTitle: 'Brilliance Crafted. Forever Loved.',
  },
  silver: {
    title: 'Silver Jewellery',
    crumb: 'Silver',
    subtitle: 'Pure silver designs for gifting, daily style and classic moments.',
    accent: '#6b7280',
    bannerTitle: 'Pure. Elegant. Everyday.',
    bannerText: 'Explore silver jewellery and coins with trusted purity.',
    bannerImage: '/silver-coin.jpg.jpeg',
    sideImage: '/dailywear_woman.jpg',
    sideTitle: 'Silver Grace. Everyday Shine.',
  },
  platinum: {
    title: 'Platinum Jewellery',
    crumb: 'Platinum',
    subtitle: 'Modern platinum pieces with a refined premium finish.',
    accent: '#788392',
    bannerTitle: 'Minimal Luxury in Platinum',
    bannerText: 'Premium designs for moments that deserve quiet elegance.',
    bannerImage: '/platinum_ring.jpg',
    sideImage: '/platinum_necklas.jpg',
    sideTitle: 'Modern. Rare. Refined.',
  },
}

function Icon({ type, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (type === 'truck') return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="8" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
  if (type === 'lock') return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v3" /></svg>
  if (type === 'exchange') return <svg {...common}><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18.5 10A7 7 0 0 0 6.2 7.8" /><path d="M5.5 14A7 7 0 0 0 17.8 16.2" /></svg>
  if (type === 'grid') return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
  if (type === 'list') return <svg {...common}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
  if (type === 'arrow') return <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
  return <svg {...common}><path d="M12 3 20 7v5c0 4.8-3.2 7.8-8 9-4.8-1.2-8-4.2-8-9V7l8-4Z" /><path d="M12 8v7" /><path d="M9.5 12h5" /></svg>
}

function getImageUrl(img) {
  if (!img) return null
  const path = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`
}

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Rs. 0'
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function productPrice(product, rates) {
  const metal = product.metal?.toLowerCase()
  const grade = product.grade?.toLowerCase()
  const rate = metal === 'gold'
    ? grade === '24k' ? rates.gold_24k : rates.gold_22k
    : metal === 'silver'
      ? rates.silver_999
      : metal === 'diamond'
        ? grade === '18k' ? rates.diamond_18k : rates.diamond_22k
        : metal === 'platinum'
          ? rates.platinum_92
          : 0

  const weight = Number(product.net_weight) || 0
  const making = Number(product.making_charge) || 0
  const discount = Number(product.wastage_charge) || 0
  const stone = Number(product.stone_value) || 0

  if (!rate || !weight) return Number(product.price) || 0
  const rateWithMaking = rate + (rate * making / 100)
  return Math.round(((weight * (rateWithMaking - (rateWithMaking * discount / 100))) + stone) * 1.03)
}

function normalizeProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  return []
}

function CategoryTile({ item, navigate }) {
  const route = item.route || `/collection/all?category=${item.category}`
  return (
    <button className="an-category-card" type="button" onClick={() => navigate(route)}>
      <img src={item.image} alt={item.label} />
      <div>
        <strong>{item.label}</strong>
        <span>{item.count || 'Explore'} Designs</span>
      </div>
      <span className="an-round-arrow"><Icon type="arrow" size={16} /></span>
    </button>
  )
}

function ProductCard({ product, rates, navigate }) {
  const image = getImageUrl(product.images?.[0]) || '/logo.png'
  const price = productPrice(product, rates)
  const reviews = 71 + ((product.id || 1) * 11) % 58
  const goProduct = () => navigate(`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`)

  const addCart = async event => {
    event.stopPropagation()
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    try {
      await api.post('/cart/', { product: product.id, qty: 1 })
      window.dispatchEvent(new Event('bb_cart_update'))
    } catch {}
  }

  return (
    <article className="an-product-card" onClick={goProduct}>
      <div className="an-product-image">
        <img src={image} alt={product.name} />
        <button className="an-heart" type="button" onClick={event => event.stopPropagation()} aria-label="Wishlist">â™¡</button>
      </div>
      <div className="an-product-body">
        <h3>{product.name}</h3>
        <p>{(product.grade || product.metal || 'Jewellery').toUpperCase()} {product.metal || 'Jewellery'} Â· {Number(product.net_weight || 0).toFixed(2)} g</p>
        <strong>{money(price)}</strong>
        <div className="an-rating">
          <span>â˜…â˜…â˜…â˜…â˜…</span>
          <small>({reviews})</small>
          <button type="button" onClick={addCart} aria-label="Add to cart"><Icon type="lock" size={15} /></button>
        </div>
      </div>
    </article>
  )
}

function FilterPanel({ activeRoute, navigate, metalFilter }) {
  const categories = metalFilter === 'gold' ? goldFilterCategories : filterCategories
  const collapses = metalFilter === 'gold'
    ? ['Price Range', 'Occasion', 'Gender', 'Purity', 'Collection']
    : ['Price', 'Occasion', 'Gender', 'Metal Type', 'Collection']

  return (
    <aside className="an-filter">
      <h2>{metalFilter === 'gold' ? 'FILTERS' : 'Shop By'}</h2>
      <div className="an-filter-section">
        <div className="an-filter-title">Category <span>{metalFilter === 'gold' ? '^' : '-'}</span></div>
        {categories.map(([label, route]) => (
          <button
            className={activeRoute === route ? 'active' : ''}
            type="button"
            key={label}
            onClick={() => navigate(route)}
          >
            {label}
          </button>
        ))}
      </div>
      {collapses.map(label => (
        <div className="an-filter-collapse" key={label}>
          <strong>{label}</strong>
          <span>+</span>
        </div>
      ))}
      <button className="an-clear" type="button" onClick={() => navigate('/collection/all')}>Clear All Filters</button>
    </aside>
  )
}

function RightRail({ copy }) {
  return (
    <aside className="an-right-rail">
      <div className="an-trust-box">
        {trustItems.map(([label, icon]) => (
          <div className="an-trust-item" key={label}>
            <Icon type={icon} size={29} />
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      <div className="an-side-promo">
        <img src={copy.sideImage} alt="" />
        <div>
          <h3>{copy.sideTitle}</h3>
          <button type="button">Explore Now</button>
        </div>
      </div>
    </aside>
  )
}

export default function AllCollection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const metalFilter = searchParams.get('metal')
  const categoryFilter = searchParams.get('category')
  const genderFilter = searchParams.get('gender')
  const occasionFilter = searchParams.get('occasion')
  const priceFilter = searchParams.get('price')
  const searchFilter = searchParams.get('search')
  const isWedding = searchParams.get('wedding') === 'true'
  const isDailywear = searchParams.get('dailywear') === 'true'
  const [products, setProducts] = useState([])
  const [rates, setRates] = useState({})
  const [sortBy, setSortBy] = useState('popular')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/metal-rates/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        setRates({
          gold_22k: Number(data?.gold_22k) || 0,
          gold_24k: Number(data?.gold_24k) || 0,
          silver_999: Number(data?.silver_999) || 0,
          diamond_18k: Number(data?.diamond_18k) || 0,
          diamond_22k: Number(data?.diamond_22k) || 0,
          platinum_92: Number(data?.platinum_92) || 0,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (metalFilter) params.set('metal', metalFilter)
        if (categoryFilter) params.set('category', categoryFilter)
        if (genderFilter) params.set('gender', genderFilter)
        if (occasionFilter) params.set('occasion', occasionFilter)
        if (priceFilter) params.set('price', priceFilter)
        if (searchFilter) params.set('search', searchFilter)
        if (isWedding) params.set('occasion', 'Wedding')
        if (isDailywear) params.set('occasion', 'Casual Wear')
        const res = await api.get(`/jewelry-products/${params.toString() ? `?${params.toString()}` : ''}`)
        setProducts(normalizeProductList(res.data))
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [metalFilter, categoryFilter, genderFilter, occasionFilter, priceFilter, searchFilter, isWedding, isDailywear])

  const visibleProducts = useMemo(() => {
    const list = [...products]
    if (sortBy === 'price-low') list.sort((a, b) => productPrice(a, rates) - productPrice(b, rates))
    if (sortBy === 'price-high') list.sort((a, b) => productPrice(b, rates) - productPrice(a, rates))
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    return list
  }, [products, rates, sortBy])

  const copy = metalCopy[metalFilter] || {
    title: categoryFilter
      ? `${categoryFilter.charAt(0).toUpperCase()}${categoryFilter.slice(1)}`
      : searchFilter
        ? `Search: ${searchFilter}`
        : isWedding
          ? 'Wedding Collection'
          : isDailywear
            ? 'Daily Wear'
            : 'All Jewellery',
    crumb: 'All Jewellery',
    subtitle: 'Explore our wide range of timeless designs crafted for every you.',
    accent: '#073B3F',
    bannerTitle: 'Heritage Crafted For Generations',
    bannerText: 'Explore jewellery collections made for every occasion.',
    bannerImage: '/black_necklaces.png',
    sideImage: '/gold_Woman.jpg',
    sideTitle: 'Heritage Crafted. For Generations.',
  }

  const activeRoute = metalFilter === 'gold'
    ? categoryFilter ? `/collection/all?metal=gold&category=${categoryFilter}` : '/collection/all?metal=gold'
    : categoryFilter ? `/collection/all?category=${categoryFilter}` : '/collection/all'

  const productResults = loading ? (
    <section className="an-loading">Loading products...</section>
  ) : visibleProducts.length ? (
    <section className="an-products">
      {visibleProducts.map(product => (
        <ProductCard key={product.id} product={product} rates={rates} navigate={navigate} />
      ))}
    </section>
  ) : (
    <section className="an-empty">No products found. Try another collection.</section>
  )

  return (
    <div className="an-page">
      <style>{`
        .an-page {
          min-height: 100vh;
          background: #fff;
          color: #071f22;
          font-family: Inter, "Montserrat", system-ui, sans-serif;
        }

        .an-shell {
          width: min(100% - 76px, 1810px);
          margin: 0 auto;
        }

        .an-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
          padding: 30px 0 20px;
        }

        .an-content {
          min-width: 0;
        }

        .an-filter,
        .an-trust-box,
        .an-side-promo,
        .an-newsletter {
          border: 1px solid #e7e1d9;
          box-shadow: 0 12px 36px rgba(7,31,34,0.06);
        }

        .an-filter {
          position: sticky;
          top: 192px;
          align-self: start;
          border-radius: 10px;
          overflow: hidden;
          background: linear-gradient(180deg,#fdfaf7,#f8f4ef);
        }

        .an-filter h2 {
          padding: 20px 20px 16px;
          font-size: 16px;
          font-weight: 900;
          border-bottom: 1px solid #e7e1d9;
        }

        .an-filter-section {
          padding: 14px 18px 16px;
          border-bottom: 1px solid #e7e1d9;
        }

        .an-filter-title,
        .an-filter-collapse {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #111;
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .an-filter-section button {
          width: 100%;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #111;
          display: block;
          padding: 9px 12px;
          text-align: left;
          cursor: pointer;
          font-weight: 600;
        }

        .an-filter-section button.active,
        .an-filter-section button:hover {
          background: #eaf1f0;
          color: #073B3F;
        }

        .an-filter-collapse {
          padding: 14px 18px;
          margin: 0;
          border-bottom: 1px solid #e7e1d9;
        }

        .an-clear {
          width: calc(100% - 36px);
          min-height: 42px;
          margin: 16px 18px 24px;
          border: 1px solid #cfc6ba;
          border-radius: 6px;
          background: #fff;
          color: #073B3F;
          font-weight: 900;
          cursor: pointer;
        }

        .an-main-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: start;
          margin: 6px 0 18px;
        }

        .an-breadcrumb {
          color: #446266;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .an-title h1 {
          margin: 0;
          color: ${copy.accent};
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(32px, 3vw, 42px);
          line-height: 1;
          font-weight: 600;
        }

        .an-title-mark {
          width: 226px;
          height: 16px;
          margin: 10px 0 8px;
          background: linear-gradient(90deg, ${copy.accent}, transparent 44%, ${copy.accent});
          mask: linear-gradient(#000,#000) center/100% 1px no-repeat;
          opacity: .8;
        }

        .an-title p {
          margin: 0;
          font-size: 16px;
          color: #111;
        }

        .an-toolbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 12px;
          color: #111;
          font-weight: 800;
          min-width: 0;
        }

        .an-toolbar select {
          min-width: min(100%, 178px);
          height: 46px;
          border: 1px solid #ded8d1;
          border-radius: 12px;
          background: #fff;
          padding: 0 16px;
          font-weight: 800;
          outline: none;
        }

        .an-view-btn {
          width: 46px;
          height: 46px;
          border: 1px solid #ded8d1;
          border-radius: 12px;
          background: #fff;
          color: #073B3F;
          display: grid;
          place-items: center;
        }

        .an-view-btn.active {
          background: #eaf4f2;
        }

        .an-category-grid {
          display: none;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 20px;
        }

        .an-category-card {
          min-height: 220px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(145deg,#fbf6ef,#fff);
          box-shadow: 0 12px 34px rgba(92,66,41,.07);
          padding: 18px 16px;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          text-align: center;
          transition: transform .22s ease, box-shadow .22s ease;
        }

        .an-category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 44px rgba(92,66,41,.12);
        }

        .an-category-card img {
          width: 128px;
          height: 118px;
          object-fit: contain;
          margin: 0 auto 14px;
          display: block;
          transition: transform .28s ease;
        }

        .an-category-card:hover img {
          transform: scale(1.06);
        }

        .an-category-card strong {
          display: block;
          color: #111;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .an-category-card span {
          color: #111;
          font-size: 13px;
        }

        .an-round-arrow {
          position: absolute;
          right: 16px;
          bottom: 20px;
          width: 30px;
          height: 30px;
          border: 1px solid #cfd8d6;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #073B3F;
          background: #fff;
        }

        .an-promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
          gap: 18px;
          margin-top: 28px;
        }

        .an-promo {
          min-height: 220px;
          border: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #f6f1eb;
          position: relative;
          text-align: left;
          padding: 24px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          isolation: isolate;
        }

        .an-promo::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(90deg, rgba(253,244,229,0.96) 0%, rgba(253,244,229,0.82) 42%, rgba(253,244,229,0.18) 100%);
        }

        .an-promo img {
          position: absolute;
          inset: 0;
          z-index: -2;
          width: 100%;
          height: 100%;
          min-height: 0;
          object-fit: cover;
          opacity: .88;
        }

        .an-promo h3 {
          position: relative;
          z-index: 1;
          max-width: 72%;
          margin: 0;
          font-family: Georgia, serif;
          font-size: clamp(20px, 1.35vw, 26px);
          font-weight: 500;
          line-height: 1.12;
          color: #073B3F;
        }

        .an-promo p,
        .an-promo span {
          position: relative;
          z-index: 1;
          max-width: 70%;
          color: #111;
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: normal;
        }

        .an-promo p {
          margin: 12px 0 0;
          font-size: 14px;
        }

        .an-promo span {
          display: inline-flex;
          margin-top: 14px;
          color: #073B3F;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
        }

        .an-metal-banner {
          min-height: 176px;
          border-radius: 10px;
          padding: 28px 34px;
          margin-bottom: 24px;
          background:
            linear-gradient(90deg, rgba(253,244,229,.98), rgba(253,244,229,.82) 46%, rgba(253,244,229,.2)),
            url('${copy.bannerImage}');
          background-size: cover;
          background-position: right center;
          display: grid;
          grid-template-columns: minmax(240px, .65fr) 1fr;
          align-items: center;
          overflow: hidden;
        }

        .an-metal-banner h2 {
          margin: 0 0 8px;
          font-family: Georgia, serif;
          font-size: 27px;
          font-weight: 500;
        }

        .an-metal-banner p {
          margin: 0 0 18px;
          max-width: 360px;
          line-height: 1.55;
        }

        .an-primary-btn {
          border: 0;
          border-radius: 6px;
          background: #073B3F;
          color: #fff;
          min-height: 38px;
          padding: 0 18px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }

        .an-banner-badges {
          display: flex;
          gap: clamp(28px, 5vw, 70px);
          align-items: center;
          justify-content: center;
        }

        .an-banner-badges div {
          text-align: center;
          color: #6b4b27;
          font-weight: 800;
          font-size: 13px;
        }

        .an-cat-rail {
          display: grid;
          grid-template-columns: repeat(9, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          align-items: start;
        }

        .an-cat-rail button {
          border: 0;
          background: transparent;
          cursor: pointer;
          text-align: center;
          font-weight: 800;
        }

        .an-cat-rail img {
          width: 78px;
          height: 78px;
          border-radius: 50%;
          object-fit: cover;
          background: #f7f1ea;
          margin: 0 auto 9px;
          box-shadow: 0 10px 28px rgba(92,66,41,.08);
        }

        .an-cat-rail .view-all {
          width: 78px;
          height: 78px;
          border-radius: 50%;
          border: 1px solid #f0d8b8;
          display: grid;
          place-items: center;
          margin: 0 auto 9px;
          color: #a36b18;
          font-size: 24px;
          background: #fff5e7;
        }

        .an-products {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: clamp(22px, 2.2vw, 34px);
          margin-top: 30px;
          align-items: start;
        }

        .an-product-card {
          min-width: 0;
          border: 1px solid #eadfd3;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(92,66,41,.07);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .an-product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 38px rgba(92,66,41,.12);
        }

        .an-product-image {
          position: relative;
          aspect-ratio: 1 / 1;
          min-height: clamp(210px, 21vw, 300px);
          background: #fbf4eb;
          overflow: hidden;
        }

        .an-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .35s ease;
        }

        .an-product-card:hover img {
          transform: scale(1.05);
        }

        .an-heart {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 30px;
          height: 30px;
          border: 0;
          background: transparent;
          font-size: 23px;
          cursor: pointer;
        }

        .an-product-body {
          padding: 13px 14px 15px;
        }

        .an-product-body h3 {
          margin: 0 0 7px;
          font-size: 14px;
          color: #111;
        }

        .an-product-body p {
          margin: 0 0 8px;
          font-size: 12px;
          color: #5e5e5e;
        }

        .an-product-body strong {
          color: #111;
          font-size: 17px;
        }

        .an-rating {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #d18414;
          font-size: 12px;
        }

        .an-rating button {
          margin-left: auto;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #073B3F;
          color: #fff;
          cursor: pointer;
        }

        .an-right-rail {
          display: none;
        }

        .an-trust-box {
          border-radius: 10px;
          background: #edf6f4;
          padding: 26px 26px 14px;
        }

        .an-trust-item {
          min-height: 72px;
          border-bottom: 1px dashed #c7d6d4;
          display: grid;
          place-items: center;
          text-align: center;
          color: #073B3F;
        }

        .an-trust-item:last-child {
          border-bottom: 0;
        }

        .an-trust-item strong {
          max-width: 150px;
          line-height: 1.25;
          font-size: 14px;
        }

        .an-side-promo {
          position: relative;
          min-height: 384px;
          overflow: hidden;
          border-radius: 10px;
          color: #fff;
          background: #a36b18;
        }

        .an-side-promo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
        }

        .an-side-promo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 35%, rgba(77,41,12,.76));
        }

        .an-side-promo div {
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 26px;
          z-index: 1;
        }

        .an-side-promo h3 {
          font-family: Georgia, serif;
          font-size: 25px;
          line-height: 1.15;
          margin: 0 0 20px;
          font-weight: 500;
        }

        .an-side-promo button {
          border: 0;
          border-radius: 6px;
          min-height: 38px;
          padding: 0 26px;
          background: #fff;
          color: #8b551e;
          text-transform: uppercase;
          font-weight: 900;
        }


        .an-loading,
        .an-empty {
          min-height: 280px;
          border-radius: 12px;
          border: 1px solid #eadfd3;
          display: grid;
          place-items: center;
          background: #fff;
          font-weight: 900;
        }

        @media (max-width: 1440px) {
          .an-shell { width: min(100% - 48px, 1810px); }
          .an-layout { grid-template-columns: 250px minmax(0, 1fr); gap: 20px; }
          .an-category-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr)); }
        }

        @media (max-width: 1120px) {
          .an-layout { grid-template-columns: 230px minmax(0, 1fr); }
          .an-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .an-promo-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
          .an-cat-rail { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
        }

        @media (max-width: 820px) {
          .an-shell { width: min(100% - 28px, 1810px); }
          .an-layout { grid-template-columns: 1fr; padding-top: 18px; }
          .an-filter { position: static; }
          .an-main-head { grid-template-columns: 1fr; }
          .an-category-grid,
          .an-products { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
          .an-metal-banner { grid-template-columns: 1fr; }
          .an-banner-badges { display: none; }
        }

        @media (max-width: 520px) {
          .an-category-grid,
          .an-promo-grid,
          .an-products { grid-template-columns: 1fr; }
          .an-promo { min-height: 190px; padding: 18px; }
          .an-products { gap: 18px; margin-top: 22px; }
          .an-product-image { min-height: 0; }
          .an-promo h3, .an-promo p, .an-promo span { max-width: 82%; }
          .an-cat-rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }

        }
      `}</style>

      <main className="an-shell">
        <section className="an-layout">
          <FilterPanel activeRoute={activeRoute} navigate={navigate} metalFilter={metalFilter} />

          <div className="an-content">
            <div className="an-main-head">
              <div className="an-title">
                <div className="an-breadcrumb">Home &gt; {copy.crumb}</div>
                <h1>{copy.title}</h1>
                <div className="an-title-mark" />
                <p>{copy.subtitle}</p>
              </div>
              <div className="an-toolbar">
                <span>Sort By :</span>
                <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
                  <option value="popular">Popularity</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <button className="an-view-btn active" type="button"><Icon type="grid" /></button>
                <button className="an-view-btn" type="button"><Icon type="list" /></button>
              </div>
            </div>

            {metalFilter ? (
              <>
                <section className="an-metal-banner">
                  <div>
                    <h2>{copy.bannerTitle}</h2>
                    <p>{copy.bannerText}</p>
                    <button className="an-primary-btn" type="button" onClick={() => navigate('/collection/all')}>Explore Collections</button>
                  </div>
                  <div className="an-banner-badges">
                    <div><Icon type="hallmark" /><br />22K & 18K<br />Certified Gold</div>
                    <div><Icon type="hallmark" /><br />BIS<br />Hallmarked</div>
                    <div><Icon type="exchange" /><br />Lifetime<br />Exchange</div>
                  </div>
                </section>

                <section className="an-cat-rail">
                  {goldRail.map(item => (
                    <button type="button" key={item.label} onClick={() => navigate(item.route || `/collection/all?metal=${metalFilter}&category=${item.category}`)}>
                      <img src={item.image} alt={item.label} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => navigate('/collection/all')}>
                    <span className="view-all">â†’</span>
                    <span>View All</span>
                  </button>
                </section>

                {productResults}
              </>
            ) : (
              <>
                <section className="an-category-grid">
                  {categoryTiles.map(item => (
                    <CategoryTile key={item.label} item={item} navigate={navigate} />
                  ))}
                </section>

                <section className="an-promo-grid">
                  {promos.map(item => (
                    <button className="an-promo" type="button" key={item.title} onClick={() => navigate(item.route)}>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <span>Explore Now -&gt;</span>
                      <img src={item.image} alt="" />
                    </button>
                  ))}
                </section>

                {productResults}
              </>
            )}
          </div>

          <RightRail copy={copy} />
        </section>


      </main>

      <CustomerFooter />
    </div>
  )
}



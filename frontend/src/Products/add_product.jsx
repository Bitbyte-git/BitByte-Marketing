import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const LEGACY_CATEGORIES = [
  { key: 'rings',      label: 'Rings',      emoji: '💍' },
  { key: 'necklaces',  label: 'Necklaces',  emoji: '📿' },
  { key: 'bangles',    label: 'Bangles',    emoji: '⭕' },
  { key: 'bracelets',  label: 'Bracelets',  emoji: '💎' },
  { key: 'earrings',   label: 'Earrings',   emoji: '✨' },
  { key: 'chains',     label: 'Chains',     emoji: '⛓️' },
  { key: 'coins',      label: 'Coins',      emoji: '🪙' },
]

const CATEGORIES = [
  { key: 'rings', label: 'Rings', emoji: 'R' },
  { key: 'necklaces', label: 'Necklaces', emoji: 'N' },
  { key: 'bangles', label: 'Bangles', emoji: 'B' },
  { key: 'bracelets', label: 'Bracelets', emoji: 'BR' },
  { key: 'earrings', label: 'Earrings', emoji: 'E' },
  { key: 'chains', label: 'Chains', emoji: 'C' },
  { key: 'pendants', label: 'Pendants', emoji: 'P' },
  { key: 'mangalsutra', label: 'Mangalsutra', emoji: 'M' },
  { key: 'anklets', label: 'Anklets', emoji: 'A' },
  { key: 'nosepin', label: 'Nose Pins', emoji: 'NP' },
  { key: 'toerings', label: 'Toe Rings', emoji: 'TR' },
  { key: 'cufflinks', label: 'Cufflinks', emoji: 'CF' },
  { key: 'brooches', label: 'Brooches', emoji: 'BC' },
  { key: 'tiepins', label: 'Tie Pins', emoji: 'TP' },
  { key: 'coins', label: 'Coins & Bars', emoji: 'CB' },
]

const TAGS = ['Bestseller', 'Bridal', 'Premium', 'Statement', 'Stackable', 'New', 'Limited']

const OCCASIONS = ['Wedding', 'Birthday', 'Anniversary', 'Auspicious', 'Office Wear', 'Modern Wear', 'Casual Wear', 'Traditional Wear']

const WEDDING_CATEGORIES = ['Wedding Ring', 'Wedding Necklaces', 'Wedding Chain', 'Wedding Bangles', 'Wedding Earring', ]

const GENDERS = ['all', 'women', 'men', 'kids']


const SUBCATEGORIES = {
  rings: {
    gold: ["Men's Gold Ring","Women's Gold Ring","Couple Gold Ring","Kids Gold Ring","Gold Engagement Ring","Gold Wedding Ring","Gold Stone Ring","Gold Plain Ring"],
    silver: ["Men's Silver Ring","Women's Silver Ring","Couple Silver Ring","Kids Silver Ring","Silver Engagement Ring","Silver Wedding Ring","Silver Stone Ring","Silver Plain Ring"],
    diamond: ["Men's Diamond Ring","Women's Diamond Ring","Couple Diamond Ring","Kids Diamond Ring","Diamond Engagement Ring","Diamond Wedding Ring","Diamond Solitaire Ring","Diamond Eternity Ring"],
    platinum: ["Men's Platinum Ring","Women's Platinum Ring","Couple Platinum Ring","Platinum Engagement Ring","Platinum Wedding Ring","Platinum Solitaire Ring","Platinum Plain Ring"],
  },
  necklaces: {
    gold: ["Men's Gold Necklace","Women's Gold Necklace","Couple Gold Necklace","Kids Gold Necklace","Gold Bridal Necklace","Gold Wedding Necklace","Gold Stone Necklace","Gold Plain Necklace"],
    silver: ["Men's Silver Necklace","Women's Silver Necklace","Couple Silver Necklace","Kids Silver Necklace","Silver Bridal Necklace","Silver Wedding Necklace","Silver Stone Necklace","Silver Plain Necklace"],
    diamond: ["Women's Diamond Necklace","Diamond Bridal Necklace","Diamond Pendant Necklace","Diamond Wedding Necklace","Diamond Statement Necklace","Diamond Plain Necklace"],
    platinum: ["Women's Platinum Necklace","Platinum Pendant Necklace","Platinum Wedding Necklace","Platinum Plain Necklace"],
  },
  bangles: {
    gold: ["Men's Gold Bangle","Women's Gold Bangle","Couple Gold Bangle","Kids Gold Bangle","Gold Bridal Bangle","Gold Wedding Bangle","Gold Stone Bangle","Gold Plain Bangle"],
    silver: ["Men's Silver Bangle","Women's Silver Bangle","Couple Silver Bangle","Kids Silver Bangle","Silver Bridal Bangle","Silver Wedding Bangle","Silver Stone Bangle","Silver Plain Bangle"],
    diamond: ["Women's Diamond Bangle","Diamond Bridal Bangle","Diamond Wedding Bangle","Diamond Stone Bangle","Diamond Plain Bangle"],
    platinum: ["Women's Platinum Bangle","Platinum Bridal Bangle","Platinum Wedding Bangle","Platinum Plain Bangle"],
  },
  bracelets: {
    gold: ["Men's Gold Bracelet","Women's Gold Bracelet","Couple Gold Bracelet","Kids Gold Bracelet","Gold Bridal Bracelet","Gold Wedding Bracelet","Gold Stone Bracelet","Gold Plain Bracelet","Gold Charm Bracelet","Gold Kada Bracelet"],
    silver: ["Men's Silver Bracelet","Women's Silver Bracelet","Couple Silver Bracelet","Kids Silver Bracelet","Silver Bridal Bracelet","Silver Wedding Bracelet","Silver Stone Bracelet","Silver Plain Bracelet","Silver Charm Bracelet","Silver Kada Bracelet"],
    diamond: ["Women's Diamond Bracelet","Diamond Tennis Bracelet","Diamond Bridal Bracelet","Diamond Wedding Bracelet","Diamond Charm Bracelet","Diamond Plain Bracelet"],
    platinum: ["Women's Platinum Bracelet","Platinum Tennis Bracelet","Platinum Wedding Bracelet","Platinum Charm Bracelet","Platinum Plain Bracelet"],
  },
  earrings: {
    gold: ["Men's Gold Earring","Women's Gold Earring","Kids Gold Earring","Gold Stud Earring","Gold Hoop Earring","Gold Drop Earring","Gold Stone Earring","Gold Plain Earring"],
    silver: ["Men's Silver Earring","Women's Silver Earring","Kids Silver Earring","Silver Stud Earring","Silver Hoop Earring","Silver Drop Earring","Silver Stone Earring","Silver Plain Earring"],
    diamond: ["Women's Diamond Earring","Diamond Stud Earring","Diamond Hoop Earring","Diamond Drop Earring","Diamond Jhumka Earring","Diamond Plain Earring"],
    platinum: ["Women's Platinum Earring","Platinum Stud Earring","Platinum Hoop Earring","Platinum Drop Earring","Platinum Plain Earring"],
  },
  chains: {
    gold: ["Men's Gold Chain","Women's Gold Chain","Kids Gold Chain","Gold Wedding Chain","Gold Rope Chain","Gold Box Chain","Gold Stone Chain","Gold Plain Chain"],
    silver: ["Men's Silver Chain","Women's Silver Chain","Kids Silver Chain","Silver Wedding Chain","Silver Rope Chain","Silver Box Chain","Silver Stone Chain","Silver Plain Chain"],
    diamond: ["Men's Diamond Chain","Women's Diamond Chain","Diamond Pendant Chain","Diamond Wedding Chain","Diamond Plain Chain"],
    platinum: ["Men's Platinum Chain","Women's Platinum Chain","Platinum Pendant Chain","Platinum Wedding Chain","Platinum Plain Chain"],
  },
  pendants: {
    gold: ['Gold Religious Pendant','Gold Initial Pendant','Gold Gemstone Pendant','Gold Kids Pendant','Gold Heart Pendant'],
    silver: ['Silver Religious Pendant','Silver Initial Pendant','Silver Oxidised Pendant','Silver Kids Pendant','Silver Stone Pendant'],
    diamond: ['Diamond Solitaire Pendant','Diamond Halo Pendant','Diamond Initial Pendant','Diamond Heart Pendant','Diamond Fancy Pendant'],
    platinum: ['Platinum Initial Pendant','Platinum Religious Pendant','Platinum Solitaire Pendant','Platinum Heart Pendant','Platinum Kids Pendant'],
  },
  mangalsutra: {
    gold: ['Traditional Gold Mangalsutra','Short Gold Mangalsutra','Black Bead Mangalsutra','Gold Mangalsutra Set','Beaded Gold Mangalsutra'],
    silver: ['Silver Mangalsutra','Silver Black Bead Mangalsutra','Silver Short Mangalsutra'],
    diamond: ['Diamond Mangalsutra','Single Line Diamond Mangalsutra','Diamond Pendant Mangalsutra','Diamond Mangalsutra Set','Contemporary Diamond Mangalsutra'],
    platinum: ['Platinum Mangalsutra','Platinum Black Bead Mangalsutra','Platinum Pendant Mangalsutra'],
  },
  anklets: {
    gold: ['Gold Anklet','Gold Beaded Anklet','Gold Kids Anklet','Gold Bridal Anklet'],
    silver: ['Plain Silver Anklet','Oxidised Silver Anklet','Beaded Silver Anklet','Charm Silver Anklet','Kids Silver Anklet'],
    diamond: ['Diamond Anklet','Diamond Bridal Anklet'],
    platinum: ['Platinum Anklet','Platinum Charm Anklet'],
  },
  nosepin: {
    gold: ['Gold Nose Pin','Gold Stud Nose Pin','Gold Hoop Nose Pin','Gold Bridal Nose Pin'],
    silver: ['Silver Nose Pin','Oxidised Silver Nose Pin','Silver Stud Nose Pin'],
    diamond: ['Diamond Nose Pin','Diamond Solitaire Nose Pin','Diamond Floral Nose Pin'],
    platinum: ['Platinum Nose Pin','Platinum Stud Nose Pin'],
  },
  toerings: {
    gold: ['Gold Toe Rings','Gold Bridal Toe Rings'], silver: ['Plain Silver Toe Rings','Adjustable Silver Toe Rings','Stone Silver Toe Rings','Oxidised Silver Toe Rings'], diamond: ['Diamond Toe Rings'], platinum: ['Platinum Toe Rings'],
  },
  cufflinks: {
    gold: ['Gold Cufflinks','Gold Wedding Cufflinks','Gold Initial Cufflinks'], silver: ['Silver Cufflinks','Silver Formal Cufflinks'], diamond: ['Diamond Cufflinks','Diamond Groom Cufflinks'], platinum: ['Platinum Cufflinks','Platinum Formal Cufflinks'],
  },
  brooches: {
    gold: ['Gold Brooch','Gold Groom Brooch','Gold Floral Brooch'], silver: ['Silver Brooch','Oxidised Silver Brooch'], diamond: ['Diamond Brooch','Diamond Bridal Brooch'], platinum: ['Platinum Brooch','Platinum Lapel Brooch'],
  },
  tiepins: {
    gold: ['Gold Tie Pin','Gold Initial Tie Pin'], silver: ['Silver Tie Pin','Silver Formal Tie Pin'], diamond: ['Diamond Tie Pin','Diamond Groom Tie Pin'], platinum: ['Platinum Tie Pin','Platinum Formal Tie Pin'],
  },
  coins: {
    gold: ["100 mg Gold Coin","200 mg Gold Coin","500 mg Gold Coin","1 gm Gold Coin","2 gm Gold Coin","4 gm Gold Coin","8 gm Gold Coin","16 gm Gold Coin","40 gm Gold Coin","Gold Lakshmi Coin","Gold Ganesha Coin","Gold Gift Coin"],
    silver: ["500 mg Silver Coin","1 gm Silver Coin","2 gm Silver Coin","5 gm Silver Coin","10 gm Silver Coin","20 gm Silver Coin","50 gm Silver Coin","100 gm Silver Coin","Silver Lakshmi Coin","Silver Ganesha Coin","Silver Gift Coin"],
    diamond: [],
    platinum: ["1 gm Platinum Coin","2 gm Platinum Coin","5 gm Platinum Coin","10 gm Platinum Coin","Platinum Gift Coin"],
  },
}

const getGradeOptions = (metal, category) => {
  if (metal === 'diamond') return ['18k', '22k']
  if (metal === 'platinum') return ['92']
  if (metal === 'silver') return ['999']
  if (metal === 'gold') return category === 'coins' ? ['22k', '24k'] : ['22k']
  return []
}

const getImageUrl = img => {
  if (!img) return null
  let p = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE}/${p.replace(/^\/+/, '')}`
}

export default function AddProduct() {
  const navigate = useNavigate()
  const dark = false
  const [activeCategory, setActiveCategory] = useState('rings')
  const [products, setProducts]           = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  

  // Edit modal
  const [editProduct, setEditProduct] = useState(null)
  const [editForm, setEditForm]       = useState({})
  const [editImages, setEditImages]   = useState([])
  const [editPreviews, setEditPreviews] = useState([])
  const [editMsg, setEditMsg]         = useState('')
  const [editSaving, setEditSaving]   = useState(false)
  const [editLivePrice, setEditLivePrice] = useState(null)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const bg       = 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 52%,#E7EDEC 100%)'
  const text     = '#111817'
  const subtext  = '#7A8987'
  const border   = 'rgba(189,207,206,0.78)'
  const glass    = 'rgba(253,253,252,0.94)'
  const inpBg    = '#FDFDFC'
  const inpBorder = '#BDCFCE'
  const optionBg = '#F3F3F0'
  const cardBg   = 'rgba(253,253,252,0.98)'
  const cardBorder = '1px solid rgba(189,207,206,0.72)'

  const inpStyle = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '14px', padding: '13px 16px', color: text, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: 'inset 0 1px 0 rgba(253,253,252,0.9)' }
  const lblStyle = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }

useEffect(() => { fetchProducts() }, [activeCategory])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await api.get(`/jewelry-products/?category=${activeCategory}`)
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch { setProducts([]) }
    setLoadingProducts(false)
  }



  // ── EDIT OPEN ──
  const openEdit = p => {
    setEditProduct(p)
    setEditForm({ category: p.category, metal: p.metal, grade: p.grade, name: p.name, description: p.description || '', weight_grams: p.weight_grams || '', tag: p.tag || '', wedding_category: p.wedding_category || '',
      stock_quantity: p.stock_quantity ?? 0 })   // ── NEW: restock field ──
    setEditImages([]); setEditPreviews([]); setEditMsg('')
    setEditLivePrice(p.price ? String(p.price) : null)
  }

  // ── EDIT SAVE ──
  const handleEdit = async () => {
    if (!editForm.name.trim()) { setEditMsg('❌ Name required'); return }
    setEditSaving(true)
    try {
      const fd = new FormData()
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v))
      if (editLivePrice) fd.append('price', editLivePrice)
      editImages.forEach(img => fd.append('uploaded_images', img))
      const res = await api.patch(`/jewelry-products/${editProduct.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setEditMsg('✅ Updated!')
      setEditProduct(res.data)   // refresh edit modal with new data
      fetchProducts()
    } catch (err) { setEditMsg('❌ ' + JSON.stringify(err.response?.data || err.message)) }
    setEditSaving(false)
  }

  // ── DELETE IMAGE ── 
  const deleteImage = async imgId => {
    try {
      await api.delete(`/jewelry-product-images/${imgId}/`)
      setEditProduct(prev => ({ ...prev, images: prev.images.filter(i => i.id !== imgId) }))
    } catch { setEditMsg('❌ Image delete failed') }
  }


  const handleToggleHide = async (p) => {
  try {
    const newStatus = !p.is_active
    await api.patch(`/jewelry-products/${p.id}/`, { is_active: newStatus })
    alert(newStatus ? '✅ Product Shown! Customers can see this now.' : '🙈 Product Hided! Customers cannot see this anymore.')
    fetchProducts()
  } catch { alert('Failed to update') }
}

const handleDelete = async (id) => {
  if (!window.confirm('Delete this product permanently?')) return
  try {
    await api.delete(`/jewelry-products/${id}/`)
    fetchProducts()
  } catch { alert('Delete failed') }
}


  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        .ap-card:hover .ap-hover { opacity:1 !important }
        .ap-card:hover .ap-edit-btn { opacity:1 !important; transform:translateY(0) !important }
        input:focus, textarea:focus, select:focus { border-color:#0C4044 !important; box-shadow:0 0 0 4px rgba(209,223,222,.65) !important }
        .ap-display{font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:0;color:#073B3F}
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{ background: glass, borderBottom: `1px solid ${border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', boxShadow: '0 18px 42px rgba(7,59,63,0.06)' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{ padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', fontWeight: 900, fontSize: '12px', border: activeCategory === cat.key ? '1px solid #073B3F' : '1px solid rgba(189,207,206,0.72)', transition: 'all 0.2s', boxShadow: '0 10px 24px rgba(7,59,63,0.06)',
                background: activeCategory === cat.key ? 'linear-gradient(135deg,#0C4044,#073B3F)' : '#F3F3F0',
                color: activeCategory === cat.key ? '#FDFDFC' : '#0C4044',
              }}>{cat.emoji} {cat.label}</button>
          ))}
        </div>

       
        {/* Right actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

  {/* Add Banner button */}
  <button onClick={() => navigate('/add-banners')}
    style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(187,137,88,0.45)', fontWeight: 900, fontSize: '12px', cursor: 'pointer', background: 'linear-gradient(135deg,#CCA881,#BB8958)', color: '#111817', boxShadow: '0 12px 26px rgba(187,137,88,0.18)' }}>
    🖼️ Add Banner
  </button>

          <button onClick={() => navigate('/add-new-product')}
            style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #073B3F', fontWeight: 900, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              background: 'linear-gradient(135deg,#0C4044,#073B3F)',
              color: '#FDFDFC',
            }}>+ Add Product</button>
          <button onClick={() => navigate('/super-admin')} style={{ padding: '11px 16px', borderRadius: '14px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '34px 32px 56px' }}>

        
        {/* ── PRODUCT GRID HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ color: '#0C4044', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.4px' }}>
            {CATEGORIES.find(c => c.key === activeCategory)?.emoji} {CATEGORIES.find(c => c.key === activeCategory)?.label} — {products.length} Products
          </div>
        </div>

        {/* ── PRODUCT GRID ── */}
        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '80px', color: subtext }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(12,64,68,0.2)', borderTop: '3px solid #0C4044', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            Loading...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: subtext, border: `2px dashed ${border}`, borderRadius: '20px' }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>{CATEGORIES.find(c => c.key === activeCategory)?.emoji}</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>No {activeCategory} yet</div>
            <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>Click "+ Add Product" to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
            {products.map(p => {
              const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
              const price    = parseFloat(p.price) || 0
              return (
                <div key={p.id} className="ap-card"
                  style={{ background: cardBg, border: cardBorder, borderRadius: '18px', overflow: 'hidden', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 18px 44px rgba(7,59,63,0.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 24px 58px rgba(7,59,63,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 18px 44px rgba(7,59,63,0.08)' }}
                >
{/* Image area */}
<div style={{ height: '220px', background: '#F3E8DE', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  {firstImg
    ? <img src={firstImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
    : <div style={{ fontSize: '44px' }}>{CATEGORIES.find(c => c.key === p.category)?.emoji || '💍'}</div>
  }

  {/* Hover overlay — position absolute so it floats over the image */}
  <div className="ap-hover" style={{
    position: 'absolute', inset: 0,
    background: 'rgba(17,24,23,0.65)',
    display: 'flex', flexDirection: 'column',
    gap: '8px', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.2s ease'
  }}>
    <button onClick={() => openEdit(p)}
      style={{ padding: '9px 22px', background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '999px', color: '#FDFDFC', fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}>
      ✏️ Edit
    </button>
    <button onClick={() => handleToggleHide(p)}
      style={{ padding: '9px 22px', background: p.is_active ? 'rgba(204,168,129,0.22)' : 'rgba(12,64,68,0.16)', border: `1px solid ${p.is_active ? '#CCA881' : '#0C4044'}`, borderRadius: '999px', color: p.is_active ? '#CCA881' : '#0C4044', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>
      {p.is_active ? '🙈 Hide' : '✅ Hided'}
    </button>
    <button onClick={() => handleDelete(p.id)}
      style={{ padding: '9px 22px', background: 'rgba(201,32,53,0.18)', border: '1px solid rgba(201,32,53,0.5)', borderRadius: '999px', color: '#C92035', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>
      🗑 Remove
    </button>
  </div>
</div>

                  {/* Info */}
                  <div style={{ padding: '18px 18px 16px' }}>
                    {p.tag && (
                      <span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 10px', borderRadius: '999px', background: 'rgba(12,64,68,0.1)', color: '#0C4044', border: '1px solid rgba(12,64,68,0.25)', marginBottom: '8px', display: 'inline-block' }}>{p.tag}</span>
                    )}
                    <div style={{ color: text, fontWeight: 900, fontSize: '16px', marginBottom: '7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: subtext, fontSize: '12px', fontWeight: 700 }}>{p.metal?.toUpperCase()} {p.grade?.toUpperCase()} • {parseFloat(p.weight_grams)}g</div>
                      <div style={{ color: p.metal === 'gold' ? '#9F6130' : '#0C4044', fontWeight: 900, fontSize: '15px' }}>
                        {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
                      </div>
                    </div>
<div style={{ color: subtext, fontSize: '11px', fontWeight: 700, marginTop: '8px' }}>📷 {p.images?.length || 0} image{p.images?.length !== 1 ? 's' : ''}</div>
                    {/* NEW: Stock status badge */}
                    <div style={{
                      fontSize: '11px', fontWeight: 800, marginTop: '4px',
                      color: p.stock_status === 'out_of_stock' ? '#C92035' : p.stock_status === 'low_stock' ? '#BB8958' : '#0C4044'
                    }}>
                      📦 Stock: {p.stock_quantity ?? 0}
                      {p.stock_status === 'out_of_stock' && ' — SOLD OUT (Edit to restock)'}
                      {p.stock_status === 'low_stock' && ' — Low Stock ⚠️'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editProduct && (
        <div onClick={() => setEditProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.88)', backdropFilter: 'blur(12px)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.35)', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 90px rgba(17,24,23,0.8)', animation: 'fadeIn 0.25s ease' }}>

            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px' }}>✏️ EDIT PRODUCT</div>
                <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>{editProduct.name}</div>
              </div>
              <button onClick={() => setEditProduct(null)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {editMsg && (
                <div style={{ background: editMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${editMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: editMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  {editMsg}
                </div>
              )}

              {/* Existing images */}
              {editProduct.images?.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={lblStyle}>Existing Images (click ✕ to delete)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {editProduct.images.map(img => {
                      const url = getImageUrl(img)
                      return url ? (
                        <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(12,64,68,0.3)', cursor: 'pointer' }}
                          onClick={() => setLightboxUrl(url)}>
                          <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={e => { e.stopPropagation(); deleteImage(img.id) }}
                            style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(201,32,53,0.9)', color: '#FDFDFC', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* category / metal / grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={lblStyle}>Category</label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key} style={{ background: optionBg }}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Metal</label>
                  <select value={editForm.metal} onChange={e => setEditForm(f => ({ ...f, metal: e.target.value, grade: '' }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                    <option value="gold" style={{ background: optionBg }}>Gold</option>
                    <option value="silver" style={{ background: optionBg }}>Silver</option>
                    <option value="diamond" style={{ background: optionBg }}>Diamond</option>
                    <option value="platinum" style={{ background: optionBg }}>Platinum</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Grade</label>
                  <select value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                    {getGradeOptions(editForm.metal, editForm.category).map(g => <option key={g} value={g} style={{ background: optionBg }}>{g.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

            {/* Wedding Category */}
<div style={{ marginBottom: '12px' }}>
  <label style={lblStyle}>Wedding Category</label>
  <select value={editForm.wedding_category || ''} onChange={e => setEditForm(f => ({ ...f, wedding_category: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
    <option value="" style={{ background: optionBg }}>-- None --</option>
    {WEDDING_CATEGORIES.map(w => (
      <option key={w} value={w} style={{ background: optionBg }}>{w}</option>
    ))}
  </select>
</div>

{/* name / tag */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
  <div>
    <label style={lblStyle}>Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Tag</label>
                  <select value={editForm.tag} onChange={e => setEditForm(f => ({ ...f, tag: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: optionBg }}>-- None --</option>
                    {TAGS.map(t => <option key={t} value={t} style={{ background: optionBg }}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* description */}
              <div style={{ marginBottom: '12px' }}>
                <label style={lblStyle}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inpStyle, resize: 'vertical' }} />
              </div>

              {/* weight / live price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={lblStyle}>Weight (grams)</label>
                  <input type="number" step="0.0001" value={editForm.weight_grams}
                    onChange={e => { const v = e.target.value; setEditForm(f => ({ ...f, weight_grams: v })); setEditLivePrice(null) }}
                    style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Live Rate Price</label>
                  <div style={{ ...inpStyle, color: editLivePrice ? '#0C4044' : subtext, fontWeight: 800, fontFamily: 'monospace', border: `1px solid ${editLivePrice ? 'rgba(12,64,68,0.5)' : inpBorder}` }}>
                    {editLivePrice ? `₹ ${editLivePrice}` : '—'}
                  </div>
                </div>
              </div>

              {/* NEW: Restock section */}
              <div style={{ marginBottom: '16px' }}>
                <label style={lblStyle}>Stock Quantity (Restock here)</label>
                <input type="number" step="1" min="0" value={editForm.stock_quantity}
                  onChange={e => setEditForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  placeholder="e.g. 50" style={{
                    ...inpStyle,
                    border: `2px solid ${Number(editForm.stock_quantity) <= 0 ? 'rgba(201,32,53,0.5)' : 'rgba(12,64,68,0.5)'}`
                  }} />
                {Number(editForm.stock_quantity) <= 0 && (
                  <div style={{ fontSize: '10px', color: '#C92035', marginTop: '4px', fontWeight: 700 }}>
                    ⚠️ Product will show as SOLD OUT
                  </div>
                )}
              </div>

              {/* Add more images */}
              <div style={{ marginBottom: '8px' }}>
                <label style={lblStyle}>Add More Images</label>
                <label htmlFor="edit-img-add" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'rgba(12,64,68,0.08)', border: '2px dashed rgba(12,64,68,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#0C4044', fontWeight: 700, fontSize: '13px' }}>
                  📷 Add Images
                </label>
                <input id="edit-img-add" type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => { const f = Array.from(e.target.files); setEditImages(p => [...p, ...f]); setEditPreviews(p => [...p, ...f.map(x => URL.createObjectURL(x))]); e.target.value = '' }} />
                {editPreviews.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                    {editPreviews.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(12,64,68,0.3)', cursor: 'pointer' }}
                        onClick={() => setLightboxUrl(url)}>
                        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={e => { e.stopPropagation(); setEditImages(p => p.filter((_, i) => i !== idx)); setEditPreviews(p => p.filter((_, i) => i !== idx)) }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(201,32,53,0.9)', color: '#FDFDFC', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
              <button disabled={editSaving} onClick={handleEdit}
                style={{ width: '100%', padding: '13px', background: editSaving ? 'rgba(12,64,68,0.22)' : 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: editSaving ? '#0C4044' : '#FDFDFC', cursor: editSaving ? 'not-allowed' : 'pointer' }}>
                {editSaving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightboxUrl} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '16px' }} />
          <button onClick={() => setLightboxUrl(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(201,32,53,0.85)', border: 'none', color: '#FDFDFC', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}
    </div>
  )
}

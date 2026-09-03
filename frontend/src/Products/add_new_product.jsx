import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { getSubcategories } from '../config/categoryConfig'

function Icon({ name, size = 16, className = '' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className }
  const icons = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></>,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
    warn: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    spinner: <><path d="M21 12a9 9 0 1 1-6.219-8.56" /></>,
  }
  return <svg {...common}>{icons[name]}</svg>
}

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
const WEDDING_CATEGORIES = ['Wedding Ring', 'Wedding Necklaces', 'Wedding Chain', 'Wedding Bangles', 'Wedding Earring']
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

export default function AddNewProduct() {
  const navigate = useNavigate()

  const [metalPrices, setMetalPrices] = useState({
    gold22k: null, gold24k: null, silver: null,
    diamond18k: null, diamond22k: null, platinum92: null
  })

  const [productImages, setProductImages] = useState([])
  const [productPreviewUrls, setProductPreviewUrls] = useState([])
  const [productMsg, setProductMsg] = useState('')
   const [productForm, setProductForm] = useState({
    category: '', metal: '', grade: '', name: '', nameChoice: '', description: '',
    cross_weight: '', stone_weight: '', making_charge: '', stone_value: '',
    tag: '', subcategory: '', occasion: '', wedding_category: '', gender: 'all', wastage_charge: '',
    stock_quantity: ''
  })
  const [productSaving, setProductSaving] = useState(false)
  const [livePrice, setLivePrice] = useState(null)
  const [netWeight, setNetWeight] = useState(null)
  const [baseMetalAmt, setBaseMetalAmt] = useState(null)
  const [makingAmt, setMakingAmt] = useState(null)
  const [discountAmt, setDiscountAmt] = useState(null)
  const [originalPrice, setOriginalPrice] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const dark = false
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

  useEffect(() => {
    api.get('/metal-rates/').then(res => {
      const d = res.data
      setMetalPrices({
        gold22k:     parseFloat(d.gold_22k)    || 0,
        gold24k:     parseFloat(d.gold_24k)    || 0,
        silver:      parseFloat(d.silver_999)  || 0,
        diamond18k:  parseFloat(d.diamond_18k) || 0,
        diamond22k:  parseFloat(d.diamond_22k) || 0,
        platinum92:  parseFloat(d.platinum_92) || 0,
      })
    }).catch(() => {})
  }, [])

  const calcAll = (crossW, stoneW, metal, grade, makingChargePct, discountPct, stoneVal) => {
    const cw    = parseFloat(crossW) || 0
    const sw    = parseFloat(stoneW) || 0
    const mcPct = parseFloat(makingChargePct) || 0
    const disPct = parseFloat(discountPct) || 0
    const sv    = parseFloat(stoneVal) || 0

    if (!cw || cw <= 0 || !metal) {
      setNetWeight(null); setBaseMetalAmt(null)
      setLivePrice(null); setMakingAmt(null); setDiscountAmt(null)
      return
    }

    const nw = cw - sw
    if (nw <= 0) {
      setNetWeight(null); setBaseMetalAmt(null)
      setLivePrice(null); setMakingAmt(null); setDiscountAmt(null)
      return
    }

    let rate = null
    if (metal === 'gold') {
      rate = grade === '24k' ? metalPrices.gold24k : metalPrices.gold22k
    } else if (metal === 'diamond') {
      rate = grade === '18k' ? metalPrices.diamond18k : metalPrices.diamond22k
    } else if (metal === 'platinum') {
      rate = metalPrices.platinum92
    } else if (metal === 'silver') {
      rate = metalPrices.silver
    }

    if (!rate) {
      setNetWeight(nw); setBaseMetalAmt(null)
      setLivePrice(null); setMakingAmt(null); setDiscountAmt(null)
      return
    }

    const base = nw * rate
    const makingAmtVal = rate * (mcPct / 100)
    const rateWithMaking = rate + makingAmtVal
    const discAmtVal = rateWithMaking * (disPct / 100)
    const effectiveRate = rateWithMaking - discAmtVal
    const finalBase = nw * effectiveRate
    const withStone = finalBase + sv
    const total = (withStone * 1.03).toFixed(2)
    const originalTotal = ((nw * rateWithMaking + sv) * 1.03).toFixed(2)

    setNetWeight(nw)
    setBaseMetalAmt((nw * rate).toFixed(2))
    setMakingAmt(makingAmtVal.toFixed(2))
    setDiscountAmt(discAmtVal.toFixed(2))
    setLivePrice(total)
    setOriginalPrice(originalTotal)
  }

  const handleSave = async () => {
    if (!productForm.name.trim())    { setProductMsg('ERR: Name required');     return }
    if (!productForm.cross_weight)   { setProductMsg('ERR: Cross Weight required');   return }
    if (!productForm.category)       { setProductMsg('ERR: Category required'); return }
    if (!productForm.metal)          { setProductMsg('ERR: Metal required');    return }
    if (!productForm.grade) { setProductMsg('ERR: Grade required'); return }
    if (!productForm.stock_quantity) { setProductMsg('ERR: Stock Quantity required'); return }
    setProductSaving(true)
    try {
          const fd = new FormData()
      Object.entries(productForm).forEach(([k, v]) => {
        if (k === 'subcategory' || k === 'nameChoice') return   // backend model-la illa — skip pannanum
        fd.append(k, v)
      })
      fd.append('net_weight', netWeight || 0)
      if (livePrice) fd.append('price', livePrice)
      if (originalPrice) fd.append('original_price', originalPrice)
      productImages.forEach(img => fd.append('uploaded_images', img))
      await api.post('/jewelry-products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProductMsg('OK: Product added!')
      setTimeout(() => navigate('/add-product'), 900)
    } catch (err) { setProductMsg('ERR: ' + JSON.stringify(err.response?.data || err.message)) }
    setProductSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .anp-spin { animation: spin 1s linear infinite; }
        input:focus, textarea:focus, select:focus { border-color:#0C4044 !important; box-shadow:0 0 0 4px rgba(209,223,222,.65) !important }
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{ background: glass, borderBottom: `1px solid ${border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 18px 42px rgba(7,59,63,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0C4044', fontSize: '15px', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          <Icon name="plus" size={16} />Add New Product
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/add-product')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 16px', borderRadius: '14px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
          <Icon name="back" size={14} />Back to Products
        </button>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '34px 32px 56px' }}>
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '22px', padding: '30px', animation: 'fadeIn 0.3s ease', boxShadow: '0 24px 64px rgba(7,59,63,0.08)' }}>

          {productMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: productMsg.startsWith('OK:') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${productMsg.startsWith('OK:') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: productMsg.startsWith('OK:') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
              <Icon name={productMsg.startsWith('OK:') ? 'check' : 'warn'} size={15} />
              {productMsg.replace(/^OK:|^ERR:/, '')}
            </div>
          )}

          {/* Row 1 - metal / category / wedding category / grade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lblStyle}>Metal *</label>
              <select value={productForm.metal} onChange={e => setProductForm(f => ({ ...f, metal: e.target.value, grade: '', name: '' }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: optionBg }}>-- Select --</option>
                <option value="gold" style={{ background: optionBg }}>🏅 Gold</option>
                <option value="silver" style={{ background: optionBg }}>🥈 Silver</option>
                <option value="diamond" style={{ background: optionBg }}>💎 Diamond</option>
                <option value="platinum" style={{ background: optionBg }}>⚪ Platinum</option>
              </select>
            </div>

            <div>
              <label style={lblStyle}>Product *</label>
              <select value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value, grade: '', name: '' }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: optionBg }}>-- Select --</option>
                {CATEGORIES.map(c => <option key={c.key} value={c.key} style={{ background: optionBg }}>{c.emoji} {c.label}</option>)}
              </select>
            </div>

            <div>
              <label style={lblStyle}>Wedding Category</label>
              <select value={productForm.wedding_category} onChange={e => setProductForm(f => ({ ...f, wedding_category: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: optionBg }}>-- None --</option>
                {WEDDING_CATEGORIES.map(w => <option key={w} value={w} style={{ background: optionBg }}>{w}</option>)}
              </select>
            </div>

            {(() => {
              const m = productForm.metal
              const cat = productForm.category
              if (!m || m === '') return <div />
              const gradeOptions = getGradeOptions(m, cat)
              return (
                <div>
                  <label style={lblStyle}>Grade *</label>
                  <select value={productForm.grade} onChange={e => setProductForm(f => ({ ...f, grade: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: optionBg }}>-- Select --</option>
                    {gradeOptions.map(g => (
                      <option key={g} value={g} style={{ background: optionBg }}>{g.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )
            })()}
          </div>

          {/* Row 2 - Product Name / Occasion / Tag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        <div>
              <label style={lblStyle}>Product Name *</label>
              <select
                value={productForm.nameChoice === 'other' ? 'other' : productForm.name}
                onChange={e => {
                  const v = e.target.value
                  if (v === 'other') {
                    setProductForm(f => ({ ...f, nameChoice: 'other', name: '' }))
                  } else {
                    setProductForm(f => ({ ...f, nameChoice: v, name: v }))
                  }
                }}
                disabled={!productForm.category || !productForm.metal}
                style={{ ...inpStyle, cursor: 'pointer' }}
              >
                <option value="" style={{ background: optionBg }}>
                  {productForm.category && productForm.metal ? '-- Select --' : 'Select metal and product first'}
                </option>
                {getSubcategories(productForm.category, productForm.metal).map(n => (
                  <option key={n} value={n} style={{ background: optionBg }}>{n}</option>
                ))}
                <option value="other" style={{ background: optionBg }}>Other (type custom name)</option>
              </select>
              {productForm.nameChoice === 'other' && (
                <input
                  type="text"
                  value={productForm.name}
                  onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Type custom product name"
                  style={{ ...inpStyle, marginTop: '8px' }}
                />
              )}
            </div>
            <div>
              <label style={lblStyle}>Occasion</label>
              <select value={productForm.occasion} onChange={e => setProductForm(f => ({ ...f, occasion: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: optionBg }}>-- None --</option>
                {OCCASIONS.map(o => <option key={o} value={o} style={{ background: optionBg }}>{o}</option>)}
              </select>
            </div>
                        <div>
              <label style={lblStyle}>Tag</label>
              <select value={productForm.tag} onChange={e => setProductForm(f => ({ ...f, tag: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: optionBg }}>-- None --</option>
                {TAGS.map(t => <option key={t} value={t} style={{ background: optionBg }}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 - Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lblStyle}>Gender</label>
              <select value={productForm.gender} onChange={e => setProductForm(f => ({ ...f, gender: e.target.value }))} style={{ ...inpStyle, cursor: 'pointer' }}>
                {GENDERS.map(g => <option key={g} value={g} style={{ background: optionBg }}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lblStyle}>Description</label>
            <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Product description..." style={{ ...inpStyle, resize: 'vertical' }} />
          </div>

          {/* Weight Section + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lblStyle}>Cross Weight (g) *</label>
              <input type="number" step="0.0001" value={productForm.cross_weight}
                onChange={e => {
                  const v = e.target.value
                  setProductForm(f => ({ ...f, cross_weight: v }))
                  calcAll(v, productForm.stone_weight, productForm.metal, productForm.grade, productForm.making_charge, productForm.wastage_charge, productForm.stone_value)
                }}
                placeholder="e.g. 10" style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Stone Weight (g)</label>
              <input type="number" step="0.0001" value={productForm.stone_weight}
                onChange={e => {
                  const v = e.target.value
                  setProductForm(f => ({ ...f, stone_weight: v }))
                  calcAll(productForm.cross_weight, v, productForm.metal, productForm.grade, productForm.making_charge, productForm.wastage_charge, productForm.stone_value)
                }}
                placeholder="e.g. 2 (0 if none)" style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Stock Quantity *</label>
              <input type="number" step="1" min="0" value={productForm.stock_quantity}
                onChange={e => setProductForm(f => ({ ...f, stock_quantity: e.target.value }))}
                placeholder="e.g. 10" style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Net Weight (auto)</label>
              <div style={{
                ...inpStyle,
                border: `1px solid ${netWeight ? 'rgba(12,64,68,0.5)' : inpBorder}`,
                color: netWeight ? '#0C4044' : subtext,
                fontWeight: 800, fontFamily: 'monospace'
              }}>
                {netWeight
                  ? `${netWeight}g${baseMetalAmt ? ` (₹${Number(baseMetalAmt).toLocaleString('en-IN')})` : ''}`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Making Charge + Stone Value + Final Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={lblStyle}>Making Charge (%)</label>
              <input type="number" step="0.01" value={productForm.making_charge}
                onChange={e => {
                  const v = e.target.value
                  setProductForm(f => ({ ...f, making_charge: v }))
                  calcAll(productForm.cross_weight, productForm.stone_weight, productForm.metal, productForm.grade, v, productForm.wastage_charge, productForm.stone_value)
                }}
                placeholder="e.g. 2" style={inpStyle} />
              {makingAmt && (
                <div style={{ fontSize: '10px', color: '#0C4044', marginTop: '4px' }}>
                  = ₹{Number(makingAmt).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div>
              <label style={lblStyle}>Discount (%)</label>
              <input type="number" step="0.01" value={productForm.wastage_charge}
                onChange={e => {
                  const v = e.target.value
                  setProductForm(f => ({ ...f, wastage_charge: v }))
                  calcAll(productForm.cross_weight, productForm.stone_weight, productForm.metal, productForm.grade, productForm.making_charge, v, productForm.stone_value)
                }}
                placeholder="e.g. 4" style={inpStyle} />
              {discountAmt && (
                <div style={{ fontSize: '10px', color: '#BB8958', marginTop: '4px' }}>
                  − ₹{Number(discountAmt).toLocaleString('en-IN')} off making
                </div>
              )}
            </div>

            <div>
              <label style={lblStyle}>Stone Value (₹)</label>
              <input type="number" step="1" value={productForm.stone_value}
                onChange={e => {
                  const v = e.target.value
                  setProductForm(f => ({ ...f, stone_value: v }))
                  calcAll(productForm.cross_weight, productForm.stone_weight, productForm.metal, productForm.grade, productForm.making_charge, productForm.wastage_charge, v)
                }}
                placeholder="e.g. 2000" style={inpStyle} />
            </div>

            <div>
              <label style={lblStyle}>Total Price (with 3% tax)</label>
              <div style={{
                ...inpStyle,
                color: livePrice ? '#0C4044' : subtext,
                fontWeight: 800, fontFamily: 'monospace',
                border: `1px solid ${livePrice ? 'rgba(12,64,68,0.5)' : inpBorder}`
              }}>
                {livePrice ? `₹ ${Number(livePrice).toLocaleString('en-IN')}` : '—'}
              </div>
              {livePrice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#0C4044', marginTop: '4px' }}>
                  <Icon name="check" size={11} />Includes 3% GST
                </div>
              )}
              {!livePrice && productForm.metal && productForm.grade && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#C92035', marginTop: '4px' }}>
                  <Icon name="warn" size={11} />No rate entered for {productForm.metal} {productForm.grade}
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div style={{ marginBottom: '18px' }}>
            <label style={lblStyle}>Product Images</label>
            <label htmlFor="anp-add-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: 'rgba(12,64,68,0.08)', border: '2px dashed rgba(12,64,68,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#0C4044', fontWeight: 700, fontSize: '13px' }}>
              <Icon name="camera" size={16} />Add Images
            </label>
            <input id="anp-add-img" type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { const f = Array.from(e.target.files); setProductImages(p => [...p, ...f]); setProductPreviewUrls(p => [...p, ...f.map(x => URL.createObjectURL(x))]); e.target.value = '' }} />
            {productPreviewUrls.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                {productPreviewUrls.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(12,64,68,0.3)', cursor: 'pointer' }}
                    onClick={() => setLightboxUrl(url)}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={e => { e.stopPropagation(); setProductImages(p => p.filter((_, i) => i !== idx)); setProductPreviewUrls(p => p.filter((_, i) => i !== idx)) }}
                      style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(201,32,53,0.9)', color: '#FDFDFC', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={productSaving} onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', background: productSaving ? 'rgba(12,64,68,0.22)' : 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: productSaving ? '#0C4044' : '#FDFDFC', cursor: productSaving ? 'not-allowed' : 'pointer' }}>
            {productSaving ? <><Icon name="spinner" size={15} className="anp-spin" />Saving...</> : <><Icon name="check" size={15} />Add Product</>}
          </button>

        </div>
      </div>

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
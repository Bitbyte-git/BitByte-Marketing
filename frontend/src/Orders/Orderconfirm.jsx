import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'
const GOLD = '#BB8958'
const DARK = '#111817'
const CREAM = '#FDFDFC'
const MUTED = '#7A8987'
const RED = '#073B3F'

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
]

const BANKS = [
  { name: 'State Bank of India', color: '#1a5276', initial: 'SBI' },
  { name: 'HDFC Bank', color: '#004c91', initial: 'HDFC' },
  { name: 'ICICI Netbanking', color: '#f96b1b', initial: 'ICICI' },
  { name: 'Axis Bank', color: '#800000', initial: 'AXIS' },
  { name: 'AU Small Finance Bank', color: '#f5a623', initial: 'AU' },
  { name: 'Kotak Mahindra Bank', color: '#ed1c24', initial: 'KMB' },
  { name: 'Bank of Baroda', color: '#f47920', initial: 'BOB' },
  { name: 'Punjab National Bank', color: '#003f7f', initial: 'PNB' },
  { name: 'Canara Bank', color: '#00539c', initial: 'CNB' },
  { name: 'IndusInd Bank', color: '#672f7e', initial: 'IIB' },
]

// ── SVG ICONS ──
const IconLocation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
)
const IconCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IconUPI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
  </svg>
)
const IconBank = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
  </svg>
)
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const checkoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

  .oc-page {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(231,237,236,0.74) 0%, #FDFDFC 28%, #F3F3F0 100%);
    color: #111817;
    font-family: "Montserrat", system-ui, sans-serif;
  }

  .oc-main {
    width: min(1320px, calc(100% - 40px));
    margin: 0 auto;
    padding: clamp(42px, 5vw, 72px) 0 88px;
    animation: fadeUp 0.42s ease both;
  }

  .oc-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 22px;
    align-items: end;
    margin-bottom: 30px;
  }

  .oc-kicker {
    margin: 0 0 10px;
    color: #BB8958;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2.8px;
    text-transform: uppercase;
  }

  .oc-hero h1 {
    margin: 0;
    color: #073B3F;
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(42px, 5vw, 68px);
    line-height: 0.98;
  }

  .oc-hero p {
    margin: 14px 0 0;
    color: #52625f;
    font-size: 14px;
    line-height: 1.75;
    max-width: 680px;
  }

  .oc-trust-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(12,64,68,0.18);
    border-radius: 999px;
    background: rgba(253,253,252,0.82);
    color: #073B3F;
    padding: 13px 18px;
    font-size: 12px;
    font-weight: 900;
    box-shadow: 0 14px 34px rgba(12,64,68,0.08);
  }

  .oc-stepper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .oc-step {
    position: relative;
    border: 1px solid rgba(189,207,206,0.78);
    border-radius: 8px;
    background: rgba(253,253,252,0.82);
    padding: 14px 16px;
    color: #7A8987;
    font-size: 12px;
    font-weight: 900;
  }

  .oc-step.active {
    border-color: rgba(12,64,68,0.34);
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
    box-shadow: 0 18px 42px rgba(12,64,68,0.18);
  }

  .oc-step i {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    margin-right: 9px;
    background: rgba(122,137,135,0.14);
    font-style: normal;
  }

  .oc-step.active i {
    background: rgba(253,253,252,0.15);
  }

  .oc-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 0.42fr);
    gap: 28px;
    align-items: start;
  }

  .oc-review-card,
  .oc-summary-card {
    border: 1px solid rgba(189,207,206,0.84);
    border-radius: 8px;
    background: rgba(253,253,252,0.92);
    box-shadow: 0 28px 76px rgba(12,64,68,0.11);
    overflow: hidden;
  }

  .oc-product-band {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 24px;
    padding: 26px;
    background: linear-gradient(120deg, rgba(231,237,236,0.82), rgba(243,232,222,0.70));
  }

  .oc-product-img {
    width: 150px;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(204,168,129,0.44);
    background: #FDFDFC;
    box-shadow: 0 20px 44px rgba(12,64,68,0.12);
  }

  .oc-product-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .oc-product-tag {
    display: inline-flex;
    border: 1px solid rgba(187,137,88,0.42);
    border-radius: 999px;
    background: rgba(243,232,222,0.76);
    color: #9F6130;
    padding: 7px 11px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .oc-product-title {
    margin: 0 0 14px;
    color: #073B3F;
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1;
  }

  .oc-specs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .oc-spec {
    border: 1px solid rgba(12,64,68,0.12);
    border-radius: 8px;
    background: rgba(253,253,252,0.78);
    padding: 12px;
  }

  .oc-spec span {
    display: block;
    color: #7A8987;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .oc-spec strong {
    color: #111817;
    font-size: 14px;
  }

  .oc-qty-row,
  .oc-price-panel {
    padding: 22px 26px;
    border-top: 1px solid rgba(189,207,206,0.62);
  }

  .oc-qty-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .oc-stepper-qty {
    display: inline-flex;
    border: 1px solid rgba(189,207,206,0.92);
    border-radius: 999px;
    overflow: hidden;
    background: #FDFDFC;
  }

  .oc-stepper-qty button,
  .oc-stepper-qty span {
    width: 44px;
    height: 42px;
    border: 0;
    display: grid;
    place-items: center;
    background: transparent;
    color: #073B3F;
    font-weight: 900;
  }

  .oc-stepper-qty button {
    cursor: pointer;
  }

  .oc-row {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 12px;
    color: #52625f;
    font-size: 14px;
  }

  .oc-row strong {
    color: #111817;
  }

  .oc-total {
    border-top: 1px dashed rgba(12,64,68,0.20);
    padding-top: 16px;
    margin-top: 16px;
    font-size: 18px;
    font-weight: 900;
    color: #073B3F;
  }

  .oc-delivery-note {
    margin-top: 18px;
    border: 1px solid rgba(12,64,68,0.16);
    border-radius: 8px;
    background: rgba(231,237,236,0.72);
    padding: 15px 16px;
    color: #073B3F;
    font-size: 13px;
    font-weight: 800;
  }

  .oc-primary {
    width: 100%;
    margin-top: 22px;
    min-height: 58px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 22px 44px rgba(12,64,68,0.18);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .oc-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 28px 58px rgba(12,64,68,0.24);
  }

  .oc-summary-card {
    position: sticky;
    top: 178px;
    padding: 24px;
  }

  .oc-summary-title {
    margin: 0 0 16px;
    color: #073B3F;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  .oc-secure-box {
    margin-top: 18px;
    border: 1px dashed rgba(12,64,68,0.34);
    border-radius: 8px;
    background: rgba(231,237,236,0.54);
    padding: 13px 14px;
    color: #073B3F;
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 980px) {
    .oc-hero,
    .oc-layout,
    .oc-product-band {
      grid-template-columns: 1fr;
    }
    .oc-summary-card {
      position: relative;
      top: auto;
    }
  }

  @media (max-width: 640px) {
    .oc-main {
      width: min(100% - 24px, 1320px);
    }
    .oc-stepper,
    .oc-specs {
      grid-template-columns: 1fr;
    }
    .oc-product-img {
      width: 118px;
      height: 118px;
    }
  }
`

export default function OrderConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { product, qty: initialQty, displayPrice, metal, cartItems = [], cartTotal } = location.state || {}
  const isCartCheckout = Array.isArray(cartItems) && cartItems.length > 0
  const cartQuantity = isCartCheckout ? cartItems.reduce((sum, item) => sum + (Number(item.qty) || 1), 0) : 0
  const cartAmount = isCartCheckout ? cartItems.reduce((sum, item) => sum + (Number(item.total) || ((Number(item.price) || 0) * (Number(item.qty) || 1))), 0) : 0

  const [qty, setQty] = useState(isCartCheckout ? cartQuantity || 1 : initialQty || 1)
  const [step, setStep] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const [showAddressPopup, setShowAddressPopup] = useState(false)
  const [savedAddress, setSavedAddress] = useState(null)
  const [addressType, setAddressType] = useState('Home')
  const [otherLabel, setOtherLabel] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [country, setCountry] = useState('IN')
  const [showCountryDrop, setShowCountryDrop] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: '', email: '', phone: '', pincode: '', city: '', state: '', address: '', locality: '',
  })
  const [addressErrors, setAddressErrors] = useState({})
  const [payTab, setPayTab] = useState('card')
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '' })
  const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState(null)
  const [bankSearch, setBankSearch] = useState('')

  useEffect(() => {
    const cached = sessionStorage.getItem('bb_saved_address')
    if (cached) {
      try { setSavedAddress(JSON.parse(cached)) } catch {}
    }

    const loadProfile = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/dashboard/')
        const d = res.data
        if (d.first_name) {
          setAddressForm(f => ({
            ...f,
            name: `${d.initial ? d.initial + ' ' : ''}${d.first_name} ${d.last_name || ''}`.trim(),
            phone: d.mobile_number || '',
            city: d.city_name || '',
            state: d.state || '',
            address: d.door_no ? `${d.door_no}, ${d.street_name || ''}, ${d.town_name || ''}`.replace(/,\s*,/g, ',').trim() : '',
          }))
        }
      } catch {}
    }
    loadProfile()
  }, [])

  useEffect(() => { if (!product) navigate(-1) }, [product, navigate])
  if (!product) return null

  const getImageUrl = img => {
    if (!img) return null
    let p = typeof img === 'object' ? (img.image || img.url || '') : img
    if (!p) return null
    if (p.startsWith('http')) return p
    return `${API_BASE}/${p.replace(/^\/+/, '')}`
  }

  const firstImage = product.images?.[0] ? getImageUrl(product.images[0]) : cartItems[0]?.image || null
  const totalPrice = isCartCheckout ? (Number(cartTotal) || cartAmount) : (displayPrice || 0) * qty
  const inr = n => `Rs. ${Math.round(n).toLocaleString('en-IN')}`

  const validateAddress = () => {
    const e = {}
    if (!addressForm.name.trim()) e.name = 'Required'
    if (!/^\d{10}$/.test(addressForm.phone)) e.phone = 'Valid 10-digit number'
    if (!/^\d{6}$/.test(addressForm.pincode)) e.pincode = 'Valid 6-digit pincode'
    if (!addressForm.city.trim()) e.city = 'Required'
    if (!addressForm.state.trim()) e.state = 'Required'
    if (!addressForm.address.trim()) e.address = 'Required'
    setAddressErrors(e)
    return Object.keys(e).length === 0
  }

  const handleUseAddress = () => {
    if (!validateAddress()) return
    const label = addressType === 'Other' && otherLabel.trim() ? otherLabel.trim() : addressType
    const addr = { ...addressForm, type: label, isDefault, country }
    setSavedAddress(addr)
    sessionStorage.setItem('bb_saved_address', JSON.stringify(addr))
    setShowAddressPopup(false)
  }

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePlaceOrder = async () => {
    if (!savedAddress) return
    setPlacing(true)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        alert('Payment could not load. Please check your internet connection.')
        setPlacing(false)
        return
      }

      const { default: api } = await import('../api')
      const orderRes = await api.post('/create-razorpay-order/', { amount: totalPrice })
      const { razorpay_order_id, amount, currency, key } = orderRes.data

      const options = {
        key,
        amount: parseInt(amount) * 100,
        currency,
        name: 'BitByte Jewels',
        description: isCartCheckout ? `${cartItems.length} jewellery pieces` : product.name,
        image: firstImage?.startsWith('http') && !firstImage?.includes('localhost') ? firstImage : '',
        order_id: razorpay_order_id,
        handler: async response => {
          try {
            const verifyRes = await api.post('/verify-payment/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              product_id: product.id,
              customer_name: savedAddress.name,
              customer_phone: savedAddress.phone,
              pincode: savedAddress.pincode,
              address_line1: savedAddress.address,
              address_line2: savedAddress.locality || '',
              city: savedAddress.city,
              state: savedAddress.state,
              quantity: isCartCheckout ? cartQuantity : qty,
              unit_price: isCartCheckout ? totalPrice : displayPrice,
              total_price: totalPrice,
            })
            if (verifyRes.data.status === 'success') {
              setOrderId(verifyRes.data.order_id)
              setStep(4)
            } else {
              alert('Payment verification failed. Please contact support.')
            }
          } catch {
            alert('Something went wrong. Please try again.')
          }
          setPlacing(false)
        },
        modal: { ondismiss: () => setPlacing(false) },
        prefill: {
          name: savedAddress.name,
          contact: savedAddress.phone,
          email: savedAddress.email || '',
        },
        theme: { color: '#073B3F' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      alert('Unable to create order. Please try again.')
      setPlacing(false)
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]
  const filteredBanks = BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))

  const inp = err => ({
    width: '100%', padding: '13px 16px',
    border: `1px solid ${err ? '#e53e3e' : '#D1DFDE'}`,
    borderRadius: 8, fontSize: 14, color: DARK,
    background: '#FDFDFC', outline: 'none',
    fontFamily: '"Montserrat", sans-serif',
    boxSizing: 'border-box',
  })
  const lbl = { display: 'block', fontSize: 12, color: '#7A8987', marginBottom: 6, fontWeight: 700 }

  const OrderSidebar = () => (
    <aside className="oc-summary-card">
      <h3 className="oc-summary-title">Order Summary</h3>
      {isCartCheckout ? (
        <div style={{ display: 'grid', gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(189,207,206,0.62)' }}>
          {cartItems.map(item => (
            <div key={`${item.id}-${item.product_id}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: 8, border: '1px solid rgba(204,168,129,0.42)', background: '#FDFDFC', overflow: 'hidden', flexShrink: 0 }}>
                {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#073B3F', fontWeight: 900 }}>BJ</div>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#073B3F', marginBottom: 4, lineHeight: 1.15 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#7A8987', fontWeight: 700 }}>Qty: {item.qty}</div>
              </div>
              <strong style={{ color: '#111817', fontSize: 13 }}>{inr(item.total || ((item.price || 0) * (item.qty || 1)))}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(189,207,206,0.62)' }}>
          <div style={{ width: 66, height: 66, borderRadius: 8, border: '1px solid rgba(204,168,129,0.42)', background: '#FDFDFC', overflow: 'hidden', flexShrink: 0 }}>
            {firstImage ? <img src={firstImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#073B3F', fontWeight: 900 }}>BJ</div>}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#073B3F', fontFamily: '"Playfair Display", serif', marginBottom: 5, lineHeight: 1.1 }}>{product.name}</div>
            <div style={{ fontSize: 11, color: '#9F6130', marginBottom: 3, fontWeight: 800 }}>{product.product_code || `${metal?.toUpperCase()} ${product.grade?.toUpperCase() || ''}`}</div>
            <div style={{ fontSize: 12, color: '#7A8987', fontWeight: 700 }}>Qty: {qty}</div>
          </div>
        </div>
      )}
      <div>
        <div className="oc-row"><span>Sub Total</span><strong>{inr(totalPrice)}</strong></div>
        <div className="oc-row"><span>Delivery Charge</span><strong style={{ color: '#16a34a' }}>FREE</strong></div>
        <div className="oc-row"><span>GST</span><strong>Included</strong></div>
        <div className="oc-row oc-total"><span>Amount Payable</span><strong>{inr(totalPrice)}</strong></div>
      </div>
      <div className="oc-secure-box">
        <IconShield /><span>Delivery secured by BitByte</span>
      </div>
    </aside>
  )

  if (step === 1) {
    return (
      <div className="oc-page">
        <style>{checkoutStyles}</style>
        <main className="oc-main">
          <header className="oc-hero">
            <div>
              <p className="oc-kicker">Secure Checkout</p>
              <h1>Review Your Order</h1>
              <p>Confirm your jewellery, quantity, insured delivery, and final payable amount before moving to delivery and payment.</p>
            </div>
            <div className="oc-trust-pill"><IconShield /> BIS checked checkout</div>
          </header>

          <div className="oc-stepper">
            {['Review Order', 'Delivery & Payment', 'Order Placed'].map((label, i) => (
              <div key={label} className={`oc-step ${i === 0 ? 'active' : ''}`}><i>{i + 1}</i>{label}</div>
            ))}
          </div>

          <div className="oc-layout">
            <div>
              <section className="oc-review-card">
                <div className="oc-product-band">
                  <div className="oc-product-img">
                    {firstImage ? <img src={firstImage} alt={product.name} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#073B3F', fontWeight: 900 }}>Team 369</div>}
                  </div>
                  <div>
                    <div className="oc-product-tag">{isCartCheckout ? 'Cart Checkout' : `${metal?.toUpperCase()} ${product.grade?.toUpperCase() || ''}`}</div>
                    <h2 className="oc-product-title">{product.name}</h2>
                    <div className="oc-specs">
                      {[
                        { label: isCartCheckout ? 'Items' : 'Metal', value: isCartCheckout ? cartItems.length : metal?.charAt(0).toUpperCase() + metal?.slice(1) },
                        { label: isCartCheckout ? 'Quantity' : 'Weight', value: isCartCheckout ? cartQuantity : product.net_weight ? `${product.net_weight} gm` : '-' },
                        { label: isCartCheckout ? 'Shipping' : 'Purity', value: isCartCheckout ? 'Insured' : product.grade?.toUpperCase() || '-' },
                      ].map(s => (
                        <div className="oc-spec" key={s.label}><span>{s.label}</span><strong>{s.value}</strong></div>
                      ))}
                    </div>
                  </div>
                </div>

                {!isCartCheckout && <div className="oc-qty-row">
                  <div>
                    <strong style={{ display: 'block', color: '#073B3F', fontSize: 16, marginBottom: 4 }}>Quantity</strong>
                    <span style={{ color: '#7A8987', fontSize: 12, fontWeight: 700 }}>Adjust pieces before checkout</span>
                  </div>
                  <div className="oc-stepper-qty">
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty(q => q + 1)}>+</button>
                  </div>
                </div>}

                <div className="oc-price-panel">
                  <div className="oc-row"><span>{isCartCheckout ? 'Cart Subtotal' : 'Unit Price'}</span><strong>{inr(isCartCheckout ? totalPrice : displayPrice || 0)}</strong></div>
                  <div className="oc-row"><span>Quantity</span><strong>x {isCartCheckout ? cartQuantity : qty}</strong></div>
                  <div className="oc-row"><span>GST</span><strong>Included</strong></div>
                  <div className="oc-row"><span>Shipping</span><strong style={{ color: '#16a34a' }}>FREE</strong></div>
                  <div className="oc-row oc-total"><span>Total</span><strong>{inr(totalPrice)}</strong></div>
                  <div className="oc-delivery-note">Free insured delivery. Estimated delivery: <strong>3-5 business days</strong></div>
                </div>
              </section>

              <button className="oc-primary" type="button" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                Continue To Address
              </button>
            </div>
            <OrderSidebar />
          </div>
        </main>
        <CustomerFooter />
      </div>
    )
  }
  // STEP 2: DELIVER TO ──
  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: '"Montserrat", sans-serif' }}>
        <style>{checkoutStyles}</style>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes modalIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
          .oc-btn:hover{opacity:.88}.country-opt:hover{background:#e7edec!important}
          .address-overlay{backdrop-filter:blur(7px);background:rgba(7,59,63,.62)!important}
          .address-modal{max-width:780px!important;border-radius:8px!important;border:1px solid #bdcfce;box-shadow:0 30px 90px rgba(7,59,63,.28)!important;animation:modalIn .28s ease both}
          .address-modal-header{padding:24px 30px!important;background:linear-gradient(110deg,#fdfdfc,#e7edec);border-bottom:1px solid #bdcfce!important}
          .address-kicker{margin:0 0 5px;color:#9f6130;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
          .address-title{font-family:"Playfair Display",serif;font-size:26px!important;color:#073b3f!important}
          .address-subtitle{margin:5px 0 0;color:#7a8987;font-size:12px;line-height:1.5}
          .address-close{width:38px;height:38px;border:1px solid #bdcfce!important;border-radius:50%!important;background:#fdfdfc!important;color:#073b3f!important;font-size:21px!important;transition:.2s ease}
          .address-close:hover{background:#073b3f!important;color:#fff!important;transform:rotate(90deg)}
          .address-modal-body{padding:24px 30px 28px!important;background:#fdfdfc}
          .address-section{padding:20px;border:1px solid #d1dfde;border-radius:8px;background:#fff;margin-bottom:16px}
          .address-section-title{display:flex;align-items:center;gap:10px;margin:0 0 18px!important;font-family:"Playfair Display",serif;font-size:17px!important;color:#073b3f!important}
          .address-section-title:before{content:"";width:4px;height:20px;border-radius:2px;background:#bb8958}
          .address-modal input:focus{outline:none!important;border-color:#0c4044!important;box-shadow:0 0 0 3px rgba(12,64,68,.1)}
          .address-type-button:hover{border-color:#0c4044!important;color:#0c4044!important;transform:translateY(-1px)}
          .address-default{padding:12px 14px;border-radius:6px;background:#f3f3f0}
          .address-modal-footer{padding:16px 30px!important;background:#f3f3f0;border-top:1px solid #d1dfde!important}
          .address-action{min-height:46px;border-radius:5px!important;transition:transform .2s ease,box-shadow .2s ease}
          .address-action:hover{transform:translateY(-2px);box-shadow:0 9px 20px rgba(7,59,63,.15)}
          .address-submit{background:#073b3f!important;min-width:190px}
          .delivery-main{max-width:1240px!important;padding-top:38px!important}
          .delivery-heading{margin-bottom:28px}
          .delivery-kicker{margin:0 0 7px;color:#9f6130;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
          .delivery-heading h1{margin:0;font-family:"Playfair Display",serif;color:#073b3f;font-size:34px;line-height:1.1}
          .delivery-heading p{margin:8px 0 0;color:#7a8987;font-size:13px}
          .delivery-layout{grid-template-columns:minmax(0,1fr) 390px!important;gap:30px!important}
          .delivery-step{gap:16px!important;margin-bottom:22px!important}
          .delivery-step-marker{width:46px!important;height:46px!important;background:#e7edec!important;border-color:#bdcfce!important;color:#073b3f;box-shadow:0 7px 18px rgba(7,59,63,.08)}
          .delivery-step-line{background:linear-gradient(#bdcfce,transparent)!important}
          .delivery-content h2,.delivery-content h3{color:#073b3f!important;letter-spacing:0!important}
          .saved-address-card{border:1px solid #bdcfce!important;border-radius:8px!important;box-shadow:0 14px 34px rgba(7,59,63,.08);transition:transform .2s ease,box-shadow .2s ease}
          .saved-address-card:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(7,59,63,.12)}
          .saved-address-head{padding:15px 20px!important;background:#e7edec;border-bottom-color:#d1dfde!important}
          .saved-address-body{padding:20px!important}
          .new-address-button{border-color:#0c4044!important;color:#073b3f!important;background:#fdfdfc!important;min-height:38px}
          .address-use-button{background:#073b3f!important;min-height:38px}
          .voucher-card{background:#f3f3f0!important;border-color:#d1dfde!important;min-height:54px;transition:.2s ease}
          .voucher-card:hover{background:#e7edec!important;border-color:#bdcfce!important;transform:translateX(3px)}
          .delivery-layout .oc-summary-card{position:sticky;top:190px;border-color:#bdcfce;box-shadow:0 18px 44px rgba(7,59,63,.1)}
          .checkout-actionbar{position:sticky!important;bottom:18px!important;left:auto!important;right:auto!important;margin:28px 0 0!important;padding:14px 18px!important;border:1px solid #bdcfce!important;border-radius:8px!important;background:rgba(253,253,252,.96)!important;backdrop-filter:blur(12px);box-shadow:0 16px 42px rgba(7,59,63,.14)!important}
          .checkout-total-label{font-size:10px;color:#7a8987;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
          .checkout-total-value{font-family:"Playfair Display",serif;font-size:23px!important;color:#073b3f!important}
          .checkout-buy{min-width:220px;border-radius:5px!important;background:#073b3f!important;min-height:50px;transition:.2s ease}
          .checkout-buy:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(7,59,63,.22)}
          .checkout-buy:disabled{background:#bdcfce!important;color:#fdfdfc!important}
          @media(max-width:700px){
            .address-overlay{padding:0!important;align-items:flex-end!important}
            .address-modal{max-height:96vh!important;border-radius:8px 8px 0 0!important}
            .address-modal-header,.address-modal-body,.address-modal-footer{padding-left:18px!important;padding-right:18px!important}
            .address-contact-grid,.address-location-grid,.address-detail-grid{grid-template-columns:1fr!important}
            .address-section{padding:16px}
            .address-modal-footer{display:grid!important;grid-template-columns:1fr 1.4fr}
            .address-action{padding:11px 14px!important;min-width:0!important}
          }
          @media(max-width:900px){
            .delivery-layout{grid-template-columns:1fr!important}
            .delivery-layout .oc-summary-card{position:static}
          }
          @media(max-width:620px){
            .delivery-main{padding:28px 14px 70px!important}
            .delivery-heading h1{font-size:28px}
            .delivery-step-marker-wrap{display:none!important}
            .saved-address-body{flex-direction:column;gap:18px}
            .saved-address-actions{width:100%;margin-left:0!important;flex-direction:row!important}
            .saved-address-actions button{flex:1}
            .checkout-actionbar{bottom:8px!important}
            .checkout-buy{min-width:0}
          }
        `}</style>

        {/* ── ADDRESS POPUP ── */}
        {showAddressPopup && (
          <div className="address-overlay" onClick={() => setShowAddressPopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="address-modal" role="dialog" aria-modal="true" aria-labelledby="address-modal-title" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div className="address-modal-header" style={{ padding: '22px 28px', borderBottom: '1px solid #f0ebe4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <p className="address-kicker">Secure delivery</p>
                  <h2 id="address-modal-title" className="address-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: RED }}>Where should we deliver?</h2>
                  <p className="address-subtitle">Add a complete address for insured and on-time delivery.</p>
                </div>
                <button className="address-close" type="button" aria-label="Close address form" onClick={() => setShowAddressPopup(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999', lineHeight: 1 }}>&times;</button>
              </div>

              {/* Body */}
              <div className="address-modal-body" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>

                {/* Contact Details */}
                <section className="address-section">
                <h3 className="address-section-title" style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: DARK }}>Contact Details</h3>
                <div className="address-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={lbl}>Name *</label>
                    <input style={inp(addressErrors.name)} placeholder="Full Name"
                      value={addressForm.name} onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))} />
                    {addressErrors.name && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.name}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Email</label>
                    <input style={inp()} placeholder="Email (optional)"
                      value={addressForm.email} onChange={e => setAddressForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={lbl}>Contact Number *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ padding: '13px 14px', border: '1px solid #d1dfde', borderRadius: 6, background: '#f3f3f0', fontSize: 13, fontWeight: 700, color: '#073B3F', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      IN +91
                    </div>
                    <input style={{ ...inp(addressErrors.phone), flex: 1 }} placeholder="10-digit mobile" maxLength={10}
                      value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  {addressErrors.phone && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.phone}</div>}
                </div>
                </section>

                {/* Address Details */}
                <section className="address-section">
                <h3 className="address-section-title" style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: DARK }}>Address Details</h3>
                <div className="address-location-grid" style={{ display: 'grid', gridTemplateColumns: '0.65fr 1fr 1fr', gap: 12, marginBottom: 12 }}>

                  {/* Country dropdown */}
                  <div style={{ position: 'relative' }}>
                    <label style={lbl}>Country *</label>
                    <div onClick={() => setShowCountryDrop(v => !v)}
                      style={{ padding: '13px 14px', border: '1px solid #e2d9d0', borderRadius: 6, background: '#fafafa', fontSize: 14, color: DARK, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.code}</span>
                      <span style={{ marginLeft: 'auto', color: '#7A8987', fontSize: 12 }}>&#9662;</span>
                    </div>
                    {showCountryDrop && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2d9d0', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}>
                        {COUNTRIES.map(c => (
                          <div key={c.code} className="country-opt"
                            onClick={() => { setCountry(c.code); setShowCountryDrop(false) }}
                            style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: country === c.code ? 'rgba(123,31,46,0.06)' : '#fff', fontSize: 13, color: DARK, transition: 'background 0.15s' }}>
                            <span>{c.flag}</span>
                            <span style={{ fontWeight: country === c.code ? 700 : 400 }}>{c.name}</span>
                            <span style={{ color: '#aaa', fontSize: 11, marginLeft: 'auto' }}>{c.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={lbl}>Pincode *</label>
                    <input style={inp(addressErrors.pincode)} placeholder="6-digit pincode" maxLength={6}
                      value={addressForm.pincode} onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value }))} />
                    {addressErrors.pincode && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.pincode}</div>}
                  </div>
                  <div>
                    <label style={lbl}>City *</label>
                    <input style={inp(addressErrors.city)} placeholder="City"
                      value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} />
                    {addressErrors.city && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.city}</div>}
                  </div>
                </div>

                <div className="address-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>State *</label>
                    <input style={inp(addressErrors.state)} placeholder="State"
                      value={addressForm.state} onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))} />
                    {addressErrors.state && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.state}</div>}
                  </div>
                  <div>
                    <label style={lbl}>Address (House No., Building, Street, Area) *</label>
                    <input style={inp(addressErrors.address)} placeholder="Address"
                      value={addressForm.address} onChange={e => setAddressForm(f => ({ ...f, address: e.target.value }))} />
                    {addressErrors.address && <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{addressErrors.address}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={lbl}>Locality / Town</label>
                  <input style={inp()} placeholder="Locality / Town (optional)"
                    value={addressForm.locality} onChange={e => setAddressForm(f => ({ ...f, locality: e.target.value }))} />
                </div>
                </section>

                {/* Save Address As */}
                <section className="address-section" style={{ marginBottom: 0 }}>
                <h3 className="address-section-title" style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: DARK }}>Save Address As</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: addressType === 'Other' ? 12 : 16, flexWrap: 'wrap' }}>
                  {['Home', 'Work', 'Other'].map(t => (
                    <button className="address-type-button" type="button" key={t} onClick={() => setAddressType(t)}
                      style={{ padding: '8px 24px', borderRadius: 20, border: `1.5px solid ${addressType === t ? RED : '#e2d9d0'}`, background: addressType === t ? 'rgba(123,31,46,0.06)' : '#fff', color: addressType === t ? RED : '#777', fontWeight: addressType === t ? 700 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* Other label input */}
                {addressType === 'Other' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Label Name (e.g. Parents, Office 2...)</label>
                    <input style={inp()} placeholder="Type address label..."
                      value={otherLabel} onChange={e => setOtherLabel(e.target.value)} />
                  </div>
                )}

                <div className="address-default" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="default-addr" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: RED }} />
                  <label htmlFor="default-addr" style={{ fontSize: 13, color: DARK, cursor: 'pointer' }}>Make this my default delivery address</label>
                </div>
                </section>
              </div>

              {/* Footer */}
              <div className="address-modal-footer" style={{ padding: '16px 28px', borderTop: '1px solid #f0ebe4', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
                <button className="address-action" type="button" onClick={() => setShowAddressPopup(false)} style={{ padding: '12px 28px', background: '#fff', border: '1.5px solid #0C4044', borderRadius: 2, color: '#073B3F', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button className="address-action address-submit" type="button" onClick={handleUseAddress} style={{ padding: '12px 28px', background: RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Use This Address</button>
              </div>
            </div>
          </div>
        )}

        <main className="delivery-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 100px', animation: 'fadeUp 0.4s ease both' }}>
          <header className="delivery-heading">
            <p className="delivery-kicker">Delivery &amp; offers</p>
            <h1>Choose your delivery address</h1>
            <p>Your jewellery is insured from dispatch until it reaches you.</p>
          </header>
          <div className="delivery-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
            <div>
              {/* DELIVER TO */}
              <div className="delivery-step" style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                <div className="delivery-step-marker-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div className="delivery-step-marker" style={{ width: 44, height: 44, borderRadius: '50%', background: '#f7f4f0', border: '1px solid #e2d9d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconLocation /></div>
                  <div className="delivery-step-line" style={{ width: 1, flex: 1, background: '#e2d9d0', marginTop: 8, minHeight: 40 }} />
                </div>
                <div className="delivery-content" style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: DARK }}>DELIVER TO</h2>
                  {savedAddress ? (
                    <div className="saved-address-card" style={{ background: '#fff', border: '1px solid #e2d9d0', borderRadius: 6, overflow: 'hidden' }}>
                      <div className="saved-address-head" style={{ padding: '14px 20px', borderBottom: '1px solid #f0ebe4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#777', letterSpacing: '1px' }}>SAVED ADDRESSES</span>
                        <button className="new-address-button" type="button" onClick={() => setShowAddressPopup(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'transparent', border: `1px solid ${RED}`, borderRadius: 4, color: RED, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <span style={{ fontSize: 16 }}>+</span> New Address
                        </button>
                      </div>
                      <div className="saved-address-body" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{savedAddress.name.toUpperCase()}</span>
                            <span style={{ fontSize: 11, padding: '2px 10px', border: `1px solid ${RED}`, borderRadius: 20, color: RED, fontWeight: 600 }}>{savedAddress.type}</span>
                            {savedAddress.isDefault && <span style={{ fontSize: 11, padding: '2px 10px', border: '1px solid #aaa', borderRadius: 20, color: '#777', fontWeight: 600 }}>Default</span>}
                          </div>
                          <div style={{ fontSize: 13, color: MUTED }}>{savedAddress.address}{savedAddress.locality ? `, ${savedAddress.locality}` : ''} {savedAddress.city}, {savedAddress.state} {savedAddress.pincode}</div>
                        </div>
                        <div className="saved-address-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                          <button onClick={() => setShowAddressPopup(true)} style={{ padding: '7px 18px', background: '#fff', border: '1px solid #e2d9d0', borderRadius: 4, color: DARK, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit Address</button>
                          <button className="address-use-button" disabled={placing} onClick={handlePlaceOrder} style={{ padding: '8px 18px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 700, cursor: placing ? 'not-allowed' : 'pointer' }}>{placing ? 'Processing...' : 'Use This Address'}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid #e2d9d0', borderRadius: 6, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#aaa' }}>No saved address</span>
                      <button onClick={() => setShowAddressPopup(true)} style={{ padding: '10px 20px', background: RED, border: 'none', borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18 }}>+</span> New Address
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GIFTCARDS */}
              <div className="delivery-step" style={{ display: 'flex', gap: 20 }}>
                <div className="delivery-step-marker-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div className="delivery-step-marker" style={{ width: 44, height: 44, borderRadius: '50%', background: '#f7f4f0', border: '1px solid #e2d9d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                </div>
                <div className="delivery-content" style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: DARK }}>GIFTCARDS AND VOUCHERS</h3>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: MUTED }}>Apply DigiGold, NeuCoins, GiftCards/E-Gift Cards, E-Vouchers, Discount Vouchers etc.</p>
                  <div className="voucher-card" role="button" tabIndex={0} style={{ background: '#f7f4f0', border: '1px solid #e2d9d0', borderRadius: 6, padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Coupons and Vouchers</span>
                    <span style={{ color: MUTED }}>›</span>
                  </div>
                </div>
              </div>
            </div>
            <OrderSidebar />
          </div>

          {/* Bottom bar */}
          <div className="checkout-actionbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2d9d0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div>
              <div className="checkout-total-label">Final payable · {isCartCheckout ? cartQuantity : qty} item{(isCartCheckout ? cartQuantity : qty) > 1 ? 's' : ''}</div>
              <div className="checkout-total-value" style={{ fontSize: 16, fontWeight: 700, color: RED }}>{inr(totalPrice)}</div>
            </div>
           <button className="oc-btn checkout-buy" disabled={!savedAddress || placing} onClick={handlePlaceOrder}
              style={{ padding: '14px 32px', background: (savedAddress && !placing) ? RED : '#ccc', border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase', cursor: (savedAddress && !placing) ? 'pointer' : 'not-allowed' }}>
              {placing ? 'Processing...' : 'Proceed To Buy'}
            </button>
          </div>
          <div style={{ height: 80 }} />
        </main>
        <div style={{ height: '80px' }} />
        <CustomerFooter />
      </div>
    )
  }

  // ── STEP 3: PAYMENT ──
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: '"Montserrat", sans-serif' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700&display=swap');
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          .oc-btn:hover{opacity:0.88}
          .pay-tab:hover{background:rgba(123,31,46,0.03)}
          .bank-row:hover{background:#fdf8f6}
          input[type=radio]{accent-color:#7B1F2E}
        `}</style>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 100px', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

            {/* Payment Box */}
            <div style={{ background: '#fff', border: '1px solid #e2d9d0', borderRadius: 8, overflow: 'hidden' }}>
              {/* Top bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Order Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>{inr(totalPrice)}</div>
                </div>
                <div style={{ padding: '8px 16px', border: `1px dashed ${RED}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconShield />
                  <span style={{ fontSize: 12, fontWeight: 600, color: RED }}>Delivery secured by BitByte</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '195px 1fr', minHeight: 420 }}>
                {/* Sidebar tabs */}
                <div style={{ borderRight: '1px solid #f0ebe4' }}>
                  {[
                    { key: 'card', label: 'Debit / Credit Card', icon: <IconCard /> },
                    { key: 'upi', label: 'UPI', icon: <IconUPI /> },
                    { key: 'netbanking', label: 'Netbanking', icon: <IconBank /> },
                  ].map(tab => (
                    <div key={tab.key} className="pay-tab"
                      onClick={() => setPayTab(tab.key)}
                      style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: payTab === tab.key ? `3px solid ${RED}` : '3px solid transparent', background: payTab === tab.key ? 'rgba(123,31,46,0.04)' : 'transparent', transition: 'all 0.15s' }}>
                      <span style={{ color: payTab === tab.key ? RED : '#bbb' }}>{tab.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: payTab === tab.key ? 700 : 400, color: payTab === tab.key ? DARK : '#888' }}>{tab.label}</span>
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div style={{ padding: 28 }}>

                  {/* CARD */}
                  {payTab === 'card' && (
                    <div>
                      <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: DARK }}>Enter Credit / Debit card details</h3>
                      <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                          <input style={{ ...inp(), paddingRight: 48 }} placeholder="Enter Card Number"
                            value={cardForm.number} maxLength={19}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                              setCardForm(f => ({ ...f, number: v.match(/.{1,4}/g)?.join(' ') || v }))
                            }} />
                          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#ccc' }}><IconCard /></div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                        <div>
                          <label style={lbl}>Expiry</label>
                          <input style={inp()} placeholder="MM/YY" maxLength={5}
                            value={cardForm.expiry}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                              if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2)
                              setCardForm(f => ({ ...f, expiry: v }))
                            }} />
                        </div>
                        <div>
                          <label style={lbl}>CVV</label>
                          <div style={{ position: 'relative' }}>
                            <input style={inp()} placeholder="CVV" maxLength={3} type="password"
                              value={cardForm.cvv} onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))} />
                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#e2d9d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#777', cursor: 'help' }}>?</span>
                          </div>
                        </div>
                      </div>
                      <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                        style={{ width: '100%', padding: '14px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}>
                        {placing ? 'Processing...' : 'Proceed to Pay'}
                      </button>
                    </div>
                  )}

                  {/* UPI */}
                  {payTab === 'upi' && (
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: DARK }}>Pay by any UPI app</h3>
                      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>Scan the QR using any UPI app on your mobile phone like PhonePe, Paytm, GooglePay, BHIM, etc</p>

                      {/* UPI app icons */}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                        {[
                          { letter: 'P', color: '#5f259f', name: 'PhonePe' },
                          { letter: 'G', color: '#4285f4', name: 'GPay' },
                          { letter: 'Pt', color: '#002970', name: 'Paytm' },
                          { letter: 'B', color: '#004c8c', name: 'BHIM' },
                          { letter: 'A', color: '#ff9900', name: 'Amazon Pay' },
                          { letter: 'C', color: '#1a1a2e', name: 'Cred' },
                          { letter: '⋯', color: '#aaa', name: 'More' },
                        ].map(u => (
                          <div key={u.name} title={u.name}
                            style={{ width: 44, height: 44, borderRadius: 10, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: u.letter.length > 1 ? 11 : 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}>
                            {u.letter}
                          </div>
                        ))}
                      </div>

                      <button className="oc-btn"
                        style={{ padding: '12px 28px', background: RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, letterSpacing: '1px' }}>
                        Generate QR Code
                      </button>

                      <div style={{ borderTop: '1px solid #f0ebe4', paddingTop: 20 }}>
                        <label style={{ ...lbl, marginBottom: 10, fontSize: 13 }}>Or enter UPI ID</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input style={{ ...inp(), flex: 1 }} placeholder="yourname@upi"
                            value={upiId} onChange={e => setUpiId(e.target.value)} />
                          <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                            style={{ padding: '13px 20px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                            {placing ? '...' : 'Verify & Pay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NETBANKING */}
                  {payTab === 'netbanking' && (
                    <div>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: DARK }}>Net Banking</h3>
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><IconSearch /></span>
                        <input style={{ ...inp(), paddingLeft: 42 }} placeholder="Search banks"
                          value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
                      </div>
                      <div style={{ border: '1px solid #e2d9d0', borderRadius: 6, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                        {filteredBanks.map((bank, i) => (
                          <div key={bank.name} className="bank-row"
                            onClick={() => setSelectedBank(bank.name)}
                            style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < filteredBanks.length - 1 ? '1px solid #f0ebe4' : 'none', cursor: 'pointer', background: selectedBank === bank.name ? 'rgba(123,31,46,0.04)' : '#fff', transition: 'background 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{bank.initial}</div>
                              <span style={{ fontSize: 14, color: DARK, fontWeight: selectedBank === bank.name ? 600 : 400 }}>{bank.name}</span>
                            </div>
                            <input type="radio" readOnly checked={selectedBank === bank.name} style={{ width: 16, height: 16 }} />
                          </div>
                        ))}
                        {filteredBanks.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No banks found</div>}
                      </div>
                      {selectedBank && (
                        <button className="oc-btn" disabled={placing} onClick={handlePlaceOrder}
                          style={{ marginTop: 16, width: '100%', padding: '14px', background: placing ? '#ccc' : RED, border: 'none', borderRadius: 2, color: '#fff', fontWeight: 700, fontSize: 13, cursor: placing ? 'not-allowed' : 'pointer', letterSpacing: '1px' }}>
                          {placing ? 'Processing...' : `Pay with ${selectedBank}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <OrderSidebar />
          </div>

          {/* Bottom bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2d9d0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: RED }}>Total ({isCartCheckout ? cartQuantity : qty} Item{(isCartCheckout ? cartQuantity : qty) > 1 ? 's' : ''}) : {inr(totalPrice)}</div>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${RED}`, borderRadius: 2, color: RED, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Checkout Page</button>
          </div>
          <div style={{ height: 80 }} />
        </main>
        <div style={{ marginTop: '75px' }}></div>
        <CustomerFooter />
      </div>
    )
  }

  return null
}


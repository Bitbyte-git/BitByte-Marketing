import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from './CustomerFooter'

const GOLD = '#BB8958'
const DARK = '#111817'
const CREAM = '#FDFDFC'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100 // 1 Rs = 100 coins

const MethodIcon = ({ type, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'card') return (
    <svg {...common}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  )
  if (type === 'upi') return (
    <svg {...common}><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
  )
  if (type === 'netbanking') return (
    <svg {...common}><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
  )
  if (type === 'wallet') return (
    <svg {...common}><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z" /><path d="M2 9V6a2 2 0 0 1 2-2h13" /><circle cx="17" cy="13.5" r="1.5" /></svg>
  )
  if (type === 'commission') return (
    <svg {...common}><path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" /></svg>
  )
  return (
    <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  )
}

const RupeeIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="18" y2="4" /><line x1="6" y1="9" x2="18" y2="9" />
    <path d="M6 4c5 0 8 2 8 5.5S11 15 6 15" /><line x1="6" y1="15" x2="18" y2="21" />
  </svg>
)
const CoinStackIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
)
const ReceiptIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2Z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" />
  </svg>
)
const DownloadIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13" /><path d="m6 11 6 6 6-6" /><path d="M4 21h16" />
  </svg>
)
const DirectionBadge = ({ direction }) => (
  <span className={`rc-direction-badge ${direction}`}>
    {direction === 'debit' ? '− DEBIT' : '+ CREDIT'}
  </span>
)

const PRESET_AMOUNTS = [100, 1000, 5000, 10000, 100000]

const rechargeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .rc-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .rc-main{width:min(1400px,calc(100% - 64px));margin:0 auto;padding:44px 0 90px;animation:fadeUp .4s ease both}
  .rc-kicker{margin:0 0 8px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .rc-title{margin:0 0 30px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(30px,4vw,44px)}
  .rc-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:28px}
  .rc-card{border:1px solid rgba(189,207,206,.8);border-radius:10px;background:#fff;box-shadow:0 18px 46px rgba(12,64,68,.08);padding:26px}
  .rc-balance-card{background:linear-gradient(135deg,${RED},#0C4044);color:#fff;border:none;display:flex;flex-direction:column;gap:6px}
  .rc-balance-label{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8;font-weight:800}
  .rc-balance-value{font-family:"Playfair Display",serif;font-size:40px;display:flex;align-items:baseline;gap:8px}
  .rc-balance-value span{font-size:15px;font-weight:700;opacity:.85}
  .rc-today-row{margin-top:14px;display:flex;justify-content:space-between;font-size:12px;opacity:.85;border-top:1px dashed rgba(255,255,255,.3);padding-top:12px}
  .rc-section-title{margin:0 0 16px;font-size:14px;font-weight:900;color:${RED};letter-spacing:.6px}
  .rc-amount-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  .rc-amount-btn{padding:14px 8px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${DARK};font-weight:800;font-size:14px;cursor:pointer;transition:.15s ease}
  .rc-amount-btn.active{border-color:${RED};background:rgba(7,59,63,.06);color:${RED}}
  .rc-custom-input{width:100%;padding:14px 16px;border:1px solid #D1DFDE;border-radius:8px;font-size:15px;font-weight:700;color:${DARK};box-sizing:border-box;margin-bottom:16px}
  .rc-custom-input:focus{outline:none;border-color:${RED}}
  .rc-coin-preview{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:8px;background:rgba(187,137,88,.1);border:1px dashed ${GOLD};margin-bottom:20px;font-size:14px;font-weight:800;color:#9F6130}
  .rc-pay-btn{width:100%;min-height:52px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:.2s ease}
  .rc-pay-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .rc-pay-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .rc-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .rc-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .rc-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
  .rc-history-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid rgba(189,207,206,.4);transition:background .15s ease;border-radius:8px}
  .rc-history-row:hover{background:rgba(7,59,63,.03)}
  .rc-history-row:last-child{border-bottom:none}
  .rc-history-icon{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:17px;color:#fff;font-weight:900}
  .rc-history-body{flex:1;min-width:0}
  .rc-history-amount{font-size:14px;font-weight:900;color:${DARK};margin-bottom:2px}
  .rc-history-coins{color:${GOLD};font-weight:900}
  .rc-history-date{color:${MUTED};font-size:11px;font-weight:600}
  .rc-method-tag{font-size:10px;font-weight:900;padding:5px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap;flex-shrink:0}
  .rc-method-tag.card{background:rgba(37,99,235,.12);color:#2563eb}
  .rc-method-tag.upi{background:rgba(147,51,234,.12);color:#9333ea}
  .rc-method-tag.netbanking{background:rgba(234,88,12,.12);color:#ea580c}
  .rc-method-tag.wallet{background:rgba(13,148,136,.12);color:#0d9488}
  .rc-method-tag.other{background:rgba(7,59,63,.08);color:${RED}}
  .rc-method-tag.commission{background:rgba(139,92,246,.12);color:#8b5cf6}
  .rc-method-tag.purchase{background:rgba(229,62,62,.1);color:#c0392b}
  .rc-history-source{color:${GOLD};font-size:11px;font-weight:700;margin-top:2px}
  .rc-direction-badge{display:inline-block;font-size:9px;font-weight:900;padding:3px 8px;border-radius:20px;letter-spacing:.4px;margin-left:8px}
  .rc-direction-badge.credit{background:rgba(22,163,74,.12);color:#16a34a}
  .rc-direction-badge.debit{background:rgba(229,62,62,.1);color:#c0392b}
  .rc-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  .rc-date-header{font-size:11px;font-weight:900;color:${MUTED};text-transform:uppercase;letter-spacing:1px;padding:14px 4px 6px}
  .rc-loadmore-btn{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${RED};font-weight:800;font-size:13px;cursor:pointer;transition:.15s ease}
  .rc-loadmore-btn:hover{border-color:${RED};background:rgba(7,59,63,.04)}
  .rc-loadmore-btn:disabled{opacity:.6;cursor:not-allowed}
  .rc-filter-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px}
  .rc-filter-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rc-filter-tab{padding:8px 16px;border-radius:20px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .rc-filter-tab.active{border-color:${RED};background:${RED};color:#fff}
  .rc-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .rc-date-to-label{display:flex;align-items:center;height:38px;color:${MUTED};font-weight:800;font-size:12px}
  .rc-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${GOLD};color:#fff;font-weight:900;font-size:12px;cursor:pointer;transition:.15s ease}
  .rc-apply-btn:hover{background:#9F6130}
  .rc-apply-btn:disabled{opacity:.5;cursor:not-allowed}
  .rc-download-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:20px;border:1.5px solid ${RED};background:#fff;color:${RED};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .rc-download-btn:hover{background:${RED};color:#fff}
  @media(max-width:600px){.rc-filter-row{flex-direction:column;align-items:stretch}.rc-download-btn{justify-content:center}}
  .rc-spend-card{background:linear-gradient(135deg,${GOLD},#9F6130);color:#fff;border:none}
  .rc-spend-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0}
  .rc-spend-row + .rc-spend-row{border-top:1px dashed rgba(255,255,255,.3)}
  .rc-spend-label{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;opacity:.92}
  .rc-spend-value{font-size:17px;font-weight:900;font-family:"Playfair Display",serif}
  .rc-spend-icon{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  @media(max-width:760px){.rc-grid{grid-template-columns:1fr}}
`

export default function Recharge() {
  const navigate = useNavigate()

  const [wallet, setWallet] = useState({
    balance_coins: 0, today_coins: 0, today_amount: 0,
    total_spent: 0, total_coins_purchased: 0, total_recharge_count: 0,
    history: [],
  })
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [banner, setBanner] = useState(null) // { type: 'success' | 'error', text }

  const amount = customAmount ? Number(customAmount) : selectedAmount
  const coinsPreview = amount > 0 ? Math.floor(amount * COIN_RATE) : 0

  const fetchWallet = async () => {
    try {
      const { default: api } = await import('../api')
      const res = await api.get('/wallet/')
      setWallet(res.data)
    } catch {
      // silent — page still usable
    } finally {
      setLoadingWallet(false)
    }
  }

  const [fullHistory, setFullHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [autopay, setAutopay] = useState({ exists: false, is_active: false, amount: 1000, recharge_day: 5 })
const [showAutopayModal, setShowAutopayModal] = useState(false)
const [autopayAmount, setAutopayAmount] = useState('')
const [autopayDay, setAutopayDay] = useState(5)
const [autopayFrequency, setAutopayFrequency] = useState('monthly')
const [autopayLoading, setAutopayLoading] = useState(false)

const fetchAutopayStatus = async () => {
  try {
    const { default: api } = await import('../api')
    const res = await api.get('/autopay/status/')
    if (res.data.exists) {
      setAutopay(res.data)
      setAutopayAmount(res.data.amount)
      setAutopayDay(res.data.recharge_day)
    }
  } catch {
    // silent
  }
}

const handleEnableAutopay = async () => {
  if (!autopayAmount || autopayAmount <= 0) {
    setBanner({ type: 'error', text: 'Please enter a valid amount' })
    return
  }
  setAutopayLoading(true)
  try {
    const loaded = await loadRazorpay()
    if (!loaded) {
      setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
      setAutopayLoading(false)
      return
    }
    const { default: api } = await import('../api')
    const res = await api.post('/autopay/create/', { amount: autopayAmount, frequency: autopayFrequency, recharge_day: autopayDay })
    const { subscription_id, key } = res.data

    const options = {
      key,
      subscription_id,
      name: 'BitByte Wallet Autopay',
      description: `₹${autopayAmount} every month on day ${autopayDay}`,
      handler: async response => {
        try {
          const confirmRes = await api.post('/autopay/confirm/', {
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setBanner({ type: 'success', text: confirmRes.data.message })
          setShowAutopayModal(false)
          fetchAutopayStatus()
        } catch {
          setBanner({ type: 'error', text: 'Autopay confirmation failed. Please try again.' })
        }
        setAutopayLoading(false)
      },
      modal: { ondismiss: () => setAutopayLoading(false) },
      theme: { color: '#073B3F' },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (err) {
    const msg = err?.response?.data?.error || 'Unable to start autopay setup. Please try again.'
    setBanner({ type: 'error', text: msg })
    setAutopayLoading(false)
  }
}

const handleToggleAutopay = async () => {
  setAutopayLoading(true)
  try {
    const { default: api } = await import('../api')
    const action = autopay.is_active ? 'off' : 'on'
    await api.post('/autopay/toggle/', { action })
    fetchAutopayStatus()
    setBanner({ type: 'success', text: `Autopay turned ${action.toUpperCase()}` })
  } catch {
    setBanner({ type: 'error', text: 'Unable to update autopay. Please try again.' })
  }
  setAutopayLoading(false)
}

  const fetchHistory = async (page = 1, filter = activeFilter, from = customFrom, to = customTo) => {
    try {
      const { default: api } = await import('../api')
      let url = `/recharge/history/?page=${page}&period=${filter}`
      if (filter === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      setFullHistory(prev => page === 1 ? res.data.items : [...prev, ...res.data.items])
      setHasMoreHistory(res.data.has_more)
      setHistoryPage(page)
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
    }
  }

  const loadMoreHistory = () => {
    setLoadingMore(true)
    fetchHistory(historyPage + 1, activeFilter, customFrom, customTo)
  }

  const handleFilterClick = filter => {
    setActiveFilter(filter)
    if (filter !== 'custom') {
      fetchHistory(1, filter, '', '')
    } else if (customFrom && customTo) {
      fetchHistory(1, 'custom', customFrom, customTo)
    }
  }

  const handleCustomFromChange = e => setCustomFrom(e.target.value)
  const handleCustomToChange = e => setCustomTo(e.target.value)

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setBanner({ type: 'error', text: 'Please select both From and To dates' })
      return
    }
    fetchHistory(1, 'custom', customFrom, customTo)
  }

  const downloadStatement = async () => {
    if (activeFilter === 'custom' && (!customFrom || !customTo)) {
      setBanner({ type: 'error', text: 'Please select both From and To dates' })
      return
    }
    setDownloading(true)
    try {
      const { default: api } = await import('../api')
      let url = `/recharge/statement/?period=${activeFilter}`
      if (activeFilter === 'custom') url += `&start_date=${customFrom}&end_date=${customTo}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `recharge-statement-${activeFilter}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      setBanner({ type: 'error', text: 'Unable to download statement. Please try again.' })
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => { fetchWallet(); fetchHistory(1, 'today', '', ''); fetchAutopayStatus() }, [])

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleBuyRecharge = async () => {
    if (!amount || amount <= 0) {
      setBanner({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setBanner(null)
    setPaying(true)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
        setPaying(false)
        return
      }

      const { default: api } = await import('../api')
      const orderRes = await api.post('/recharge/create-order/', { amount })
      const { razorpay_order_id, amount: orderAmount, currency, key, recharge_id } = orderRes.data

      const options = {
        key,
        amount: Math.round(orderAmount * 100),
        currency,
        name: 'BitByte Wallet Recharge',
        description: `Recharge for ${coinsPreview} coins`,
        order_id: razorpay_order_id,
        handler: async response => {
          try {
            const verifyRes = await api.post('/recharge/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              recharge_id,
            })
            if (verifyRes.data.status === 'success') {
              setBanner({ type: 'success', text: `Recharge successful! ${verifyRes.data.coins_credited} coins added.` })
              setCustomAmount('')
              fetchWallet()
            } else {
              setBanner({ type: 'error', text: 'Payment verification failed. Please contact support.' })
            }
          } catch {
            setBanner({ type: 'error', text: 'Something went wrong. Please try again.' })
          }
          setPaying(false)
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#073B3F' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      setBanner({ type: 'error', text: 'Unable to create order. Please try again.' })
      setPaying(false)
    }
  }

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── GPay mari: Today / Yesterday / actual date nu group pannurom ──
  const dateGroupLabel = d => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const sameDay = (a, b) => a.toDateString() === b.toDateString()
    if (sameDay(date, today)) return 'Today'
    if (sameDay(date, yesterday)) return 'Yesterday'
    return fmtDate(d)
  }

  return (
    <div className="rc-page">
      <style>{rechargeStyles}</style>
      <main className="rc-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
  <div>
    <p className="rc-kicker">Wallet</p>
    <h1 className="rc-title" style={{ marginBottom: 0 }}>Recharge &amp; Coins</h1>
  </div>
  <button
    type="button"
    className="rc-autopay-btn"
    onClick={() => setShowAutopayModal(true)}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 20,
      border: `1.5px solid ${autopay.is_active ? '#16a34a' : '#D1DFDE'}`,
      background: autopay.is_active ? 'rgba(22,163,74,.08)' : '#FDFDFC',
      color: autopay.is_active ? '#16a34a' : DARK, fontWeight: 800, fontSize: 12, cursor: 'pointer'
    }}
  >
    Autopay: {autopay.is_active ? 'ON' : 'OFF'}
  </button>
</div>

        <div className="rc-grid">
          {/* LEFT: Buy Recharge */}
          <section className="rc-card">
            <h3 className="rc-section-title">Buy Recharge</h3>

            {banner && <div className={`rc-banner ${banner.type}`}>{banner.text}</div>}

            <div className="rc-amount-grid">
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`rc-amount-btn ${!customAmount && selectedAmount === amt ? 'active' : ''}`}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <input
              className="rc-custom-input"
              type="number"
              min="1"
              placeholder="Enter custom amount (₹)"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
            />

            <div className="rc-coin-preview">
              <span>You'll get</span>
              <span>{coinsPreview.toLocaleString('en-IN')} coins</span>
            </div>

            <button className="rc-pay-btn" disabled={paying || amount <= 0} onClick={handleBuyRecharge}>
              {paying ? 'Processing...' : `Pay ₹${amount || 0} & Recharge`}
            </button>
          </section>

          {/* RIGHT: Available Coin + Recent Recharges */}
          <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
            <section className="rc-card rc-balance-card">
              <span className="rc-balance-label">Available Coin</span>
              <div className="rc-balance-value">
                {loadingWallet ? '...' : (wallet.balance_coins || 0).toLocaleString('en-IN')}
                <span>coins</span>
              </div>
              <div className="rc-today-row">
                <span>Today Recharged</span>
                <span>₹{wallet.today_amount || 0} · {wallet.today_coins || 0} coins</span>
              </div>
            </section>

            <section className="rc-card">
              <h3 className="rc-section-title">Recent Recharges</h3>
              {wallet.history.length === 0 ? (
                <div className="rc-empty">No recharges yet</div>
              ) : (
                wallet.history.map(h => {
                  const methodColors = { card: '#2563eb', upi: '#9333ea', netbanking: '#ea580c', wallet: '#0d9488', other: RED, commission: '#8b5cf6', purchase: '#c0392b' }
                  return (
                    <div key={h.id} className="rc-history-row">
                      <div className="rc-history-icon" style={{ background: methodColors[h.payment_method] || RED }}>
                        <MethodIcon type={h.payment_method} size={19} />
                      </div>
                      <div className="rc-history-body">
                        <div className="rc-history-amount">
                          {h.direction === 'debit' ? '−' : '+'}₹{h.amount_paid}{' '}
                          <span style={{ color: MUTED, fontWeight: 700 }}>→</span>{' '}
                          <span className="rc-history-coins">
                            {h.direction === 'debit' ? '−' : ''}{h.coins_credited.toLocaleString('en-IN')} coins
                          </span>
                          <DirectionBadge direction={h.direction} />
                        </div>
                        <div className="rc-history-date">{fmtDate(h.created_at)}</div>
                        {h.type === 'commission' && (
                          <div className="rc-history-source">From {h.source} · Level {h.level} · {h.order_id}</div>
                        )}
                        {h.type === 'debit' && (
                          <div className="rc-history-source">Used for order {h.order_id}</div>
                        )}
                        {h.type === 'admin_credit' && (
                          <div className="rc-history-source">Sent by {h.source}</div>
                        )}
                      </div>
                      <span className={`rc-method-tag ${h.payment_method}`}>{h.payment_method === 'admin' ? 'BBTEAM' : h.payment_method}</span>
                    </div>
                  )
                })
              )}
            </section>
          </div>
        </div>

        {/* BOTTOM: Transaction History — full width, GPay style with date groups + Load More */}
        <section className="rc-card" style={{ marginTop: 20 }}>
          <h3 className="rc-section-title">Transaction History</h3>

          <div className="rc-filter-row">
            <div className="rc-filter-tabs">
              {[
                { key: 'today', label: 'Today' },
                { key: 'month', label: 'This Month' },
                { key: '6month', label: '6 Months' },
                { key: 'custom', label: 'Custom' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`rc-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
                  onClick={() => handleFilterClick(f.key)}
                >
                  {f.label}
                </button>
              ))}
              {activeFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    className="rc-custom-date"
                    value={customFrom}
                    max={customTo || new Date().toISOString().split('T')[0]}
                    onChange={handleCustomFromChange}
                  />
                  <span className="rc-date-to-label">to</span>
                  <input
                    type="date"
                    className="rc-custom-date"
                    value={customTo}
                    min={customFrom}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleCustomToChange}
                  />
                  <button type="button" className="rc-apply-btn" onClick={applyCustomRange}>
                    Apply
                  </button>
                </>
              )}
            </div>
            <button className="rc-download-btn" type="button" onClick={downloadStatement} disabled={downloading}>
              <DownloadIcon size={14} />
              {downloading ? 'Downloading...' : 'Download Statement'}
            </button>
          </div>

          {fullHistory.length === 0 ? (
            <div className="rc-empty">No recharges yet</div>
          ) : (
            (() => {
              const methodColors = { card: '#2563eb', upi: '#9333ea', netbanking: '#ea580c', wallet: '#0d9488', other: RED, commission: '#8b5cf6', purchase: '#c0392b' }
              let lastGroup = null
              return fullHistory.map(h => {
                const group = dateGroupLabel(h.created_at)
                const showHeader = group !== lastGroup
                lastGroup = group
                return (
                  <div key={h.id}>
                    {showHeader && <div className="rc-date-header">{group}</div>}
                    <div className="rc-history-row">
                      <div className="rc-history-icon" style={{ background: methodColors[h.payment_method] || RED }}>
                        <MethodIcon type={h.payment_method} size={19} />
                      </div>
                      <div className="rc-history-body">
                        <div className="rc-history-amount">
                          {h.direction === 'debit' ? '−' : '+'}₹{h.amount_paid}{' '}
                          <span style={{ color: MUTED, fontWeight: 700 }}>→</span>{' '}
                          <span className="rc-history-coins">
                            {h.direction === 'debit' ? '−' : ''}{h.coins_credited.toLocaleString('en-IN')} coins
                          </span>
                          <DirectionBadge direction={h.direction} />
                        </div>
                        <div className="rc-history-date">{fmtDate(h.created_at)}</div>
                        {h.type === 'commission' && (
                          <div className="rc-history-source">From {h.source} · Level {h.level} · {h.order_id}</div>
                        )}
                        {h.type === 'debit' && (
                          <div className="rc-history-source">Used for order {h.order_id}</div>
                        )}
                        {h.type === 'admin_credit' && (
                          <div className="rc-history-source">Sent by {h.source}</div>
                        )}
                      </div>
                      <span className={`rc-method-tag ${h.payment_method}`}>{h.payment_method === 'admin' ? 'BBTEAM' : h.payment_method}</span>
                    </div>
                  </div>
                )
              })
            })()
          )}
          {hasMoreHistory && (
            <button className="rc-loadmore-btn" type="button" onClick={loadMoreHistory} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </section>
      </main>

      {showAutopayModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
    <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 'min(420px, 90vw)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: RED }}>Autopay settings</h3>
        {autopay.exists && (
          <button
            type="button"
            onClick={handleToggleAutopay}
            disabled={autopayLoading}
            style={{
              width: 42, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer',
              background: autopay.is_active ? RED : '#D1DFDE', position: 'relative'
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
              top: 3, left: autopay.is_active ? 21 : 3, transition: '.15s ease'
            }} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Monthly amount (₹)</p>
      <input
  type="number" min="1" placeholder="Enter amount (₹)" value={autopayAmount}
  onChange={e => setAutopayAmount(e.target.value === '' ? '' : Number(e.target.value))}
  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #D1DFDE', borderRadius: 8, fontSize: 15, fontWeight: 700, marginBottom: 16 }}
/>

      <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Frequency</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[{ value: 'daily', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }].map(f => (
          <button
            key={f.value} type="button"
            onClick={() => setAutopayFrequency(f.value)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13, textTransform: 'capitalize',
              border: autopayFrequency === f.value ? `1.5px solid ${RED}` : '1.5px solid #D1DFDE',
              background: autopayFrequency === f.value ? 'rgba(7,59,63,.06)' : '#fff',
              color: autopayFrequency === f.value ? RED : DARK,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {autopayFrequency === 'monthly' && (
        <>
          <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Charge day, every month</p>
          <select
            value={autopayDay}
            onChange={e => setAutopayDay(Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #D1DFDE', borderRadius: 8, fontSize: 14, fontWeight: 700, marginBottom: 20 }}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button" onClick={() => setShowAutopayModal(false)}
          style={{ flex: 1, minHeight: 46, borderRadius: 999, border: '1.5px solid #D1DFDE', background: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="button" onClick={handleEnableAutopay} disabled={autopayLoading || autopay.is_active}
          style={{ flex: 2, minHeight: 46, borderRadius: 999, border: 'none', background: RED, color: '#fff', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {autopayLoading ? 'Processing...' : autopay.exists ? 'Update mandate' : 'Authorize UPI mandate'}
        </button>
      </div>
    </div>
  </div>
)}

      <CustomerFooter />
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from './CustomerFooter'

const GOLD = '#BB8958'
const DARK = '#111817'
const CREAM = '#FDFDFC'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100 // 1 Rs = 100 coins

const PRESET_AMOUNTS = [100, 1000, 5000, 10000, 100000]

const rechargeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .rc-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .rc-main{width:min(1100px,calc(100% - 32px));margin:0 auto;padding:44px 0 90px;animation:fadeUp .4s ease both}
  .rc-kicker{margin:0 0 8px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .rc-title{margin:0 0 30px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(30px,4vw,44px)}
  .rc-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
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
  .rc-history-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(189,207,206,.5);font-size:13px}
  .rc-history-row:last-child{border-bottom:none}
  .rc-method-tag{font-size:10px;font-weight:900;padding:3px 9px;border-radius:20px;background:rgba(7,59,63,.08);color:${RED};text-transform:uppercase;letter-spacing:.5px}
  .rc-empty{color:${MUTED};font-size:13px;text-align:center;padding:20px 0}
  @media(max-width:760px){.rc-grid{grid-template-columns:1fr}}
`

export default function Recharge() {
  const navigate = useNavigate()

  const [wallet, setWallet] = useState({ balance_coins: 0, today_coins: 0, today_amount: 0, history: [] })
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

  useEffect(() => { fetchWallet() }, [])

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

  return (
    <div className="rc-page">
      <style>{rechargeStyles}</style>
      <main className="rc-main">
        <p className="rc-kicker">Wallet</p>
        <h1 className="rc-title">Recharge &amp; Coins</h1>

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

          {/* RIGHT: Available Coin */}
          <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
            <section className="rc-card rc-balance-card">
              <span className="rc-balance-label">Available Coin</span>
              <div className="rc-balance-value">
                {loadingWallet ? '...' : wallet.balance_coins.toLocaleString('en-IN')}
                <span>coins</span>
              </div>
              <div className="rc-today-row">
                <span>Today Recharged</span>
                <span>₹{wallet.today_amount} · {wallet.today_coins} coins</span>
              </div>
            </section>

            <section className="rc-card">
              <h3 className="rc-section-title">Recent Recharges</h3>
              {wallet.history.length === 0 ? (
                <div className="rc-empty">No recharges yet</div>
              ) : (
                wallet.history.map(h => (
                  <div key={h.id} className="rc-history-row">
                    <div>
                      <div style={{ fontWeight: 800 }}>₹{h.amount_paid} → {h.coins_credited} coins</div>
                      <div style={{ color: MUTED, fontSize: 11 }}>{fmtDate(h.created_at)}</div>
                    </div>
                    <span className="rc-method-tag">{h.payment_method}</span>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
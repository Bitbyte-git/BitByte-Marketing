import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'

const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100 // 1 Rs = 100 coins

const CoinIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
  </svg>
)
const AlertIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .op-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .op-main{width:min(900px,calc(100% - 40px));margin:0 auto;padding:44px 0 90px;animation:fadeUp .4s ease both}
  .op-kicker{margin:0 0 8px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .op-title{margin:0 0 28px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(28px,4vw,40px)}
  .op-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;box-shadow:0 18px 46px rgba(12,64,68,.08);padding:26px;margin-bottom:20px}
  .op-order-row{display:flex;gap:14px;align-items:center;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid rgba(189,207,206,.6)}
  .op-order-img{width:64px;height:64px;border-radius:8px;overflow:hidden;border:1px solid rgba(204,168,129,.4);flex-shrink:0;background:#FDFDFC}
  .op-order-img img{width:100%;height:100%;object-fit:cover}
  .op-amount-row{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:${MUTED};margin-bottom:8px}
  .op-amount-total{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:8px;border-top:1px dashed rgba(12,64,68,.2);font-weight:900;font-size:18px;color:${RED}}
  .op-balance-card{background:linear-gradient(135deg,${RED},#0C4044);color:#fff;border:none}
  .op-balance-label{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;opacity:.8;font-weight:800}
  .op-balance-value{font-family:"Playfair Display",serif;font-size:32px;display:flex;align-items:baseline;gap:8px;margin-top:6px}
  .op-balance-value span{font-size:14px;font-weight:700;opacity:.85}
  .op-status-banner{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;font-size:13px;font-weight:800;margin-bottom:18px}
  .op-status-banner.ok{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .op-status-banner.no{background:rgba(229,62,62,.08);color:#c0392b;border:1px solid rgba(229,62,62,.28)}
  .op-pay-btn{width:100%;min-height:54px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:.2s ease}
  .op-pay-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .op-pay-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .op-buy-coin-btn{width:100%;min-height:54px;border:none;border-radius:999px;background:linear-gradient(135deg,${GOLD},#9F6130);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;margin-top:12px;transition:.2s ease}
  .op-buy-coin-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .op-shortfall-input{width:100%;padding:14px 16px;border:1px solid #D1DFDE;border-radius:8px;font-size:15px;font-weight:700;color:${DARK};box-sizing:border-box;margin-bottom:14px}
  .op-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .op-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .op-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
  .op-success-box{text-align:center;padding:40px 20px}
  .op-success-icon{width:70px;height:70px;border-radius:50%;background:rgba(22,163,74,.12);color:#16a34a;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
`

export default function OrderPayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { product, qty, totalPrice, isCartCheckout, cartItems = [], firstImage, savedAddress } = location.state || {}

  const [wallet, setWallet] = useState({ balance_coins: 0 })
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [paying, setPaying] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [toppingUp, setToppingUp] = useState(false)
  const [banner, setBanner] = useState(null)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => { if (!product || !savedAddress) navigate(-1) }, [product, savedAddress, navigate])

  const fetchWallet = async () => {
    try {
      const { default: api } = await import('../api')
      const res = await api.get('/wallet/')
      setWallet(res.data)
    } catch {
      // silent
    } finally {
      setLoadingWallet(false)
    }
  }

  useEffect(() => { fetchWallet() }, [])

  if (!product || !savedAddress) return null

  const coinsNeeded = Math.ceil((totalPrice || 0) * COIN_RATE)
  const hasEnoughCoins = wallet.balance_coins >= coinsNeeded
  const shortfallCoins = Math.max(0, coinsNeeded - wallet.balance_coins)
  const shortfallRupees = Math.ceil(shortfallCoins / COIN_RATE)
  const inr = n => `Rs. ${Math.round(n).toLocaleString('en-IN')}`

  const handlePayWithCoins = async () => {
    setPaying(true)
    setBanner(null)
    try {
      const { default: api } = await import('../api')
      const res = await api.post('/orders/pay-with-coins/', {
        product_id: product.id,
        product_image_url: firstImage,
        customer_name: savedAddress.name,
        customer_phone: savedAddress.phone,
        pincode: savedAddress.pincode,
        address_line1: savedAddress.address,
        address_line2: savedAddress.locality || '',
        city: savedAddress.city,
        state: savedAddress.state,
        quantity: qty,
        unit_price: isCartCheckout ? totalPrice : (totalPrice / (qty || 1)),
        total_price: totalPrice,
      })
      if (res.data.status === 'success') {
        setOrderId(res.data.order_id)
      } else {
        setBanner({ type: 'error', text: 'Payment failed. Please try again.' })
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.response?.data?.error || 'Payment failed. Please try again.' })
      fetchWallet()
    } finally {
      setPaying(false)
    }
  }

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleBuyAugCoin = async () => {
    const amount = Number(topUpAmount) || shortfallRupees
    if (amount <= 0) {
      setBanner({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setToppingUp(true)
    setBanner(null)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        setBanner({ type: 'error', text: 'Payment could not load. Check your internet connection.' })
        setToppingUp(false)
        return
      }

      const { default: api } = await import('../api')
      const orderRes = await api.post('/recharge/create-order/', { amount })
      const { razorpay_order_id, amount: orderAmount, currency, key, recharge_id } = orderRes.data

      const options = {
        key,
        amount: Math.round(orderAmount * 100),
        currency,
        name: 'BitByte AUG Coin',
        description: `Top-up ${Math.round(amount * COIN_RATE)} coins`,
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
              setBanner({ type: 'success', text: `${verifyRes.data.coins_credited} coins added! You can proceed to pay now.` })
              setTopUpAmount('')
              fetchWallet()
            } else {
              setBanner({ type: 'error', text: 'Top-up verification failed. Please contact support.' })
            }
          } catch {
            setBanner({ type: 'error', text: 'Something went wrong. Please try again.' })
          }
          setToppingUp(false)
        },
        modal: { ondismiss: () => setToppingUp(false) },
        theme: { color: '#073B3F' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      setBanner({ type: 'error', text: 'Unable to create top-up order. Please try again.' })
      setToppingUp(false)
    }
  }

  if (orderId) {
    return (
      <div className="op-page">
        <style>{styles}</style>
        <main className="op-main">
          <div className="op-card op-success-box">
            <div className="op-success-icon"><CheckIcon size={32} /></div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', color: RED, margin: '0 0 10px' }}>Order Confirmed!</h2>
            <p style={{ color: MUTED, fontSize: 14, marginBottom: 6 }}>Order ID</p>
            <p style={{ fontWeight: 900, fontSize: 18, color: RED, marginBottom: 24 }}>{orderId}</p>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>Paid using AUG Coin — {coinsNeeded.toLocaleString('en-IN')} coins deducted.</p>
            <button className="op-pay-btn" style={{ maxWidth: 260, margin: '0 auto' }} onClick={() => navigate('/customer')}>
              Continue Shopping
            </button>
          </div>
        </main>
        <CustomerFooter />
      </div>
    )
  }

  return (
    <div className="op-page">
      <style>{styles}</style>
      <main className="op-main">
        <p className="op-kicker">Secure Payment</p>
        <h1 className="op-title">Pay with AUG Coin</h1>

        {banner && <div className={`op-banner ${banner.type}`}>{banner.text}</div>}

        <section className="op-card">
          <div className="op-order-row">
            <div className="op-order-img">
              {firstImage ? <img src={firstImage} alt="" /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: RED, fontWeight: 900 }}>BJ</div>}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: RED, fontSize: 15 }}>{isCartCheckout ? `${cartItems.length} jewellery pieces` : product.name}</div>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 700, marginTop: 4 }}>Qty: {qty}</div>
            </div>
          </div>
          <div className="op-amount-row"><span>Order Amount</span><strong style={{ color: DARK }}>{inr(totalPrice)}</strong></div>
          <div className="op-amount-row"><span>Coins Required</span><strong style={{ color: GOLD }}>{coinsNeeded.toLocaleString('en-IN')} coins</strong></div>
          <div className="op-amount-total"><span>Amount Payable</span><span>{inr(totalPrice)}</span></div>
        </section>

        <section className="op-card op-balance-card">
          <span className="op-balance-label">Available AUG Coin</span>
          <div className="op-balance-value">
            {loadingWallet ? '...' : wallet.balance_coins.toLocaleString('en-IN')}
            <span>coins</span>
          </div>
        </section>

        <section className="op-card">
          {hasEnoughCoins ? (
            <>
              <div className="op-status-banner ok"><CheckIcon /> You have enough AUG Coin to pay for this order</div>
              <button className="op-pay-btn" disabled={paying} onClick={handlePayWithCoins}>
                {paying ? 'Processing...' : `Proceed to Pay — ${coinsNeeded.toLocaleString('en-IN')} coins`}
              </button>
            </>
          ) : (
            <>
              <div className="op-status-banner no">
                <AlertIcon /> Coin not available — you need {shortfallCoins.toLocaleString('en-IN')} more coins ({inr(shortfallRupees)})
              </div>
              <input
                className="op-shortfall-input"
                type="number"
                min="1"
                placeholder={`Enter amount (min ${inr(shortfallRupees)})`}
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
              />
              <button className="op-buy-coin-btn" disabled={toppingUp} onClick={handleBuyAugCoin}>
                {toppingUp ? 'Processing...' : <><CoinIcon /> Buy AUG Coin</>}
              </button>
            </>
          )}
        </section>
      </main>
      <CustomerFooter />
    </div>
  )
}
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const METALS = [
  { key: 'gold_22k', label: 'Gold 22K', tone: '#CCA881', note: 'Hallmarked purchase request' },
  { key: 'gold_24k', label: 'Gold 24K', tone: '#BB8958', note: 'Pure gold coin request' },
  { key: 'silver_999', label: 'Silver 999', tone: '#7A8987', note: 'Certified silver request' },
]

const WEIGHTS = [
  { label: '50 mg', grams: 0.05 },
  { label: '100 mg', grams: 0.1 },
  { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.2 },
  { label: '500 mg', grams: 0.5 },
  { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 },
  { label: '4 gm', grams: 4 },
  { label: '8 gm', grams: 8 },
]

const ROLE_TARGET = {
  admin: 'Super Admin',
  dealer: 'Admin',
  sub_dealer: 'Dealer',
  promotor: 'Sub Dealer',
  super_admin: 'coin stock desk',
}

export default function BuyCoin() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'admin'
  const [metalType, setMetalType] = useState('gold_22k')
  const [weightLabel, setWeightLabel] = useState('100 mg')
  const [qty, setQty] = useState(1)
  const [cart, setCart] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')

  const selectedMetal = METALS.find(m => m.key === metalType) || METALS[0]
  const selectedWeight = WEIGHTS.find(w => w.label === weightLabel) || WEIGHTS[1]
  const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0)
  const totalWeight = useMemo(() => cart.reduce((sum, item) => sum + Number(item.weight_grams || 0) * Number(item.qty || 0), 0), [cart])

  const addItem = () => {
    const count = Math.max(1, Number(qty) || 1)
    setCart(prev => {
      const existing = prev.findIndex(item => item.metal_type === metalType && item.weight_label === weightLabel)
      if (existing >= 0) {
        return prev.map((item, index) => index === existing ? { ...item, qty: Number(item.qty) + count } : item)
      }
      return [...prev, { metal_type: metalType, weight_label: weightLabel, weight_grams: selectedWeight.grams, qty: count }]
    })
    setMsg('')
  }

  const removeItem = index => setCart(prev => prev.filter((_, i) => i !== index))

  const submitRequest = async () => {
    if (!cart.length) {
      setMsgType('error')
      setMsg('Add at least one coin item before sending the request.')
      return
    }
    setSubmitting(true)
    setMsg('')
    try {
      await api.post('/coin-requests/', { items: cart })
      setMsgType('success')
      setMsg(`Coin request sent to ${ROLE_TARGET[role] || 'your upstream role'}.`)
      setCart([])
    } catch (err) {
      setMsgType('error')
      setMsg(err.response?.data?.error || 'Failed to send coin request. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <main className="bc-page">
      <style>{`
        .bc-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:42px 28px 70px}.bc-wrap{max-width:1240px;margin:0 auto}.bc-hero{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:22px;align-items:stretch;margin-bottom:24px}.bc-title-card,.bc-side-card,.bc-panel,.bc-cart{background:rgba(253,253,252,.94);border:1px solid rgba(189,207,206,.9);border-radius:8px;box-shadow:0 22px 58px rgba(7,59,63,.08)}.bc-title-card{padding:32px 36px;position:relative;overflow:hidden}.bc-title-card:after{content:"";position:absolute;right:-70px;top:-80px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle,rgba(204,168,129,.26),transparent 68%)}.bc-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#BB8958;margin-bottom:10px}.bc-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,66px);line-height:.94;color:#073B3F;margin:0;font-weight:500}.bc-sub{margin:14px 0 0;color:#7A8987;font-weight:700;max-width:660px;line-height:1.7}.bc-side-card{padding:26px}.bc-side-label{font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#7A8987}.bc-side-value{font-size:28px;color:#0C4044;font-weight:950;margin-top:8px}.bc-grid{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:24px;align-items:start}.bc-panel{padding:26px}.bc-section-title{font-size:14px;font-weight:950;color:#0C4044;text-transform:uppercase;letter-spacing:.12em;margin-bottom:16px}.bc-metal-grid,.bc-weight-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:22px}.bc-weight-grid{grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}.bc-choice{border:1px solid rgba(189,207,206,.9);background:#FDFDFC;border-radius:8px;padding:16px;text-align:left;cursor:pointer;transition:.22s ease;color:#073B3F}.bc-choice:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(7,59,63,.08)}.bc-choice.active{border-color:var(--tone);background:linear-gradient(145deg,rgba(243,232,222,.8),#FDFDFC);box-shadow:0 16px 34px rgba(7,59,63,.08)}.bc-choice strong{display:block;font-size:15px}.bc-choice small{display:block;margin-top:6px;color:#7A8987;font-weight:700}.bc-weight{display:grid;place-items:center;min-height:74px;font-weight:950;letter-spacing:.03em}.bc-stepper{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:6px 0 24px}.bc-stepper button{width:46px;height:46px;border-radius:50%;border:1px solid rgba(12,64,68,.28);background:#FDFDFC;color:#073B3F;font-size:20px;font-weight:950;cursor:pointer}.bc-stepper input{width:110px;height:46px;border-radius:999px;border:1px solid rgba(12,64,68,.22);text-align:center;font-size:18px;font-weight:900;color:#073B3F;background:#FDFDFC}.bc-primary,.bc-secondary{height:50px;border-radius:999px;border:0;padding:0 24px;font-weight:950;letter-spacing:.04em;cursor:pointer}.bc-primary{background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;box-shadow:0 16px 30px rgba(7,59,63,.18)}.bc-secondary{background:#FDFDFC;border:1px solid rgba(12,64,68,.22);color:#073B3F}.bc-cart{padding:24px;position:sticky;top:126px}.bc-cart-head{display:flex;justify-content:space-between;gap:12px;align-items:center;border-bottom:1px solid rgba(189,207,206,.72);padding-bottom:16px;margin-bottom:16px}.bc-cart-title{font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#073B3F}.bc-pill{display:inline-flex;border-radius:999px;background:#E7EDEC;color:#0C4044;border:1px solid #D1DFDE;padding:7px 12px;font-size:12px;font-weight:900}.bc-cart-list{display:grid;gap:10px;margin-bottom:18px}.bc-cart-item{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:14px;border-radius:8px;background:#F3F3F0;border:1px solid rgba(189,207,206,.65)}.bc-cart-item strong{font-size:14px;color:#111817}.bc-cart-item small{display:block;margin-top:4px;color:#7A8987;font-weight:750}.bc-remove{border:0;background:rgba(201,32,53,.08);color:#C92035;border-radius:999px;padding:7px 10px;font-weight:900;cursor:pointer}.bc-empty{padding:34px 18px;text-align:center;color:#7A8987;border:1px dashed #D1DFDE;border-radius:8px;font-weight:800}.bc-summary{display:grid;gap:9px;margin-bottom:18px}.bc-row{display:flex;justify-content:space-between;color:#7A8987;font-weight:800}.bc-row b{color:#073B3F}.bc-msg{border-radius:8px;padding:13px 15px;margin-bottom:16px;font-weight:850}.bc-msg.success{background:rgba(12,64,68,.09);border:1px solid rgba(12,64,68,.25);color:#0C4044}.bc-msg.error{background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035}@media(max-width:980px){.bc-hero,.bc-grid{grid-template-columns:1fr}.bc-cart{position:static}.bc-metal-grid{grid-template-columns:1fr}.bc-page{padding:28px 14px 54px}}
      `}</style>
      <div className="bc-wrap">
        <section className="bc-hero">
          <div className="bc-title-card">
            <div className="bc-kicker">Secure Internal Coin Request</div>
            <h1 className="bc-title">Buy Coin</h1>
            <p className="bc-sub">Create a gold or silver coin request with weight, quantity, and role-aware approval flow. Requests are sent to {ROLE_TARGET[role] || 'your upstream role'}.</p>
          </div>
          <aside className="bc-side-card">
            <div className="bc-side-label">Cart Pieces</div>
            <div className="bc-side-value">{totalQty}</div>
            <div className="bc-side-label" style={{ marginTop: 18 }}>Net Weight</div>
            <div className="bc-side-value">{totalWeight.toFixed(2)} g</div>
          </aside>
        </section>

        <section className="bc-grid">
          <div className="bc-panel">
            <div className="bc-section-title">Select Metal</div>
            <div className="bc-metal-grid">
              {METALS.map(m => (
                <button key={m.key} type="button" className={`bc-choice ${metalType === m.key ? 'active' : ''}`} style={{ '--tone': m.tone }} onClick={() => setMetalType(m.key)}>
                  <strong>{m.label}</strong><small>{m.note}</small>
                </button>
              ))}
            </div>

            <div className="bc-section-title">Select Weight</div>
            <div className="bc-weight-grid">
              {WEIGHTS.map(w => (
                <button key={w.label} type="button" className={`bc-choice bc-weight ${weightLabel === w.label ? 'active' : ''}`} style={{ '--tone': selectedMetal.tone }} onClick={() => setWeightLabel(w.label)}>
                  {w.label}
                </button>
              ))}
            </div>

            <div className="bc-section-title">Quantity</div>
            <div className="bc-stepper">
              <button type="button" onClick={() => setQty(q => Math.max(1, Number(q || 1) - 1))}>-</button>
              <input value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
              <button type="button" onClick={() => setQty(q => Number(q || 1) + 1)}>+</button>
              <button type="button" className="bc-primary" onClick={addItem}>Add To Request</button>
              <button type="button" className="bc-secondary" onClick={() => navigate('/coin-requests-page')}>View Requests</button>
            </div>
          </div>

          <aside className="bc-cart">
            <div className="bc-cart-head">
              <div className="bc-cart-title">Request Cart</div>
              <span className="bc-pill">{cart.length} lines</span>
            </div>
            {cart.length ? (
              <div className="bc-cart-list">
                {cart.map((item, index) => (
                  <div className="bc-cart-item" key={`${item.metal_type}-${item.weight_label}-${index}`}>
                    <div><strong>{METALS.find(m => m.key === item.metal_type)?.label}</strong><small>{item.weight_label} x {item.qty}</small></div>
                    <button className="bc-remove" onClick={() => removeItem(index)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : <div className="bc-empty">No coin items added yet</div>}

            <div className="bc-summary">
              <div className="bc-row"><span>Total pieces</span><b>{totalQty}</b></div>
              <div className="bc-row"><span>Total requested weight</span><b>{totalWeight.toFixed(2)} g</b></div>
              <div className="bc-row"><span>Approver</span><b>{ROLE_TARGET[role] || 'Upstream'}</b></div>
            </div>
            {msg && <div className={`bc-msg ${msgType}`}>{msg}</div>}
            <button type="button" className="bc-primary" disabled={submitting || !cart.length} onClick={submitRequest} style={{ width: '100%', opacity: submitting || !cart.length ? .58 : 1 }}>
              {submitting ? 'Sending...' : 'Send Coin Request'}
            </button>
          </aside>
        </section>
      </div>
    </main>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
const METAL_COLORS = { gold_22k: '#CCA881', gold_24k: '#BB8958', silver_999: '#7A8987' }

export default function StoredCoins() {
  const navigate = useNavigate()
  const [coinStock, setCoinStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true)
      try {
        const res = await api.get('/coin-stock/')
        setCoinStock(res.data)
      } catch (err) {
        setError('Failed to load stored coins')
      }
      setLoading(false)
    }
    fetchStock()
  }, [])

  const grouped = ['gold_22k', 'gold_24k', 'silver_999'].map(m => ({
    metal: m,
    color: METAL_COLORS[m],
    items: coinStock.filter(s => s.metal_type === m),
  }))

  const totalCoins = coinStock.reduce((sum, s) => sum + s.qty, 0)
  const totalLines = coinStock.length

  return (
    <main className="sc-page">
      <style>{`
        .sc-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 52%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:42px 28px 76px}.sc-wrap{max-width:1280px;margin:0 auto}.sc-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:stretch;margin-bottom:22px}.sc-title-card,.sc-stat,.sc-section,.sc-empty{background:rgba(253,253,252,.95);border:1px solid rgba(189,207,206,.95);border-radius:8px;box-shadow:0 22px 58px rgba(7,59,63,.08)}.sc-title-card{padding:34px 38px;position:relative;overflow:hidden}.sc-title-card:after{content:"";position:absolute;right:-80px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(204,168,129,.3),transparent 70%)}.sc-kicker{font-size:12px;font-weight:950;letter-spacing:.18em;text-transform:uppercase;color:#BB8958}.sc-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,66px);line-height:.95;margin:9px 0 0;color:#073B3F;font-weight:500}.sc-sub{margin:12px 0 0;color:#7A8987;font-weight:750;line-height:1.7}.sc-actions{display:flex;gap:12px;align-items:center}.sc-btn{height:48px;border-radius:999px;border:1px solid rgba(12,64,68,.24);background:#FDFDFC;color:#073B3F;padding:0 22px;font-weight:950;cursor:pointer}.sc-btn.primary{border:0;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;box-shadow:0 16px 34px rgba(7,59,63,.18)}.sc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:24px}.sc-stat{padding:20px}.sc-stat small{display:block;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.13em;color:#7A8987}.sc-stat strong{display:block;margin-top:8px;font-size:32px;color:#073B3F}.sc-stat span{display:block;margin-top:5px;color:#7A8987;font-weight:750}.sc-section{padding:24px;margin-bottom:18px}.sc-section-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.sc-dot{width:12px;height:12px;border-radius:50%;background:var(--tone);box-shadow:0 0 18px var(--tone)}.sc-section h2{font-size:18px;margin:0;color:#073B3F;font-weight:950}.sc-section-line{height:1px;flex:1;background:linear-gradient(90deg,rgba(189,207,206,.9),transparent)}.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}.sc-card{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:110px;padding:20px;border-radius:8px;border:1px solid rgba(189,207,206,.82);background:linear-gradient(145deg,#FDFDFC,#F3F3F0);transition:.22s ease}.sc-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,rgba(var(--rgb),.18),transparent 42%);opacity:.8}.sc-card:hover{transform:translateY(-3px);box-shadow:0 18px 36px rgba(7,59,63,.1);border-color:rgba(var(--rgb),.55)}.sc-card-label,.sc-card-qty{position:relative}.sc-card-label{font-size:16px;font-weight:900;color:#111817}.sc-card-label small{display:block;color:#7A8987;margin-top:5px;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.sc-card-qty{font-size:34px;line-height:1;font-weight:950;color:#073B3F}.sc-empty{padding:54px 28px;text-align:center;color:#7A8987;font-weight:850}.sc-loading{display:grid;place-items:center;min-height:240px;color:#7A8987;font-weight:900}.sc-error{padding:16px 18px;border-radius:8px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.24);color:#C92035;font-weight:850}@media(max-width:900px){.sc-page{padding:28px 14px 56px}.sc-hero{grid-template-columns:1fr}.sc-actions{justify-content:flex-start;flex-wrap:wrap}.sc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.sc-stats{grid-template-columns:1fr}.sc-title-card{padding:28px 22px}.sc-actions{display:grid}.sc-btn{width:100%}}
      `}</style>
      <div className="sc-wrap">
        <section className="sc-hero">
          <div className="sc-title-card">
            <div className="sc-kicker">Inventory Vault</div>
            <h1 className="sc-title">Stored Coin</h1>
            <p className="sc-sub">Role-wise coin stock, grouped by purity, with a clean live inventory view for all internal teams.</p>
          </div>
          <div className="sc-actions">
            <button className="sc-btn" onClick={() => navigate('/coin-transactions')}>Transactions</button>
            <button className="sc-btn primary" onClick={() => navigate('/buy-coin')}>Buy Coin</button>
          </div>
        </section>

        {!loading && !error && (
          <section className="sc-stats">
            <div className="sc-stat"><small>Total coins</small><strong>{totalCoins}</strong><span>{totalLines} stock lines</span></div>
            {grouped.map(g => <div className="sc-stat" key={g.metal}><small>{COIN_METAL_LABELS_TEXT[g.metal]}</small><strong>{g.items.reduce((s, i) => s + i.qty, 0)}</strong><span>{g.items.length} weights</span></div>)}
          </section>
        )}

        {loading && <div className="sc-loading">Loading stored coins...</div>}
        {error && <div className="sc-error">{error}</div>}
        {!loading && !error && coinStock.length === 0 && <div className="sc-empty">No stored coin stock available yet.</div>}

        {!loading && !error && grouped.map(group => group.items.length > 0 && (
          <section className="sc-section" key={group.metal}>
            <div className="sc-section-head" style={{ '--tone': group.color }}>
              <span className="sc-dot" />
              <h2>{COIN_METAL_LABELS_TEXT[group.metal]}</h2>
              <span className="sc-section-line" />
            </div>
            <div className="sc-grid">
              {group.items.map(s => (
                <article className="sc-card" key={s.id} style={{ '--rgb': hexToRgb(group.color) }}>
                  <div className="sc-card-label">{s.weight_label}<small>available stock</small></div>
                  <div className="sc-card-qty">{s.qty}</div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

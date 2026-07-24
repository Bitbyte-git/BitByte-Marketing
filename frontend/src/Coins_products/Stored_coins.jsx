import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
const METAL_COLORS = { gold_22k: '#fbbf24', gold_24k: '#ffd700', silver_999: '#c0c0c0' }

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

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%, #0f1729 0%, #020617 55%)', color: '#f8fafc', fontFamily: '"Inter",system-ui,sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '22px', borderRadius: '4px', background: 'linear-gradient(180deg,#4ade80,#22c55e)' }} />
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#4ade80,#86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Stored Coins
              </h1>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, paddingLeft: '14px' }}>
              {totalCoins} coins currently in your stock
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 22px',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            ← Back
          </button>
        </div>

        {/* Summary strip */}
        {!loading && !error && coinStock.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {grouped.map(g => {
              const subtotal = g.items.reduce((s, i) => s + i.qty, 0)
              return (
                <div key={g.metal} style={{
                  background: `linear-gradient(135deg, rgba(${hexToRgb(g.color)},0.10), rgba(${hexToRgb(g.color)},0.02))`,
                  border: `1px solid rgba(${hexToRgb(g.color)},0.25)`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {COIN_METAL_LABELS_TEXT[g.metal]}
                  </div>
                  <div style={{ color: g.color, fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', marginTop: '4px' }}>
                    {subtotal}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <div style={{
              width: '32px', height: '32px', margin: '0 auto 14px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#4ade80',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: '14px', padding: '16px 22px', marginBottom: '24px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!loading && !error && coinStock.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '80px 0', fontSize: '14px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '18px' }}>
            No stock yet
          </div>
        )}

        {!loading && !error && grouped.map(group => (
          group.items.length > 0 && (
            <div key={group.metal} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: group.color, boxShadow: `0 0 10px ${group.color}` }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: group.color }}>
                  {COIN_METAL_LABELS_TEXT[group.metal]}
                </h2>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, rgba(${hexToRgb(group.color)},0.3), transparent)` }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {group.items.map(s => (
                  <div
                    key={s.id}
                    style={{
                      background: `linear-gradient(135deg, rgba(${hexToRgb(group.color)},0.08), rgba(255,255,255,0.02))`,
                      border: `1px solid rgba(${hexToRgb(group.color)},0.28)`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `rgba(${hexToRgb(group.color)},0.55)` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `rgba(${hexToRgb(group.color)},0.28)` }}
                  >
                    <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{s.weight_label}</div>
                    <div style={{ color: group.color, fontWeight: 900, fontSize: '24px', fontFamily: 'monospace' }}>{s.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
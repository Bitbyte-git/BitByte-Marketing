import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    dot: <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    refresh: <><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
  }
  return <svg {...common}>{icons[name]}</svg>
}

const getImageUrl = img => {
  if (!img) return null
  let p = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE}/${p.replace(/^\/+/, '')}`
}

export default function SoldOutProducts() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('sold_out')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchList() }, [filter])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/jewelry-products/sold-out/?filter=${filter}`)
      setProducts(res.data.results || [])
    } catch { setProducts([]) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F3F0', padding: '32px', fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C92035' }}>
            <Icon name="alert" size={20} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#073B3F' }}>Stock Alerts</div>
            <div style={{ fontSize: '13px', color: '#7A8987', marginTop: '4px' }}>Sold out and low stock products</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/stock-notifications')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(31,111,235,0.08)', border: '1px solid rgba(31,111,235,0.3)', color: '#1f6feb', fontWeight: 800, cursor: 'pointer' }}>
            <Icon name="alert" size={15} />Notify Requests
          </button>
          <button onClick={() => navigate('/super-admin')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', fontWeight: 800, cursor: 'pointer' }}>
            <Icon name="back" size={15} />Back
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { key: 'sold_out', label: 'Sold Out', icon: 'dot', color: '#C92035' },
          { key: 'low_stock', label: 'Low Stock', icon: 'dot', color: '#BB8958' },
          { key: 'both', label: 'All Alerts', icon: 'list', color: '#0C4044' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              border: filter === f.key ? '1px solid #073B3F' : '1px solid rgba(189,207,206,0.72)',
              background: filter === f.key ? 'linear-gradient(135deg,#0C4044,#073B3F)' : '#FDFDFC',
              color: filter === f.key ? '#FDFDFC' : '#0C4044',
            }}>
            <span style={{ color: filter === f.key ? '#FDFDFC' : f.color }}><Icon name={f.icon} size={f.icon === 'dot' ? 9 : 15} /></span>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(12,64,68,0.2)', borderTop: '3px solid #0C4044', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987', border: '2px dashed #BDCFCE', borderRadius: '18px' }}>
          <div style={{ color: '#0C4044', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><Icon name="check" size={36} /></div>
          No alerts — all products well stocked
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {products.map(p => {
            const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
            return (
              <div key={p.id} style={{ background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.72)', borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '14px', padding: '14px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#F3E8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BB8958' }}>
                  {firstImg ? <img src={firstImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="box" size={28} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', color: '#7A8987', fontWeight: 700 }}>{p.product_code}</div>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: '#111817', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8987', marginBottom: '8px' }}>{p.metal?.toUpperCase()} {p.grade?.toUpperCase()} • {p.category}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 900,
                    background: p.stock_status === 'out_of_stock' ? 'rgba(201,32,53,0.12)' : 'rgba(187,137,88,0.15)',
                    color: p.stock_status === 'out_of_stock' ? '#C92035' : '#BB8958',
                  }}>
                    <Icon name="dot" size={7} />
                    Stock: {p.stock_quantity} {p.stock_status === 'out_of_stock' ? '— SOLD OUT' : '— LOW'}
                  </div>
                </div>
                <button onClick={() => navigate('/add-product')}
                  style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', color: '#FDFDFC', fontWeight: 800, fontSize: '12px', cursor: 'pointer', height: 'fit-content' }}>
                  <Icon name="refresh" size={13} />Restock
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
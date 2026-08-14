import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#073B3F' }}>⚠️ Stock Alerts</div>
          <div style={{ fontSize: '13px', color: '#7A8987', marginTop: '4px' }}>Sold out and low stock products</div>
        </div>
        <button onClick={() => navigate('/super-admin')} style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', fontWeight: 800, cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { key: 'sold_out', label: '🔴 Sold Out' },
          { key: 'low_stock', label: '🟠 Low Stock' },
          { key: 'both', label: '📋 All Alerts' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '10px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              border: filter === f.key ? '1px solid #073B3F' : '1px solid rgba(189,207,206,0.72)',
              background: filter === f.key ? 'linear-gradient(135deg,#0C4044,#073B3F)' : '#FDFDFC',
              color: filter === f.key ? '#FDFDFC' : '#0C4044',
            }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987', border: '2px dashed #BDCFCE', borderRadius: '18px' }}>
          ✅ No alerts — all products well stocked
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {products.map(p => {
            const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
            return (
              <div key={p.id} style={{ background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.72)', borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '14px', padding: '14px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#F3E8DE' }}>
                  {firstImg && <img src={firstImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', color: '#7A8987', fontWeight: 700 }}>{p.product_code}</div>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: '#111817', marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#7A8987', marginBottom: '8px' }}>{p.metal?.toUpperCase()} {p.grade?.toUpperCase()} • {p.category}</div>
                  <div style={{
                    display: 'inline-block', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 900,
                    background: p.stock_status === 'out_of_stock' ? 'rgba(201,32,53,0.12)' : 'rgba(187,137,88,0.15)',
                    color: p.stock_status === 'out_of_stock' ? '#C92035' : '#BB8958',
                  }}>
                    Stock: {p.stock_quantity} {p.stock_status === 'out_of_stock' ? '— SOLD OUT' : '— LOW'}
                  </div>
                </div>
                <button onClick={() => navigate('/add-product')}
                  style={{ alignSelf: 'center', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', color: '#FDFDFC', fontWeight: 800, fontSize: '12px', cursor: 'pointer', height: 'fit-content' }}>
                  Restock
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
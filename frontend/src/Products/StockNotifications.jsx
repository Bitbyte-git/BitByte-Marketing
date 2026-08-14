import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10-3-3" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  }
  return <svg {...common}>{icons[name]}</svg>
}

export default function StockNotifications() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchList() }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notify-me/')
      setProducts(res.data.products || [])
    } catch { setProducts([]) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F3F0', padding: '32px', fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(31,111,235,0.1)', border: '1px solid rgba(31,111,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f6feb' }}>
            <Icon name="bell" size={20} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#073B3F' }}>Stock Notifications</div>
            <div style={{ fontSize: '13px', color: '#7A8987', marginTop: '4px' }}>Customers waiting for sold-out products to restock</div>
          </div>
        </div>
        <button onClick={() => navigate('/super-admin')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', fontWeight: 800, cursor: 'pointer' }}>
          <Icon name="back" size={15} />Back
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(12,64,68,0.2)', borderTop: '3px solid #0C4044', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7A8987', border: '2px dashed #BDCFCE', borderRadius: '18px' }}>
          <div style={{ color: '#0C4044', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><Icon name="check" size={36} /></div>
          No notify requests yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {products.map(p => (
            <div key={p.product_id} style={{ background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.72)', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(expanded === p.product_id ? null : p.product_id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F3E8DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BB8958', flexShrink: 0 }}>
                    <Icon name="box" size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '14px', color: '#111817' }}>{p.product_name}</div>
                    <div style={{ fontSize: '11px', color: '#7A8987', marginTop: '2px' }}>{p.product_code} · Current stock: {p.current_stock}</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px',
                  background: 'rgba(31,111,235,0.1)', color: '#1f6feb', fontWeight: 900, fontSize: '12px'
                }}>
                  <Icon name="user" size={13} />{p.waiting_count} waiting
                </div>
              </button>

              {expanded === p.product_id && (
                <div style={{ borderTop: '1px solid rgba(189,207,206,0.5)', padding: '4px 20px 16px' }}>
                  {p.customers.map(c => (
                    <div key={c.notify_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(189,207,206,0.35)' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#111817' }}>{c.email}</div>
                        <div style={{ fontSize: '11px', color: '#7A8987', marginTop: '2px' }}>
                          {c.id_str || c.role} · Requested {new Date(c.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '999px',
                        background: c.notified ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.08)',
                        color: c.notified ? '#0C4044' : '#C92035',
                      }}>
                        {c.notified ? 'Notified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
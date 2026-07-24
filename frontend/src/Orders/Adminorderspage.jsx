import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const STATUS_COLORS = {
  pending:    { bg: 'rgba(204,168,129,0.16)', border: 'rgba(204,168,129,0.48)', color: '#BB8958' },
  confirmed:  { bg: 'rgba(12,64,68,0.10)',  border: 'rgba(12,64,68,0.38)',  color: '#0C4044' },
  processing: { bg: 'rgba(189,207,206,0.24)', border: 'rgba(189,207,206,0.68)', color: '#0C4044' },
  shipped:    { bg: 'rgba(187,137,88,0.14)',  border: 'rgba(187,137,88,0.44)',  color: '#8A623D' },
  delivered:  { bg: 'rgba(12,64,68,0.12)',   border: 'rgba(12,64,68,0.42)',   color: '#073B3F' },
  cancelled:  { bg: 'rgba(201,32,53,0.10)',   border: 'rgba(201,32,53,0.42)',   color: '#C92035' },
}

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const dark = false
  const bg = '#FDFDFC', text = '#111817', subtext = '#7A8987'
  const accent = '#0C4044', border = 'rgba(189,207,206,0.72)'
  const cardBg = 'rgba(253,253,252,0.97)', cardBorder = '1px solid rgba(189,207,206,0.72)'

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders/')
      setOrders(Array.isArray(res.data) ? res.data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : [])
    } catch { setOrders([]) }
    setLoading(false)
  }

  const updateStatus = async (orderId, newStatus) => {
    setStatusUpdating(orderId)
    try {
      await api.patch(`/orders/${orderId}/`, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
    } catch { alert('Status update failed') }
    setStatusUpdating(null)
  }

  const getImageUrl = url => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}/${url.replace(/^\/+/, '')}`
  }

  const inr = n => `₹${Math.round(n).toLocaleString('en-IN')}`
  const formatDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q || o.order_id?.toLowerCase().includes(q) || o.product_name?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0),
  }

  return (
    <div className="orders-shell" style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ord-row{transition:background 0.2s,border-color 0.2s,transform 0.2s,box-shadow 0.2s;cursor:pointer;}
        .ord-row:hover{background:rgba(189,207,206,0.16) !important;box-shadow:inset 3px 0 0 rgba(12,64,68,0.42);}
        .orders-shell{background:radial-gradient(circle at 12% 0%,rgba(204,168,129,0.16),transparent 28%),radial-gradient(circle at 88% 2%,rgba(12,64,68,0.09),transparent 28%),#FDFDFC;}
        .orders-stat{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;}
        .orders-stat:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(7,59,63,.10);border-color:rgba(12,64,68,.24)!important;}
        .orders-filter{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;}
        .orders-filter:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(7,59,63,.08);}
        .orders-action{transition:transform .2s ease,box-shadow .2s ease,background .2s ease;}
        .orders-action:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(7,59,63,.13);}
      `}</style>

      {/* Navbar */}
      <div style={{ background: 'rgba(253,253,252,0.94)', borderBottom: `1px solid ${border}`, padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="orders-action" onClick={() => navigate('/super-admin')} style={{ background: 'rgba(231,237,236,0.72)', border: `1px solid ${border}`, color: accent, borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
            ← Dashboard
          </button>
          <div>
            <div style={{ color: accent, fontWeight: 800, fontSize: 16, letterSpacing: '0.05em' }}>🛍️ JEWELRY ORDERS</div>
            <div style={{ color: subtext, fontSize: 11, marginTop: 2 }}>All customer orders — manage & track</div>
          </div>
        </div>
        <button className="orders-action" onClick={fetchOrders} style={{ background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: '1px solid rgba(12,64,68,0.28)', color: '#FDFDFC', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Orders', value: stats.total, color: '#0C4044' },
            { label: 'Pending', value: stats.pending, color: '#BB8958' },
            { label: 'Confirmed', value: stats.confirmed, color: '#0C4044' },
            { label: 'Shipped', value: stats.shipped, color: '#8A623D' },
            { label: 'Delivered', value: stats.delivered, color: '#073B3F' },
            { label: 'Total Revenue', value: inr(stats.revenue), color: '#C92035', isText: true },
          ].map(s => (
            <div className="orders-stat" key={s.label} style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '16px 18px', animation: 'fadeIn 0.4s ease both' }}>
              <div style={{ fontSize: 9, color: subtext, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: s.isText ? 16 : 26, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, product, customer..."
            style={{ flex: 1, minWidth: 240, background: 'rgba(253,253,252,0.92)', border: `1px solid ${border}`, borderRadius: 10, padding: '10px 16px', color: text, fontSize: 13, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <button className="orders-filter" key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${filterStatus === s ? accent : border}`, background: filterStatus === s ? 'linear-gradient(135deg,#0C4044,#073B3F)' : 'rgba(253,253,252,0.72)', color: filterStatus === s ? '#FDFDFC' : subtext, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid rgba(189,207,206,0.65)`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}/>
            <div style={{ color: subtext, fontSize: 13 }}>Loading orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: subtext }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15 }}>No orders found</div>
          </div>
        ) : (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 58px rgba(7,59,63,0.08)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '12px 20px', borderBottom: `1px solid ${border}`, background: 'rgba(231,237,236,0.38)' }}>
              {['Order ID', 'Product', 'Customer', 'Total', 'Payment', 'Status', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 800, color: subtext, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((order, i) => {
              const st = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const img = getImageUrl(order.product_image_url)
              const isExpanded = selectedOrder?.id === order.id
              return (
                <div key={order.id} style={{ borderBottom: `1px solid ${border}`, animation: `fadeIn 0.3s ${i * 0.04}s ease both`, opacity: 0 }}>
                  {/* Main row */}
                  <div className="ord-row"
                    onClick={() => setSelectedOrder(isExpanded ? null : order)}
                    style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px 140px 160px 40px', gap: 0, padding: '14px 20px', alignItems: 'center', background: isExpanded ? 'rgba(189,207,206,0.18)' : 'transparent', borderLeft: isExpanded ? `2px solid ${accent}` : '2px solid transparent' }}>

                    <div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: accent, fontWeight: 700 }}>{order.order_id}</div>
                      <div style={{ fontSize: 10, color: subtext, marginTop: 2 }}>{formatDate(order.created_at)}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'rgba(231,237,236,0.65)', flexShrink: 0 }}>
                        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 18 }}>💍</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{order.product_name}</div>
                        <div style={{ fontSize: 10, color: subtext }}>{order.product_metal?.toUpperCase()} · Qty: {order.quantity}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_name}</div>
                      <div style={{ fontSize: 10, color: subtext }}>{order.customer_phone}</div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 800, color: '#BB8958', fontFamily: 'monospace' }}>{inr(order.total_price)}</div>

                    <div style={{ fontSize: 11, color: subtext, textTransform: 'capitalize' }}>
                      {order.payment_method?.replace('_', ' ')}
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ color: subtext, fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', textAlign: 'center' }}>▼</div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ padding: '24px', background: 'rgba(231,237,236,0.34)', borderTop: `1px solid ${border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, animation: 'fadeIn 0.25s ease both' }}>

                      {/* Delivery */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>📦 Delivery Details</div>
                        <div style={{ background: 'rgba(253,253,252,0.86)', border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>{order.customer_name}</div>
                          <div style={{ fontSize: 12, color: subtext, lineHeight: 1.8 }}>
                            📞 {order.customer_phone}{order.customer_alt_phone ? ` / Alt: ${order.customer_alt_phone}` : ''}<br/>
                            📍 {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ''}<br/>
                            {order.city}, {order.state} – {order.pincode}
                          </div>
                          {order.customer_dob && <div style={{ fontSize: 11, color: subtext, marginTop: 8 }}>🎂 DOB: {order.customer_dob}</div>}
                          {order.customer_anniversary && <div style={{ fontSize: 11, color: subtext }}>💍 Anniversary: {order.customer_anniversary}</div>}
                        </div>
                      </div>

                      {/* Product + Price */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>💰 Order Details</div>
                        <div style={{ background: 'rgba(253,253,252,0.86)', border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px' }}>
                          {[
                            { label: 'Product', value: order.product_name },
                            { label: 'Metal', value: `${order.product_metal?.toUpperCase()} ${order.product_grade?.toUpperCase()}` },
                            { label: 'Category', value: order.product_category },
                            { label: 'Unit Price', value: inr(order.unit_price) },
                            { label: 'Qty', value: order.quantity },
                            { label: 'Total', value: inr(order.total_price) },
                            { label: 'Payment', value: order.payment_method?.replace('_', ' ') },
                          ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 11, color: subtext }}>{r.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: text, textTransform: 'capitalize' }}>{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status update */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>⚙️ Update Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                            const sc = STATUS_COLORS[s]
                            const isCurrent = order.status === s
                            return (
                              <button key={s} disabled={isCurrent || statusUpdating === order.id}
                                onClick={() => updateStatus(order.id, s)}
                                style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${isCurrent ? sc.border : border}`, background: isCurrent ? sc.bg : 'rgba(253,253,252,0.76)', color: isCurrent ? sc.color : subtext, fontSize: 12, fontWeight: isCurrent ? 800 : 500, cursor: isCurrent ? 'default' : 'pointer', textTransform: 'capitalize', textAlign: 'left', transition: 'all 0.15s' }}>
                                {isCurrent ? '● ' : '○ '}{s}
                                {statusUpdating === order.id && !isCurrent && ' ...'}
                              </button>
                            )
                          })}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: subtext }}>
                          Customer: {order.customer_email}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
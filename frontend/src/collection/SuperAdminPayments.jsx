import { useEffect, useState } from 'react'

const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'
const RED = '#073B3F'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .sp-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .sp-main{width:min(1300px,calc(100% - 48px));margin:0 auto;padding:36px 0 90px}
  .sp-kicker{margin:0 0 6px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .sp-title{margin:0 0 8px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(26px,4vw,36px)}
  .sp-note{color:${MUTED};font-size:12.5px;margin:0 0 28px;max-width:720px;line-height:1.6}
  .sp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
  .sp-card{border:1px solid rgba(189,207,206,.8);border-radius:12px;background:#fff;padding:20px;box-shadow:0 12px 30px rgba(12,64,68,.06)}
  .sp-card-label{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px}
  .sp-card-value{font-family:"Playfair Display",serif;font-size:26px;color:${RED};font-weight:700}
  .sp-card.revenue{background:linear-gradient(135deg,${RED},#0C4044);border:none}
  .sp-card.revenue .sp-card-label{color:rgba(255,255,255,.8)}
  .sp-card.revenue .sp-card-value{color:#fff}
  .sp-panel{border:1px solid rgba(189,207,206,.8);border-radius:12px;background:#fff;padding:24px;margin-bottom:22px;box-shadow:0 12px 30px rgba(12,64,68,.06)}
  .sp-panel-title{margin:0 0 20px;font-size:15px;font-weight:900;color:${RED}}
  .sp-chart{display:flex;align-items:flex-end;gap:14px;height:200px;padding:0 6px}
  .sp-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .sp-bar{width:100%;max-width:52px;background:linear-gradient(180deg,${GOLD},#9F6130);border-radius:6px 6px 0 0;transition:height .4s ease}
  .sp-bar-value{font-size:10.5px;font-weight:800;color:${RED};margin-bottom:6px}
  .sp-bar-label{font-size:10.5px;font-weight:700;color:${MUTED};margin-top:8px}
  .sp-order-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid rgba(189,207,206,.4)}
  .sp-order-row:last-child{border-bottom:none}
  .sp-order-id{font-weight:800;color:${DARK};font-size:13px}
  .sp-order-buyer{color:${MUTED};font-size:11.5px;margin-top:2px}
  .sp-order-amount{font-weight:900;color:${RED};font-size:14px;margin-left:auto}
  .sp-order-tag{font-size:10px;font-weight:900;padding:4px 11px;border-radius:20px;text-transform:uppercase;background:rgba(7,59,63,.08);color:${RED};margin-left:14px;white-space:nowrap}
  .sp-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${RED};font-weight:800;font-size:13px;cursor:pointer}
  .sp-loadmore:hover{border-color:${RED};background:rgba(7,59,63,.04)}
  .sp-loadmore:disabled{opacity:.6;cursor:not-allowed}
  .sp-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  @media(max-width:900px){.sp-cards{grid-template-columns:repeat(2,1fr)}}
`

export default function SuperAdminPayments() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = async (p = 1) => {
    try {
      const { default: api } = await import('../api')
      const res = await api.get(`/superadmin/payments/?page=${p}`)
      setSummary({
        total_revenue: res.data.total_revenue,
        total_commission: res.data.total_commission,
        company_share: res.data.company_share,
        total_orders: res.data.total_orders,
        monthly_trend: res.data.monthly_trend,
      })
      setOrders(prev => p === 1 ? res.data.orders : [...prev, ...res.data.orders])
      setHasMore(res.data.has_more)
      setPage(p)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  const loadMore = () => {
    setLoadingMore(true)
    fetchData(page + 1)
  }

  const inr = n => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const trend = summary?.monthly_trend || []
  const maxRevenue = Math.max(...trend.map(t => t.revenue), 1)

  return (
    <div className="sp-page">
      <style>{styles}</style>
      <main className="sp-main">
        <p className="sp-kicker">Super Admin</p>
        <h1 className="sp-title">Revenue &amp; Payments</h1>
        <p className="sp-note">
          Real payments settle automatically to the business bank account via Razorpay — this page is
          a visibility report only. Commission shown here is the internal AUG Coin reward distributed
          across the referral chain, not a separate money transfer.
        </p>

        {loading ? (
          <div className="sp-empty">Loading...</div>
        ) : (
          <>
            <div className="sp-cards">
              <div className="sp-card revenue">
                <div className="sp-card-label">Total Revenue</div>
                <div className="sp-card-value">{inr(summary.total_revenue)}</div>
              </div>
              <div className="sp-card">
                <div className="sp-card-label">Total Commission Paid</div>
                <div className="sp-card-value">{inr(summary.total_commission)}</div>
              </div>
              <div className="sp-card">
                <div className="sp-card-label">Company Share</div>
                <div className="sp-card-value">{inr(summary.company_share)}</div>
              </div>
              <div className="sp-card">
                <div className="sp-card-label">Total Orders</div>
                <div className="sp-card-value">{summary.total_orders}</div>
              </div>
            </div>

            <section className="sp-panel">
              <h3 className="sp-panel-title">Monthly Revenue Trend (last 6 months)</h3>
              {trend.length === 0 ? (
                <div className="sp-empty">No revenue data yet</div>
              ) : (
                <div className="sp-chart">
                  {trend.map(t => (
                    <div className="sp-bar-col" key={t.month}>
                      <div className="sp-bar-value">{inr(t.revenue)}</div>
                      <div className="sp-bar" style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, 4)}%` }} />
                      <div className="sp-bar-label">{t.month}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="sp-panel">
              <h3 className="sp-panel-title">All Orders</h3>
              {orders.length === 0 ? (
                <div className="sp-empty">No orders yet</div>
              ) : (
                orders.map(o => (
                  <div key={o.order_id} className="sp-order-row">
                    <div>
                      <div className="sp-order-id">{o.order_id}</div>
                      <div className="sp-order-buyer">{o.buyer} · {fmtDate(o.created_at)}</div>
                    </div>
                    <div className="sp-order-amount">{inr(o.amount)}</div>
                    <span className="sp-order-tag">{o.payment_method}</span>
                  </div>
                ))
              )}
              {hasMore && (
                <button className="sp-loadmore" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
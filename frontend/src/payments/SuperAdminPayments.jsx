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
  .sp-note{color:${MUTED};font-size:12.5px;margin:0 0 22px;max-width:760px;line-height:1.6}
  .sp-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .sp-filter-tab{padding:9px 18px;border-radius:20px;border:1.5px solid #D1DFDE;background:#fff;color:${DARK};font-weight:800;font-size:12px;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .sp-filter-tab.active{border-color:${RED};background:${RED};color:#fff}
  .sp-custom-date{padding:8px 12px;border-radius:8px;border:1.5px solid #D1DFDE;font-size:12px;font-weight:700;color:${DARK};height:38px;box-sizing:border-box}
  .sp-date-to{color:${MUTED};font-weight:800;font-size:12px}
  .sp-apply-btn{height:38px;padding:0 18px;border-radius:20px;border:none;background:${GOLD};color:#fff;font-weight:900;font-size:12px;cursor:pointer}
  .sp-apply-btn:hover{background:#9F6130}
  .sp-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
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
  .sp-txn-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid rgba(189,207,206,.4)}
  .sp-txn-row:last-child{border-bottom:none}
  .sp-txn-id{font-weight:800;color:${DARK};font-size:12.5px;font-family:monospace}
  .sp-txn-buyer{color:${MUTED};font-size:11.5px;margin-top:2px}
  .sp-txn-amounts{margin-left:auto;text-align:right}
  .sp-txn-amount{font-weight:900;color:${RED};font-size:14px}
  .sp-txn-coins{color:${GOLD};font-size:11px;font-weight:700;margin-top:2px}
  .sp-txn-tag{font-size:10px;font-weight:900;padding:4px 11px;border-radius:20px;text-transform:uppercase;margin-left:14px;white-space:nowrap}
  .sp-txn-tag.wallet{background:rgba(13,148,136,.12);color:#0d9488}
  .sp-txn-tag.upi{background:rgba(147,51,234,.12);color:#9333ea}
  .sp-txn-tag.card{background:rgba(37,99,235,.12);color:#2563eb}
  .sp-txn-tag.netbanking{background:rgba(234,88,12,.12);color:#ea580c}
  .sp-txn-tag.other{background:rgba(7,59,63,.08);color:${RED}}
  .sp-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${RED};font-weight:800;font-size:13px;cursor:pointer}
  .sp-loadmore:hover{border-color:${RED};background:rgba(7,59,63,.04)}
  .sp-loadmore:disabled{opacity:.6;cursor:not-allowed}
  .sp-empty{color:${MUTED};font-size:13px;text-align:center;padding:24px 0}
  @media(max-width:900px){.sp-cards{grid-template-columns:1fr}}
`

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: '6month', label: '6 Months' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

export default function SuperAdminPayments() {
  const [summary, setSummary] = useState(null)
  const [txns, setTxns] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [activeView, setActiveView] = useState('super_admin_commission')

  const [loadError, setLoadError] = useState(false)

  const fetchData = async (p = 1, period = activeFilter, from = customFrom, to = customTo, view = activeView) => {
    try {
      const { default: api } = await import('../api')
      let url = `/superadmin/payments/?page=${p}&period=${period}&view=${view}`
      if (period === 'custom' && from && to) url += `&start_date=${from}&end_date=${to}`
      const res = await api.get(url)
      setSummary({
        total_revenue: res.data.total_revenue,
        total_coins_sold: res.data.total_coins_sold,
        total_transactions: res.data.total_transactions,
        monthly_trend: res.data.monthly_trend,
      })
      setTxns(prev => p === 1 ? res.data.transactions : [...prev, ...res.data.transactions])
      setHasMore(res.data.has_more)
      setPage(p)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchData(1, 'today', '', '', 'super_admin_commission') }, [])

  const handleFilterClick = key => {
    setActiveFilter(key)
    if (key !== 'custom') {
      setLoading(true)
      fetchData(1, key, '', '', activeView)
    } else if (customFrom && customTo) {
      setLoading(true)
      fetchData(1, 'custom', customFrom, customTo, activeView)
    }
  }

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    setLoading(true)
    fetchData(1, 'custom', customFrom, customTo, activeView)
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetchData(page + 1, activeFilter, customFrom, customTo, activeView)
  }

  const handleViewChange = e => {
    const view = e.target.value
    setActiveView(view)
    setLoading(true)
    fetchData(1, activeFilter, customFrom, customTo, view)
  }

  const inr = n => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtMethod = m => (m || 'other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const trend = summary?.monthly_trend || []
  const maxRevenue = Math.max(...trend.map(t => t.revenue), 1)

  return (
    <div className="sp-page">
      <style>{styles}</style>
     <main className="sp-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="sp-kicker">Super Admin</p>
            <h1 className="sp-title" style={{ marginBottom: 8 }}>Revenue &amp; Payments</h1>
          </div>
          <select
            value={activeView}
            onChange={handleViewChange}
            style={{
              padding: '10px 16px', borderRadius: 20, border: `1.5px solid ${RED}`,
              background: '#fff', color: RED, fontWeight: 800, fontSize: 12.5, cursor: 'pointer'
            }}
          >
            <option value="all_sales">All Sales</option>
            <option value="super_admin_commission">Super Admin Commission</option>
            <option value="my_commission">My Commission</option>
          </select>
        </div>
        <p className="sp-note">
          Real money enters the business only when a user recharges AUG Coin via Razorpay — this
          list shows every such recharge transaction (payment method + Razorpay transaction ID).
          Spending coins on jewelry orders does not create new revenue, it just uses coins already paid for.
        </p>

        <div className="sp-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`sp-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
          {activeFilter === 'custom' && (
            <>
              <input type="date" className="sp-custom-date" value={customFrom}
                max={customTo || new Date().toISOString().split('T')[0]}
                onChange={e => setCustomFrom(e.target.value)} />
              <span className="sp-date-to">to</span>
              <input type="date" className="sp-custom-date" value={customTo}
                min={customFrom} max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomTo(e.target.value)} />
              <button className="sp-apply-btn" onClick={applyCustomRange}>Apply</button>
            </>
          )}
        </div>

        {loading ? (
          <div className="sp-empty">Loading...</div>
        ) : (
          <>
            <div className="sp-cards">
              <div className="sp-card revenue">
                <div className="sp-card-label">Real Revenue Collected</div>
                <div className="sp-card-value">{inr(summary.total_revenue)}</div>
              </div>
              <div className="sp-card">
                <div className="sp-card-label">Coins Sold</div>
                <div className="sp-card-value">{(summary.total_coins_sold || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="sp-card">
                <div className="sp-card-label">Transactions</div>
                <div className="sp-card-value">{summary.total_transactions}</div>
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
              <h3 className="sp-panel-title">Recharge Transactions {activeFilter !== 'custom' ? `— ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''}</h3>
              {txns.length === 0 ? (
                <div className="sp-empty">No transactions in this period</div>
              ) : (
                txns.map((t, i) => (
                  <div key={i} className="sp-txn-row">
                    <div>
                      <div className="sp-txn-id">{t.transaction_id}</div>
                      <div className="sp-txn-buyer">{t.buyer} · {fmtDate(t.created_at)}</div>
                    </div>
                    <div className="sp-txn-amounts">
                      <div className="sp-txn-amount">{inr(t.amount)}</div>
                      {t.coins != null && (
                        <div className="sp-txn-coins">{t.coins.toLocaleString('en-IN')} coins</div>
                      )}
                      {t.percent != null && (
                        <div className="sp-txn-coins" style={{ color: GOLD, fontWeight: 900 }}>{t.percent}%</div>
                      )}
                    </div>
                    <span className={`sp-txn-tag ${t.payment_method}`}>{fmtMethod(t.payment_method)}</span>
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
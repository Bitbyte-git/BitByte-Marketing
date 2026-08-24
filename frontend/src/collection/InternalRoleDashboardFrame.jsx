import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'

const palette = {
  white: '#FDFDFC',
  off: '#F3F3F0',
  mist: '#E7EDEC',
  aqua: '#D1DFDE',
  dusty: '#BDCFCE',
  teal: '#0C4044',
  deep: '#073B3F',
  champagne: '#F3E8DE',
  gold: '#CCA881',
  antique: '#BB8958',
  grey: '#7A8987',
  black: '#111817',
  red: '#C92035',
}

const chartPeriods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7D' },
  { key: 'month', label: '1M' },
  { key: '3month', label: '3M' },
  { key: 'year', label: '1Y' },
  { key: 'all', label: 'All' },
]

function Icon({ type }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'store') return <svg {...common}><path d="M4 10h16l-1-5H5l-1 5z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
  if (type === 'report') return <svg {...common}><path d="M4 19V5"/><path d="M8 19v-8"/><path d="M12 19V8"/><path d="M16 19v-5"/><path d="M20 19V4"/></svg>
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  if (type === 'box') return <svg {...common}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
  if (type === 'cart') return <svg {...common}><path d="M6 6h15l-2 9H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
  return <svg {...common}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
}

function normalizeSeries(rows, period) {
  const formatAxis = (iso) => {
    const d = new Date(iso)
    if (period === 'today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (period === 'week' || period === 'month' || period === '3month') return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }
  const grouped = new Map()
  ;(rows || []).forEach(row => {
    const label = formatAxis(row.time)
    const prev = grouped.get(label)
    if (prev) prev.count += Number(row.count || 0)
    else grouped.set(label, {
      ...row,
      count: Number(row.count || 0),
      label,
      fullDate: new Date(row.time).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
      fullTime: new Date(row.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
    })
  })
  return Array.from(grouped.values()).sort((a, b) => new Date(a.time) - new Date(b.time))
}

function OrderTrendPanel({ title = 'Order Volume', endpoint = '/order-timeseries/', requestParams = {}, onSummaryChange }) {
  const [period, setPeriod] = useState('today')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async (nextPeriod = period) => {
    setLoading(true)
    try {
      const res = await api.get(endpoint, { params: { ...requestParams, period: nextPeriod } })
      const normalized = normalizeSeries(res.data?.data || [], nextPeriod)
      setData(normalized)
      onSummaryChange?.(normalized.reduce((sum, row) => sum + Number(row.count || 0), 0))
      setLastUpdated(new Date())
    } catch {
      setData([])
      onSummaryChange?.(0)
      setLastUpdated(new Date())
    }
    setLoading(false)
  }

  useEffect(() => { fetchData('today') }, [])

  const totalOrders = data.reduce((sum, row) => sum + Number(row.count || 0), 0)
  const peakOrders = data.length ? Math.max(...data.map(row => Number(row.count || 0))) : 0
  const averageOrders = data.length ? (totalOrders / data.length).toFixed(1) : '0.0'
  const selectedPeriodLabel = chartPeriods.find(item => item.key === period)?.label || 'Today'
  const peakIndex = data.length ? data.reduce((best, row, idx, arr) => row.count > arr[best].count ? idx : best, 0) : -1
  const activeLabels = data.filter(row => row.count > 0).map(row => row.label)
  const trendPercent = useMemo(() => {
    if (!data.length) return 0
    const mid = Math.max(1, Math.floor(data.length / 2))
    const avg = arr => arr.length ? arr.reduce((s, d) => s + Number(d.count || 0), 0) / arr.length : 0
    const first = avg(data.slice(0, mid))
    const second = avg(data.slice(mid))
    if (first <= 0) return second > 0 ? 100 : 0
    return Math.round(((second - first) / first) * 100)
  }, [data])

  const Dot = ({ cx, cy, index, payload }) => {
    if (!payload?.count || cx == null || cy == null) return null
    const peak = index === peakIndex
    return <g>{peak && <circle className="ird-pulse" cx={cx} cy={cy} r={10} fill="#E2BC84" opacity="0.28" />}<circle cx={cx} cy={cy} r={peak ? 6 : 4.5} fill="#E2BC84" stroke={palette.deep} strokeWidth="2.5" /></g>
  }

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return <div className="ird-tooltip"><div><span>{row.fullDate}</span><b>{row.fullTime}</b></div><strong>{row.count} orders</strong></div>
  }

  return (
    <section className="ird-chart-card">
      <div className="ird-chart-head">
        <div>
          <p>Order Analytics</p>
          <div className="ird-chart-title-row"><h2>{title}</h2><span><i />Manual refresh only</span></div>
          <small>{totalOrders} orders selected - {trendPercent >= 0 ? '+' : ''}{trendPercent}% trend {lastUpdated ? `- Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</small>
        </div>
        <button disabled={loading} onClick={() => fetchData(period)}><Icon type="clock" />{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <div className="ird-chart-kpis">
        <div><small>Total Orders</small><strong>{totalOrders.toLocaleString('en-IN')}</strong><span>{selectedPeriodLabel} selection</span></div>
        <div><small>Peak Volume</small><strong>{peakOrders.toLocaleString('en-IN')}</strong><span>Highest single bucket</span></div>
        <div><small>Average Pace</small><strong>{averageOrders}</strong><span>Orders per interval</span></div>
      </div>
      <div className="ird-periods">
        {chartPeriods.map(p => <button key={p.key} className={period === p.key ? 'active' : ''} onClick={() => { setPeriod(p.key); fetchData(p.key) }}>{p.label}</button>)}
        <span>Viewing {selectedPeriodLabel}</span>
      </div>
      <div className="ird-chart-box">
        {loading ? <div className="ird-empty">Loading...</div> : data.length === 0 ? <div className="ird-empty">No orders in this period</div> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 18, right: 22, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="irdArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E3BC83" stopOpacity="0.42"/><stop offset="52%" stopColor="#C59A68" stopOpacity="0.16"/><stop offset="100%" stopColor="#C59A68" stopOpacity="0.01"/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.12)" vertical={false}/>
              <XAxis dataKey="label" tickFormatter={(label) => activeLabels.includes(label) ? label : ''} stroke="rgba(226,235,232,0.62)" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.16)' }} minTickGap={30}/>
              <YAxis stroke="rgba(226,235,232,0.62)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} tickCount={5}/>
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(12,64,68,0.72)', strokeWidth: 2, strokeDasharray: '5 7' }}/>
              <Area type="monotone" dataKey="count" stroke="transparent" fill="url(#irdArea)" dot={false} isAnimationActive={false}/>
              <Line type="monotone" dataKey="count" stroke="#E2BC84" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" dot={<Dot />} activeDot={{ r: 8, fill: '#F0D29E', stroke: palette.deep, strokeWidth: 3 }} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

function KpiCard({ label, value, sub, note, icon = 'users', tone = palette.teal }) {
  return <div className="ird-kpi"><div className="ird-kpi-icon" style={{ color: tone }}><Icon type={icon}/></div><div><p>{label}</p><strong>{value}</strong>{sub ? <span>{sub}</span> : null}<small>{note}</small></div></div>
}

function DonutPanel({ title, totalLabel, data, login, onSliceClick }) {
  const colors = [palette.dusty, palette.teal, palette.antique, palette.gold, palette.red, palette.grey]
  return <section className="ird-pie"><h3>{title}</h3><strong>{totalLabel}</strong><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={102} paddingAngle={2} onClick={onSliceClick} style={onSliceClick ? { cursor: 'pointer' } : undefined}>{data.map((item, idx) => <Cell key={item.name} fill={item.color || colors[idx % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: palette.white, border: `1px solid ${palette.dusty}`, borderRadius: 10, fontSize: 12, color: palette.black }}/></PieChart></ResponsiveContainer><div className="ird-legend">{data.map((item, idx) => <button key={item.name} onClick={() => onSliceClick?.(item)}><i style={{ background: item.color || colors[idx % colors.length] }}/><span className={login ? 'big' : ''}>{item.name} {item.value}</span></button>)}</div></section>
}

export default function InternalRoleDashboardFrame({ roleName, focusLabel, focusCount = 0, roleDistribution = [], quickActions = [], endpoint, requestParams = {} }) {
  const navigate = useNavigate()
  const [orderCount, setOrderCount] = useState(0)
  const [loginCounts, setLoginCounts] = useState({ active: 0, inactive: 0 })
  const totalNetwork = roleDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const loginData = [
    { name: 'Active', value: loginCounts.active, color: palette.teal },
    { name: 'Inactive', value: loginCounts.inactive, color: palette.red },
  ]
  const hierarchyAction = quickActions.find(action => action.label.toLowerCase().includes('hierarchy'))
  const reportAction = quickActions.find(action => action.label.toLowerCase().includes('report'))
  const createAction = quickActions.find(action => action.label.toLowerCase().includes('create'))

  useEffect(() => {
    let current = true
    api.get('/today-login-status/', { params: { period: 'today', list_type: 'active', limit: 1 } })
      .then(res => {
        if (!current) return
        setLoginCounts({
          active: Number(res.data?.total_count || 0),
          inactive: Number(res.data?.other_count || 0),
        })
      })
      .catch(() => current && setLoginCounts({ active: 0, inactive: 0 }))
    return () => { current = false }
  }, [])

  return (
    <div className="ird-shell">
      <style>{`
        @keyframes irdIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes irdPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.8);opacity:.12}}
        .ird-shell{padding:24px 34px 0;box-sizing:border-box;font-family:"Inter",system-ui,sans-serif;color:${palette.black}}
        .ird-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:18px}.ird-kpi{min-height:126px;background:${palette.white};border:1px solid rgba(189,207,206,.78);border-radius:14px;padding:22px 24px;display:flex;align-items:flex-start;gap:18px;box-shadow:0 18px 46px rgba(7,59,63,.07);animation:irdIn .45s ease both}.ird-kpi-icon{width:54px;height:54px;border-radius:10px;background:${palette.mist};display:flex;align-items:center;justify-content:center;flex-shrink:0}.ird-kpi p{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:${palette.teal}}.ird-kpi strong{font-size:30px;font-weight:950;color:#00152a}.ird-kpi span{font-size:16px;margin-left:8px;color:${palette.black}}.ird-kpi small{display:block;margin-top:10px;color:#009957;font-size:13px;line-height:1.35}.ird-grid{display:grid;grid-template-columns:minmax(0,1fr) 38%;gap:22px;align-items:stretch}.ird-chart-card,.ird-pie,.ird-actions{position:relative;overflow:hidden;background:${palette.white};border:1px solid rgba(189,207,206,.78);border-radius:20px;padding:24px 28px;box-shadow:0 24px 64px rgba(7,59,63,.10);animation:irdIn .55s ease both}.ird-chart-card:before,.ird-pie:before,.ird-actions:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 5%,rgba(204,168,129,.18),transparent 30%),radial-gradient(circle at 95% 5%,rgba(12,64,68,.09),transparent 36%)}.ird-chart-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}.ird-chart-head p{margin:0;font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:${palette.antique}}.ird-chart-title-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ird-chart-title-row h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:42px;font-weight:950;line-height:1;color:${palette.deep};margin:5px 0 0}.ird-chart-title-row span{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(12,64,68,.28);background:${palette.mist};color:${palette.teal};border-radius:999px;padding:8px 13px;font-size:12px;font-weight:900}.ird-chart-title-row i{width:8px;height:8px;border-radius:50%;background:${palette.teal};box-shadow:0 0 0 4px rgba(12,64,68,.1)}.ird-chart-head small{display:block;margin-top:8px;font-size:13px;font-weight:800;color:${palette.grey}}.ird-chart-head button{min-height:48px;padding:0 20px;border-radius:14px;border:1px solid rgba(12,64,68,.32);background:linear-gradient(135deg,${palette.teal},${palette.deep});color:${palette.white};font-size:13px;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 14px 28px rgba(7,59,63,.16)}.ird-chart-head button:disabled{opacity:.62;cursor:not-allowed}.ird-chart-head button svg{width:17px;height:17px}.ird-periods{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0}.ird-periods button{padding:8px 18px;border-radius:999px;border:1px solid rgba(189,207,206,.82);background:rgba(253,253,252,.7);color:#6f7f7d;font-size:13px;font-weight:850;cursor:pointer}.ird-periods button.active{background:linear-gradient(135deg,${palette.teal},${palette.deep});color:${palette.white};border-color:${palette.teal};box-shadow:0 10px 22px rgba(12,64,68,.20)}.ird-chart-box{height:430px;border:1px solid rgba(189,207,206,.48);border-radius:18px;padding:14px 12px 8px;background:linear-gradient(180deg,rgba(253,253,252,.75),rgba(231,237,236,.36))}.ird-empty{height:100%;display:flex;align-items:center;justify-content:center;color:${palette.grey};font-size:13px}.ird-pulse{transform-box:fill-box;transform-origin:center;animation:irdPulse 1.6s ease-in-out infinite}.ird-tooltip{background:linear-gradient(145deg,rgba(253,253,252,.98),rgba(243,243,240,.96));border:1px solid rgba(189,207,206,.95);border-radius:14px;padding:16px 20px;box-shadow:0 22px 50px rgba(7,59,63,.18);min-width:240px}.ird-tooltip div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.ird-tooltip span{color:${palette.grey};font-size:13px}.ird-tooltip b{color:${palette.teal};font-size:13px;background:${palette.mist};padding:6px 12px;border-radius:9px}.ird-tooltip strong{font-size:20px;color:${palette.black}}.ird-side{display:flex;flex-direction:column;gap:22px}.ird-pie{min-height:390px}.ird-pie h3{font-size:17px;margin:0 0 8px;font-weight:950;color:${palette.teal}}.ird-pie>strong{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:36px;margin-bottom:8px;color:${palette.black}}.ird-legend{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}.ird-legend button{border:0;background:transparent;display:flex;align-items:center;gap:6px;cursor:pointer}.ird-legend i{width:12px;height:12px;border-radius:50%}.ird-legend span{font-size:14px;font-weight:850;color:${palette.black}}.ird-legend span.big{font-size:16px;font-weight:950}.ird-actions{margin-top:22px}.ird-actions h3{font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:${palette.teal};margin:0 0 14px}.ird-action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.ird-action-grid button{height:70px;border-radius:12px;border:1px solid rgba(189,207,206,.76);background:linear-gradient(145deg,${palette.white},${palette.off});display:flex;align-items:center;gap:12px;padding:0 20px;color:${palette.deep};font-weight:950;cursor:pointer;box-shadow:0 12px 30px rgba(7,59,63,.06)}.ird-action-grid button:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(7,59,63,.12)}@media(max-width:1180px){.ird-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ird-grid{grid-template-columns:1fr}.ird-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.ird-shell{padding:18px 14px 0}.ird-kpis,.ird-side,.ird-action-grid{grid-template-columns:1fr}.ird-chart-head{grid-template-columns:1fr}.ird-chart-title-row h2{font-size:34px}.ird-chart-box{height:340px}}
        .ird-grid{display:block!important}.ird-chart-card{margin-bottom:22px}.ird-side{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:36px!important}.ird-chart-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:26px 0}.ird-chart-kpis>div{position:relative;overflow:hidden;min-height:156px;padding:25px 24px;border:1px solid #D7E3E2;border-radius:18px;background:rgba(255,255,255,.78)}.ird-chart-kpis>div:after{content:'';position:absolute;right:-18px;top:-28px;width:78px;height:78px;border:1px solid rgba(197,154,104,.22);border-radius:50%}.ird-chart-kpis small{display:block;color:#83918F;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.ird-chart-kpis strong{display:block;margin:16px 0;color:#073B3F;font-family:Georgia,serif;font-size:26px}.ird-chart-kpis span{color:#A2764C;font-size:10px;font-weight:800}.ird-periods{align-items:center;padding:8px!important;border:1px solid #D7E3E2;border-radius:17px;background:rgba(255,255,255,.7)}.ird-periods>span{margin-left:auto;padding-right:14px;color:#83918F;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ird-chart-box{position:relative!important;border-color:rgba(219,191,148,.24)!important;border-radius:20px!important;padding:22px 18px 10px!important;background:radial-gradient(circle at 16% 0%,rgba(197,154,104,.17),transparent 32%),linear-gradient(145deg,#0B4848,#07383B 62%,#052D31)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 44px rgba(7,59,63,.2)!important}.ird-chart-box:before{content:'ORDER ACTIVITY';position:absolute;left:24px;top:14px;color:rgba(255,255,255,.32);font-size:8px;font-weight:900;letter-spacing:.16em}.ird-chart-box .ird-empty{color:rgba(231,239,236,.72)}.ird-pie{min-height:620px!important;padding:56px 54px!important;border-radius:16px!important;background:#FDFDFC!important}.ird-pie h3{font-size:19px!important}.ird-pie>strong{font-size:42px!important;margin:24px 0 30px!important}.ird-pie .recharts-responsive-container{height:340px!important}.ird-legend{margin-top:20px!important;gap:22px!important}.ird-legend span{font-size:15px!important;font-weight:900!important}.ird-actions{border-radius:18px!important}.ird-actions h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px!important;letter-spacing:0!important;text-transform:none!important}@media(max-width:900px){.ird-side,.ird-chart-kpis{grid-template-columns:1fr!important}.ird-pie{min-height:500px!important;padding:30px 24px!important}.ird-periods>span{width:100%;margin:4px 8px}.ird-chart-kpis>div{min-height:120px}}
        .ird-action-grid-primary{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:28px!important}.ird-action-grid-primary button{height:102px!important;background:#FDFDFC!important;box-shadow:none!important;font-size:15px!important;padding:0 36px!important}.ird-create-action{width:100%;height:54px;margin-top:26px;border:0;border-radius:14px;background:#00525C;color:#FDFDFC;font-size:15px;font-weight:950;cursor:pointer;box-shadow:0 16px 32px rgba(0,82,92,.15)}.ird-create-action:hover{background:#073B3F;transform:translateY(-1px)}@media(max-width:680px){.ird-action-grid-primary{grid-template-columns:1fr!important}}
      `}</style>
      <div className="ird-kpis">
        <KpiCard label="Order Volume" value={orderCount} sub="orders" note="Role scoped order analytics" icon="cart" tone="#00A767" />
        <KpiCard label={`Total ${focusLabel}`} value={focusCount} note={`${roleName} managed network`} icon="users" tone={palette.teal} />
        <KpiCard label="Hierarchy Units" value={totalNetwork} note="Visible downstream records" icon="store" tone={palette.antique} />
        <KpiCard label="Reports" value={quickActions.length} note="Role specific tools ready" icon="report" tone={palette.gold} />
      </div>
      <div className="ird-grid">
        <OrderTrendPanel title={`${roleName} Order Volume`} endpoint={endpoint} requestParams={requestParams} onSummaryChange={setOrderCount} />
        <div className="ird-side">
          <DonutPanel title="Role Distribution" totalLabel={`${totalNetwork} total`} data={roleDistribution.filter(item => Number(item.value || 0) > 0)} />
          <DonutPanel title="Today's Login Status" totalLabel={`${loginCounts.active + loginCounts.inactive} total users`} data={loginData} login onSliceClick={(entry) => entry.name === 'Active' ? navigate('/login-active') : navigate('/login-inactive')} />
        </div>
      </div>
      <section className="ird-actions">
        <h3>{roleName} Management</h3>
        <div className="ird-action-grid ird-action-grid-primary">
          {hierarchyAction && <button onClick={hierarchyAction.onClick}><Icon type={hierarchyAction.icon || 'store'} />Hierarchy</button>}
          {reportAction && <button onClick={reportAction.onClick}><Icon type={reportAction.icon || 'report'} />Sales Report</button>}
        </div>
        {createAction && <button className="ird-create-action" onClick={createAction.onClick}>+ {createAction.label}</button>}
      </section>
    </div>
  )
}

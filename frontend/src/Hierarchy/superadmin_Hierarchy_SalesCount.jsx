import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { SkeletonText } from '../components/Skeleton'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

// ══════════════════════════════════════════════════════════════════
// ICONS — same set as the hierarchy grid page, so the whole app feels
// like one consistent product instead of two different styles.
// ══════════════════════════════════════════════════════════════════
const IconShield = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconStore = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/>
    <path d="M4 9v10h16V9"/><path d="M9 21v-6h6v6"/>
  </svg>
)
const IconLink = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IconStar = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconUser = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconPhone = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconMapPin = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconBack = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconChart = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconBox = ({ color, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconRupee = ({ color, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c3 0 5-1.5 5-5"/>
  </svg>
)
const IconEmpty = ({ color, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" opacity="0"/><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
)

// ══════════════════════════════════════════════════════════════════
// ROLE CONFIG — matches the exact same colors as SuperAdminDashboard
// (Luxiva theme), so this page feels like the same product.
// ══════════════════════════════════════════════════════════════════
const ROLE_CFG = {
  admin:      { color: '#53615F', label: 'ADMIN',      Icon: IconShield, idKey: 'admin_id',      childKey: 'dealers' },
  dealer:     { color: '#0C4044', label: 'DEALER',      Icon: IconStore,  idKey: 'dealer_id',     childKey: 'sub_dealers' },
  sub_dealer: { color: '#BB8958', label: 'SUB DEALER',  Icon: IconLink,   idKey: 'sub_dealer_id', childKey: 'promotors' },
  promotor:   { color: '#CCA881', label: 'PROMOTOR',    Icon: IconStar,   idKey: 'promotor_id',   childKey: 'customers' },
  customer:   { color: '#C92035', label: 'CUSTOMER',    Icon: IconUser,   idKey: 'customer_id',   childKey: null },
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function getImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}/${url.replace(/^\/+/, '')}`
}

function collectOrders(node) {
  if (!node) return []
  // ── NEW: ovvoru order-kum adha place panna customer node-a attach pannuvom,
  // so product click pannina yaaru order pannanganu therinjukalam ──
  if (node.type === 'customer') return (node.orders || []).map(o => ({ ...o, _ownerNode: node }))
  const cfg = ROLE_CFG[node.type]
  const children = node[cfg.childKey] || []
  return children.flatMap(collectOrders)
}

function isSameDay(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

// ── NEW: today order illatha branch-ah tree-la irundhu prune pannum ──
function filterTreeForToday(node) {
  if (!node) return null
  if (node.type === 'customer') {
    const hasToday = (node.orders || []).some(o => isSameDay(o.created_at))
    return hasToday ? node : null
  }
  const cfg = ROLE_CFG[node.type]
  const prunedChildren = (node[cfg.childKey] || [])
    .map(filterTreeForToday)
    .filter(Boolean)
  if (prunedChildren.length === 0) return null
  return { ...node, [cfg.childKey]: prunedChildren }
}

// ══════════════════════════════════════════════════════════════════
// TREE ITEM — left panel, one node per row, indented by depth.
// ══════════════════════════════════════════════════════════════════
function TreeItem({ node, selectedId, onSelect, pulseId, period, expandedChildren, loadingNode, fetchChildren }) {
  const cfg = ROLE_CFG[node.type]
  const Icon = cfg.Icon
  const isSelected = selectedId === `${node.type}-${node.id}`
  const isPulsing = pulseId === `${node.type}-${node.id}`
  const nodeKey = `${node.type}-${node.id}`
  // ── CHANGED: children ippo expandedChildren state la irundhu varum, node kula illa ──
  const children = expandedChildren[nodeKey] || null   // null = innum fetch pannala, [] = fetch aagi customer-ku children illa
  const isLoadingThis = loadingNode === nodeKey
  const rgb = hexToRgb(cfg.color)
  const childColor = children && children.length > 0 ? ROLE_CFG[children[0].type].color : null

  // ── CHANGED: order count ippo node mela irundhே direct varum (backend already anுppுthு) ──
  const orderCount = node.order_count ?? 0

  const handleClick = () => {
    onSelect(node)
    if (cfg.childKey && !children) fetchChildren(node)   // ── NEW: first click la mattum fetch, appuram cache
  }

  return (
    <div className="stree-node">
      <div
        id={`streeid-${node.type}-${node.id}`}
        onClick={handleClick}
        className={`stree-item ${isPulsing ? 'stree-item-pulse' : ''}`}
        style={{
          '--nc': cfg.color,
          background: isSelected ? `rgba(${rgb},0.12)` : 'rgba(253,253,252,0.6)',
          borderColor: isSelected ? cfg.color : 'rgba(189,207,206,0.55)',
          boxShadow: isSelected ? `0 0 0 1px ${cfg.color}, 0 8px 22px rgba(${rgb},0.16)` : 'none',
        }}
      >
        {isSelected && <div className="stree-accent" style={{ background: cfg.color }} />}
        <div className="stree-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
          <Icon color={cfg.color} size={11} /> {cfg.label}
        </div>
        <div style={{ fontSize: 10, color: cfg.color, fontFamily: 'monospace', opacity: 0.85, marginTop: 3 }}>{node[cfg.idKey]}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111817', marginTop: 2 }}>{node.first_name} {node.last_name || ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {node.mobile_number && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#7A8987' }}>
              <IconPhone color="#7A8987" size={10} /> {node.mobile_number}
            </span>
          )}
          {node.city_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#7A8987' }}>
              <IconMapPin color="#7A8987" size={10} /> {node.city_name}
            </span>
          )}
        </div>
        <div className="stree-ordercount">
          <IconChart color="#0C4044" size={11} /> {orderCount} order{orderCount !== 1 ? 's' : ''}
        </div>
        {/* ── NEW: children fetch aagும் pothு chinna loading text ── */}
        {isLoadingThis && (
          <div style={{ fontSize: 10, color: '#7A8987', marginTop: 6 }}>Loading...</div>
        )}
      </div>

      {/* ── CHANGED: children irundha mattum render pannум், node.customers mari nested data illa ── */}
      {children && children.length > 0 && (
        <div className="stree-children" style={{ '--cc': childColor }}>
          {children.map((child) => (
            <div className="stree-branch" key={`${child.type}-${child.id}`} style={{ '--cc': childColor }}>
              <TreeItem
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                pulseId={pulseId}
                period={period}
                expandedChildren={expandedChildren}
                loadingNode={loadingNode}
                fetchChildren={fetchChildren}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function SuperAdminHierarchySalesCount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const role = searchParams.get('role')
  const id = searchParams.get('id')
  const period = searchParams.get('period')   // ── NEW: 'today' na Login page-la irundhu vandhurukom

  // ── NEW: indha date "today"-va nu check pannurom ──
  const isToday = (iso) => {
    if (!iso) return false
    const d = new Date(iso)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }

 const [root, setRoot] = useState(null)          // ── CHANGED: root la mattum root node info, children KAALI
const [loading, setLoading] = useState(true)
const [selected, setSelected] = useState(null)
const [pulseId, setPulseId] = useState(null)
const [expandedChildren, setExpandedChildren] = useState({})   // ── NEW: { 'admin-5': [dealer1, dealer2...] }
const [loadingNode, setLoadingNode] = useState(null)            // ── NEW: which node currently fetching children

// ── NEW: orders pagination (right panel) ──
const [orderGroups, setOrderGroups] = useState([])
const [ordersOffset, setOrdersOffset] = useState(0)
const [ordersLimit, setOrdersLimit] = useState(20)
const [ordersTotal, setOrdersTotal] = useState(0)
const [overallCount, setOverallCount] = useState(0)
const [overallAmount, setOverallAmount] = useState(0)
const [ordersLoading, setOrdersLoading] = useState(false)
const [ordersLoadingMore, setOrdersLoadingMore] = useState(false)


  const CHILD_ROLE = { admin: 'dealer', dealer: 'sub_dealer', sub_dealer: 'promotor', promotor: 'customer', customer: 'customer' }
const TREE_CACHE_KEY = `stree_cache_${role}_${id}`   // ── NEW: sessionStorage key

useEffect(() => {
  if (!role || !id) return
  setLoading(true)

  // ── NEW: root node real info (name/phone/city) backend la irundhu vaangurom ──
  api.get('/hierarchy/node-info/', { params: { role, id } })
    .then(res => {
      const rootNode = { type: role, ...res.data }
      setRoot(rootNode)
      setSelected(rootNode)
    })
    .catch(() => setRoot(null))
    .finally(() => setLoading(false))
}, [role, id])

  // ── NEW: node expand pannும் pothு, children fetch pannும் (cache-first) ──
  const fetchChildren = async (node) => {
  const key = `${node.type}-${node.id}`
  if (expandedChildren[key]) return   // already fetched

  setLoadingNode(key)
  try {
    const cacheKey = `stree_children_${key}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      setExpandedChildren(prev => ({ ...prev, [key]: JSON.parse(cached) }))
      setLoadingNode(null)
      return
    }
    const res = await api.get(`/hierarchy/children/?role=${node.type}&id=${node.id}`)
    const children = (res.data.items || []).map(c => ({ ...c, type: CHILD_ROLE[node.type] }))
    setExpandedChildren(prev => ({ ...prev, [key]: children }))
    // ── NEW: non-sensitive summary mattum cache pannurom (id, name, role, order_count) ──
    sessionStorage.setItem(cacheKey, JSON.stringify(children))
  } catch (err) {
    setExpandedChildren(prev => ({ ...prev, [key]: [] }))
  }
  setLoadingNode(null)
}

 // ── NEW: product-la irundhu neraa antha customer-ku jump pannum —
  // selected node-ah maathi, tree-la andha customer row-ku smooth scroll pannும் ──
  const jumpToCustomer = (custNode) => {
    setSelected(custNode)
    setPulseId(`customer-${custNode.id}`)
    setTimeout(() => {
      const el = document.getElementById(`streeid-customer-${custNode.id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    setTimeout(() => setPulseId(null), 1600)
  }

  // ── NEW: selected node maarina, orders backend la irundhu offset=0, limit=20 fetch pannurom ──
  useEffect(() => {
    if (!selected) return
    const fetchOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await api.get('/hierarchy/node-orders/', {
          params: { role: selected.type, id: selected.id, period, offset: 0, limit: 20 }
        })
        setOrderGroups(res.data.items || [])
        setOrdersTotal(res.data.total_groups || 0)
        setOverallCount(res.data.overall_count || 0)
        setOverallAmount(res.data.overall_amount || 0)
        setOrdersOffset(20)
        setOrdersLimit(50)
      } catch (err) { /* ignore */ }
      setOrdersLoading(false)
    }
    fetchOrders()
  }, [selected, period])

  const loadMoreOrders = async () => {
    setOrdersLoadingMore(true)
    try {
      const res = await api.get('/hierarchy/node-orders/', {
        params: { role: selected.type, id: selected.id, period, offset: ordersOffset, limit: ordersLimit }
      })
      setOrderGroups(prev => [...prev, ...(res.data.items || [])])
      setOrdersOffset(prev => prev + ordersLimit)
      setOrdersLimit(100)
    } catch (err) { /* ignore */ }
    setOrdersLoadingMore(false)
  }

  const hasMoreOrders = orderGroups.length < ordersTotal
  const groupedList = orderGroups   // ── CHANGED: backend already grouped ah anுppுthu, JSX same peraale use pannalam

  const text = '#111817'
  const subtext = '#7A8987'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '18px 32px',
          background: 'rgba(253,253,252,0.94)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(189,207,206,0.72)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.24)' }} />
            <div>
              <SkeletonText width="260px" height="17px" />
              <div style={{ marginTop: 6 }}><SkeletonText width="320px" height="12px" /></div>
            </div>
          </div>
          <SkeletonText width="90px" height="36px" />
        </div>

        <div style={{ padding: '28px 32px', paddingTop: 108 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 22, alignItems: 'start' }}>

            {/* LEFT: tree skeleton */}
            <div style={{ background: 'rgba(253,253,252,0.97)', border: '1px solid rgba(189,207,206,0.72)', borderRadius: 16, padding: 14 }}>
              <SkeletonText width="140px" height="12px" />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(189,207,206,0.55)' }}>
                    <SkeletonText width="70px" height="16px" />
                    <div style={{ marginTop: 6 }}><SkeletonText width="90px" height="10px" /></div>
                    <div style={{ marginTop: 4 }}><SkeletonText width="130px" height="13px" /></div>
                    <div style={{ marginTop: 8 }}><SkeletonText width="80px" height="18px" /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: details skeleton */}
            <div style={{ background: 'rgba(253,253,252,0.97)', border: '1px solid rgba(189,207,206,0.72)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(189,207,206,0.2)' }} />
                <div>
                  <SkeletonText width="80px" height="10px" />
                  <div style={{ marginTop: 6 }}><SkeletonText width="150px" height="16px" /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ flex: 1, minWidth: 160, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(189,207,206,0.4)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(189,207,206,0.25)' }} />
                    <div>
                      <SkeletonText width="80px" height="10px" />
                      <div style={{ marginTop: 6 }}><SkeletonText width="60px" height="22px" /></div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ background: 'rgba(253,253,252,0.85)', border: '1px solid rgba(189,207,206,0.6)', borderRadius: 14, padding: 16 }}>
                    <div style={{ width: '100%', height: 130, borderRadius: 10, background: 'rgba(189,207,206,0.18)', marginBottom: 12 }} />
                    <SkeletonText width="70%" height="14px" />
                    <div style={{ marginTop: 8, marginBottom: 10, display: 'flex', gap: 6 }}>
                      <SkeletonText width="50px" height="18px" />
                      <SkeletonText width="50px" height="18px" />
                    </div>
                    {[0, 1, 2, 3].map(j => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <SkeletonText width="40%" height="10px" />
                        <SkeletonText width="30%" height="10px" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  if (!root) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <IconEmpty color="#C92035" />
        <span style={{ color: '#C92035', fontSize: 14 }}>No data found.</span>
        <button onClick={() => navigate(-1)} style={{ marginTop: 8, padding: '8px 18px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          ← Back
        </button>
      </div>
    )
  }

  const selCfg = selected ? ROLE_CFG[selected.type] : null

  const displayRoot = root   // ── CHANGED: filterTreeForToday nested data expect pannuthu, ippo lazy-load ah irukanum so remove pannirukom

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes sheaderShimmer{ 0%{ background-position:-200% center; } 100%{ background-position:200% center; } }
        .sheader-shimmer{
          position:absolute; left:0; right:0; bottom:-1px; height:2px;
          background: linear-gradient(90deg, transparent, #0C4044, #CCA881, #BB8958, transparent);
          background-size: 200% auto; animation: sheaderShimmer 5s linear infinite;
        }

        .stree-node{ position:relative; }
        .stree-children{
          margin-left:18px; padding-left:16px; margin-top:8px;
          border-left:2px solid rgba(189,207,206,0.55); border-radius:0 0 0 10px;
        }
        .stree-branch{ position:relative; margin-bottom:8px; }
        .stree-branch:last-child{ margin-bottom:0; }
        .stree-branch::before{
          content:''; position:absolute; left:-16px; top:24px; width:14px; height:2px;
          background:rgba(189,207,206,0.55);
        }

        .stree-item{
          padding:12px 14px; margin-bottom:8px; border-radius:12px; cursor:pointer;
          border:1.5px solid; transition: all .18s ease; position:relative; overflow:hidden;
        }
        .stree-item:hover{ transform: translateX(2px); }
        @keyframes streePulseFlash{
          0%{ box-shadow: 0 0 0 0 rgba(201,32,53,0.5); }
          50%{ box-shadow: 0 0 0 8px rgba(201,32,53,0); }
          100%{ box-shadow: 0 0 0 0 rgba(201,32,53,0); }
        }
        .stree-item-pulse{ animation: streePulseFlash 0.8s ease-out 2; }
        .stree-accent{
          position:absolute; left:0; top:0; bottom:0; width:3px; border-radius:0 3px 3px 0;
          box-shadow: 0 0 10px currentColor;
        }
        .stree-badge{
          display:inline-flex; align-items:center; gap:5px; font-size:9px; font-weight:800;
          letter-spacing:0.8px; padding:2px 8px; border-radius:20px; border:1px solid;
        }
        .stree-ordercount{
          display:inline-flex; align-items:center; gap:5px; margin-top:8px;
          font-size:10px; font-weight:800; color:#0C4044; background:rgba(12,64,68,0.08);
          border:1px solid rgba(12,64,68,0.22); padding:2px 9px; border-radius:20px;
        }
        .stree-panel::-webkit-scrollbar{ width:6px; }
        .stree-panel::-webkit-scrollbar-track{ background:rgba(189,207,206,0.12); border-radius:10px; }
        .stree-panel::-webkit-scrollbar-thumb{ background:rgba(12,64,68,0.4); border-radius:10px; }

        @keyframes sfadeIn{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:translateY(0); } }
        .sfade-in{ animation: sfadeIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        .sperson-icon{
          width:44px; height:44px; border-radius:12px; display:flex; align-items:center;
          justify-content:center; flex-shrink:0; transition: box-shadow .3s ease;
        }

        @keyframes sstatPulse{ 0%,100%{ box-shadow:0 0 0 0 var(--glow); } 50%{ box-shadow:0 0 0 6px transparent; } }
        .sstat-card{
          flex:1; min-width:160px; border-radius:14px; padding:16px 20px;
          display:flex; align-items:center; gap:14px; border:1px solid;
        }
        .sstat-glow{ animation: sstatPulse 2.6s ease-in-out infinite; }
        .sstat-icon{
          width:42px; height:42px; border-radius:11px; display:flex; align-items:center;
          justify-content:center; flex-shrink:0;
        }

        @keyframes sprodIn{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }
        .sprod-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:16px; }
        .sprod-card{
          background:rgba(253,253,252,0.85); border:1px solid rgba(189,207,206,0.6); border-radius:14px;
          padding:16px; transition: all .2s ease; animation: sprodIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 10px 26px rgba(7,59,63,0.05);
        }
        .sprod-card:hover{ border-color:rgba(204,168,129,0.55); transform:translateY(-4px); box-shadow:0 16px 32px rgba(7,59,63,0.12), 0 0 0 1px rgba(204,168,129,0.2); }
        .sprod-img{
          width:100%; height:130px; border-radius:10px; overflow:hidden; background:rgba(189,207,206,0.14);
          border:1px solid rgba(189,207,206,0.55); display:flex; align-items:center; justify-content:center; margin-bottom:12px;
          transition: border-color .2s ease;
        }
        .sprod-card:hover .sprod-img{ border-color:rgba(204,168,129,0.45); }
        .sprod-img img{ width:100%; height:100%; object-fit:cover; transition: transform .3s ease; }
        .sprod-card:hover .sprod-img img{ transform: scale(1.05); }
        .sprod-row{ display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:4px 0; }
        .sprod-row + .sprod-row{ border-top:1px solid rgba(189,207,206,0.4); }
        .sprod-label{ color:#7A8987; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; }
      `}</style>

      {/* ── FIXED HEADER ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, padding: '18px 32px',
        background: 'rgba(253,253,252,0.94)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(189,207,206,0.72)',
        boxShadow: '0 16px 34px rgba(7,59,63,0.04)',
      }}>
        <div className="sheader-shimmer" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconChart color="#0C4044" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0C4044' }}>Sales Count — Hierarchy Breakdown</div>
<div style={{ fontSize: 12, color: subtext, marginTop: 2 }}>
  {period === 'today' ? "Showing TODAY's orders only" : 'Left-la oru person click pannu, right-la avanga sales details varum'}
</div>
          </div>
        </div>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <IconBack color="#C92035" /> Back
        </button>
      </div>

      {/* ── PAGE BODY (padded, pushed below the fixed header) ── */}
      <div style={{ padding: '28px 32px', paddingTop: 108 }}>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 22, alignItems: 'start' }}>


        {/* ── LEFT: HIERARCHY TREE ── */}
        <div className="stree-panel" style={{ background: 'rgba(253,253,252,0.97)', border: '1px solid rgba(189,207,206,0.72)', borderRadius: 16, padding: 14, maxHeight: 'calc(100vh - 128px)', overflowY: 'auto', position: 'sticky', top: 108, boxShadow: '0 22px 58px rgba(7,59,63,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 12px 4px', marginBottom: 10, borderBottom: '1px solid rgba(189,207,206,0.5)' }}>
            <IconLink color="#0C4044" size={14} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#0C4044' }}>HIERARCHY TREE</span>
          </div>
  {displayRoot ? (
  <TreeItem
    node={displayRoot}
    selectedId={selected ? `${selected.type}-${selected.id}` : null}
    onSelect={setSelected}
    pulseId={pulseId}
    period={period}
    expandedChildren={expandedChildren}
    loadingNode={loadingNode}
    fetchChildren={fetchChildren}
  />
) : (
  <div style={{ padding: '24px 8px', textAlign: 'center', color: '#7A8987', fontSize: 12.5 }}>
    Indha network-la today order edukave illa.
  </div>
)}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(189,207,206,0.5)', textAlign: 'center' }}>
            <span style={{ fontSize: 9.5, color: '#7A8987', letterSpacing: 0.5 }}>BitByte Network • Live Tree</span>
          </div>
        </div>

        {/* ── RIGHT: SELECTED PERSON DETAILS ── */}
        <div style={{ background: 'rgba(253,253,252,0.97)', border: '1px solid rgba(189,207,206,0.72)', borderRadius: 16, padding: 24, boxShadow: '0 22px 58px rgba(7,59,63,0.06)' }}>
          {selected && (
            <div key={`${selected.type}-${selected.id}`} className="sfade-in">
              {/* person header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="sperson-icon" style={{ background: `linear-gradient(135deg, ${selCfg.color}33, ${selCfg.color}0d)`, border: `1.5px solid ${selCfg.color}`, boxShadow: `0 0 18px ${selCfg.color}33` }}>
                  <selCfg.Icon color={selCfg.color} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: selCfg.color }}>{selCfg.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: text }}>{selected.first_name} {selected.last_name || ''}</div>
                </div>
              </div>

              {/* stat cards */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="sstat-card sstat-glow" style={{ background: 'rgba(12,64,68,0.05)', borderColor: 'rgba(12,64,68,0.22)', '--glow': 'rgba(12,64,68,0.3)' }}>
                  <div className="sstat-icon" style={{ background: 'rgba(12,64,68,0.12)' }}>
                    <IconBox color="#0C4044" />
                  </div>
                  <div>
                    <div style={{ color: subtext, fontSize: 11 }}>{period === 'today' ? "Today's Orders" : 'Total Orders'}</div>
<div style={{ fontSize: 24, fontWeight: 900, color: '#0C4044' }}>{overallCount}</div>
                  </div>
                </div>
                <div className="sstat-card sstat-glow" style={{ background: 'rgba(204,168,129,0.08)', borderColor: 'rgba(204,168,129,0.3)', '--glow': 'rgba(204,168,129,0.35)' }}>
                  <div className="sstat-icon" style={{ background: 'rgba(204,168,129,0.16)' }}>
                    <IconRupee color="#BB8958" />
                  </div>
                  <div>
                    <div style={{ color: subtext, fontSize: 11 }}>Total Amount</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#BB8958' }}>₹{overallAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* product breakdown */}
              {groupedList.length === 0 && !ordersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 0', color: subtext }}>
                  <IconEmpty color={subtext} />
                  <span style={{ fontSize: 13 }}>Idhu kku keela orders illa.</span>
                </div>
              ) : (
                <>
                <div className="sprod-grid">
                  {groupedList.map((g, i) => {
                    const imgUrl = getImageUrl(g.image)
                    return (
                      <div
                        key={`${g.product_name}-${g.owner?.id}-${i}`}
                        className="sprod-card"
                        onClick={() => g.owner && jumpToCustomer(g.owner)}
                        style={{
                          animationDelay: `${i * 45}ms`,
                          cursor: g.owner ? 'pointer' : 'default',
                        }}
                      >
                        <div className="sprod-img">
                          {imgUrl ? (
                            <img src={imgUrl} alt={g.product_name} onError={e => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <IconBox color="#7A8987" size={32} />
                          )}
                        </div>

                        {g.owner && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8,
                            background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.28)',
                            borderRadius: 20, padding: '3px 10px',
                          }}>
                            <IconUser color="#C92035" size={10} />
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#C92035' }}>{g.owner.first_name} {g.owner.last_name || ''}</span>
                          </div>
                        )}

                        <div style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 2 }}>{g.product_name}</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'capitalize', color: '#0C4044', background: 'rgba(12,64,68,0.08)', border: '1px solid rgba(12,64,68,0.24)', borderRadius: 20, padding: '2px 9px' }}>{g.metal}</span>
                          {(g.grade || g.category) && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#CCA881', background: 'rgba(204,168,129,0.12)', border: '1px solid rgba(204,168,129,0.3)', borderRadius: 20, padding: '2px 9px' }}>{g.grade || g.category}</span>
                          )}
                        </div>

                        <div className="sprod-row">
                          <span className="sprod-label">Weight</span>
                          <span style={{ fontWeight: 700 }}>{g.net_weight ? `${g.net_weight} gm` : '—'}</span>
                        </div>
                        <div className="sprod-row">
                          <span className="sprod-label">Quantity</span>
                          <span style={{ fontWeight: 700 }}>{g.total_qty}</span>
                        </div>
                        <div className="sprod-row">
                          <span className="sprod-label">Rate</span>
                          <span style={{ fontWeight: 700 }}>₹{g.last_rate.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="sprod-row">
                          <span className="sprod-label">Total</span>
                          <span style={{ fontWeight: 800, color: '#BB8958' }}>₹{g.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── NEW: Load More — right panel product cards keezhe ── */}
                {hasMoreOrders && !ordersLoadingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button onClick={loadMoreOrders} style={{ padding: '10px 24px', background: '#0C4044', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                      Load More ({orderGroups.length} of {ordersTotal})
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
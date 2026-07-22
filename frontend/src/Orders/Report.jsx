import { useState, useEffect, useMemo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'
import ExcelJS from 'exceljs'

// ── Role display config ──
const ROLE_ICONS = {
  super_admin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" strokeLinejoin="round"/>
      <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  admin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" strokeLinejoin="round"/>
      <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  dealer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10l2-6h14l2 6" strokeLinejoin="round"/>
      <path d="M4 10v9h16v-9M9 19v-5h6v5" strokeLinejoin="round"/>
    </svg>
  ),
  sub_dealer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2.5"/>
      <circle cx="18" cy="6" r="2.5"/>
      <circle cx="12" cy="18" r="2.5"/>
      <path d="M8 7.5L11 16M16 7.5L13 16" strokeLinecap="round"/>
    </svg>
  ),
  promotor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" strokeLinejoin="round"/>
    </svg>
  ),
}

const ROLE_CFG = {
  super_admin: { label: 'Super Admin', color: '#ffd700' },
  admin:       { label: 'Admin',       color: '#22d3ee' },
  dealer:      { label: 'Dealer',      color: '#4ade80' },
  sub_dealer:  { label: 'Sub Dealer',  color: '#f59e0b' },
  promotor:    { label: 'Promotor',    color: '#a78bfa' },
}

// ── NEW: same status colors as the hierarchy grid — customer order_count base
// panni backend calculate pannina cascading status (red/orange/yellow/green) ──
const STATUS_COLOR = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e' }

// ── Column labels shown in the breakdown table, based on root type ──
const COLUMN_MAP = {
  super_admin_view: ['Admin', 'Dealer', 'Sub Dealer', 'Promotor', 'Customer'],
  admin:      ['Dealer', 'Sub Dealer', 'Promotor', 'Customer'],
  dealer:     ['Sub Dealer', 'Promotor', 'Customer'],
  sub_dealer: ['Promotor', 'Customer'],
  promotor:   ['Customer'],
}

// ── Drill-down levels available per login role ──
const DRILL_LEVELS = {
  super_admin: ['own', 'admin', 'dealer', 'sub_dealer', 'promotor', 'customer'],
  admin:       ['own', 'dealer', 'sub_dealer', 'promotor', 'customer'],
  dealer:      ['own', 'sub_dealer', 'promotor', 'customer'],
  sub_dealer:  ['own', 'promotor', 'customer'],
  promotor:    ['own', 'customer'],
}

const LEVEL_LABELS = {
  own: 'My full network',
  admin: 'Admin',
  dealer: 'Dealer',
  sub_dealer: 'Sub Dealer',
  promotor: 'Promotor',
  customer: 'Customer',
}

const TIME_RANGES = ['Today', 'Week', 'Month', 'Year']

// ── children key per node type ──
function getChildren(node) {
  if (node.type === 'admin') return { key: 'dealers', childType: 'dealer' }
  if (node.type === 'dealer') return { key: 'sub_dealers', childType: 'sub_dealer' }
  if (node.type === 'sub_dealer') return { key: 'promotors', childType: 'promotor' }
  if (node.type === 'promotor') return { key: 'customers', childType: 'customer' }
  return { key: null, childType: null }
}

// ── NEW: node oda subtree la irukka ella admin/dealer/sub_dealer/promotor
// IDs-um collect pannu (customer login status track pannathu, so skip) ──
function collectSubtreeRoleIds(node) {
  const ids = new Set()
  function addId(n) {
    if (n.type === 'admin') ids.add(n.admin_id)
    else if (n.type === 'dealer') ids.add(n.dealer_id)
    else if (n.type === 'sub_dealer') ids.add(n.sub_dealer_id)
    else if (n.type === 'promotor') ids.add(n.promotor_id)
  }
  function walk(n) {
    addId(n)
    const { key, childType } = getChildren(n)
    const children = n[key] || []
    children.forEach(c => walk({ ...c, type: childType }))
  }
  walk(node)
  return ids
}

// ── Flatten a tree (rooted at admin/dealer/sub_dealer/promotor) into leaf rows ──
function flattenToRows(root) {
  const rows = []

  function getIdName(node, type) {
    const idVal = node[`${type}_id`] || node.id || '—'
    const name = `${node.first_name || ''} ${node.last_name || ''}`.trim() || node.dealer_name || node.promotor_name || idVal
    // ── NEW: customer eppayume fixed GREEN. Vera ella roles-um (admin/dealer/
    // sub_dealer/promotor) andha node's own status field (backend cascade
    // pannina, customer order_count base panni) follow pannும். ──
    const color = type === 'customer' ? STATUS_COLOR.green : (node.status ? STATUS_COLOR[node.status] : null)
    return { id: idVal, name, color }
  }

  function walk(node, chain) {
    if (node.type === 'customer') {
      const orders = node.orders || []
      const totalAmount = orders.reduce((s, o) => s + (parseFloat(o.total_price) || 0), 0)
      rows.push({
        chain,
        customerId: node.customer_id,
        orders: orders.length,
        amount: totalAmount,
        rawOrders: orders,
      })
      return
    }
    const { key, childType } = getChildren(node)
    const children = node[key] || []
    if (children.length === 0) return
    children.forEach(child => {
      const childInfo = getIdName(child, childType)
      walk({ ...child, type: childType }, [...chain, childInfo])
    })
  }

  walk(root, [])
  return rows
}

// ── Collect every node of a given type inside a tree, keeping its own subtree ──
// ── Collect every node of a given type inside a tree, keeping its own subtree ──
function collectNodesOfType(root, targetType) {
  const found = []
  function walk(node) {
    if (node.type === targetType) {
      found.push(node)
      return
    }
    const { key, childType } = getChildren(node)
    const children = node[key]
    if (!children || children.length === 0) return
    for (let i = 0; i < children.length; i++) {
      walk({ ...children[i], type: childType })
    }
  }
  walk(root)
  return found
}

// ── Find full ancestor chain for a selected node of any type ──
function findAncestorChain(treeData, targetType, targetId) {
  function walk(node, chain) {
    const idVal = (node.customer_id || node[`${node.type}_id`] || node.id)?.toString()
    const currentChain = [...chain, node]

    if (node.type === targetType && idVal === targetId) {
      return currentChain
    }

    const { key, childType } = getChildren(node)
    const children = node[key] || []
    for (const child of children) {
      const result = walk({ ...child, type: childType }, currentChain)
      if (result) return result
    }
    return null
  }

  for (const root of treeData) {
    const result = walk(root, [])
    if (result) return result
  }
  return null
}

// ── Build a fake date for an order so we can bucket it (fallback = today) ──
function orderDate(o) {
  const d = o.created_at || o.order_date || o.date
  return d ? new Date(d) : new Date()
}

function isInRange(date, range) {
  const now = new Date()
  if (range === 'Today') {
    return date.toDateString() === now.toDateString()
  }
  if (range === 'Week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    return date >= weekAgo && date <= now
  }
  if (range === 'Month') {
    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)
    return date >= monthAgo && date <= now
  }
  if (range === 'Year') {
    const yearAgo = new Date(now)
    yearAgo.setFullYear(now.getFullYear() - 1)
    return date >= yearAgo && date <= now
  }
  return true
}

// ── Group rows' orders into buckets (labels + totals) for the trend chart ──
function buildTrendBuckets(rows, range) {
  const now = new Date()
  let buckets = []

  if (range === 'Today') {
    // 6 buckets of 4 hours each
    buckets = Array.from({ length: 6 }, (_, i) => ({ label: `${i * 4}:00`, total: 0, count: 0 }))
rows.forEach(r => r.rawOrders.forEach(o => {
  const d = orderDate(o)
  if (!isInRange(d, range)) return
  const idx = Math.min(5, Math.floor(d.getHours() / 4))
  buckets[idx].total += parseFloat(o.total_price) || 0
  buckets[idx].count += 1
}))
  } else if (range === 'Week') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    buckets = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(now); d.setDate(now.getDate() - (6 - i))
  return { label: days[d.getDay()], total: 0, count: 0, _key: d.toDateString() }
})
rows.forEach(r => r.rawOrders.forEach(o => {
  const d = orderDate(o)
  if (!isInRange(d, range)) return
  const b = buckets.find(b => b._key === d.toDateString())
  if (b) { b.total += parseFloat(o.total_price) || 0; b.count += 1 }
}))
  } else if (range === 'Month') {
    // 4 weekly buckets
    buckets = Array.from({ length: 4 }, (_, i) => ({ label: `Week ${i + 1}`, total: 0, count: 0 }))
rows.forEach(r => r.rawOrders.forEach(o => {
  const d = orderDate(o)
  if (!isInRange(d, range)) return
  const daysAgo = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  const idx = Math.min(3, Math.floor(daysAgo / 7))
  buckets[3 - idx].total += parseFloat(o.total_price) || 0
  buckets[3 - idx].count += 1
}))
  } else {
    // Year — 12 monthly buckets
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    buckets = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
  return { label: months[d.getMonth()], total: 0, count: 0, _key: `${d.getFullYear()}-${d.getMonth()}` }
})
rows.forEach(r => r.rawOrders.forEach(o => {
  const d = orderDate(o)
  if (!isInRange(d, range)) return
  const key = `${d.getFullYear()}-${d.getMonth()}`
  const b = buckets.find(b => b._key === key)
  if (b) { b.total += parseFloat(o.total_price) || 0; b.count += 1 }
}))
  }

  return buckets
}

// ── Simple inline SVG line chart (no external library needed) ──
function TrendLineChart({ buckets, color }) {
  const [hoverIdx, setHoverIdx] = useState(null)   // ── NEW
  const width = 700, height = 220, padding = 36
  const max = Math.max(1, ...buckets.map(b => b.total))
  const stepX = (width - padding * 2) / Math.max(1, buckets.length - 1)

  const points = buckets.map((b, i) => {
    const x = padding + i * stepX
    const y = height - padding - (b.total / max) * (height - padding * 2)
    return { x, y, ...b }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
  const hp = hoverIdx !== null ? points[hoverIdx] : null   // ── NEW

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i}
          x1={padding} x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#trendFill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" />

      {/* ── NEW: wide invisible hover zones ── */}
      {points.map((p, i) => (
        <rect key={`hz-${i}`} x={p.x - stepX / 2} y={0} width={stepX} height={height}
          fill="transparent"
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)} />
      ))}

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 6 : 4} fill={color} style={{ pointerEvents: 'none' }} />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={height - 10} fontSize="11" fill="#94a3b8" textAnchor="middle">{p.label}</text>
      ))}

      {/* ── NEW: hover tooltip — amount + order count ── */}
      {hp && (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={hp.x} x2={hp.x} y1={padding} y2={height - padding} stroke={color} strokeOpacity="0.3" strokeDasharray="3 3" />
          <rect x={Math.min(Math.max(hp.x - 55, 4), width - 114)} y={Math.max(hp.y - 46, 4)} width="110" height="38" rx="8" fill="#0f172a" stroke={color} strokeOpacity="0.5" />
          <text x={Math.min(Math.max(hp.x - 55, 4), width - 114) + 10} y={Math.max(hp.y - 46, 4) + 16} fontSize="11" fontWeight="700" fill={color}>₹{hp.total.toLocaleString('en-IN')}</text>
          <text x={Math.min(Math.max(hp.x - 55, 4), width - 114) + 10} y={Math.max(hp.y - 46, 4) + 30} fontSize="10" fill="#94a3b8">{hp.count || 0} orders</text>
        </g>
      )}
    </svg>
  )
}



// ── NEW: small helpers to read id / name / color off any node in the tree ──
function nodeIdVal(node) {
  return node.customer_id || node[`${node.type}_id`] || node.id || '—'
}
function nodeName(node) {
  return `${node.first_name || ''} ${node.last_name || ''}`.trim() || node.dealer_name || node.promotor_name || nodeIdVal(node)
}
function nodeColor(node) {
  // customer eppayume fixed green (target illaya). Vera ella roles-um andha
  // node's own status field (backend cascade pannina, customer order_count base panni) follow pannum.
  if (node.type === 'customer') return STATUS_COLOR.green
  return node.status ? STATUS_COLOR[node.status] : (ROLE_CFG[node.type]?.color || '#94a3b8')
}

// ── NEW: Hierarchy Grid — same lane-row style as SuperadminHierarchyGrid.
// roots = top-level nodes (admin list, or single dealer/sub_dealer/promotor
// depending on login role / selected drill-down node). Click a card to open
// its children lane below, exactly like the main hierarchy grid page. ──
function HierarchyBreakdownGrid({ roots, cardBg, border, text, subtext, selectedNode, onSelectNode }) {
  const [selChain, setSelChain] = useState([])

  useEffect(() => { setSelChain([]) }, [roots])

  const levels = []
  let currentNodes = roots
  let depth = 0
  while (currentNodes && currentNodes.length > 0) {
    levels.push(currentNodes)
    const selId = selChain[depth]
    if (!selId) break
    const selectedNode = currentNodes.find(n => nodeIdVal(n).toString() === selId)
    if (!selectedNode) break
    const { key, childType } = getChildren(selectedNode)
    if (!key) break
    const children = (selectedNode[key] || []).map(c => ({ ...c, type: childType }))
    if (children.length === 0) { levels.push(children); break }
    currentNodes = children
    depth++
  }

  const selectAt = (depthIdx, node) => {
    setSelChain(prev => {
      const next = prev.slice(0, depthIdx)
      next[depthIdx] = nodeIdVal(node).toString()
      return next
    })
  }

  if (!roots || roots.length === 0) {
    return <div style={{ color: subtext, textAlign: 'center', padding: '50px 0' }}>No sales found yet.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {levels.map((nodes, depthIdx) => {
        // ── NEW: lane divider color — role fixed color base (like glane-divider
        // in the hierarchy grid page), na status color illa, role color base ──
        const laneColor = nodes[0] ? (ROLE_CFG[nodes[0].type]?.color || subtext) : subtext
        return (
        <div key={depthIdx}>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px', color: subtext, marginBottom: '10px', textTransform: 'uppercase' }}>
            {nodes[0] ? `${LEVEL_LABELS[nodes[0].type] || nodes[0].type} · ${nodes.length}` : 'No matches'}
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '14px' }}>
            {nodes.map(node => {
  const c = nodeColor(node)
  const idVal = nodeIdVal(node)
  const { key, childType } = getChildren(node)
  const childCount = key ? (node[key] || []).length : null
  const active = selChain[depthIdx] === idVal.toString()
  const isDim = selChain[depthIdx] && !active
  // ── NEW: intha card ippo stats-ku select pannirukka nu check ──
  const isStatsSelected = selectedNode
    && selectedNode.type === node.type
    && nodeIdVal(selectedNode).toString() === idVal.toString()
  return (
    <div
      key={idVal}
      onClick={() => {
        onSelectNode?.(node)                                 // ── NEW: stats filter
        if (childCount !== null) selectAt(depthIdx, node)     // existing drill-down
      }}
      style={{
        minWidth: '176px', maxWidth: '210px', flexShrink: 0,
        cursor: childCount !== null ? 'pointer' : 'default',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
        border: `1.5px solid ${c}`, borderRadius: '14px', padding: '13px 16px',
        opacity: isDim ? 0.45 : 1,
        boxShadow: isStatsSelected
          ? `0 0 0 2px #facc15, 0 10px 22px rgba(0,0,0,0.4)`   // ── NEW: yellow ring for stats-selected
          : (active ? `0 0 0 1.5px ${c}, 0 10px 22px rgba(0,0,0,0.4)` : 'none'),
        transition: 'opacity .15s ease, box-shadow .15s ease',
      }}
    >
                  <div style={{ fontSize: '9px', fontWeight: 800, color: c, letterSpacing: '1.2px', marginBottom: '7px' }}>
                    {(LEVEL_LABELS[node.type] || node.type).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: c, marginBottom: '4px' }}>{idVal}</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: text, marginBottom: '5px' }}>{nodeName(node)}</div>
                  {node.mobile_number && (
                    <div style={{ fontSize: '11px', color: subtext, marginBottom: '2px' }}>{node.mobile_number}</div>
                  )}
                  {node.city_name && (
                    <div style={{ fontSize: '11px', color: subtext }}>{node.city_name}</div>
                  )}
                  {node.type === 'customer' && (
                    <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: c }}>
                      {(node.orders || []).length} orders
                    </div>
                  )}
                  {childCount !== null && (
                    <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: 800, color: c }}>
                      {childCount} {(LEVEL_LABELS[childType] || childType).toLowerCase()}{childCount === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* ── NEW: full-width horizontal divider bar under this lane —
               same "glane-divider" style as SuperadminHierarchyGrid ── */}
          <div style={{ height: '3px', borderRadius: '3px', background: laneColor, opacity: 0.55, margin: '0 4px 22px 4px' }} />
        </div>
      )})}
    </div>
  )
}

function LoginStatusPie({ activeCount, inactiveCount, scopeLabel, cardBg, border, text, subtext, onClickActive, onClickInactive }) {
  const total = activeCount + inactiveCount
  const activeFrac = total > 0 ? activeCount / total : 0
  const size = 170, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const activeLen = c * activeFrac

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#22d3ee', letterSpacing: '1px', alignSelf: 'flex-start' }}>
        LOGIN STATUS TODAY
      </div>
      <div style={{ fontSize: '11px', color: subtext, alignSelf: 'flex-start', marginTop: '-8px' }}>
        {scopeLabel}
      </div>

      {total === 0 ? (
        <div style={{ color: subtext, fontSize: '13px', padding: '30px 0' }}>No data</div>
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f87171" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4ade80" strokeWidth={stroke}
            strokeDasharray={`${activeLen} ${c - activeLen}`}
            strokeDashoffset={c / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={text}>{total}</text>
          <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="10" fill={subtext}>total users</text>
        </svg>
      )}

      <div style={{ display: 'flex', gap: '18px' }}>
        <div onClick={onClickActive} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '12px' }}>Active {activeCount}</span>
        </div>
        <div onClick={onClickInactive} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f87171' }} />
          <span style={{ color: '#f87171', fontWeight: 700, fontSize: '12px' }}>Inactive {inactiveCount}</span>
        </div>
      </div>
    </div>
  )
}

const COIN_LABELS = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
const COIN_COLORS = { gold_22k: '#fbbf24', gold_24k: '#ffd700', silver_999: '#c0c0c0' }

function CoinStockPie({ stock, scopeLabel, cardBg, border, text, subtext }) {
  const total = stock.reduce((s, item) => s + item.qty, 0)
  const size = 170, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r

  const grouped = ['gold_22k', 'gold_24k', 'silver_999'].map(m => ({
    metal: m,
    qty: stock.filter(s => s.metal_type === m).reduce((sum, s) => sum + s.qty, 0),
  })).filter(g => g.qty > 0)

  let offset = 0
  const segments = grouped.map(g => {
    const frac = total > 0 ? g.qty / total : 0
    const len = c * frac
    const seg = { ...g, len, offset }
    offset += len
    return seg
  })

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', letterSpacing: '1px', alignSelf: 'flex-start' }}>
        COIN STOCK
      </div>
      <div style={{ fontSize: '11px', color: subtext, alignSelf: 'flex-start', marginTop: '-8px' }}>
        {scopeLabel}
      </div>

      {total === 0 ? (
        <div style={{ color: subtext, fontSize: '13px', padding: '30px 0' }}>No stock</div>
      ) : (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map(seg => (
            <circle
              key={seg.metal}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={COIN_COLORS[seg.metal]} strokeWidth={stroke}
              strokeDasharray={`${seg.len} ${c - seg.len}`}
              strokeDashoffset={-seg.offset + c / 4}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          ))}
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill={text}>{total}</text>
          <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize="10" fill={subtext}>total coins</text>
        </svg>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        {grouped.map(g => (
          <div key={g.metal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: COIN_COLORS[g.metal] }} />
              <span style={{ color: COIN_COLORS[g.metal], fontWeight: 700, fontSize: '12px' }}>{COIN_LABELS[g.metal]}</span>
            </div>
            <span style={{ color: text, fontWeight: 700, fontSize: '12px' }}>{g.qty}</span>
          </div>
        ))}
      </div>

      {/* Weight-wise breakdown */}
      <div style={{ width: '100%', borderTop: `1px solid ${border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {stock.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: subtext }}>{COIN_LABELS[item.metal_type]} — {item.weight_label}</span>
            <span style={{ color: COIN_COLORS[item.metal_type], fontWeight: 700 }}>{item.qty}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function Report() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('')
  const [treeData, setTreeData] = useState([])
  const [ancestors, setAncestors] = useState([])

  const [selectedLevel, setSelectedLevel] = useState('own')
const [selectedNodeId, setSelectedNodeId] = useState('')
const [timeRange, setTimeRange] = useState('Week')

// ── NEW: Network breakdown grid la click pannina node ──
const [gridSelectedNode, setGridSelectedNode] = useState(null)

// ── NEW: full active/inactive login list (super_admin only) ──
const [loginStatusFull, setLoginStatusFull] = useState({ active: [], inactive: [] })

// ── NEW: coin stock for scoped node (or own account) ──
const [coinStock, setCoinStock] = useState([])

const [nodeSearch, setNodeSearch] = useState('')
const [debouncedNodeSearch, setDebouncedNodeSearch] = useState('')
const [showNodeDropdown, setShowNodeDropdown] = useState(false)

useEffect(() => {
  const t = setTimeout(() => setDebouncedNodeSearch(nodeSearch), 150)
  return () => clearTimeout(t)
}, [nodeSearch])

  const bg = '#020617'
  const text = '#f8fafc'
  const subtext = '#94a3b8'
  const border = 'rgba(255,255,255,0.1)'
  const cardBg = 'rgba(255,255,255,0.03)'

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/sales-report/')
        setRole(res.data.role)
        setTreeData(res.data.data || [])
        setAncestors(res.data.ancestors || [])
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report')
      }
      setLoading(false)
    }
    fetchReport()
  }, [])

// ── NEW: super_admin ku mattum login status fetch pannu ──
  useEffect(() => {
    if (role !== 'super_admin') return
    api.get('/today-login-status/')
      .then(res => setLoginStatusFull({ active: res.data.active || [], inactive: res.data.inactive || [] }))
      .catch(() => {})
  }, [role])



  const cfg = ROLE_CFG[role] || { label: role, color: '#a5f3fc' }
  const availableLevels = DRILL_LEVELS[role] || ['own']

  // ── nodes available for the second dropdown (only when level !== 'own') ──
const nodesForSelectedLevel = useMemo(() => {
  if (selectedLevel === 'own' || !treeData.length) return []
  let all = []
  treeData.forEach(root => { all = all.concat(collectNodesOfType(root, selectedLevel)) })
  return all
}, [selectedLevel, treeData])

// reset node selection whenever level changes
useEffect(() => {
  setSelectedNodeId('')
  setNodeSearch('')
}, [selectedLevel])

// ── filtered nodes based on search (id / name / phone) ──
const filteredNodes = useMemo(() => {
  if (!debouncedNodeSearch.trim()) return nodesForSelectedLevel.slice(0, 50)
  const q = debouncedNodeSearch.trim().toLowerCase()
  const results = []
  for (let i = 0; i < nodesForSelectedLevel.length; i++) {
    const n = nodesForSelectedLevel[i]
    const id = (n.customer_id || n[`${n.type}_id`] || n.id || '').toString().toLowerCase()
    const name = (n.first_name ? `${n.first_name} ${n.last_name || ''}` : (n.dealer_name || n.promotor_name || '')).toLowerCase()
    const phone = (n.mobile_number || '').toString().toLowerCase()
    if (id.includes(q) || name.includes(q) || phone.includes(q)) {
      results.push(n)
      if (results.length >= 50) break
    }
  }
  return results
}, [debouncedNodeSearch, nodesForSelectedLevel])

  // ── the actual tree we render: full network OR a single selected node's subtree ──
  const activeTree = useMemo(() => {
    if (selectedLevel === 'own' || !selectedNodeId) return treeData
    const node = nodesForSelectedLevel.find(n =>
      (n.customer_id || n[`${n.type}_id`] || n.id)?.toString() === selectedNodeId
    )
    return node ? [node] : treeData
  }, [selectedLevel, selectedNodeId, nodesForSelectedLevel, treeData])

  const isMultiAdminView = role === 'super_admin' && selectedLevel === 'own' && activeTree.length > 1

// ── NEW: top dropdown maathaanum grid selection clear pannidanum ──
useEffect(() => { setGridSelectedNode(null) }, [activeTree])

// ── NEW: card click pannirundha andha node mattum, illana existing activeTree ──
const statsTree = gridSelectedNode ? [gridSelectedNode] : activeTree
const isMultiAdminViewStats = !gridSelectedNode && isMultiAdminView

const scopedNode = gridSelectedNode || (selectedLevel !== 'own' && activeTree.length === 1 ? activeTree[0] : null)
const scopedLoginLabel = scopedNode ? `${LEVEL_LABELS[scopedNode.type] || scopedNode.type} · ${nodeName(scopedNode)}` : 'Full Network'

useEffect(() => {
  const targetUserId = scopedNode?.user_id
  if (targetUserId) {
    api.get('/coin-stock/for-user/', { params: { user_id: targetUserId } })
      .then(res => setCoinStock(res.data || []))
      .catch(() => setCoinStock([]))
  } else {
    api.get('/coin-stock/')
      .then(res => setCoinStock(res.data || []))
      .catch(() => setCoinStock([]))
  }
}, [scopedNode])

const scopedLoginStats = useMemo(() => {
  if (!scopedNode) return loginStatusFull
  const ids = collectSubtreeRoleIds(scopedNode)
  return {
    active: loginStatusFull.active.filter(e => ids.has(e.id)),
    inactive: loginStatusFull.inactive.filter(e => ids.has(e.id)),
  }
}, [scopedNode, loginStatusFull])

const goToActiveLogin = () => navigate('/login-active', { state: { ids: scopedNode ? Array.from(collectSubtreeRoleIds(scopedNode)) : null, scopeLabel: scopedLoginLabel } })
const goToInactiveLogin = () => navigate('/login-inactive', { state: { ids: scopedNode ? Array.from(collectSubtreeRoleIds(scopedNode)) : null, scopeLabel: scopedLoginLabel } })

 const allRows = useMemo(() => {
  let rows = []
  statsTree.forEach(root => {
    const rootRows = flattenToRows(root)
    if (isMultiAdminViewStats) {
      const adminId = root.admin_id || root.id || '—'
      const adminName = `${root.first_name || ''} ${root.last_name || ''}`.trim() || adminId
      const adminColor = root.status ? STATUS_COLOR[root.status] : null
      rootRows.forEach(r => { r.chain = [{ id: adminId, name: adminName, color: adminColor }, ...r.chain] })
    }
    rows = rows.concat(rootRows)
  })
  return rows
}, [statsTree, isMultiAdminViewStats])

  const totalSales = allRows.reduce((s, r) => s + r.amount, 0)
  const totalOrders = allRows.reduce((s, r) => s + r.orders, 0)
  const totalCustomers = allRows.length

  const columns = gridSelectedNode
  ? (COLUMN_MAP[gridSelectedNode.type] || [])
  : (isMultiAdminView
      ? COLUMN_MAP.super_admin_view
      : (activeTree[0] ? (COLUMN_MAP[activeTree[0].type] || []) : []))

  const trendBuckets = useMemo(() => buildTrendBuckets(allRows, timeRange), [allRows, timeRange])

  const handleExportExcel = async () => {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'BitByte'
  wb.created = new Date()

  const themeColor = cfg.color.replace('#', '')
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + themeColor } }
  const darkFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }

  // ── Sheet 1: Summary ──
  const summarySheet = wb.addWorksheet('Summary')
  summarySheet.columns = [{ width: 26 }, { width: 34 }]

  summarySheet.mergeCells('A1:B1')
  const titleCell = summarySheet.getCell('A1')
  titleCell.value = `Sales Report — ${cfg.label}`
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = headerFill
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  summarySheet.getRow(1).height = 28

  const infoRows = [
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Generated By', role],
  ]
  infoRows.forEach(([label, value]) => {
    const r = summarySheet.addRow([label, value])
    r.getCell(1).font = { bold: true, color: { argb: 'FF94A3B8' } }
  })

  summarySheet.addRow([])

  const statRow = summarySheet.addRow(['Metric', 'Value'])
  statRow.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = darkFill
  })

  const stats = [
    ['Total Sales', totalSales],
    ['Total Orders', totalOrders],
    ['Customers with Orders', totalCustomers],
  ]
  stats.forEach(([label, value]) => {
    const r = summarySheet.addRow([label, value])
    r.getCell(1).font = { bold: true }
    if (label === 'Total Sales') r.getCell(2).numFmt = '₹#,##0'
    r.getCell(2).font = { bold: true, color: { argb: 'FF' + themeColor } }
  })

  // ── Sheet 2: Sales Trend chart data + native chart ──
  const trendSheet = wb.addWorksheet('Sales Trend')
  trendSheet.columns = [{ width: 14 }, { width: 16 }]
  trendSheet.addRow(['Period', 'Sales Amount']).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = darkFill
  })
  trendBuckets.forEach(b => trendSheet.addRow([b.label, b.total]))

  trendSheet.addChart = trendSheet.addChart || (() => {}) // safety no-op if unsupported

  // Note: ExcelJS chart API (community builds may vary) — safe fallback if unavailable
  try {
    trendSheet.addChart({
      type: 'line',
      title: { name: 'Sales Trend' },
      data: {
        categories: `'Sales Trend'!$A$2:$A$${trendBuckets.length + 1}`,
        series: [{ name: 'Sales', values: `'Sales Trend'!$B$2:$B$${trendBuckets.length + 1}` }],
      },
      position: { x: 400, y: 20 },
    })
  } catch { /* chart not supported in this ExcelJS build — data still exported */ }

  // ── Sheet 3: Network breakdown ──
  const detailSheet = wb.addWorksheet('Network Breakdown')
  const headerLabels = columns.flatMap(c => [`${c} ID`, `${c} Name`]).concat(['Orders', 'Sales'])
  detailSheet.columns = headerLabels.map(h => ({ header: h, width: h.includes('Name') ? 22 : 16 }))

  const headerRow = detailSheet.getRow(1)
  headerRow.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = darkFill
    c.alignment = { horizontal: 'center' }
  })

  allRows.forEach((row, idx) => {
    const rowData = [...row.chain.flatMap(item => [item.id, item.name]), row.orders, row.amount]
    const r = detailSheet.addRow(rowData)
    if (idx % 2 === 0) {
      r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } })
    }
    const salesCell = r.getCell(rowData.length)
    salesCell.numFmt = '₹#,##0'
    salesCell.font = { bold: true, color: { argb: 'FF' + themeColor } }
  })

  // ── Sheet 4: Full hierarchy tree (readable list) ──
  const hierarchySheet = wb.addWorksheet('Hierarchy')
  hierarchySheet.columns = [{ width: 6 }, { width: 16 }, { width: 22 }, { width: 16 }, { width: 22 }]
  hierarchySheet.addRow(['Level', 'ID', 'Name', 'Phone', 'City']).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = darkFill
  })

  const addHierarchyRows = (node, depth = 0) => {
    const idVal = node[`${node.type}_id`] || node.id || ''
    const name = `${node.first_name || ''} ${node.last_name || ''}`.trim()
    const r = hierarchySheet.addRow([
      '  '.repeat(depth) + (node.type || '').toUpperCase(),
      idVal, name, node.mobile_number || '', node.city_name || ''
    ])
    r.getCell(1).font = { bold: true, color: { argb: 'FF' + themeColor } }
    const { key, childType } = getChildren(node)
    const children = node[key] || []
    children.forEach(child => addHierarchyRows({ ...child, type: childType }, depth + 1))
  }
  activeTree.forEach(root => addHierarchyRows(root))

  // ── Download ──
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Sales_Report_${role}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

  const handleExportPDF = () => {
    window.print()
  }

  if (loading) {
  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', gap: '18px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseText { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
      <div style={{
        width: '46px', height: '46px',
        border: '3px solid rgba(34,211,238,0.15)',
        borderTop: '3px solid #22d3ee',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{
        fontSize: '14px',
        color: '#94a3b8',
        letterSpacing: '0.05em',
        animation: 'pulseText 1.6s ease-in-out infinite',
      }}>
        Loading report...
      </div>
    </div>
  )
}

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: bg, color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #020617 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { color: #f8fafc !important; background: #020617 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-card {
            background: rgba(255,255,255,0.03) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { break-inside: auto; width: 100% !important; table-layout: fixed !important; }
          tr { break-inside: avoid; break-after: auto; }
          td, th {
            white-space: normal !important;
            word-break: break-word;
            font-size: 9px !important;
            padding: 6px 8px !important;
            overflow: hidden;
            vertical-align: top;
          }
          .print-table-wrap { overflow: visible !important; width: 100% !important; }
          td:last-child, th:last-child { text-align: right !important; }
          @page { size: landscape; margin: 8mm; }
        }
      `}</style>
      {/* Navbar */}
      <div className="no-print" style={{ padding: '18px 40px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
<img src={logo} alt="Team 369" style={{ width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0 }} />
<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
  <div style={{
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '0.02em',
    marginLeft: '-14px',
    background: 'linear-gradient(90deg, #dc2626, #ef4444, #fca5a5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontFamily: '"Inter", sans-serif',
  }}>
    TEAM369
  </div>
  <span style={{ fontWeight: 700, fontSize: '15px', color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ color: cfg.color, display: 'inline-flex' }}>{ROLE_ICONS[role]}</span>
    {cfg.label} — Sales Report
  </span>
</div>
        </div>

        {/* Drill-down dropdowns + export buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
         <select
  value={selectedLevel}
  onChange={e => {
    const val = e.target.value
    startTransition(() => setSelectedLevel(val))
  }}
  style={{ background: cardBg, color: text, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', transition: 'border-color 0.15s ease', willChange: 'contents' }}
>
            {availableLevels.map(lvl => (
              <option key={lvl} value={lvl} style={{ background: '#0f172a' }}>{LEVEL_LABELS[lvl]}</option>
            ))}
          </select>

         {selectedLevel !== 'own' && (
  <div style={{ position: 'relative' }}>
    <input
      value={
        showNodeDropdown
          ? nodeSearch
          : (() => {
              const sel = nodesForSelectedLevel.find(n => (n.customer_id || n[`${n.type}_id`] || n.id)?.toString() === selectedNodeId)
              if (!sel) return ''
              return sel.first_name ? `${sel.first_name} ${sel.last_name || ''}`.trim() : (sel.dealer_name || sel.promotor_name || '')
            })()
      }
      onChange={e => { setNodeSearch(e.target.value); setShowNodeDropdown(true) }}
      onFocus={() => { setShowNodeDropdown(true); setNodeSearch('') }}
      onBlur={() => setTimeout(() => setShowNodeDropdown(false), 150)}
      placeholder={`Search ${LEVEL_LABELS[selectedLevel]} by ID, name, phone...`}
      style={{ background: cardBg, color: text, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', fontSize: '13px', minWidth: '220px', outline: 'none', boxSizing: 'border-box' }}
      onFocusCapture={e => e.target.style.borderColor = cfg.color}
    />
    {showNodeDropdown && (
      <div style={{
        position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
        background: '#0f172a', border: `1px solid ${border}`, borderRadius: '10px',
        maxHeight: '260px', overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}>
        {filteredNodes.length === 0 ? (
          <div style={{ padding: '12px', color: subtext, fontSize: '13px', textAlign: 'center' }}>No matches found</div>
        ) : filteredNodes.map(n => {
          const id = n.customer_id || n[`${n.type}_id`] || n.id
          const name = n.first_name ? `${n.first_name} ${n.last_name || ''}`.trim() : (n.dealer_name || n.promotor_name || id)
          return (
            <div
              key={id}
              onMouseDown={() => {
                setSelectedNodeId(id.toString())
                setShowNodeDropdown(false)
                setNodeSearch('')
              }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${border}` }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ color: cfg.color, fontFamily: 'monospace', fontSize: '11px' }}>{id}</div>
              <div style={{ color: text, fontSize: '13px', fontWeight: 600 }}>{name}</div>
              {n.mobile_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {n.mobile_number}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
)}

         <button onClick={handleExportExcel}
  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  Export Excel
</button>
          <button onClick={handleExportPDF}
  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
    <path d="M6 3h9l5 5v13H6z" strokeLinejoin="round"/>
    <path d="M15 3v5h5" strokeLinejoin="round"/>
    <path d="M9 13h6M9 16h6M9 10h2" strokeLinecap="round"/>
  </svg>
  Export PDF
</button>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: `1px solid ${border}`, color: subtext, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}
          >← Back</button>
        </div>
      </div>

      <div className="print-container" style={{ padding: '32px 40px', maxWidth: '1500px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        <div style={{ flex: '1 1 0%', minWidth: 0 }}>

          {/* ── NEW: selected node indicator ── */}
{gridSelectedNode && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 16px' }}>
    <span style={{ color: subtext, fontSize: '12px' }}>Showing data for</span>
    <span style={{ color: nodeColor(gridSelectedNode), fontWeight: 700, fontSize: '13px' }}>
      {(LEVEL_LABELS[gridSelectedNode.type] || gridSelectedNode.type)} · {nodeName(gridSelectedNode)}
    </span>
    <button onClick={() => setGridSelectedNode(null)}
      style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${border}`, color: subtext, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
      Clear
    </button>
  </div>
)}

{/* Summary cards */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
           <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px 20px' }}>
    <div style={{ color: subtext, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total sales</div>
    <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.2, letterSpacing: 'normal', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
  </div>
            <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px 20px' }}>
              <div style={{ color: subtext, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total orders</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{totalOrders}</div>
            </div>
            <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px 20px' }}>
              <div style={{ color: subtext, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customers with orders</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{totalCustomers}</div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sales trend
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TIME_RANGES.map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    style={{
                      background: timeRange === r ? cfg.color : 'transparent',
                      color: timeRange === r ? '#020617' : subtext,
                      border: `1px solid ${timeRange === r ? cfg.color : border}`,
                      borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <TrendLineChart buckets={trendBuckets} color={cfg.color} />
          </div>

          {/* Breakdown grid — same lane style as the hierarchy grid page */}
          <div className="print-card" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px 28px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px' }}>
              Network breakdown
            </div>
            <HierarchyBreakdownGrid
  roots={activeTree}
  cardBg={cardBg} border={border} text={text} subtext={subtext}
  selectedNode={gridSelectedNode}
  onSelectNode={setGridSelectedNode}
/>
          </div>

        </div>

       {/* ── RIGHT: Login Status + Coin Stock Pie panels ── */}
        <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {role === 'super_admin' && (
            <LoginStatusPie
              activeCount={scopedLoginStats.active.length}
              inactiveCount={scopedLoginStats.inactive.length}
              scopeLabel={scopedLoginLabel}
              cardBg={cardBg}
              border={border}
              text={text}
              subtext={subtext}
              onClickActive={goToActiveLogin}
              onClickInactive={goToInactiveLogin}
            />
          )}
          <CoinStockPie
            stock={coinStock}
            scopeLabel={scopedNode ? scopedLoginLabel : 'My own stock'}
            cardBg={cardBg}
            border={border}
            text={text}
            subtext={subtext}
          />
        </div>

      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'
import goldCoin from '../assets/gold-coin.png'
import silverCoin from '../assets/silver-coin.png'

const OCCUPATIONS = ['employee', 'business', 'others']
const emptyForm = {
  initial: '', first_name: '', last_name: '', mobile_number: '',
  gender: 'male',
  dob: '',
  married_status: 'single',
  anniversary_date: '',
  email: '', password: '',
  door_no: '', street_name: '', town_name: '', city_name: '',
  district: '', state: '', aadhaar_no: '', pan_no: '',
  occupation: '', occupation_detail: '', annual_salary: '',
  assigned_promotor_id: null
}

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i, size: Math.random() * 60 + 10, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.2 + 0.05,
}))

const PR_TREE_COLORS = ['#f472b6', '#a78bfa', '#22d3ee', '#4ade80', '#fb923c', '#60a5fa']

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

// ─── CHAIN POPUP ───────────────────────────────────────────────────────────────
let _prChainPopupEl = null
let _prChainHideTimer = null

function removePRChainPopup() {
  document.querySelectorAll('#pr-chain-popup').forEach(el => el.remove())
  _prChainPopupEl = null
}

function showPRChainPopup(anchorEl, customer, dark, text, subtext, superAdminEmail, promotorInfo) {
  clearTimeout(_prChainHideTimer)
  removePRChainPopup()

  const CHAIN_CFG = {
    super_admin: { emoji: '🛡️', label: 'SUPER ADMIN', color: '#ffd700', idKey: null },
    sub_dealer:  { emoji: '🔗', label: 'SUB DEALER',  color: '#f59e0b', idKey: 'sub_dealer_id' },
    promotor:    { emoji: '🌟', label: 'PROMOTOR',    color: '#a78bfa', idKey: 'promotor_id' },
    customer:    { emoji: '👤', label: 'CUSTOMER',    color: '#f472b6', idKey: 'customer_id' },
  }

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...(promotorInfo?.sub_dealer_id ? [{
      type: 'sub_dealer',
      data: { sub_dealer_id: promotorInfo.sub_dealer_id, first_name: promotorInfo.sub_dealer_name, mobile_number: promotorInfo.sub_dealer_contact_no }
    }] : []),
    { type: 'promotor', data: promotorInfo || {} },
    { type: 'customer', data: customer },
  ]

  const el = document.createElement('div')
  el.id = 'pr-chain-popup'

  // Inject scrollbar styles once
  if (!document.getElementById('pr-chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'pr-chain-popup-styles'
    s.textContent = `
      #pr-chain-popup::-webkit-scrollbar{width:6px}
      #pr-chain-popup::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #pr-chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#f472b6,#a78bfa);border-radius:10px;box-shadow:0 0 6px rgba(244,114,182,0.4)}
      #pr-chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#fbcfe8,#c4b5fd)}
      #pr-chain-popup{scrollbar-color:rgba(244,114,182,0.5) rgba(255,255,255,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(244,114,182,0.22)' : 'rgba(219,39,119,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(244,114,182,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(219,39,119,0.05)'};
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:280px;
    max-height:85vh; overflow-y:auto; overflow-x:hidden;
    scroll-behavior:smooth; scrollbar-width:thin;
    scroll-padding:8px;
    -webkit-overflow-scrolling:touch;
    backdrop-filter:blur(28px);
    font-family:'Inter',system-ui,sans-serif;
  `

  const totalNodes = chain.length

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const isSuperAdmin = item.type === 'super_admin'
    const cfg = CHAIN_CFG[item.type]
    if (!cfg) return ''

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(244,114,182,0.65),rgba(244,114,182,0.1));"></div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid rgba(244,114,182,0.5);"></div>
        </div>
      </div>` : ''

    if (isSuperAdmin) {
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:${isDark ? 'linear-gradient(135deg,rgba(255,215,0,0.09),rgba(255,140,0,0.04))' : 'linear-gradient(135deg,rgba(255,215,0,0.14),rgba(255,140,0,0.06))'};
          border:1px solid rgba(255,215,0,0.28);
          position:relative;overflow:hidden;
        ">
          <div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,rgba(255,215,0,0.14),transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#ffd700,#ff8c00);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(255,215,0,0.35);">🛡️</div>
            <div>
              <div style="font-size:9px;color:#ffd700;font-weight:800;letter-spacing:1.8px;">SUPER ADMIN</div>
              <div style="font-size:8px;color:rgba(255,215,0,0.45);margin-top:2px;letter-spacing:0.5px;">ROOT • FULL ACCESS</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#4ade80;animation:acpPulse 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(74,222,128,0.9);"></div>
              <span style="font-size:9px;color:#4ade80;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:12px;color:${isDark ? '#cbd5e1' : '#475569'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">${item.data.email || '—'}</div>
        </div>
      `
    }

    const d = item.data || {}
    const idVal = cfg.idKey ? (d[cfg.idKey] || d.id || '—') : ''
    const name  = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city  = d.city_name || ''
    const rc    = hexToRgb(cfg.color)

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:${isLast
          ? `linear-gradient(135deg,rgba(${rc},0.13),rgba(${rc},0.05))`
          : `rgba(${rc},0.04)`};
        border:${isLast
          ? `1.5px solid rgba(${rc},0.55)`
          : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
        ${isLast ? `animation:acpGlow 3s ease-in-out infinite;` : ''}
      ">
        ${isLast ? `<div style="position:absolute;top:-15px;right:-15px;width:80px;height:80px;background:radial-gradient(circle,rgba(${rc},0.18),transparent 70%);pointer-events:none;"></div>` : ''}

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${cfg.color},rgba(${rc},0.45));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${cfg.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            ${idVal ? `<div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>` : ''}
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#f1f5f9' : '#0f172a'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== '—' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">📞</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">📍</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(244,114,182,0.1)' : 'rgba(219,39,119,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#f472b6,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 4px 10px rgba(244,114,182,0.4);">🔗</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#fbcfe8' : '#db2777'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(244,114,182,0.15),rgba(167,139,250,0.12),rgba(244,114,182,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(244,114,182,0.25);
        color:${isDark ? '#fbcfe8' : '#db2777'};
        letter-spacing:1px;">● LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#334155' : '#cbd5e1'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = 280
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top  = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth  - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top  = top  + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_prChainHideTimer))
  el.addEventListener('mouseleave', () => { _prChainHideTimer = setTimeout(() => removePRChainPopup(), 200) })
  _prChainPopupEl = el
}

// ─── PRINT ─────────────────────────────────────────────────────────────────────
function printCustomerCard(node, color, superAdminEmail, promotorInfo) {
  const arrowDiv = `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #94a3b8;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#94a3b8,rgba(148,163,184,0.2));"></div></div></div>`

  const chain = [
    { type:'super_admin', label:'SUPER ADMIN', emoji:'🛡️', data:{ email: superAdminEmail } },
    ...(promotorInfo?.sub_dealer_id ? [{
      type:'sub_dealer', label:'SUB DEALER', emoji:'🔗',
      data:{ sub_dealer_id: promotorInfo.sub_dealer_id, first_name: promotorInfo.sub_dealer_name, mobile_number: promotorInfo.sub_dealer_contact_no }
    }] : []),
    { type:'promotor', label:'PROMOTOR', emoji:'🌟', data: promotorInfo || {} },
    { type:'customer', label:'CUSTOMER', emoji:'👤', data: node },
  ]

  const idMap = { sub_dealer:'sub_dealer_id', promotor:'promotor_id', customer:'customer_id' }

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const arrow  = idx < chain.length - 1 ? arrowDiv : ''
    const d = item.data || {}
    if (item.type === 'super_admin') {
      return `<div class="chain-item"><div class="chain-role">${item.emoji} ${item.label}</div><div class="chain-email">${d.email || '—'}</div></div>${arrow}`
    }
    const idVal = idMap[item.type] ? (d[idMap[item.type]] || '—') : ''
    const name  = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${item.emoji} ${item.label}</div>
        ${idVal ? `<div class="chain-id">${idVal}</div>` : ''}
        <div class="chain-name">${name}</div>
        <div class="chain-info">📞 ${d.mobile_number || '—'}</div>
        <div class="chain-info">📍 ${d.city_name || '—'}</div>
      </div>${arrow}`
  }).join('')

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>CUSTOMER — ${currentName}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;padding:40px;display:flex;justify-content:center;}.wrapper{max-width:480px;width:100%;}.header{text-align:center;margin-bottom:28px;}.header h1{font-size:20px;font-weight:800;color:#020617;}.header p{font-size:12px;color:#64748b;margin-top:4px;}.chain-item{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;}.chain-item.current{border-color:${color};background:${color}11;box-shadow:0 4px 16px ${color}22;}.chain-role{font-size:10px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;}.chain-item.current .chain-role{color:${color};}.chain-id{font-family:monospace;font-size:11px;color:${color};margin-bottom:4px;}.chain-name{font-size:16px;font-weight:800;color:#020617;margin-bottom:6px;}.chain-email{font-size:12px;color:#475569;}.chain-info{font-size:12px;color:#475569;margin-top:3px;}.chain-arrow{display:flex;justify-content:center;padding:4px 0;}.footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:24px;}@media print{body{background:white;padding:20px;}.chain-item{box-shadow:none;}}</style>
    </head><body><div class="wrapper"><div class="header"><h1>BitByte — CUSTOMER Profile</h1><p>Hierarchy Chain Report</p></div>${chainHtml}<div class="footer">Printed on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div></div><script>window.onload=()=>{window.print()}<\/script></body></html>`)
  win.document.close()
}

// ─── CUSTOMER LEAF NODE ────────────────────────────────────────────────────────
function CustomerLeafNode({ node, dark, text, subtext, colorIdx=0, superAdminEmail='', promotorInfo=null }) {
  const c = PR_TREE_COLORS[colorIdx % PR_TREE_COLORS.length]

  return (
    <div
      style={{
        background: dark ? `rgba(${hexToRgb(c)},0.06)` : `rgba(${hexToRgb(c)},0.08)`,
        border: `1px solid rgba(${hexToRgb(c)},0.35)`,
        borderRadius:'12px', padding:'12px 16px',
        minWidth:'160px', maxWidth:'200px',
        cursor:'default',
        transition:'all 0.3s ease', position:'relative',
      }}
      onMouseEnter={e => {
        clearTimeout(_prChainHideTimer)
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgb(c)},0.25)`
        e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.7)`
        showPRChainPopup(e.currentTarget, node, dark, text, subtext, superAdminEmail, promotorInfo)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.35)`
        _prChainHideTimer = setTimeout(() => removePRChainPopup(), 300)
      }}
    >
      <div style={{ display:'inline-block', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', marginBottom:'8px', background:`rgba(${hexToRgb(c)},0.15)`, color:c, border:`1px solid rgba(${hexToRgb(c)},0.35)` }}>
        👤 CUSTOMER
      </div>
      <div style={{ color:c, fontFamily:'monospace', fontSize:'10px', marginBottom:'4px', wordBreak:'break-all' }}>{node.customer_id}</div>
      <div style={{ color:text, fontWeight:700, fontSize:'13px', marginBottom:'6px' }}>{node.first_name || '—'} {node.last_name || ''}</div>
      <div style={{ color:subtext, fontSize:'11px', marginBottom:'2px' }}>📞 {node.mobile_number}</div>
      {node.city_name && <div style={{ color:subtext, fontSize:'11px' }}>📍 {node.city_name}</div>}

      <div style={{ marginTop:'8px', width:'100%', height:2, borderRadius:2, background:`linear-gradient(90deg,rgba(${hexToRgb(c)},0.2),${c})` }} />

      <button
        onClick={e => { e.stopPropagation(); printCustomerCard(node, c, superAdminEmail, promotorInfo) }}
        style={{ marginTop:'8px', width:'100%', padding:'3px 0', fontSize:'9px', fontWeight:700, background:`rgba(${hexToRgb(c)},0.1)`, border:`1px solid rgba(${hexToRgb(c)},0.35)`, borderRadius:'6px', color:c, cursor:'pointer', letterSpacing:'0.8px', transition:'all 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.25)`}
        onMouseLeave={e => e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.1)`}
      >🖨️ PRINT</button>
    </div>
  )
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function PromotorDashboard() {
  const navigate = useNavigate()                         
  const [dark, setDark]               = useState(true)       
  const [customers, setCustomers]     = useState([])
  const [allPromotors, setAllPromotors] = useState([])
  const [selectedPromotor, setSelectedPromotor] = useState(null)
  const [promotorInfo, setPromotorInfo] = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [msg, setMsg]                 = useState('')
  const [msgType, setMsgType]         = useState('success')
 const [form, setForm]               = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
const [showAnnouncements, setShowAnnouncements] = useState(false)
const [updateMessage, setUpdateMessage] = useState('')
const [proofDocument, setProofDocument] = useState(null)

const [announcements, setAnnouncements] = useState([])
const [unreadCount, setUnreadCount] = useState(0)
const [showProfile, setShowProfile] = useState(false)
const [showProfileEdit, setShowProfileEdit] = useState(false)
const [updateForm, setUpdateForm] = useState({})


const [metalPrices, setMetalPrices] = useState({ gold24k: null, gold22k: null, silver: null })
const [metalLoading, setMetalLoading] = useState(false)
const [usdToInr, setUsdToInr] = useState(null)
const [dbRateDate, setDbRateDate] = useState(null)

// ── COIN REQUEST / STOCK ──
const [showBuyCoin, setShowBuyCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])   // [{metal_type, weight_label, weight_grams, qty}]
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')

const [showStoredCoin, setShowStoredCoin] = useState(false)
  const [coinStock, setCoinStock] = useState([])
  const [coinStockLoading, setCoinStockLoading] = useState(false)

  // ── MY COIN REQUESTS (status tracking) ──
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [myCoinRequests, setMyCoinRequests] = useState([])
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)


const [replyAnn,        setReplyAnn]        = useState(null)
  const [replyText,       setReplyText]       = useState('')
  const [replyLoading,    setReplyLoading]    = useState(false)
  const [replyMsg,        setReplyMsg]        = useState('')
  const [repliedIds,      setRepliedIds]      = useState(new Set())
  const [annReplies,      setAnnReplies]      = useState({})
  const [replyPopupAnnId, setReplyPopupAnnId] = useState(null)
  const [replyPopupPos, setReplyPopupPos] = useState({ top: 0, left: 0 })
const wishTimerRef = useRef(null)
const canvasRef = useRef(null)

  const bg         = dark ? '#020617' : '#f8fafc'
  const text       = dark ? '#f8fafc' : '#020617'
  const subtext    = dark ? '#94a3b8' : '#64748b'
  const accent     = dark ? '#f472b6' : '#db2777'
  const border     = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const glass      = dark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.7)'
  const cardBg     = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const cardBorder = dark ? '1px solid rgba(244,114,182,0.1)' : '1px solid rgba(0,0,0,0.1)'
  const inpBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const inpBorder = dark ? '#374151' : '#d1d5db'
  const optionBg = dark ? '#1a2035' : '#ffffff'
  const selectInput = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }

  // ── Particle canvas ──
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId, pts = []
    const mouse = { x: null, y: null, radius: 150 }
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const onMouse  = e => { mouse.x = e.x; mouse.y = e.y }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouse)
    onResize()
  class Particle {
  constructor() {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 4 + 2 
    this.speedX = (Math.random() - 0.5) * 0.3
    this.speedY = (Math.random() - 0.5) * 0.3
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    if (this.x > canvas.width || this.x < 0) this.speedX *= -1
    if (this.y > canvas.height || this.y < 0) this.speedY *= -1

    if (mouse.x !== null && mouse.y !== null) {
      let dx = mouse.x - this.x
      let dy = mouse.y - this.y
      let distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < mouse.radius) {
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const force = (mouse.radius - distance) / mouse.radius
        this.x += forceDirectionX * force * 2
        this.y += forceDirectionY * force * 2
      }
    }
  }                          // ← update() ends here

draw() {
  ctx.fillStyle = dark ? 'rgba(34, 211, 238, 0.9)' : 'rgba(37, 99, 235, 0.8)'
  ctx.save()
  ctx.translate(this.x, this.y)
  ctx.beginPath()
  
  const spikes = 5
  const outerRadius = this.size * 1
  const innerRadius = this.size * 0.4
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

}
function init(){pts=[];for(let i=0;i<60;i++)pts.push(new Particle())}
    function connect(){
      for(let a=0;a<pts.length;a++) for(let b=a;b<pts.length;b++){
        let dx=pts[a].x-pts[b].x,dy=pts[a].y-pts[b].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<150){ctx.strokeStyle=dark?`rgba(244,114,182,${1-d/150})`:`rgba(219,39,119,${0.5-d/300})`;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke()}
      }
    }
    function animate(){ctx.clearRect(0,0,canvas.width,canvas.height);pts.forEach(p=>{p.update();p.draw()});connect();animId=requestAnimationFrame(animate)}
init(); animate()

    // ── PLANETS & COMETS ──────────────────────────────────────────
    let planets = [], comets2 = [], planetAnimId

    class Planet {
      constructor(index, total) {
        this.distFactor = 0.12 + (index / total) * 0.75
        this.radius = 12 + Math.random() * 25
        this.speed = (0.003 / (index + 1)) * 0.35
        this.angle = Math.random() * Math.PI * 2
        const hues = [200, 30, 180, 5, 280, 150, 45, 210, 330, 20]
        this.color = `hsl(${hues[index % hues.length]}, 70%, 60%)`
      }
      update(c2, x2) {
        this.angle += this.speed
        const centerX = c2.width / 2
        const centerY = c2.height / 2
        const maxDim = Math.max(c2.width, c2.height)
        const orbitRadius = maxDim * this.distFactor
        const x = centerX + Math.cos(this.angle) * orbitRadius
        const y = centerY + Math.sin(this.angle) * orbitRadius
        x2.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
        x2.lineWidth = 1
        x2.beginPath()
        x2.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
        x2.stroke()
        x2.shadowBlur = dark ? 20 : 5
        x2.shadowColor = this.color
        x2.fillStyle = this.color
        x2.beginPath()
        x2.arc(x, y, this.radius, 0, Math.PI * 2)
        x2.fill()
        x2.shadowBlur = 0
      }
    }

    const canvas2 = document.createElement('canvas')
    canvas2.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2;opacity:0.5;'
    canvas2.width = window.innerWidth
    canvas2.height = window.innerHeight
    document.body.appendChild(canvas2)
    const ctx2 = canvas2.getContext('2d')

    function createComet2() {
      const sides = ['top', 'bottom', 'left', 'right']
      const side = sides[Math.floor(Math.random() * 4)]
      let x, y, vx, vy
      const speed = 0.4 + Math.random() * 0.3
      if (side === 'top')         { x = Math.random() * canvas2.width;  y = -100;                vx = 0.1;  vy = speed  }
      else if (side === 'bottom') { x = Math.random() * canvas2.width;  y = canvas2.height + 100; vx = -0.1; vy = -speed }
      else if (side === 'left')   { x = -100;               y = Math.random() * canvas2.height;  vx = speed; vy = 0.1  }
      else                        { x = canvas2.width + 100; y = Math.random() * canvas2.height;  vx = -speed; vy = -0.1 }
      return { x, y, vx, vy, history: [], tailLength: 130 }
    }

    planets = Array.from({ length: 10 }, (_, i) => new Planet(i, 10))
    comets2 = Array.from({ length: 3 }, createComet2)

    function drawPlanets() {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
      const colorAccent = dark ? '76, 201, 240' : '0, 95, 115'
      planets.forEach(p => p.update(canvas2, ctx2))
      comets2.forEach((c, i) => {
        c.x += c.vx; c.y += c.vy
        c.history.push({ x: c.x, y: c.y })
        if (c.history.length > c.tailLength) c.history.shift()
        if (c.x < -200 || c.x > canvas2.width + 200 || c.y < -200 || c.y > canvas2.height + 200)
          comets2[i] = createComet2()
        c.history.forEach((h, idx) => {
          ctx2.fillStyle = `rgba(${colorAccent}, ${(idx / c.history.length) * 0.3})`
          ctx2.beginPath()
          ctx2.arc(h.x, h.y, (idx / c.history.length) * 3, 0, Math.PI * 2)
          ctx2.fill()
        })
      })
      planetAnimId = requestAnimationFrame(drawPlanets)
    }

    const handleResize2 = () => { canvas2.width = window.innerWidth; canvas2.height = window.innerHeight }
    window.addEventListener('resize', handleResize2)
    drawPlanets()
    // ── END PLANETS & COMETS ──────────────────────────────────────

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', handleResize2)
      cancelAnimationFrame(animId)
      cancelAnimationFrame(planetAnimId)
      canvas2.remove()
    }
  }, [dark])

 const fetchAll = async () => {
    try {
      const [custRes, dashRes, allPRRes] = await Promise.allSettled([
        api.get('/customers/'),
        api.get('/dashboard/'),
        api.get('/promotors/list'),
      ])
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data)
      if (dashRes.status === 'fulfilled') {
        setPromotorInfo(dashRes.value.data)
        if (dashRes.value.data?.super_admin_email) {
          localStorage.setItem('superAdminEmail', dashRes.value.data.super_admin_email)
        }
      }
      if (allPRRes.status === 'fulfilled') setAllPromotors(allPRRes.value.data)
    } catch(err) { console.error(err) }
  }

const PROFILE_FIELDS = [
  ['initial', 'Initial'],
  ['first_name', 'First Name'],
  ['last_name', 'Last Name'],
  ['email', 'Email'],
  ['mobile_number', 'Mobile Number'],
  ['gender', 'Gender'],
  ['dob', 'DOB'],
  ['married_status', 'Married Status'],
  ['anniversary_date', 'Anniversary Date'],
  ['door_no', 'Door No'],
  ['street_name', 'Street'],
  ['town_name', 'Town'],
  ['city_name', 'City'],
  ['district', 'District'],
  ['state', 'State'],
  ['aadhaar_no', 'Aadhaar No'],
  ['pan_no', 'PAN No'],
  ['occupation', 'Type'],
  ['occupation_detail', 'Detail'],
  ['annual_salary', 'Annual Salary'],
  ['promotor_id', 'Promotor ID'],
  ['sub_dealer_id', 'Sub Dealer ID'],
  ['sub_dealer_name', 'Sub Dealer Name'],
  ['sub_dealer_contact_no', 'Contact No'],
]


const openProfileEdit = () => {
  const next = {}
  PROFILE_FIELDS.forEach(([key]) => {
    next[key] = promotorInfo?.[key] || ''
  })
  setUpdateForm(next)
  setUpdateMessage('')
  setProofDocument(null)
  setShowProfileEdit(true)
}

const handleUpdateChange = e => {
  const { name, value } = e.target

  if (name === 'married_status' && value !== 'married') {
    setUpdateForm({ ...updateForm, married_status: value, anniversary_date: '' })
    return
  }

  setUpdateForm({ ...updateForm, [name]: value })
}



const submitProfileUpdate = async e => {
  e.preventDefault()

  if (!updateMessage.trim()) {
    alert('Please enter message / reason bro')
    return
  }

  if (!proofDocument) {
    alert('Please upload document proof bro')
    return
  }

  const fd = new FormData()

  PROFILE_FIELDS.forEach(([key]) => {
    if (
      !['email', 'admin_id', 'admin_name', 'admin_contact_no'].includes(key) &&
      updateForm[key] !== null &&
      updateForm[key] !== undefined
    ) {
      fd.append(key, updateForm[key])
    }
  })

  fd.append('message', updateMessage)
  fd.append('proof_document', proofDocument)

  try {
    await api.post('/profile-update-request/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    setMsg('✅ Profile update request submitted successfully!')
    setMsgType('success')
    setShowProfileEdit(false)
    setUpdateMessage('')
    setProofDocument(null)
  } catch (err) {
    setMsg('❌ Error: ' + JSON.stringify(err.response?.data || err.message))
    setMsgType('error')
  }
}

  
const fetchMetalPrices = async () => {
  setMetalLoading(true)
  try {
    const res = await api.get('/metal-rates/')
    const d = res.data
    setMetalPrices({
      gold22k: parseFloat(d.gold_22k),
      gold24k: parseFloat(d.gold_24k),
      silver:  parseFloat(d.silver_999),
    })
    setDbRateDate(d.date)
  } catch (e) {
    setMetalPrices({ gold22k: null, gold24k: null, silver: null })
    setDbRateDate(null)
  }
  setMetalLoading(false)
}

// ── COIN REQUEST helpers ──
const COIN_WEIGHTS_GOLD = [
  { label: '50 mg', grams: 0.05 }, { label: '100 mg', grams: 0.10 }, { label: '150 mg', grams: 0.15 },
  { label: '200 mg', grams: 0.20 }, { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 },
  { label: '2 gm', grams: 2 }, { label: '4 gm', grams: 4 }, { label: '8 gm', grams: 8 },
]
const COIN_WEIGHTS_SILVER = [
  { label: '500 mg', grams: 0.50 }, { label: '1 gm', grams: 1 }, { label: '2 gm', grams: 2 },
  { label: '5 gm', grams: 5 }, { label: '10 gm', grams: 10 }, { label: '20 gm', grams: 20 },
  { label: '50 gm', grams: 50 }, { label: '100 gm', grams: 100 },
]
const COIN_METAL_LABELS = { gold_22k: '🏅 Gold 22K', gold_24k: '🥇 Gold 24K', silver_999: '🥈 Silver 999' }

const addToCoinCart = () => {
  if (!selCoinWeight || !selCoinQty || Number(selCoinQty) < 1) {
    setCoinBuyMsg('❌ Weight & Qty select pannunga')
    return
  }
  const weightsArr = selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD
  const w = weightsArr.find(x => x.label === selCoinWeight)
  if (!w) return
  setCoinCart(prev => [...prev, { metal_type: selCoinMetal, weight_label: w.label, weight_grams: w.grams, qty: Number(selCoinQty) }])
  setSelCoinWeight('')
  setSelCoinQty('')
  setCoinBuyMsg('')
}

const removeCoinCartItem = (idx) => {
  setCoinCart(prev => prev.filter((_, i) => i !== idx))
}

const submitCoinRequest = async () => {
  if (coinCart.length === 0) {
    setCoinBuyMsg('❌ Ore item aavathu add pannunga')
    return
  }
  setCoinBuySubmitting(true)
  try {
    await api.post('/coin-requests/', { items: coinCart })
    setCoinBuyMsg('✅ Request Sub Dealer-ku anupitten!')
    setCoinCart([])
    setTimeout(() => { setShowBuyCoin(false); setCoinBuyMsg('') }, 1400)
  } catch (err) {
    setCoinBuyMsg('❌ Failed: ' + JSON.stringify(err.response?.data || err.message))
  }
  setCoinBuySubmitting(false)
}

const fetchCoinStock = async () => {
  setCoinStockLoading(true)
  try {
    const res = await api.get('/coin-stock/')
    setCoinStock(res.data)
  } catch { setCoinStock([]) }
  setCoinStockLoading(false)
}

const fetchMyCoinRequests = async () => {
  setMyRequestsLoading(true)
  try {
    const res = await api.get('/coin-requests/')
    setMyCoinRequests(res.data)
  } catch { setMyCoinRequests([]) }
  setMyRequestsLoading(false)
}

  const fetchAnnouncements = async () => {
  try {
    const res = await api.get('/announcements/')
    const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setAnnouncements(sorted)
    const lastSeen = parseInt(localStorage.getItem('promotorAnnouncementSeen') || '0')
    setUnreadCount(sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length)
  } catch {}
}

function extractIdsFromTitle(title) {
    return title.match(/BB[A-Z]+\d+/g) || []
  }

  function isCurrentUserMentioned(title) {
    const myId = promotorInfo?.promotor_id
    if (!myId) return false
    return extractIdsFromTitle(title).includes(myId)
  }

  async function fetchReplies(annId) {
    try {
      const res = await api.get(`/announcements/${annId}/replies/`)
      setAnnReplies(prev => ({ ...prev, [annId]: res.data }))
    } catch {}
  }

  async function submitReply() {
    if (!replyText.trim()) return
    setReplyLoading(true)
    try {
      await api.post(`/announcements/${replyAnn.id}/replies/`, { message: replyText })
      setRepliedIds(prev => new Set([...prev, replyAnn.id]))
      setReplyMsg('✅ Wish sent!')
      setReplyText('')
    } catch (err) {
      if (err.response?.data?.error === 'Already replied') {
        setRepliedIds(prev => new Set([...prev, replyAnn.id]))
        setReplyMsg('⚠️ Already sent!')
      } else { setReplyMsg('❌ Failed.') }
    }
    setReplyLoading(false)
  }

useEffect(() => {
  if (showForm && promotorInfo) {
    setSelectedPromotor(promotorInfo)
    setForm(prev => ({ ...prev, assigned_promotor_id: promotorInfo.id }))
  }
}, [showForm])

useEffect(() => { 
  fetchAll(); fetchAnnouncements()
  fetchMetalPrices()
  const interval = setInterval(() => {
    fetchAnnouncements()
    fetchMetalPrices()
  }, 30000)
  return () => clearInterval(interval)
}, [])



const handlePromotorChange = (e) => {
  const id = parseInt(e.target.value)
  const pr = allPromotors.find(p => p.id === id)
  setSelectedPromotor(pr || null)
  setForm({ ...form, assigned_promotor_id: id })
}

const handleChange = e => {
  const { name, value } = e.target

  if (name === 'married_status' && value !== 'married') {
    setForm({ ...form, married_status: value, anniversary_date: '' })
    return
  }

  setForm({ ...form, [name]: value })
}

const handleSubmit = async e => {
  e.preventDefault()

  if (form.married_status === 'married' && !form.anniversary_date) {
    setMsg('❌ Please enter Anniversary Date!'); setMsgType('error')
    return
  }

  if (form.password !== confirmPassword) {
    setPasswordError('❌ Passwords do not match')
    return
  }

  try {
    const payload = { ...form }
    if (!payload.dob) delete payload.dob
    if (payload.married_status !== 'married') delete payload.anniversary_date

    await api.post('/customers/', payload)
    setMsg('✅ Customer created successfully!'); setMsgType('success')
    setShowForm(false); fetchAll(); setForm(emptyForm)
    setConfirmPassword(''); setPasswordError('')
  } catch(err) {
    console.log('ERROR:', JSON.stringify(err.response?.data, null, 2))
    setMsg('❌ Error: ' + JSON.stringify(err.response?.data)); setMsgType('error')
  }
}

  const card     = { background: cardBg, border: cardBorder, borderRadius:'20px', padding:'32px 36px', marginBottom:'24px' }
  const secHead  = (col='#fbcfe8') => ({ color:col, fontSize:'13px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 20px', paddingBottom:'14px', borderBottom: cardBorder })
  const secLabel = (col='#fbcfe8') => ({ color:col, fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', margin:'4px 0 0', paddingBottom:'10px', borderBottom: cardBorder })
  const inp      = { width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 16px', color: text, fontSize:'14px', outline:'none', boxSizing:'border-box' }
  const lbl      = { display:'block', color: subtext, fontSize:'12px', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em' }

  const superAdminEmail = localStorage.getItem('superAdminEmail') || ''

  return (
    <div style={{ minHeight:'100vh', background: bg, color: text, transition:'background 0.8s ease, color 0.4s ease', fontFamily:'"Inter",system-ui,sans-serif', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes float-orb{0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}100%{transform:translate(0,0) scale(1)}}
        @keyframes antigravity{0%{transform:translateY(110vh) rotate(0deg);opacity:0}10%{opacity:var(--op)}90%{opacity:var(--op)}100%{transform:translateY(-20vh) rotate(360deg);opacity:0}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes prPopupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes prPulseGlow{0%,100%{box-shadow:0 0 8px rgba(244,114,182,0.15);}50%{box-shadow:0 0 22px rgba(244,114,182,0.35);}}
        @keyframes prDotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
        @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(244,114,182,0)}50%{box-shadow:0 0 20px rgba(244,114,182,0.22)}}
        @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .pr-inp:focus{border-color:#f472b6 !important}
        .pr-grad-btn{position:relative;overflow:hidden}
        .pr-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:translateX(-100%)}
        .pr-grad-btn:hover::after{animation:shimmer 1s infinite}
        .pr-tr:hover td{background:rgba(255,255,255,.02)}
      `}</style>

      <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, pointerEvents:'none', zIndex:1, opacity:0.45 }} />
      <div style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', animation:'float-orb 20s infinite ease-in-out', zIndex:0, top:'8%', left:'8%', width:'380px', height:'380px', background: dark?'rgba(244,114,182,0.08)':'rgba(219,39,119,0.08)' }} />
      <div style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', animation:'float-orb 20s infinite ease-in-out', zIndex:0, bottom:'10%', right:'4%', width:'460px', height:'460px', background: dark?'rgba(167,139,250,0.06)':'rgba(139,92,246,0.06)', animationDelay:'-5s' }} />

      {PARTICLES.map(p => (
        <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, bottom:'-100px', width:p.size, height:p.size, borderRadius:'40% 60% 60% 40% / 40% 40% 60% 60%', border:`1px solid ${accent}44`, opacity:p.opacity, animation:`antigravity ${p.duration}s ${p.delay}s infinite linear`, '--op':p.opacity, pointerEvents:'none', zIndex:0 }} />
      ))}

      {/* Navbar */}
      <div style={{ position:'relative', zIndex:10, background: glass, borderBottom:`1px solid ${border}`, padding:'18px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(16px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginLeft:'10px' }}>
          <img src={logo} alt="BitByte Logo" style={{ width:60, height:50, borderRadius:'10px', objectFit:'contain' }} />
          <span style={{ color:'#fbcfe8', fontWeight:700, fontSize:'14px' }}>🌟 Promotor Dashboard</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
<div
  onClick={() => setShowProfile(true)}
  style={{ cursor:'pointer', width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(244,114,182,0.25),rgba(167,139,250,0.15))', border:'2px solid rgba(244,114,182,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', transition:'all 0.25s ease' }}
  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(244,114,182,0.3)' }}
  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
>🌟</div>

          {/* 🪙 Buy Coin Button */}
          <div
            onClick={() => { setShowBuyCoin(true); setCoinCart([]); setCoinBuyMsg('') }}
            style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '15px' }}>🪙</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Buy Coin</span>
          </div>

          {/* 📦 Stored Coin Button */}
          <div
            onClick={() => navigate('/stored-coins')}
            style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '15px' }}>📦</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>Stored Coin</span>
          </div>

          {/* 🧾 My Coin Requests Button */}
          <div
            onClick={() => navigate('/coin-requests-page')}
            style={{ position: 'relative', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6M9 16h6M9 8h6"/>
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>My Requests</span>
            {myCoinRequests.filter(r => r.status === 'pending').length > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#38bdf8,#22d3ee)', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(56,189,248,0.5)', border: '1.5px solid #020617' }}>
                {myCoinRequests.filter(r => r.status === 'pending').length}
              </div>
            )}
          </div>

          {/* 📢 Announcement Bell */}
          <div
            onClick={() => { setShowAnnouncements(true); localStorage.setItem('promotorAnnouncementSeen', Date.now().toString()); setUnreadCount(0) }}
            style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '10px', border: '1px solid rgba(244,114,182,0.35)', background: 'rgba(244,114,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>📢</span>
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#f472b6,#a78bfa)', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(244,114,182,0.5)', border: '1.5px solid #020617' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>

          <button onClick={() => setDark(!dark)}         
            style={{ padding:'8px 16px', borderRadius:'16px', border:`1px solid ${border}`, background:'transparent', color: text, cursor:'pointer', fontWeight:600, fontSize:'13px' }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }} style={{ padding:'8px 18px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'10px', fontSize:'13px', cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:10, padding:'36px 40px', maxWidth:'1200px', margin:'0 auto' }}>
        {msg && (
          <div style={{ background: msgType==='success'?'rgba(244,114,182,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${msgType==='success'?'rgba(244,114,182,0.25)':'rgba(239,68,68,0.3)'}`, color: msgType==='success'?'#f472b6':'#f87171', borderRadius:'12px', padding:'14px 20px', fontSize:'14px', marginBottom:'20px' }}>
            {msg}
          </div>
        )}


{(() => {
  const WEIGHTS = [
    { label: '50 mg',  grams: 0.05 },
    { label: '100 mg', grams: 0.10 },
    { label: '150 mg', grams: 0.15 },
    { label: '200 mg', grams: 0.20 },
    { label: '500 mg', grams: 0.50 },
    { label: '1 gm',   grams: 1 },
    { label: '2 gm',   grams: 2 },
    { label: '4 gm',   grams: 4 },
    { label: '8 gm',   grams: 8 },
  ]

  const METALS = [
    {
      key: 'gold22k', icon: '🏅', label: 'GOLD 22K',
      price: metalPrices.gold22k,
      cardBg: 'rgba(251,191,36,0.05)', cardBd: 'rgba(251,191,36,0.28)',
      hoverShadow: '0 10px 28px rgba(251,191,36,0.22)',
      coinShadow: '0 3px 10px rgba(251,191,36,0.4)',
      pillBg: 'rgba(251,191,36,0.12)', pillBd: 'rgba(251,191,36,0.3)',
      color: '#fbbf24', img: goldCoin,
    },
    {
      key: 'gold24k', icon: '🥇', label: 'GOLD 24K',
      price: metalPrices.gold24k,
      cardBg: 'rgba(255,215,0,0.05)', cardBd: 'rgba(255,215,0,0.28)',
      hoverShadow: '0 10px 28px rgba(255,215,0,0.22)',
      coinShadow: '0 3px 10px rgba(255,215,0,0.5)',
      pillBg: 'rgba(255,215,0,0.12)', pillBd: 'rgba(255,215,0,0.3)',
      color: '#ffd700', img: goldCoin,
    },
    {
      key: 'silver', icon: '🥈', label: 'SILVER 999',
      price: metalPrices.silver,
      cardBg: 'rgba(192,192,192,0.04)', cardBd: 'rgba(192,192,192,0.22)',
      hoverShadow: '0 10px 28px rgba(192,192,192,0.15)',
      coinShadow: '0 3px 10px rgba(192,192,192,0.4)',
      pillBg: 'rgba(192,192,192,0.1)', pillBd: 'rgba(192,192,192,0.25)',
      color: '#c0c0c0', img: silverCoin,
    },
  ]

  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: '20px', padding: '28px 32px', marginBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '22px' }}>⚖️</span>
        <div>
          <div style={{ color: '#fbcfe8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Today's Gold & Silver Rates
          </div>
          <div style={{ color: subtext, fontSize: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📍 Chennai, India</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>₹ per gram</span>
            <span style={{ opacity: 0.4 }}>•</span>
            {dbRateDate ? (
              <span style={{ color: '#4ade80', fontSize: '9px', fontWeight: 700 }}>
                📅 {new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            ) : (
              <span style={{ color: '#f87171', fontSize: '9px', fontWeight: 700 }}>No rate entered yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Metal Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {METALS.map(m => (
          <div key={m.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px' }}>{m.icon}</span>
              <span style={{ color: m.color, fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>{m.label}</span>
              {m.price && (
                <span style={{ color: m.color, fontSize: '10px', opacity: 0.55 }}>₹{m.price.toFixed(2)}/gm</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
              {WEIGHTS.map((w, i) => (
                <div
                  key={w.label}
                  className="metal-card"
                  style={{
                    flex: 1, minWidth: 0,
                    background: m.cardBg,
                    border: `1px solid ${m.cardBd}`,
                    animationDelay: `${i * 0.06}s`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = m.hoverShadow }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                    <img
                      src={m.img}
                      alt={m.label}
                      style={{
                        width: '46px', height: '46px', objectFit: 'contain',
                        filter: `drop-shadow(0 2px 6px ${m.color}66)`,
                        boxShadow: m.coinShadow,
                        borderRadius: '50%',
                      }}
                    />
                  </div>
                  <div style={{ padding: '6px 4px 8px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block', fontSize: '9px', fontWeight: 800,
                      color: m.color, background: m.pillBg,
                      border: `1px solid ${m.pillBd}`,
                      borderRadius: '20px', padding: '2px 7px', marginBottom: '5px',
                    }}>
                      {w.label}
                    </div>
                    <div style={{ color: m.color, fontWeight: 900, fontSize: '11px', fontFamily: 'monospace', paddingBottom: '4px' }}>
                      {m.price != null ? `₹${(w.grams * m.price).toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
})()}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <h2 style={{ fontSize:'22px', fontWeight:800, margin:0 }}>Customer Management</h2>
          <div style={{ display:'flex', gap:'12px' }}>
            <button onClick={() => navigate('/sales-report')}
  style={{ padding:'11px 28px', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:'12px', fontWeight:700, color:'#4ade80', fontSize:'14px', cursor:'pointer' }}>
  📊 Sales Report
</button>
<button onClick={() => navigate('/promotor-hierarchy')}
  style={{ padding:'11px 28px', background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.3)', borderRadius:'12px', fontWeight:700, color:'#fbcfe8', fontSize:'14px', cursor:'pointer' }}>
  🏢 Customer Hierarchy
</button>
            <button onClick={() => setShowForm(!showForm)} className="pr-grad-btn"
              style={{ padding:'11px 28px', background:'linear-gradient(90deg,#f472b6,#a78bfa)', border:'none', borderRadius:'12px', fontWeight:800, color:'#3b0024', fontSize:'14px', cursor:'pointer' }}>
              {showForm ? 'Cancel' : '+ Create Customer'}
            </button>
          </div>
        </div>

{showProfileEdit && (
  <div onClick={() => setShowProfileEdit(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <form onSubmit={submitProfileUpdate} onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border:'1px solid rgba(244,114,182,0.35)', borderRadius:'24px', width:'96%', maxWidth:'1050px', maxHeight:'90vh', overflow:'hidden', boxShadow:'0 32px 90px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column' }}>
      
      {/* Header */}
      <div style={{ padding:'22px 28px', borderBottom:'1px solid rgba(244,114,182,0.16)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ color:'#f472b6', fontWeight:900, fontSize:'15px', letterSpacing:'1px' }}>✎ PROFILE UPDATE REQUEST</div>
          <div style={{ color:subtext, fontSize:'12px', marginTop:'4px' }}>Existing details compare pannitu correct details full ah enter pannunga</div>
        </div>
        <button type="button" onClick={() => setShowProfileEdit(false)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'8px', padding:'7px 14px', cursor:'pointer' }}>✕ Close</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto', padding:'24px 28px' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ background:'rgba(244,114,182,0.08)' }}>
              {['Existing Details Description', 'Existing Details', 'Details To Updated'].map(h => (
                <th key={h} style={{ padding:'14px', color:'#f472b6', textAlign:'left', border:'1px solid rgba(244,114,182,0.2)', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.8px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PROFILE_FIELDS.map(([key, label]) => (
              <tr key={key}>
                <td style={{ padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', color:'#fbcfe8', fontWeight:700 }}>
                  {label}
                </td>
                <td style={{ padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', color:text, wordBreak:'break-all' }}>
                  {promotorInfo?.[key] || '—'}
                </td>
                <td style={{ padding:'10px', border:'1px solid rgba(255,255,255,0.08)' }}>

                  {key === 'gender' ? (
                    <select
                      name={key}
                      value={updateForm[key] || 'male'}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    >
                      <option value="male" style={{ background:optionBg, color:text }}>Male</option>
                      <option value="female" style={{ background:optionBg, color:text }}>Female</option>
                      <option value="other" style={{ background:optionBg, color:text }}>Other</option>
                    </select>

                  ) : key === 'married_status' ? (
                    <select
                      name={key}
                      value={updateForm[key] || 'single'}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    >
                      <option value="single" style={{ background:optionBg, color:text }}>Single</option>
                      <option value="married" style={{ background:optionBg, color:text }}>Married</option>
                      <option value="other" style={{ background:optionBg, color:text }}>Other</option>
                    </select>

                  ) : key === 'dob' ? (
                    <input
                      type="date"
                      name={key}
                      value={updateForm[key] || ''}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    />

                  ) : key === 'anniversary_date' ? (
                    updateForm.married_status === 'married' ? (
                      <input
                        type="date"
                        name={key}
                        value={updateForm[key] || ''}
                        onChange={handleUpdateChange}
                        style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                      />
                    ) : (
                      <span style={{ color:subtext, fontSize:'12px' }}>Only married select panna show aagum</span>
                    )

                  ) : (
                    <input
                      name={key}
                      value={updateForm[key] || ''}
                      onChange={handleUpdateChange}
                      style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'9px', padding:'10px 12px', color:text, outline:'none', boxSizing:'border-box' }}
                    />
                  )}

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Message / Reason */}
        <div style={{ marginTop:'16px' }}>
          <label style={{ display:'block', color:subtext, fontSize:'12px', marginBottom:'8px', fontWeight:700 }}>
            Message / Reason *
          </label>
          <textarea
            value={updateMessage}
            onChange={e => setUpdateMessage(e.target.value)}
            placeholder="Example: My mobile number is wrong, please update it..."
            rows={3}
            style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 14px', color:text, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:'1.6' }}
            onFocus={e => e.target.style.borderColor = '#f472b6'}
            onBlur={e => e.target.style.borderColor = inpBorder}
          />
        </div>

        {/* Proof Document */}
        <div style={{ marginTop:'16px' }}>
          <label style={{ display:'block', color:subtext, fontSize:'12px', marginBottom:'8px', fontWeight:700 }}>
            Upload Proof Document *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setProofDocument(e.target.files[0])}
            style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'10px 12px', color:text, boxSizing:'border-box' }}
          />
          {proofDocument && (
            <div style={{ color:'#4ade80', fontSize:'12px', marginTop:'8px' }}>
              ✅ Selected: {proofDocument.name}
            </div>
          )}
          <div style={{ color:subtext, fontSize:'12px', marginTop:'8px' }}>
            PAN / Aadhaar / supporting document upload pannunga. Max size: 2 MB.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'18px 28px', borderTop:'1px solid rgba(244,114,182,0.14)', display:'flex', justifyContent:'flex-end', gap:'12px' }}>
        <button
          type="button"
          onClick={() => setShowProfileEdit(false)}
          style={{ padding:'12px 22px', background:inpBg, border:`1px solid ${border}`, borderRadius:'12px', color:subtext, cursor:'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ padding:'12px 30px', background:'linear-gradient(90deg,#f472b6,#a78bfa)', border:'none', borderRadius:'12px', color:'#3b0024', fontWeight:900, cursor:'pointer' }}
        >
          Submit Request
        </button>
      </div>

    </form>
  </div>
)}


{showProfile && (
  <div
    onClick={() => setShowProfile(false)}
    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(10px)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border:'1px solid rgba(244,114,182,0.3)', borderRadius:'24px', width:'95%', maxWidth:'580px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}
    >
      {/* Header */}
      <div style={{ flexShrink:0, padding:'24px 28px', borderBottom:'1px solid rgba(244,114,182,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(244,114,182,0.25),rgba(167,139,250,0.15))', border:'2px solid rgba(244,114,182,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', boxShadow:'0 4px 16px rgba(244,114,182,0.2)' }}>🌟</div>
          <div>
            <div style={{ color:'#f472b6', fontWeight:800, fontSize:'15px', letterSpacing:'0.05em' }}>MY PROFILE</div>
            <div style={{ color:subtext, fontSize:'11px', marginTop:'3px', fontFamily:'monospace' }}>{promotorInfo?.promotor_id || '—'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <button
            onClick={() => { setShowProfile(false); openProfileEdit() }}
            style={{ background:'rgba(244,114,182,0.12)', border:'1px solid rgba(244,114,182,0.35)', color:'#f472b6', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px', fontWeight:800 }}
          >✎ Edit</button>
          <button
            onClick={() => setShowProfile(false)}
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px' }}
          >✕ Close</button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:'20px', scrollbarWidth:'thin', scrollbarColor:'rgba(244,114,182,0.4) transparent' }}>
        {!promotorInfo ? (
          <div style={{ textAlign:'center', color:subtext, padding:'60px 0' }}>Loading...</div>
        ) : (
          <>
            {/* Account Info */}
            <div style={{ background: dark ? 'rgba(244,114,182,0.04)' : 'rgba(244,114,182,0.03)', border:'1px solid rgba(244,114,182,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#f472b6', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#f472b6', display:'inline-block' }} />
                ACCOUNT INFO
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  { label:'Promotor ID', value:promotorInfo.promotor_id, mono:true, color:'#f472b6' },
                  { label:'Initial',     value:promotorInfo.initial },
                  { label:'First Name',  value:promotorInfo.first_name },
                  { label:'Last Name',   value:promotorInfo.last_name },
                  { label:'Email',       value:promotorInfo.email },
                  { label:'Mobile',      value:promotorInfo.mobile_number },
                  { label:'Gender',      value:promotorInfo.gender },
                  { label:'DOB',         value:promotorInfo.dob },
                  { label:'Married',     value:promotorInfo.married_status },
                  { label:'Anniversary', value:promotorInfo.anniversary_date },
                ].map(f => f.value ? (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:f.color || text, fontSize:'13px', fontWeight:f.mono?700:500, fontFamily:f.mono?'monospace':'inherit', wordBreak:'break-all' }}>{f.value}</div>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Address */}
            <div style={{ background: dark ? 'rgba(34,211,238,0.04)' : 'rgba(34,211,238,0.03)', border:'1px solid rgba(34,211,238,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#22d3ee', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22d3ee', display:'inline-block' }} />
                ADDRESS
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  { label:'Door No',  value:promotorInfo.door_no },
                  { label:'Street',   value:promotorInfo.street_name },
                  { label:'Town',     value:promotorInfo.town_name },
                  { label:'City',     value:promotorInfo.city_name },
                  { label:'District', value:promotorInfo.district },
                  { label:'State',    value:promotorInfo.state },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity */}
            <div style={{ background: dark ? 'rgba(167,139,250,0.04)' : 'rgba(167,139,250,0.03)', border:'1px solid rgba(167,139,250,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#a78bfa', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', display:'inline-block' }} />
                IDENTITY
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  { label:'Aadhaar No', value:promotorInfo.aadhaar_no, mask:true },
                  { label:'PAN No',     value:promotorInfo.pan_no, mono:true },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px', fontFamily:'monospace' }}>
                      {f.mask && f.value ? `XXXX-XXXX-${f.value.slice(-4)}` : (f.value || '—')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Occupation */}
            <div style={{ background: dark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#f59e0b', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />
                OCCUPATION
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                {[
                  { label:'Type',          value:promotorInfo.occupation },
                  { label:'Detail',        value:promotorInfo.occupation_detail },
                  { label:'Annual Salary', value:promotorInfo.annual_salary ? `₹ ${Number(promotorInfo.annual_salary).toLocaleString('en-IN')}` : '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:text, fontSize:'13px' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub Dealer Info */}
            <div style={{ background: dark ? 'rgba(244,114,182,0.06)' : 'rgba(244,114,182,0.04)', border:'1.5px solid rgba(244,114,182,0.35)', borderRadius:'16px', padding:'18px 20px' }}>
              <div style={{ color:'#f472b6', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#f472b6', display:'inline-block', boxShadow:'0 0 6px #f472b6' }} />
                SUB DEALER INFO
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  { label:'Sub Dealer ID',      value:promotorInfo.sub_dealer_id,      mono:true, color:'#f472b6' },
                  { label:'Sub Dealer Name',     value:promotorInfo.sub_dealer_name },
                  { label:'Contact No',          value:promotorInfo.sub_dealer_contact_no },
                  { label:'Member Since',        value:promotorInfo.created_at ? new Date(promotorInfo.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ color:subtext, fontSize:'10px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</div>
                    <div style={{ color:f.color||text, fontSize:'13px', fontFamily:f.mono?'monospace':'inherit', fontWeight:f.mono?700:500 }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}


{/* ── BUY COIN POPUP (multi-weight, becomes a request) ── */}
  {showBuyCoin && (
    <div onClick={() => setShowBuyCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px', boxShadow: '0 32px 90px rgba(0,0,0,0.8)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '16px' }}>🪙 Buy Coin — Request</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>Athana coin type um weight um add pannunga, appuram Sub Dealer-ku request anuppunga</div>
          </div>
          <button onClick={() => setShowBuyCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
        </div>

        {/* Metal select */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['gold_22k', 'gold_24k', 'silver_999'].map(m => (
            <div key={m} onClick={() => { setSelCoinMetal(m); setSelCoinWeight('') }}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                background: selCoinMetal === m ? 'rgba(251,191,36,0.2)' : inpBg,
                border: `1.5px solid ${selCoinMetal === m ? 'rgba(251,191,36,0.7)' : inpBorder}`,
                color: selCoinMetal === m ? '#fbbf24' : subtext }}>
              {COIN_METAL_LABELS[m]}
            </div>
          ))}
        </div>

        {/* Weight + Qty + Add button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ color: subtext, fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>WEIGHT</label>
            <select value={selCoinWeight} onChange={e => setSelCoinWeight(e.target.value)}
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '11px 12px', color: text, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ background: optionBg }}>-- Select --</option>
              {(selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD).map(w => (
                <option key={w.label} value={w.label} style={{ background: optionBg }}>{w.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: subtext, fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>QTY</label>
            <input type="number" min="1" value={selCoinQty} onChange={e => setSelCoinQty(e.target.value)}
              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '11px 12px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={addToCoinCart}
              style={{ padding: '11px 18px', background: 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '10px', color: '#3b0024', fontWeight: 800, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Cart list */}
        {coinCart.length > 0 && (
          <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {coinCart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px' }}>
                <span style={{ color: text, fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS[item.metal_type]} — {item.weight_label} × {item.qty}</span>
                <button onClick={() => removeCoinCartItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {coinBuyMsg && (
          <div style={{ background: coinBuyMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${coinBuyMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: coinBuyMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
            {coinBuyMsg}
          </div>
        )}

        <button
          disabled={coinBuySubmitting || coinCart.length === 0}
          onClick={submitCoinRequest}
          style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#3b0024', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
          {coinBuySubmitting ? '⏳ Sending Request...' : '✅ Confirm & Send Request'}
        </button>
      </div>
    </div>
  )}

  {/* ── STORED COIN POPUP ── */}
  {showStoredCoin && (
    <div onClick={() => setShowStoredCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '24px', width: '95%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ flexShrink: 0, padding: '22px 26px', borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '15px' }}>📦 Stored Coins</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Sub Dealer send pannina coin stock</div>
          </div>
          <button onClick={() => setShowStoredCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {coinStockLoading ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>Loading...</div>
          ) : coinStock.length === 0 ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>Stock illa — Buy Coin request pannunga</div>
          ) : coinStock.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '12px' }}>
              <div>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px' }}>{COIN_METAL_LABELS[s.metal_type]}</div>
                <div style={{ color: subtext, fontSize: '12px', marginTop: '2px' }}>{s.weight_label}</div>
              </div>
              <div style={{ color: text, fontWeight: 900, fontSize: '20px', fontFamily: 'monospace' }}>{s.qty}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

{/* ── MY COIN REQUESTS (STATUS TRACKING) POPUP ── */}
  {showMyRequests && (
    <div onClick={() => setShowMyRequests(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px', width: '95%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

        <div style={{ flexShrink: 0, padding: '22px 26px', borderBottom: '1px solid rgba(56,189,248,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6M9 16h6M9 8h6"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '15px' }}>My Coin Requests</div>
              <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Status of coin requests you sent to your Sub Dealer</div>
            </div>
          </div>
          <button onClick={() => setShowMyRequests(false)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myRequestsLoading ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>Loading...</div>
          ) : myCoinRequests.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: subtext, padding: '40px 0' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6M9 16h6M9 8h6"/><rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
              No coin requests yet
            </div>
          ) : myCoinRequests.map(req => {
            const statusCfg = {
              pending:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', label: 'Pending', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></> },
              sent:     { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.3)', label: 'Approved', icon: <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></> },
              rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', label: 'Rejected', icon: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
            }
            const cfg = statusCfg[req.status] || statusCfg.pending
            return (
              <div key={req.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ color: subtext, fontSize: '11px' }}>
                    {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${cfg.color}22`, border: `1px solid ${cfg.color}55` }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {cfg.icon}
                    </svg>
                    <span style={{ color: cfg.color, fontSize: '11px', fontWeight: 800 }}>{cfg.label}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {req.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: inpBg, borderRadius: '8px', fontSize: '12px' }}>
                      <span style={{ color: text }}>{COIN_METAL_LABELS[item.metal_type]} — {item.weight_label}</span>
                      <span style={{ color: cfg.color, fontWeight: 700 }}>× {item.qty}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'rejected' && req.reject_reason && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                    <div style={{ color: '#f87171', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>REASON FOR REJECTION</div>
                    <div style={{ color: text, fontSize: '12px', lineHeight: 1.5 }}>{req.reject_reason}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )}

  {/* ── HIERARCHY MODAL ── */}
{showHierarchy && (
  <div
    onClick={() => { setShowHierarchy(false); removePRChainPopup() }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: dark ? '#0f172a' : '#f8fafc', border: '1px solid rgba(244,114,182,0.2)', borderRadius: '22px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >

      {/* HEADER - fixed top */}
      <div style={{ flexShrink: 0, padding: '20px 28px', borderBottom: '1px solid rgba(244,114,182,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ color: '#fbcfe8', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🏢 Customer Hierarchy</span>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'Customers', count: customers.length, color: '#f472b6' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `rgba(${hexToRgb(s.color)},0.08)`, border: `1px solid rgba(${hexToRgb(s.color)},0.25)`, borderRadius: '20px', padding: '3px 12px' }}>
                <span style={{ color: s.color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
                <span style={{ color: subtext, fontSize: '11px' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setShowHierarchy(false); removePRChainPopup() }}
          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}
        >✕ Close</button>
      </div>

      {/* SCROLL AREA - middle scrolls */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '28px 32px', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'rgba(244,114,182,0.4) rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'max-content', margin: '0 auto' }}>

          {/* Promotor Root Node */}
          <div style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.13),rgba(167,139,250,0.08))', border: '1px solid rgba(244,114,182,0.55)', borderRadius: '16px', padding: '16px 48px', fontWeight: 800, fontSize: '16px', color: '#f472b6', animation: 'prPulseGlow 3s ease-in-out infinite', boxShadow: '0 0 24px rgba(244,114,182,0.1)', textAlign: 'center' }}>
            🌟 Promotor
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400, marginTop: '4px' }}>
              {localStorage.getItem('email')}
            </div>
          </div>

          {/* Stem */}
          <div style={{ width: 2, height: 32, background: 'linear-gradient(180deg,#f472b6,rgba(244,114,182,0.3))' }} />

          {customers.length > 0 ? (
            <>
              <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(244,114,182,0.5),transparent)', width: '80%' }} />
              <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start' }}>
                {customers.map((cust, ci) => (
                  <div key={cust.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: 24, background: 'rgba(244,114,182,0.5)' }} />
                    <CustomerLeafNode
                      node={cust}
                      dark={dark}
                      text={text}
                      subtext={subtext}
                      colorIdx={ci}
                      superAdminEmail={superAdminEmail}
                      promotorInfo={promotorInfo}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No customers yet.</div>
          )}

        </div>
      </div>

      {/* LEGEND - fixed bottom */}
      <div style={{ flexShrink: 0, padding: '14px 28px', borderTop: '1px solid rgba(244,114,182,0.08)', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {[
          { role: 'Promotor', color: '#f472b6', emoji: '🌟' },
          { role: 'Customer', color: '#a78bfa', emoji: '👤' },
        ].map(l => (
          <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
            <span style={{ color: subtext, fontSize: '11px' }}>{l.emoji} {l.role}</span>
          </div>
        ))}
        <div style={{ color: subtext, fontSize: '11px', width: '100%', textAlign: 'center' }}>
          💡 Hover any node to see full hierarchy chain
        </div>
      </div>

    </div>
  </div>
)}


{/* ── ANNOUNCEMENT VIEW MODAL (Promotor) ── */}
{showAnnouncements && (
  <div onClick={() => setShowAnnouncements(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(244,114,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(244,114,182,0.25),rgba(167,139,250,0.15))', border: '1px solid rgba(244,114,182,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📢</div>
          <div>
            <div style={{ color: '#f472b6', fontWeight: 800, fontSize: '14px' }}>ANNOUNCEMENTS</div>
            <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{announcements.length} total from Super Admin</div>
          </div>
        </div>
        <button onClick={() => setShowAnnouncements(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', color: subtext, padding: '60px 0', fontSize: '15px' }}>No announcements yet.</div>
        ) : announcements.map((ann, idx) => {
          const isMentioned = isCurrentUserMentioned(ann.title)
          const alreadyReplied = repliedIds.has(ann.id)
          const replies = annReplies[ann.id] || []
          return (
            <div key={ann.id} style={{ background: idx === 0 ? (dark ? 'rgba(244,114,182,0.07)' : 'rgba(244,114,182,0.05)') : (dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), border: `1px solid ${idx === 0 ? 'rgba(244,114,182,0.35)' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}`, borderRadius: '14px', padding: '16px 18px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {idx === 0 && <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(244,114,182,0.15)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.3)' }}>● NEW</span>}
                  <span style={{ color: idx === 0 ? '#f472b6' : text, fontWeight: 700, fontSize: '14px' }}>{ann.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: subtext, fontSize: '10px', whiteSpace: 'nowrap' }}>{new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <button disabled={alreadyReplied} onClick={() => { setReplyAnn(ann); setReplyMsg(''); setReplyText('') }} style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 700, borderRadius: '20px', cursor: alreadyReplied ? 'not-allowed' : 'pointer', background: alreadyReplied ? 'rgba(255,255,255,0.05)' : 'rgba(244,114,182,0.15)', border: `1px solid ${alreadyReplied ? 'rgba(255,255,255,0.1)' : 'rgba(244,114,182,0.4)'}`, color: alreadyReplied ? subtext : '#f472b6', whiteSpace: 'nowrap' }}>
                    {alreadyReplied ? '✓ Wished' : '💬 Reply'}
                  </button>
                </div>
              </div>
              <p style={{ color: dark ? '#cbd5e1' : '#475569', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{ann.message}</p>
{isMentioned && (
  <div
    onMouseEnter={e => {
      clearTimeout(wishTimerRef.current)
      const rect = e.currentTarget.getBoundingClientRect()
      let left = rect.left + rect.width / 2
      if (left - 160 < 12) left = 172
      if (left + 160 > window.innerWidth - 12) left = window.innerWidth - 172
      setReplyPopupPos({ top: rect.top, left })
      setReplyPopupAnnId(ann.id)
      fetchReplies(ann.id)
    }}
    onMouseLeave={() => { wishTimerRef.current = setTimeout(() => setReplyPopupAnnId(null), 220) }}
    style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}
  >
    <div style={{ fontSize: '10px', color: '#4ade80', padding: '3px 14px', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', cursor: 'default', background: 'rgba(74,222,128,0.06)', fontWeight: 600 }}>
      🎂 You are mentioned · {replies.length} wish{replies.length !== 1 ? 'es' : ''} — hover to see
    </div>
  </div>
)}
            </div>
          )
        })}
      </div>
    </div>
  </div>
)}


{/* ── REPLY MODAL — Promotor ── */}
{replyAnn && (
  <div onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#f472b6', fontWeight: 800, fontSize: '14px' }}>💬 SEND YOUR WISH</div>
          <div style={{ color: subtext, fontSize: '11px', marginTop: '4px' }}>Replying to: <span style={{ color: text, fontWeight: 600 }}>{replyAnn.title}</span></div>
        </div>
        <button onClick={() => setReplyAnn(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
      </div>
      {replyMsg && <div style={{ background: replyMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${replyMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: replyMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>{replyMsg}</div>}
      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Type your wish..." style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 14px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#f472b6'} onBlur={e => e.target.style.borderColor = inpBorder} />
      <button disabled={replyLoading || !replyText.trim()} onClick={submitReply} style={{ marginTop: '14px', width: '100%', padding: '13px', background: replyLoading || !replyText.trim() ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', color: replyLoading || !replyText.trim() ? '#f472b6' : '#3b0024', cursor: replyLoading || !replyText.trim() ? 'not-allowed' : 'pointer' }}>
        {replyLoading ? '⏳ Sending...' : '💬 Send Wish'}
      </button>
    </div>
  </div>
)}

{/* ── WISH HOVER POPUP — Admin ── */}
{replyPopupAnnId && (
  <div
    id="ad-wish-popup"
    onMouseEnter={() => clearTimeout(wishTimerRef.current)}
    onMouseLeave={() => { wishTimerRef.current = setTimeout(() => setReplyPopupAnnId(null), 220) }}
    style={{
      position: 'fixed',
      top: `${replyPopupPos.top}px`,
      left: `${replyPopupPos.left}px`,
      transform: 'translate(-50%, calc(-100% - 10px))',
      background: dark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)',
      border: '1px solid rgba(74,222,128,0.35)',
      borderRadius: '16px', padding: '16px 18px',
      minWidth: '270px', maxWidth: '340px', maxHeight: '280px',
      overflowY: 'auto', zIndex: 9999,
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(24px)',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(74,222,128,0.5) rgba(74,222,128,0.03)',
      animation: 'adWishIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(74,222,128,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>💬</div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#4ade80', letterSpacing: '1.5px' }}>WISHES</span>
      </div>
      <div style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
        {(annReplies[replyPopupAnnId] || []).length}
      </div>
    </div>
    {(annReplies[replyPopupAnnId] || []).length === 0 ? (
      <div style={{ color: subtext, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No wishes yet</div>
    ) : (annReplies[replyPopupAnnId] || []).map(r => (
      <div key={r.id} style={{ marginBottom: '8px', padding: '10px 12px', background: dark ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.04)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80' }}>{r.replied_by_name}</span>
          <span style={{ fontSize: '9px', color: subtext }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: dark ? '#cbd5e1' : '#475569', lineHeight: '1.5' }}>{r.message}</p>
      </div>
    ))}
    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(74,222,128,0.08)', textAlign: 'center', fontSize: '9px', color: dark ? '#334155' : '#cbd5e1', letterSpacing: '0.8px', fontWeight: 600 }}>
      BitByte Network • Wishes
    </div>
  </div>
)}

       

        {/* ── CREATE FORM ── */}
{/* ── CREATE FORM ── */}
{showForm && (
  <div style={card}>
    <p style={secHead('#fbcfe8')}>Create New Customer</p>
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      <p style={secLabel('#fbcfe8')}>👤 Personal Info</p>

      {/* Initial, First, Last */}
      <div style={{ display:'grid', gridTemplateColumns:'0.4fr 1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Initial</label>
          <input name="initial" value={form.initial} onChange={handleChange} maxLength={5} className="pr-inp" style={inp}/>
        </div>
        <div><label style={lbl}>First Name *</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={100} className="pr-inp" style={inp}/>
        </div>
        <div><label style={lbl}>Last Name *</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={100} className="pr-inp" style={inp}/>
        </div>
      </div>

      {/* Mobile, Email, Password */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Mobile *</label>
          <input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required className="pr-inp" style={inp}/>
        </div>
        <div><label style={lbl}>Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="pr-inp" style={inp}/>
        </div>
        <div><label style={lbl}>Password *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className="pr-inp" style={inp}/>
        </div>
      </div>

      {/* Confirm Password */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div>
          <label style={lbl}>Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
            required
            className="pr-inp"
            style={{ ...inp, border: `1px solid ${passwordError ? '#f87171' : inpBorder}` }}
          />
          {passwordError && (
            <div style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{passwordError}</div>
          )}
        </div>
      </div>

      {/* Gender, DOB, Married Status */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div>
          <label style={lbl}>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} className="pr-inp" style={selectInput}>
            <option value="male"   style={{ background: optionBg, color: text }}>Male</option>
            <option value="female" style={{ background: optionBg, color: text }}>Female</option>
            <option value="other"  style={{ background: optionBg, color: text }}>Other</option>
          </select>
        </div>
        <div>
          <label style={lbl}>DOB</label>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} className="pr-inp" style={inp}/>
        </div>
        <div>
          <label style={lbl}>Married Status</label>
          <select name="married_status" value={form.married_status} onChange={handleChange} className="pr-inp" style={selectInput}>
            <option value="single"  style={{ background: optionBg, color: text }}>Single</option>
            <option value="married" style={{ background: optionBg, color: text }}>Married</option>
            <option value="other"   style={{ background: optionBg, color: text }}>Other</option>
          </select>
        </div>
      </div>

      {/* Anniversary — only if married */}
      {form.married_status === 'married' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
          <div>
            <label style={lbl}>Anniversary Date</label>
            <input type="date" name="anniversary_date" value={form.anniversary_date} onChange={handleChange} className="pr-inp" style={inp}/>
          </div>
        </div>
      )}

      <p style={secLabel('#fbcfe8')}>📍 Address</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Door No *</label><input name="door_no" value={form.door_no} onChange={handleChange} required className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>Town *</label><input name="town_name" value={form.town_name} onChange={handleChange} required className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>City *</label><input name="city_name" value={form.city_name} onChange={handleChange} required className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>District *</label><input name="district" value={form.district} onChange={handleChange} required className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>State *</label><input name="state" value={form.state} onChange={handleChange} required className="pr-inp" style={inp}/></div>
      </div>

      <p style={secLabel('#fbcfe8')}>🪪 Identity</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Aadhaar No *</label><input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} className="pr-inp" style={inp}/></div>
        <div><label style={lbl}>PAN No *</label><input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} className="pr-inp" style={inp}/></div>
      </div>

      <p style={secLabel('#fbcfe8')}>💼 Occupation</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Occupation *</label>
          <select name="occupation" value={form.occupation} onChange={handleChange} required className="pr-inp" style={{ ...inp, cursor:'pointer' }}>
            <option value="" style={{ background:'#1a1f26' }}>Select</option>
            {OCCUPATIONS.map(o => <option key={o} value={o} style={{ background:'#1a1f26' }}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Detail</label>
          <input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} className="pr-inp" style={inp}/>
        </div>
        <div><label style={lbl}>Annual Salary *</label>
          <input name="annual_salary" value={form.annual_salary} onChange={handleChange} required className="pr-inp" style={inp}/>
        </div>
      </div>

<p style={secLabel('#fbcfe8')}>🌟 Promotor Info</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
        <div><label style={lbl}>Promotor ID *</label>
          <select
            value={form.assigned_promotor_id || ''}
            onChange={handlePromotorChange}
            className="pr-inp"
            style={{ ...inp, cursor:'pointer' }}
          >
            <option value="" style={{ background:'#1a1f26' }}>Select Promotor ID</option>
            {allPromotors.map((p, idx) => (
              <option key={p.promotor_id || p.id || idx} value={p.id} style={{ background:'#1a1f26' }}>
                {p.promotor_id}
              </option>
            ))}
          </select>
        </div>
        <div><label style={lbl}>Promotor Name</label>
          <input value={selectedPromotor?.first_name || ''} readOnly placeholder="Auto fetch" style={{ ...inp, opacity:0.5, cursor:'not-allowed' }}/>
        </div>
        <div><label style={lbl}>Promotor Contact</label>
          <input value={selectedPromotor?.mobile_number || ''} readOnly placeholder="Auto fetch" style={{ ...inp, opacity:0.5, cursor:'not-allowed' }}/>
        </div>
      </div>

      <div style={{ display:'flex', gap:'12px', marginTop:'6px' }}>
        <button type="submit" className="pr-grad-btn"
          style={{ padding:'12px 28px', background:'linear-gradient(90deg,#f472b6,#a78bfa)', border:'none', borderRadius:'12px', fontWeight:800, color:'#3b0024', fontSize:'14px', cursor:'pointer' }}>
          Create Customer
        </button>
        <button type="button" onClick={() => setShowForm(false)}
          style={{ padding:'12px 24px', background: inpBg, border:`1px solid ${border}`, borderRadius:'12px', color: subtext, fontSize:'14px', cursor:'pointer' }}>
          Cancel
        </button>
      </div>

    </form>
  </div>
)}

        {/* ── CUSTOMERS TABLE ── */}
        <div style={card}>
          <p style={secHead('#fbcfe8')}>My Customers ({customers.length})</p>
          {customers.length === 0 ? (
            <p style={{ color: subtext, textAlign:'center', padding:'60px 0', fontSize:'15px' }}>No customers yet!</p>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'15px' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${inpBorder}` }}>
                    {['Customer ID','First Name','Last Name','Email','Mobile','City','Created'].map(h => (
                      <th key={h} style={{ padding:'14px 16px', textAlign:'left', color: subtext, fontSize:'13px', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i} className="pr-tr" style={{ borderBottom:`1px solid ${border}` }}>
                      <td style={{ padding:'14px 16px', color:'#f472b6', fontFamily:'monospace', fontSize:'13px' }}>{c.customer_id}</td>
                      <td style={{ padding:'14px 16px', color: text }}>{c.first_name}</td>
                      <td style={{ padding:'14px 16px', color: text }}>{c.last_name}</td>
                      <td style={{ padding:'14px 16px', color: subtext }}>{c.email}</td>
                      <td style={{ padding:'14px 16px', color: subtext }}>{c.mobile_number}</td>
                      <td style={{ padding:'14px 16px', color: subtext }}>{c.city_name}</td>
                      <td style={{ padding:'14px 16px', color: subtext, whiteSpace:'nowrap' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin.png'

const COLORS = ['#0C4044', '#CCA881', '#BDCFCE', '#BB8958', '#7A8987', '#9F6130']

const ROLE_CFG_ADMIN = {
  dealer: { color: '#0C4044', label: 'ðŸª DEALER', idKey: 'dealer_id' },
  sub_dealer: { color: '#BB8958', label: 'ðŸ”— SUB DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#CCA881', label: 'ðŸŒŸ PROMOTOR', idKey: 'promotor_id' },
  customer: { color: '#C92035', label: 'ðŸ‘¤ CUSTOMER', idKey: 'customer_id' },
}

const ROLE_LABELS_ADMIN = {
  admin: { emoji: 'ðŸ›¡ï¸', label: 'ADMIN', color: '#0C4044', idKey: 'admin_id' },
  dealer: { emoji: 'ðŸª', label: 'DEALER', color: '#0C4044', idKey: 'dealer_id' },
  sub_dealer: { emoji: 'ðŸ”—', label: 'SUB DEALER', color: '#BB8958', idKey: 'sub_dealer_id' },
  promotor: { emoji: 'ðŸŒŸ', label: 'PROMOTOR', color: '#CCA881', idKey: 'promotor_id' },
  customer: { emoji: 'ðŸ‘¤', label: 'CUSTOMER', color: '#C92035', idKey: 'customer_id' },
}

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
  occupation: '', occupation_detail: '', annual_salary: ''
}

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i, size: Math.random() * 60 + 10, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.2 + 0.05,
}))

const DEALER_COLORS = ['#0C4044', '#BDCFCE', '#CCA881', '#C92035']

// â”€â”€â”€ ADMIN CHAIN POPUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _aChainPopupEl = null
let _aChainHideTimer = null

function hexToRgbA(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function removeAdminChainPopup() {
  document.querySelectorAll('#admin-chain-popup').forEach(el => el.remove())
  _aChainPopupEl = null
}

function scheduleHideAdminChainPopup() {
  clearTimeout(_aChainHideTimer)
  _aChainHideTimer = setTimeout(() => removeAdminChainPopup(), 200)
}

function showAdminChainPopup(anchorEl, ancestors, current, dark, text, subtext, superAdminEmail, adminData = null) {
  clearTimeout(_aChainHideTimer)
  removeAdminChainPopup()

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...(adminData ? [{ type: 'admin', data: adminData }] : []),
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'admin-chain-popup'

  // Inject keyframes once
  if (!document.getElementById('acp-styles')) {
    const s = document.createElement('style')
    s.id = 'acp-styles'
    s.textContent = `
      @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(12,64,68,0)}50%{box-shadow:0 0 20px rgba(12,64,68,0.22)}}
      @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes fadeSlideIn{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      #admin-chain-popup::-webkit-scrollbar{width:6px}
      #admin-chain-popup::-webkit-scrollbar-track{background:rgba(253,253,252,0.03);border-radius:10px;margin:4px 0}
      #admin-chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0C4044,#BDCFCE);border-radius:10px;box-shadow:0 0 6px rgba(12,64,68,0.4)}
      #admin-chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#073B3F,#D1DFDE)}
      #admin-chain-popup{scrollbar-color:rgba(12,64,68,0.5) rgba(253,253,252,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(12,64,68,0.22)' : 'rgba(12,64,68,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(17,24,23,0.85), 0 0 0 1px rgba(12,64,68,0.06), inset 0 1px 0 rgba(253,253,252,0.04)'
      : '0 32px 80px rgba(17,24,23,0.15), 0 0 0 1px rgba(12,64,68,0.05)'};
    animation:acpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:260px;
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

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(12,64,68,0.65),rgba(12,64,68,0.1));"></div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid rgba(12,64,68,0.5);"></div>
        </div>
      </div>` : ''

    if (isSuperAdmin) {
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:${isDark ? 'linear-gradient(135deg,rgba(204,168,129,0.09),rgba(187,137,88,0.04))' : 'linear-gradient(135deg,rgba(204,168,129,0.14),rgba(187,137,88,0.06))'};
          border:1px solid rgba(204,168,129,0.28);
          position:relative;overflow:hidden;
        ">
          <div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,rgba(204,168,129,0.14),transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#CCA881,#BB8958);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;box-shadow:0 4px 12px rgba(204,168,129,0.35);">ðŸ›¡ï¸</div>
            <div>
              <div style="font-size:9px;color:#CCA881;font-weight:800;letter-spacing:1.8px;">SUPER ADMIN</div>
              <div style="font-size:8px;color:rgba(204,168,129,0.45);margin-top:2px;letter-spacing:0.5px;">ROOT â€¢ FULL ACCESS</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#0C4044;animation:acpPulse 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(12,64,68,0.9);"></div>
              <span style="font-size:9px;color:#0C4044;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:12px;color:${isDark ? '#111817' : '#7A8987'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">${item.data.email || 'â€”'}</div>
        </div>
      `
    }

    const cfg = ROLE_LABELS_ADMIN[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || 'â€”'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || 'â€”'
    const phone = d.mobile_number || 'â€”'
    const city = d.city_name || ''
    const rc = hexToRgbA(cfg.color)

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
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">â— CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#F3F3F0' : '#111817'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== 'â€”' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">ðŸ“ž</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">ðŸ“</div>
            <span style="font-size:12px;color:${isDark ? '#7A8987' : '#7A8987'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(12,64,68,0.1)' : 'rgba(12,64,68,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#0C4044,#BDCFCE);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 4px 10px rgba(12,64,68,0.4);">ðŸ”—</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#0C4044' : '#0C4044'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#7A8987' : '#7A8987'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(12,64,68,0.15),rgba(189,207,206,0.12),rgba(12,64,68,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(12,64,68,0.22);
        color:${isDark ? '#073B3F' : '#0C4044'};
        letter-spacing:1px;">â— LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(253,253,252,0.04)' : 'rgba(17,24,23,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#7A8987' : '#111817'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network â€¢ Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = 340
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_aChainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideAdminChainPopup())
  _aChainPopupEl = el
}

function printAdminPersonCard(node, role, color, ancestors, superAdminEmail) {
  const ROLE_PRINT = {
    admin: { label: 'ADMIN', emoji: 'ðŸ›¡ï¸', idKey: 'admin_id' },
    dealer: { label: 'DEALER', emoji: 'ðŸª', idKey: 'dealer_id' },
    sub_dealer: { label: 'SUB DEALER', emoji: 'ðŸ”—', idKey: 'sub_dealer_id' },
    promotor: { label: 'PROMOTOR', emoji: 'ðŸŒŸ', idKey: 'promotor_id' },
    customer: { label: 'CUSTOMER', emoji: 'ðŸ‘¤', idKey: 'customer_id' },
  }

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: role, data: node },
  ]

  const arrowDiv = `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #7A8987;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#7A8987,rgba(122,137,135,0.2));"></div></div></div>`

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const arrow = idx < chain.length - 1 ? arrowDiv : ''

    if (item.type === 'super_admin') {
      return `
        <div class="chain-item">
          <div class="chain-role">ðŸ›¡ï¸ SUPER ADMIN</div>
          <div class="chain-email">${item.data.email || 'â€”'}</div>
        </div>${arrow}`
    }

    const r = ROLE_PRINT[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || 'â€”'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || 'â€”'
    const phone = d.mobile_number || 'â€”'
    const city = d.city_name || 'â€”'

    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${r.emoji} ${r.label}</div>
        <div class="chain-id">${idVal}</div>
        <div class="chain-name">${name}</div>
        <div class="chain-info">ðŸ“ž ${phone}</div>
        <div class="chain-info">ðŸ“ ${city}</div>
      </div>${arrow}`
  }).join('')

  const roleLabel = ROLE_PRINT[role]?.label || role.toUpperCase()
  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || 'â€”'

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html><html><head>
    <title>${roleLabel} â€” ${currentName}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Inter',system-ui,sans-serif;background:#FDFDFC;padding:40px;display:flex;justify-content:center;}
      .wrapper{max-width:480px;width:100%;}
      .header{text-align:center;margin-bottom:28px;}
      .header h1{font-size:20px;font-weight:800;color:#FDFDFC;}
      .header p{font-size:12px;color:#7A8987;margin-top:4px;}
      .chain-item{background:#FDFDFC;border:1.5px solid #E7EDEC;border-radius:12px;padding:14px 18px;}
      .chain-item.current{border-color:${color};background:${color}11;box-shadow:0 4px 16px ${color}22;}
      .chain-role{font-size:10px;font-weight:800;color:#7A8987;letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;}
      .chain-item.current .chain-role{color:${color};}
      .chain-id{font-family:monospace;font-size:11px;color:${color};margin-bottom:4px;}
      .chain-name{font-size:16px;font-weight:800;color:#FDFDFC;margin-bottom:6px;}
      .chain-email{font-size:12px;color:#7A8987;}
      .chain-info{font-size:12px;color:#7A8987;margin-top:3px;}
      .chain-arrow{display:flex;justify-content:center;padding:4px 0;}
      .footer{text-align:center;font-size:10px;color:#7A8987;margin-top:24px;letter-spacing:0.5px;}
      @media print{body{background:white;padding:20px;}.chain-item{box-shadow:none;}}
    </style>
    </head><body>
    <div class="wrapper">
      <div class="header">
        <h1>BitByte â€” ${roleLabel} Profile</h1>
        <p>Hierarchy Chain Report</p>
      </div>
      ${chainHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

// â”€â”€â”€ ADMIN TREE NODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminTreeNode({ node, role, depth = 0, dark, text, subtext, colorIdx = 0, ancestors = [], superAdminEmail = '', adminData = null }) {
  const [expanded, setExpanded] = useState(depth < 2)

  const cfg = ROLE_CFG_ADMIN[role]
  const c = COLORS[colorIdx % COLORS.length]

  const childRole = {
    dealer: 'sub_dealer',
    sub_dealer: 'promotor',
    promotor: 'customer',
  }[role]

  const children = {
    dealer: node.sub_dealers,
    sub_dealer: node.promotors,
    promotor: node.customers,
  }[role] || []

  const hasChildren = children.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          background: dark ? `rgba(${hexToRgbA(c)},0.06)` : `rgba(${hexToRgbA(c)},0.08)`,
          border: `1px solid rgba(${hexToRgbA(c)},0.35)`,
          borderRadius: '12px', padding: '12px 16px',
          minWidth: '160px', maxWidth: '200px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.3s ease', position: 'relative',
        }}
        onMouseEnter={e => {
          clearTimeout(_aChainHideTimer)
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgbA(c)},0.25)`
          e.currentTarget.style.borderColor = `rgba(${hexToRgbA(c)},0.7)`
          showAdminChainPopup(e.currentTarget, ancestors, { node, role }, dark, text, subtext, superAdminEmail, adminData)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(${hexToRgbA(c)},0.35)`
          _aChainHideTimer = setTimeout(() => removeAdminChainPopup(), 300)
        }}
      >
        <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', marginBottom: '8px', background: `rgba(${hexToRgbA(c)},0.15)`, color: c, border: `1px solid rgba(${hexToRgbA(c)},0.35)` }}>
          {cfg.label}
        </div>
        <div style={{ color: c, fontFamily: 'monospace', fontSize: '10px', marginBottom: '4px', wordBreak: 'break-all' }}>
          {node[cfg.idKey]}
        </div>
        <div style={{ color: text, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
          {node.first_name || node.dealer_name || node.promotor_name || 'â€”'} {node.last_name || ''}
        </div>
        <div style={{ color: subtext, fontSize: '11px', marginBottom: '2px' }}>ðŸ“ž {node.mobile_number}</div>
        {node.city_name && <div style={{ color: subtext, fontSize: '11px' }}>ðŸ“ {node.city_name}</div>}

        <div style={{ marginTop: '8px', width: '100%', height: 2, borderRadius: 2, background: `linear-gradient(90deg,rgba(${hexToRgbA(c)},0.2),${c})` }} />

        <button
          onClick={e => { e.stopPropagation(); printAdminPersonCard(node, role, c, adminData ? [{ type: 'admin', data: adminData }, ...ancestors] : ancestors, superAdminEmail) }}
          style={{ marginTop: '8px', width: '100%', padding: '3px 0', fontSize: '9px', fontWeight: 700, background: `rgba(${hexToRgbA(c)},0.1)`, border: `1px solid rgba(${hexToRgbA(c)},0.35)`, borderRadius: '6px', color: c, cursor: 'pointer', letterSpacing: '0.8px', transition: 'all 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = `rgba(${hexToRgbA(c)},0.25)`}
          onMouseLeave={e => e.currentTarget.style.background = `rgba(${hexToRgbA(c)},0.1)`}
        >ðŸ–¨ï¸ PRINT</button>

        {hasChildren && (
          <div style={{ position: 'absolute', top: '8px', right: '10px', color: c, fontSize: '10px', fontWeight: 700, transition: 'transform 0.3s ease', transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>â–²</div>
        )}
        {hasChildren && (
          <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', background: c, color: '#111817', fontSize: '9px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
            {children.length} {childRole?.replace('_', ' ')}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ width: 2, height: 28, background: `linear-gradient(180deg,${c},rgba(${hexToRgbA(c)},0.3))`, marginTop: '10px' }} />
          <div style={{ position: 'relative', width: '100%' }}>
            {children.length > 1 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `rgba(${hexToRgbA(c)},0.45)` }} />
            )}
            <div style={{ display: 'flex', justifyContent: children.length === 1 ? 'center' : 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              {children.map((child, ci) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: children.length === 1 ? '0 0 auto' : 1 }}>
                  <div style={{ width: 2, height: 20, background: `rgba(${hexToRgbA(c)},0.5)` }} />
                  <AdminTreeNode
                    node={child}
                    role={childRole}
                    depth={depth + 1}
                    dark={dark}
                    text={text}
                    subtext={subtext}
                    colorIdx={colorIdx + ci + 1}
                    ancestors={[...ancestors, { node, role }]}
                    superAdminEmail={superAdminEmail}
                    adminData={adminData}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

let _dpopupEl = null
let _dhideTimer = null

function removeDealerPopup() {
  document.querySelectorAll('#dealer-popup').forEach(el => el.remove())
  _dpopupEl = null
}

function scheduleDealerHide(setActiveDealer) {
  clearTimeout(_dhideTimer)
  _dhideTimer = setTimeout(() => {
    removeDealerPopup()
    setActiveDealer(null)
  }, 120)
}

function createDealerPopup(d, i, anchorEl, dark, subtext, text, currentAdmin) {
  removeDealerPopup()
  const c = DEALER_COLORS[i % DEALER_COLORS.length]
  const popupBg = dark ? 'linear-gradient(160deg,#091525,#E7EDEC)' : 'linear-gradient(160deg,#FDFDFC,#F3F3F0)'
  const popupBorder = dark ? 'rgba(12,64,68,0.25)' : 'rgba(12,64,68,0.25)'
  const saBoxBg = dark ? 'rgba(204,168,129,0.05)' : 'rgba(255,193,7,0.08)'
  const saBoxBorder = dark ? 'rgba(204,168,129,0.22)' : 'rgba(255,193,7,0.35)'
  const adminBoxBg = dark ? 'rgba(12,64,68,0.05)' : 'rgba(204,168,129,0.05)'
  const adminBoxBd = dark ? 'rgba(12,64,68,0.2)' : 'rgba(204,168,129,0.2)'
  const dealerBoxBg = dark ? 'rgba(189,207,206,0.04)' : 'rgba(12,64,68,0.05)'
  const dealerBoxBd = dark ? 'rgba(189,207,206,0.14)' : 'rgba(12,64,68,0.2)'
  const accentColor = dark ? '#0C4044' : '#0C4044'

  const el = document.createElement('div')   // âœ… à®‡à®¤à¯ à®®à¯à®¤à®²à¯à®² à®µà®°à®£à¯à®®à¯
  el.id = 'dealer-popup'
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${popupBg}; border:1px solid ${popupBorder};
    border-radius:14px; padding:14px;
    box-shadow:0 16px 48px rgba(17,24,23,0.45);
    animation:dealerPopupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
    min-width:210px; max-width:250px;
    display:flex; flex-direction:column; align-items:stretch;
  `

  el.innerHTML = `
    <div style="font-size:9px;color:${accentColor};font-weight:700;letter-spacing:1.3px;margin-bottom:11px;padding-bottom:9px;border-bottom:1px solid ${popupBorder};display:flex;align-items:center;gap:6px;">
      <span style="width:5px;height:5px;border-radius:50%;background:${accentColor};display:inline-block;"></span>
      CREATED BY
    </div>

    <!-- Super Admin -->
    <div style="border-radius:9px;padding:10px;margin-bottom:6px;background:${saBoxBg};border:1px solid ${saBoxBorder};">
<div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(204,168,129,0.12);color:#CCA881;border:1px solid rgba(204,168,129,0.3);margin-bottom:6px;">ðŸ›¡ï¸ SUPER ADMIN</div>    
<div style="font-size:11px;color:${subtext};word-break:break-all;">${localStorage.getItem('superAdminEmail') || localStorage.getItem('email') || 'â€”'}</div>
      <div style="margin-top:5px;font-size:9px;padding:2px 7px;background:rgba(204,168,129,0.1);border:1px solid rgba(204,168,129,0.25);border-radius:20px;color:#CCA881;display:inline-block;">â— ONLINE</div>
    </div>

    <!-- Arrow SA â†’ Admin -->
    <div style="display:flex;justify-content:center;padding:3px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #CCA881;"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,#CCA881,#CCA88144);"></div>
      </div>
    </div>

    <!-- Admin -->
    <div style="border-radius:9px;padding:10px;margin-bottom:6px;background:${adminBoxBg};border:1px solid ${adminBoxBd};">
<div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(12,64,68,0.12);color:#0C4044;border:1px solid rgba(12,64,68,0.3);margin-bottom:6px;">ðŸ›¡ï¸ ADMIN</div>  
    <div style="font-size:10px;color:#0C4044;font-family:monospace;margin-bottom:3px;">${currentAdmin?.admin_id || 'â€”'}</div>
      <div style="font-size:13px;font-weight:700;color:${text};margin-bottom:5px;">${currentAdmin?.first_name || currentAdmin?.admin_name || 'â€”'}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:2px;">ðŸ“ž ${currentAdmin?.mobile_number || currentAdmin?.admin_contact_no || 'â€”'}</div>
      <div style="font-size:11px;color:${subtext};">ðŸ“ ${currentAdmin?.city_name || 'â€”'}</div>
    </div>

    <!-- Arrow Admin â†’ Dealer -->
    <div style="display:flex;justify-content:center;padding:3px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${accentColor};"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,${accentColor},${accentColor}44);"></div>
      </div>
    </div>

    <!-- Dealer -->
    <div style="background:${dealerBoxBg};border:1px solid ${dealerBoxBd};border-radius:10px;padding:10px;">
      <div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(189,207,206,0.12);color:#BDCFCE;border:1px solid rgba(189,207,206,0.25);margin-bottom:6px;">DEALER</div>
      <div style="font-size:10px;color:${c};font-family:monospace;margin-bottom:3px;">${d.dealer_id}</div>
      <div style="font-size:14px;font-weight:700;color:${text};margin-bottom:6px;">${d.first_name || ''}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:2px;">ðŸ“ž ${d.mobile_number}</div>
      <div style="font-size:11px;color:${subtext};">ðŸ“ ${d.city_name}</div>
    </div>
  `
  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = el.offsetWidth || 250
  const popH = el.offsetHeight || 320
  let left = rect.right + 14
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 10) left = rect.left - popW - 14
  if (top < 8) top = 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - popH - 8
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_dhideTimer))
  el.addEventListener('mouseleave', () => scheduleDealerHide(setActiveDealer))
  _dpopupEl = el
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)
  const [dealers, setDealers] = useState([])
  const [admins, setAdmins] = useState([])
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [activeDealer, setActiveDealer] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [form, setForm] = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [updateForm, setUpdateForm] = useState({})
  const [updateMessage, setUpdateMessage] = useState('')
  const [proofDocument, setProofDocument] = useState(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  // â”€â”€ ADD after existing useState declarations â”€â”€
  const [myAdminId, setMyAdminId] = useState(null)
  const [metalPrices, setMetalPrices] = useState({ gold24k: null, gold22k: null, silver: null })
  const [metalLoading, setMetalLoading] = useState(false)
  const [usdToInr, setUsdToInr] = useState(null)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [replyAnn, setReplyAnn] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [repliedIds, setRepliedIds] = useState(new Set())
  const [annReplies, setAnnReplies] = useState({})
  const [replyPopupAnnId, setReplyPopupAnnId] = useState(null)
  const [replyPopupPos, setReplyPopupPos] = useState({ top: 0, left: 0 })
  const wishTimerRef = useRef(null)

  const [showRequestCoin, setShowRequestCoin] = useState(false)
const [coinRequests, setCoinRequests] = useState([])
const [coinReqLoading, setCoinReqLoading] = useState(false)
const [approvingReqId, setApprovingReqId] = useState(null)
const [approvingAll, setApprovingAll] = useState(false)
const [coinReqMsg, setCoinReqMsg] = useState('')
const [coinReqMsgType, setCoinReqMsgType] = useState('success')
const [rejectingReqId, setRejectingReqId] = useState(null)
const [rejectReason, setRejectReason] = useState('')
const [rejectSubmitting, setRejectSubmitting] = useState(false)
const [showBuyCoin, setShowBuyCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')
const [showStoredCoin, setShowStoredCoin] = useState(false)
const [coinStock, setCoinStock] = useState([])
const [coinStockLoading, setCoinStockLoading] = useState(false)






  const canvasRef = useRef(null)

  // Luxiva customer theme palette
  const bg = dark ? '#073B3F' : '#FDFDFC'
  const text = dark ? '#FDFDFC' : '#111817'
  const subtext = dark ? '#D1DFDE' : '#7A8987'
  const accent = dark ? '#CCA881' : '#0C4044'
  const border = dark ? 'rgba(209,223,222,0.22)' : 'rgba(189,207,206,0.78)'
  const glass = dark ? 'rgba(7,59,63,0.9)' : 'rgba(253,253,252,0.92)'
  const cardBg = dark ? 'rgba(12,64,68,0.88)' : 'rgba(253,253,252,0.96)'
  const cardBorder = dark ? '1px solid rgba(209,223,222,0.22)' : '1px solid rgba(189,207,206,0.72)'
  const inpBg = dark ? 'rgba(253,253,252,0.08)' : '#FDFDFC'
  const inpBorder = dark ? 'rgba(209,223,222,0.24)' : '#BDCFCE'
  const optionBg = dark ? '#073B3F' : '#F3F3F0'
  const selectInput = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId, particlesArray = []
    const mouse = { x: null, y: null, radius: 150 }
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const handleMouseMove = (e) => { mouse.x = e.x; mouse.y = e.y }
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    handleResize()
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
      }
      
      // â† update() ends here

      draw() {
        ctx.fillStyle = dark ? 'rgba(189, 207, 206, 0.9)' : 'rgba(12, 64, 68, 0.8)'
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
    function init() { particlesArray = []; for (let i = 0; i < 60; i++)particlesArray.push(new Particle()) }
    function connect() {
      for (let a = 0; a < particlesArray.length; a++) for (let b = a; b < particlesArray.length; b++) {
        let dx = particlesArray[a].x - particlesArray[b].x, dy = particlesArray[a].y - particlesArray[b].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 150) { ctx.strokeStyle = dark ? `rgba(189,207,206,${1 - d / 150})` : `rgba(12,64,68,${0.5 - d / 300})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke() }
      }
    }
    function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particlesArray.forEach(p => { p.update(); p.draw() }); connect(); animationFrameId = requestAnimationFrame(animate) }
    init(); animate()

 init(); animate()

    // â”€â”€ PLANETS & COMETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        x2.strokeStyle = dark ? 'rgba(253,253,252,0.04)' : 'rgba(17,24,23,0.04)'
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
    // â”€â”€ END PLANETS & COMETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize2)
      cancelAnimationFrame(animationFrameId)
      cancelAnimationFrame(planetAnimId)
      canvas2.remove()
    }
  }, [dark])

  const fetchDealers = async () => {
    try {
      const [hierarchyRes, dealerRes] = await Promise.allSettled([
        api.get('/hierarchy/full/'),
        api.get('/dealers/'),
      ])

      const hierarchyData = hierarchyRes.status === 'fulfilled' ? hierarchyRes.value.data : null
      const flatDealers = dealerRes.status === 'fulfilled' ? dealerRes.value.data : []

      if (hierarchyData?.super_admin_email) {
        localStorage.setItem('superAdminEmail', hierarchyData.super_admin_email)
      }

      let dealerList = []
      let myAdminData = null

      if (hierarchyData?.admins?.length > 0) {
        myAdminData = hierarchyData.admins[0]

        // Build id map from hierarchy dealers
        const hierarchyDealerMap = {}
          ; (myAdminData.dealers || []).forEach(d => {
            hierarchyDealerMap[String(d.id)] = d
          })

        // Merge flat dealers (for table) with hierarchy nested data (for tree)
        dealerList = flatDealers.map(d => {
          const nested = hierarchyDealerMap[String(d.id)] || {}
          return {
            ...d,
            sub_dealers: (nested.sub_dealers || []).map(sd => ({
              ...sd,
              promotors: (sd.promotors || []).map(p => ({
                ...p,
                customers: p.customers || []
              }))
            })),
            _admin: myAdminData ? {
              id: myAdminData.id,
              admin_id: myAdminData.admin_id,
              first_name: myAdminData.first_name,
              last_name: myAdminData.last_name,
              mobile_number: myAdminData.mobile_number,
              city_name: myAdminData.city_name,
            } : null
          }
        })
      } else {
        // Fallback â€” flat dealers only
        dealerList = flatDealers
      }

      setDealers(dealerList)

      try {
        const adminRes = await api.get('/admins/list/')
        setAdmins(adminRes.data)
      } catch { }

    } catch (err) {
      console.error('dealers error:', err)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await api.get('/dashboard/')
      setProfileData(res.data)
    } catch (err) {
      console.error('profile error:', err)
    }
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
    ['admin_id', 'Admin ID'],
    ['admin_name', 'Admin Name'],
    ['admin_contact_no', 'Contact No'],
  ]

  const openProfileEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => {
      next[key] = profileData?.[key] || ''
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

      setMsg('âœ… Profile update request submitted successfully!')
      setMsgType('success')
      setShowProfileEdit(false)
      setUpdateMessage('')
      setProofDocument(null)
    } catch (err) {
      setMsg('âŒ Error: ' + JSON.stringify(err.response?.data || err.message))
      setMsgType('error')
    }
  }

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admins/list/')
      setAdmins(res.data)
      // â”€â”€ ADD THIS LINE â”€â”€
      const me = res.data.find(a => a.email === localStorage.getItem('email'))
      if (me) setMyAdminId(me.admin_id)
      // â”€â”€ END ADD â”€â”€
    } catch (err) { console.error('admins error:', err.response?.status) }
  }





  // â”€â”€ ADD before return() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function extractIdsFromTitle(title) {
    return title.match(/BB[A-Z]+\d+/g) || []
  }

  function isCurrentUserMentioned(title) {
    if (!myAdminId) return false
    return extractIdsFromTitle(title).includes(myAdminId)
  }

  async function fetchReplies(annId) {
    try {
      const res = await api.get(`/announcements/${annId}/replies/`)
      setAnnReplies(prev => ({ ...prev, [annId]: res.data }))
    } catch { }
  }

  async function submitReply() {
    if (!replyText.trim()) return
    setReplyLoading(true)
    try {
      await api.post(`/announcements/${replyAnn.id}/replies/`, { message: replyText })
      setRepliedIds(prev => new Set([...prev, replyAnn.id]))
      setReplyMsg('âœ… Wish sent!')
      setReplyText('')
    } catch (err) {
      if (err.response?.data?.error === 'Already replied') {
        setRepliedIds(prev => new Set([...prev, replyAnn.id]))
        setReplyMsg('âš ï¸ Already sent!')
      } else {
        setReplyMsg('âŒ Failed.')
      }
    }
    setReplyLoading(false)
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

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAnnouncements(sorted)
      const lastSeen = parseInt(localStorage.getItem('adminAnnouncementSeen') || '0')
      const unread = sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length
      setUnreadCount(unread)
    } catch { }
  }

useEffect(() => {
  fetchDealers(); fetchAdmins(); fetchAnnouncements(); fetchProfile()
  fetchMetalPrices()
  const interval = setInterval(() => {
    fetchAnnouncements()
    fetchMetalPrices()
  }, 30000)
  return () => clearInterval(interval)
}, [])

  const handleChange = e => {
    const { name, value } = e.target

    if (name === 'married_status' && value !== 'married') {
      setForm({ ...form, married_status: value, anniversary_date: '' })
      return
    }

    setForm({ ...form, [name]: value })
  }
  const handleAdminChange = (e) => {
    const id = parseInt(e.target.value)
    const admin = admins.find(a => a.id === id)
    setSelectedAdmin(admin || null)
    setForm({ ...form, assigned_admin_id: id })
  }
const handleSubmit = async e => {
  e.preventDefault()

  // Married na anniversary compulsory
  if (form.married_status === 'married' && !form.anniversary_date) {
    setMsg('âŒ Please enter Anniversary Date!'); setMsgType('error')
    return
  }

  if (form.password !== confirmPassword) {
    setPasswordError('âŒ Passwords do not match')
    return
  }

  try {
    const payload = { ...form }
    if (!payload.dob) delete payload.dob
    if (payload.married_status !== 'married') delete payload.anniversary_date
    await api.post('/dealers/', payload)
    setMsg('âœ… Dealer created successfully!'); setMsgType('success')
    setShowForm(false); fetchDealers(); setForm(emptyForm); setSelectedAdmin(null)
    setConfirmPassword(''); setPasswordError('')
  } catch (err) {
    console.log('ERROR DETAILS:', JSON.stringify(err.response?.data))
    setMsg('âŒ Error: ' + JSON.stringify(err.response?.data)); setMsgType('error')
  }
}
  const card = {
    background: cardBg,
    border: cardBorder,
    borderRadius: '22px',
    padding: '34px 38px',
    marginBottom: '26px',
    boxShadow: dark ? '0 26px 70px rgba(17,24,23,0.18)' : '0 22px 58px rgba(7,59,63,0.08)',
    backdropFilter: 'blur(18px)',
  }
  const secHead = (color = '#0C4044') => ({ color, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 22px', paddingBottom: '15px', borderBottom: cardBorder })
  const secLabel = (color = '#0C4044') => ({ color, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '4px 0 0', paddingBottom: '11px', borderBottom: cardBorder })
  const inp = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', boxShadow: dark ? 'none' : 'inset 0 1px 0 rgba(253,253,252,0.7)' }
  const lbl = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }

  return (
    <div style={{ minHeight: '100vh', background: dark ? bg : 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, transition: 'background 0.8s ease, color 0.4s ease', fontFamily: '"Inter",system-ui,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float-orb{0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}100%{transform:translate(0,0) scale(1)}}
        @keyframes antigravity{0%{transform:translateY(110vh) rotate(0deg);opacity:0}10%{opacity:var(--op)}90%{opacity:var(--op)}100%{transform:translateY(-20vh) rotate(360deg);opacity:0}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .ad-inp:focus,.sa-inp:focus{border-color:#0C4044 !important;box-shadow:0 0 0 4px rgba(12,64,68,0.08) !important}
        .ad-grad-btn{position:relative;overflow:hidden}
        .ad-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(253,253,252,.28),transparent);transform:translateX(-100%)}
        .ad-grad-btn:hover::after{animation:shimmer 1s infinite}
        .ad-tr:hover td{background:rgba(231,237,236,.55)}
        @keyframes dealerPopupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes dPulseGlow{0%,100%{box-shadow:0 0 8px rgba(12,64,68,0.15);}50%{box-shadow:0 0 22px rgba(12,64,68,0.35);}}
@keyframes dDotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
.d-card{background:rgba(253,253,252,0.94);border:1px solid rgba(189,207,206,0.82);border-radius:14px;padding:14px 18px;min-width:140px;cursor:pointer;position:relative;overflow:hidden;transition:background 0.35s ease,border-color 0.35s ease,transform 0.4s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.35s ease;}
.d-card.d-active{background:rgba(231,237,236,0.92);border-color:rgba(12,64,68,0.55);transform:translateY(-6px) scale(1.02);box-shadow:0 14px 34px rgba(7,59,63,0.13);animation:dPulseGlow 2.5s ease-in-out infinite;}
#ad-wish-popup::-webkit-scrollbar{width:5px}
#ad-wish-popup::-webkit-scrollbar-track{background:rgba(12,64,68,0.05);border-radius:10px;margin:4px 0}
#ad-wish-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0C4044,#BDCFCE);border-radius:10px}
#ad-wish-popup{scrollbar-color:rgba(12,64,68,0.5) rgba(12,64,68,0.03)}
@keyframes adWishIn{from{opacity:0;transform:translate(-50%,calc(-100% + 8px)) scale(0.95)}to{opacity:1;transform:translate(-50%,calc(-100% - 10px)) scale(1)}}
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1, opacity: dark ? 0.2 : 0.08 }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(82px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, top: '8%', left: '8%', width: '380px', height: '380px', background: dark ? 'rgba(204,168,129,0.1)' : 'rgba(209,223,222,0.42)' }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(86px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, bottom: '10%', right: '4%', width: '460px', height: '460px', background: dark ? 'rgba(189,207,206,0.08)' : 'rgba(243,232,222,0.56)', animationDelay: '-5s' }} />

      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, bottom: '-100px', width: p.size, height: p.size, borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%', border: `1px solid ${accent}44`, opacity: p.opacity, animation: `antigravity ${p.duration}s ${p.delay}s infinite linear`, '--op': p.opacity, pointerEvents: 'none', zIndex: 0 }} />
      ))}

      {/* Navbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: glass, borderBottom: `1px solid ${border}`, padding: '18px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(18px)', transition: 'background 0.8s ease', boxShadow: dark ? '0 12px 34px rgba(17,24,23,0.14)' : '0 10px 32px rgba(7,59,63,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
          <img
            src={logo}
            alt="BitByte Logo"
            style={{ width: 60, height: 50, borderRadius: '10px', objectFit: 'contain' }}
          />
          <span style={{ color: accent, fontWeight: 900, fontSize: '14px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>ðŸ›¡ï¸ Admin Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          {/* ðŸ“¢ Announcement Bell */}
          <div
            onClick={() => { setShowAnnouncements(true); localStorage.setItem('adminAnnouncementSeen', Date.now().toString()); setUnreadCount(0) }}
            style={{ position: 'relative', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(12,64,68,0.24)', background: 'rgba(231,237,236,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(209,223,222,0.95)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,237,236,0.88)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>ðŸ“¢</span>
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#C92035', color: '#FDFDFC', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(12,64,68,0.5)', border: '1.5px solid #FDFDFC' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>

          {/* ðŸ‘¤ Profile Icon */}
          <div
            onClick={() => { setShowProfile(true); fetchProfile() }}
            style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#E7EDEC,#F3E8DE)', border: '1px solid rgba(12,64,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.25s ease', boxShadow: '0 8px 20px rgba(7,59,63,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(12,64,68,0.3)'; e.currentTarget.style.borderColor = 'rgba(12,64,68,0.9)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 0 rgba(12,64,68,0.3)'; e.currentTarget.style.borderColor = 'rgba(12,64,68,0.5)' }}
            title="View Profile"
          >
            ðŸ›¡ï¸
          </div>

          <div onClick={() => { setShowBuyCoin(true); setCoinCart([]); setCoinBuyMsg('') }}
  style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Buy Coin</span>
</div>

<div onClick={() => navigate('/stored-coins')}
  style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>Stored Coin</span>
</div>

<div onClick={() => navigate('/coin-requests-page')}
  style={{ position: 'relative', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Coin Requests</span>
  {coinRequests.filter(r => r.status === 'pending').length > 0 && (
    <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#fbbf24', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {coinRequests.filter(r => r.status === 'pending').length}
    </div>
  )}
</div>

          {/* â”€â”€ DARK / LIGHT TOGGLE â”€â”€ */}
          <button onClick={() => setDark(!dark)}
            style={{ padding: '10px 18px', borderRadius: '999px', border: `1px solid ${border}`, background: dark ? 'rgba(253,253,252,0.08)' : '#FDFDFC', color: accent, cursor: 'pointer', fontWeight: 800, fontSize: '13px', transition: 'all 0.3s ease' }}>
            {dark ? 'â˜€ï¸ Light' : 'ðŸŒ™ Dark'}
          </button>



          <button onClick={() => { localStorage.clear(); navigate('/login') }}
            style={{ padding: '10px 18px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.22)', color: '#C92035', borderRadius: '999px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '42px 46px 56px', maxWidth: '1500px', margin: '0 auto' }}>
        {msg && (
          <div style={{ background: msgType === 'success' ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${msgType === 'success' ? 'rgba(12,64,68,0.25)' : 'rgba(201,32,53,0.3)'}`, color: msgType === 'success' ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '20px' }}>
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
  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: '20px', padding: '28px 32px', marginBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '22px' }}>âš–ï¸</span>
        <div>
          <div style={{ color: '#0C4044', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Today's Gold & Silver Rates
          </div>
          <div style={{ color: subtext, fontSize: '11px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ðŸ“ Chennai, India</span>
            <span style={{ opacity: 0.4 }}>â€¢</span>
            <span>â‚¹ per gram</span>
            <span style={{ opacity: 0.4 }}>â€¢</span>
            {dbRateDate ? (
              <span style={{ color: '#0C4044', fontSize: '10px', fontWeight: 700 }}>
                ðŸ“… {new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            ) : (
              <span style={{ color: '#C92035', fontSize: '9px', fontWeight: 700 }}>No rate entered yet</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* GOLD 22K */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>ðŸ…</span>
            <span style={{ color: '#CCA881', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>GOLD 22K</span>
            {metalPrices.gold22k && (
              <span style={{ color: 'rgba(204,168,129,0.55)', fontSize: '11px' }}>â‚¹{metalPrices.gold22k.toFixed(2)}/gm</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
            {WEIGHTS.map(w => (
              <div key={w.label}
                style={{ flex: 1, minWidth: 0, background: dark ? 'rgba(204,168,129,0.05)' : 'rgba(204,168,129,0.07)', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '14px', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(204,168,129,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                  <img src={goldCoin} alt="Gold 22K" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(204,168,129,0.4))' }} />
                </div>
                <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, color: '#CCA881', background: 'rgba(204,168,129,0.12)', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '20px', padding: '2px 8px', marginBottom: '6px' }}>
                    {w.label}
                  </div>
                  <div style={{ color: '#CCA881', fontWeight: 900, fontSize: '12px', fontFamily: 'monospace', paddingBottom: '8px' }}>
                    {metalPrices.gold22k != null ? `â‚¹${(w.grams * metalPrices.gold22k).toFixed(2)}` : 'â€”'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOLD 24K */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>ðŸ¥‡</span>
            <span style={{ color: '#CCA881', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>GOLD 24K</span>
            {metalPrices.gold24k && (
              <span style={{ color: 'rgba(204,168,129,0.55)', fontSize: '11px' }}>â‚¹{metalPrices.gold24k.toFixed(2)}/gm</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
            {WEIGHTS.map(w => (
              <div key={w.label}
                style={{ flex: 1, minWidth: 0, background: dark ? 'rgba(204,168,129,0.05)' : 'rgba(204,168,129,0.07)', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '14px', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(204,168,129,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                  <img src={goldCoin} alt="Gold 24K" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(204,168,129,0.5))' }} />
                </div>
                <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, color: '#CCA881', background: 'rgba(204,168,129,0.12)', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '20px', padding: '2px 8px', marginBottom: '6px' }}>
                    {w.label}
                  </div>
                  <div style={{ color: '#CCA881', fontWeight: 900, fontSize: '12px', fontFamily: 'monospace', paddingBottom: '8px' }}>
                    {metalPrices.gold24k != null ? `â‚¹${(w.grams * metalPrices.gold24k).toFixed(2)}` : 'â€”'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SILVER 999 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>ðŸ¥ˆ</span>
            <span style={{ color: '#BDCFCE', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>SILVER 999</span>
            {metalPrices.silver && (
              <span style={{ color: 'rgba(192,192,192,0.55)', fontSize: '11px' }}>â‚¹{metalPrices.silver.toFixed(2)}/gm</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
            {WEIGHTS.map(w => (
              <div key={w.label}
                style={{ flex: 1, minWidth: 0, background: dark ? 'rgba(192,192,192,0.04)' : 'rgba(192,192,192,0.07)', border: '1px solid rgba(192,192,192,0.25)', borderRadius: '14px', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(192,192,192,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                  <img src={silverCoin} alt="Silver 999" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(192,192,192,0.4))' }} />
                </div>
                <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, color: '#BDCFCE', background: 'rgba(192,192,192,0.1)', border: '1px solid rgba(192,192,192,0.25)', borderRadius: '20px', padding: '2px 8px', marginBottom: '6px' }}>
                    {w.label}
                  </div>
                  <div style={{ color: '#BDCFCE', fontWeight: 900, fontSize: '12px', fontFamily: 'monospace', paddingBottom: '8px' }}>
                    {metalPrices.silver != null ? `â‚¹${(w.grams * metalPrices.silver).toFixed(2)}` : 'â€”'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
})()}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '26px', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#BB8958', fontSize: '12px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>Network Operations</div>
            <h2 style={{ fontSize: 'clamp(32px,4vw,56px)', lineHeight: 0.95, fontFamily: 'Georgia, serif', color: accent, fontWeight: 500, margin: 0 }}>Dealer Management</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => navigate('/sales-report')}
              style={{ padding: '12px 24px', background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.22)', borderRadius: '999px', fontWeight: 800, color: '#0C4044', fontSize: '14px', cursor: 'pointer', boxShadow: '0 12px 26px rgba(7,59,63,0.06)' }}>
              Sales Report
            </button>
            <button onClick={() => navigate('/admin-hierarchy')}
              style={{ padding: '12px 24px', background: '#F3F3F0', border: '1px solid rgba(12,64,68,0.22)', borderRadius: '999px', fontWeight: 800, color: '#073B3F', fontSize: '14px', cursor: 'pointer', boxShadow: '0 12px 26px rgba(7,59,63,0.06)' }}>
              Dealer Hierarchy
            </button>
            <button onClick={() => setShowForm(!showForm)} className="ad-grad-btn"
              style={{ padding: '12px 28px', background: '#073B3F', border: 'none', borderRadius: '999px', fontWeight: 900, color: '#FDFDFC', fontSize: '14px', cursor: 'pointer', boxShadow: '0 16px 34px rgba(7,59,63,0.18)' }}>
              {showForm ? 'Cancel' : '+ Create Dealer'}
            </button>
          </div>
        </div>

        {/* DEALER HIERARCHY MODAL */}
        {/* â”€â”€ DEALER HIERARCHY MODAL â”€â”€ */}
        {showHierarchy && (
          <div
            onClick={() => { setShowHierarchy(false); setActiveDealer(null); removeDealerPopup() }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? '#F3F3F0' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.2)', borderRadius: '24px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >

              {/* HEADER - fixed top */}
              <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(12,64,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <span style={{ color: '#073B3F', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>ðŸ¢ Full Dealer Hierarchy</span>
                  {(() => {
                    const totalSubDealers = dealers.reduce((a, d) => a + (d.sub_dealers?.length || 0), 0)
                    const totalPromotors = dealers.reduce((a, d) => a + (d.sub_dealers || []).reduce((b, sd) => b + (sd.promotors?.length || 0), 0), 0)
                    const totalCustomers = dealers.reduce((a, d) => a + (d.sub_dealers || []).reduce((b, sd) => b + (sd.promotors || []).reduce((c, p) => c + (p.customers?.length || 0), 0), 0), 0)
                    return (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Dealers', count: dealers.length, color: '#0C4044' },
                          { label: 'Sub Dealers', count: totalSubDealers, color: '#BB8958' },
                          { label: 'Promotors', count: totalPromotors, color: '#CCA881' },
                          { label: 'Customers', count: totalCustomers, color: '#C92035' },
                        ].map(s => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `rgba(${hexToRgbA(s.color)},0.08)`, border: `1px solid rgba(${hexToRgbA(s.color)},0.25)`, borderRadius: '20px', padding: '3px 12px' }}>
                            <span style={{ color: s.color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
                            <span style={{ color: subtext, fontSize: '11px' }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
                <button
                  onClick={() => { setShowHierarchy(false); setActiveDealer(null); removeDealerPopup() }}
                  style={{ background: 'transparent', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                >âœ• Close</button>
              </div>

              {/* SCROLL AREA - à®‡à®¤à¯à®¤à®¾à®©à¯ scroll à®†à®•à¯à®®à¯ */}
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '28px 32px', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,64,68,0.4) rgba(253,253,252,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'max-content', margin: '0 auto' }}>

                  {/* Admin Root Node */}
                  <div style={{ background: 'linear-gradient(135deg,rgba(12,64,68,0.13),rgba(189,207,206,0.08))', border: '1px solid rgba(12,64,68,0.55)', borderRadius: '16px', padding: '16px 48px', fontWeight: 800, fontSize: '16px', color: '#0C4044', animation: 'dPulseGlow 3s ease-in-out infinite', boxShadow: '0 0 24px rgba(12,64,68,0.1)' }}>
                    ðŸ›¡ï¸ Admin
                    <div style={{ fontSize: '11px', color: '#7A8987', fontWeight: 400, marginTop: '4px', textAlign: 'center' }}>
                      {localStorage.getItem('email')}
                    </div>
                  </div>

                  {/* Stem */}
                  <div style={{ width: 2, height: 32, background: 'linear-gradient(180deg,#0C4044,rgba(12,64,68,0.3))' }} />

                  {dealers.length > 0 && (
                    <>
                      <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(12,64,68,0.5),transparent)', width: '80%' }} />
                      <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 0 }}>
                        {dealers.map((dealer, di) => (
                          <div key={dealer.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 2, height: 24, background: 'rgba(12,64,68,0.5)' }} />
                            <AdminTreeNode
                              node={dealer}
                              role="dealer"
                              depth={0}
                              dark={dark}
                              text={text}
                              subtext={subtext}
                              colorIdx={di}
                              ancestors={[]}
                              superAdminEmail={localStorage.getItem('superAdminEmail') || ''}
                              adminData={dealer._admin || null}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {dealers.length === 0 && (
                    <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No dealers yet.</div>
                  )}

                </div>
              </div>

              {/* LEGEND - fixed bottom */}
              <div style={{ flexShrink: 0, padding: '14px 28px', borderTop: '1px solid rgba(12,64,68,0.08)', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                {[
                  { role: 'Admin', color: '#0C4044', emoji: 'ðŸ›¡ï¸' },
                  { role: 'Dealer', color: '#BDCFCE', emoji: 'ðŸª' },
                  { role: 'Sub Dealer', color: '#BB8958', emoji: 'ðŸ”—' },
                  { role: 'Promotor', color: '#CCA881', emoji: 'ðŸŒŸ' },
                  { role: 'Customer', color: '#C92035', emoji: 'ðŸ‘¤' },
                ].map(l => (
                  <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
                    <span style={{ color: subtext, fontSize: '11px' }}>{l.emoji} {l.role}</span>
                  </div>
                ))}
                <div style={{ color: subtext, fontSize: '11px', width: '100%', textAlign: 'center' }}>
                  ðŸ’¡ Click any node to expand/collapse
                </div>
              </div>

            </div>
          </div>
        )}

        {/* â”€â”€ ANNOUNCEMENT VIEW MODAL (Admin) â”€â”€ */}
        {showAnnouncements && (
          <div
            onClick={() => setShowAnnouncements(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.6)', animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >

              {/* Header */}
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(12,64,68,0.25),rgba(189,207,206,0.15))', border: '1px solid rgba(12,64,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>ðŸ“¢</div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>ANNOUNCEMENTS</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{announcements.length} total from Super Admin</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAnnouncements(false)}
                  style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}
                >
                  âœ• Close
                </button>
              </div>

              {/* EXISTING: List â€” REPLACE the .map() section with this: */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,64,68,0.4) transparent' }}>
                {announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '60px 0', fontSize: '15px' }}>No announcements yet.</div>
                ) : (
                  announcements.map((ann, idx) => {
                    const isMentioned = isCurrentUserMentioned(ann.title)
                    const alreadyReplied = repliedIds.has(ann.id)
                    const replies = annReplies[ann.id] || []

                    return (
                      <div key={ann.id} style={{ background: idx === 0 ? (dark ? 'rgba(12,64,68,0.07)' : 'rgba(12,64,68,0.05)') : (dark ? 'rgba(253,253,252,0.02)' : 'rgba(17,24,23,0.02)'), border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.35)' : (dark ? 'rgba(253,253,252,0.06)' : 'rgba(17,24,23,0.08)')}`, borderRadius: '14px', padding: '16px 18px', position: 'relative' }}>

                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {idx === 0 && <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(12,64,68,0.15)', color: '#0C4044', border: '1px solid rgba(12,64,68,0.3)' }}>â— NEW</span>}
                            <span style={{ color: idx === 0 ? '#0C4044' : text, fontWeight: 700, fontSize: '14px' }}>{ann.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: subtext, fontSize: '10px', whiteSpace: 'nowrap' }}>
                              {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* REPLY BUTTON */}
                            <button
                              disabled={alreadyReplied}
                              onClick={() => { setReplyAnn(ann); setReplyMsg(''); setReplyText('') }}
                              style={{
                                padding: '4px 12px', fontSize: '10px', fontWeight: 700,
                                borderRadius: '20px', cursor: alreadyReplied ? 'not-allowed' : 'pointer',
                                background: alreadyReplied ? 'rgba(253,253,252,0.05)' : 'rgba(12,64,68,0.15)',
                                border: `1px solid ${alreadyReplied ? 'rgba(253,253,252,0.1)' : 'rgba(12,64,68,0.4)'}`,
                                color: alreadyReplied ? subtext : '#0C4044',
                                whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                              }}
                            >
                              {alreadyReplied ? 'âœ“ Wished' : 'ðŸ’¬ Reply'}
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        <p style={{ color: dark ? '#111817' : '#7A8987', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{ann.message}</p>

                        {/* HOVER POPUP â€” only if this admin is mentioned */}
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
    <div style={{ fontSize: '10px', color: '#0C4044', padding: '3px 14px', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', cursor: 'default', background: 'rgba(12,64,68,0.06)', fontWeight: 600 }}>
      ðŸŽ‚ You are mentioned Â· {replies.length} wish{replies.length !== 1 ? 'es' : ''} â€” hover to see
    </div>
  </div>
)}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}




        {/* â”€â”€ REPLY MODAL â€” AdminDashboard â”€â”€ */}
        {replyAnn && (
          <div
            onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(17,24,23,0.7)', animation: 'fadeIn 0.25s ease' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>ðŸ’¬ SEND YOUR WISH</div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '4px' }}>Replying to: <span style={{ color: text, fontWeight: 600 }}>{replyAnn.title}</span></div>
                </div>
                <button onClick={() => setReplyAnn(null)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>âœ•</button>
              </div>

              {replyMsg && (
                <div style={{ background: replyMsg.includes('âœ…') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${replyMsg.includes('âœ…') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: replyMsg.includes('âœ…') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                  {replyMsg}
                </div>
              )}

              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Type your wish or message..."
                style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 14px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#0C4044'}
                onBlur={e => e.target.style.borderColor = inpBorder}
              />

              <button
                disabled={replyLoading || !replyText.trim()}
                onClick={submitReply}
                style={{ marginTop: '14px', width: '100%', padding: '13px', background: replyLoading || !replyText.trim() ? 'rgba(12,64,68,0.2)' : 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', color: replyLoading || !replyText.trim() ? '#0C4044' : '#FDFDFC', cursor: replyLoading || !replyText.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
              >
                {replyLoading ? 'â³ Sending...' : 'ðŸ’¬ Send Wish'}
              </button>
            </div>
          </div>
        )}

{/* â”€â”€ WISH HOVER POPUP â€” Admin â”€â”€ */}
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
      background: dark ? 'rgba(7,59,63,0.97)' : 'rgba(248,250,252,0.98)',
      border: '1px solid rgba(12,64,68,0.35)',
      borderRadius: '16px', padding: '16px 18px',
      minWidth: '270px', maxWidth: '340px', maxHeight: '280px',
      overflowY: 'auto', zIndex: 9999,
      boxShadow: '0 20px 60px rgba(17,24,23,0.7)',
      backdropFilter: 'blur(24px)',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(12,64,68,0.5) rgba(12,64,68,0.03)',
      animation: 'adWishIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(12,64,68,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(12,64,68,0.15)', border: '1px solid rgba(12,64,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>ðŸ’¬</div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#0C4044', letterSpacing: '1.5px' }}>WISHES</span>
      </div>
      <div style={{ background: 'rgba(12,64,68,0.15)', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', color: '#0C4044', fontWeight: 800 }}>
        {(annReplies[replyPopupAnnId] || []).length}
      </div>
    </div>
    {(annReplies[replyPopupAnnId] || []).length === 0 ? (
      <div style={{ color: subtext, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No wishes yet</div>
    ) : (annReplies[replyPopupAnnId] || []).map(r => (
      <div key={r.id} style={{ marginBottom: '8px', padding: '10px 12px', background: dark ? 'rgba(12,64,68,0.05)' : 'rgba(12,64,68,0.04)', borderRadius: '10px', border: '1px solid rgba(12,64,68,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0C4044' }}>{r.replied_by_name}</span>
          <span style={{ fontSize: '9px', color: subtext }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: dark ? '#111817' : '#7A8987', lineHeight: '1.5' }}>{r.message}</p>
      </div>
    ))}
    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(12,64,68,0.08)', textAlign: 'center', fontSize: '9px', color: dark ? '#7A8987' : '#111817', letterSpacing: '0.8px', fontWeight: 600 }}>
      BitByte Network â€¢ Wishes
    </div>
  </div>
)} 

        {/* â”€â”€ ADMIN PROFILE MODAL â”€â”€ */}
        {showProfile && (
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)', animation: 'fadeSlideIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >
              {/* Header */}
              <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(12,64,68,0.25),rgba(189,207,206,0.15))', border: '2px solid rgba(12,64,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 16px rgba(12,64,68,0.2)' }}>ðŸ›¡ï¸</div>
                  <div>
                    <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em' }}>MY PROFILE</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{profileData?.admin_id || 'â€”'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                  <button
                    onClick={openProfileEdit}
                    style={{
                      background: 'rgba(12,64,68,0.12)',
                      border: '1px solid rgba(12,64,68,0.35)',
                      color: '#0C4044',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  >
                    âœŽ Edit
                  </button>

                  <button
                    onClick={() => setShowProfile(false)}
                    style={{
                      background: 'rgba(201,32,53,0.1)',
                      border: '1px solid rgba(201,32,53,0.3)',
                      color: '#C92035',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    âœ• Close
                  </button>

                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,64,68,0.4) transparent' }}>

                {!profileData ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '60px 0' }}>Loading...</div>
                ) : (
                  <>
                    {/* Account Info */}
                    <div style={{ background: dark ? 'rgba(12,64,68,0.04)' : 'rgba(12,64,68,0.03)', border: '1px solid rgba(12,64,68,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#0C4044', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0C4044', display: 'inline-block' }} />
                        ACCOUNT INFO
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Admin ID', value: profileData.admin_id, mono: true, color: '#0C4044' },
                          { label: 'Initial', value: profileData.initial },
                          { label: 'First Name', value: profileData.first_name },
                          { label: 'Last Name', value: profileData.last_name },
                          { label: 'Email', value: profileData.email },
                          { label: 'Mobile', value: profileData.mobile_number },
                          { label: 'Gender', value: profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'â€”' },
                          { label: 'DOB', value: profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'â€”' },
                          { label: 'Married Status', value: profileData.married_status ? profileData.married_status.charAt(0).toUpperCase() + profileData.married_status.slice(1) : 'â€”' },
                          ...(profileData.married_status === 'married' ? [
                            { label: 'Anniversary', value: profileData.anniversary_date ? new Date(profileData.anniversary_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'â€”' }
                          ] : []),

                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: f.color || text, fontSize: '13px', fontWeight: f.mono ? 700 : 500, fontFamily: f.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{f.value || 'â€”'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div style={{ background: dark ? 'rgba(189,207,206,0.04)' : 'rgba(189,207,206,0.03)', border: '1px solid rgba(189,207,206,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#BDCFCE', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BDCFCE', display: 'inline-block' }} />
                        ADDRESS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Door No', value: profileData.door_no },
                          { label: 'Street', value: profileData.street_name },
                          { label: 'Town', value: profileData.town_name },
                          { label: 'City', value: profileData.city_name },
                          { label: 'District', value: profileData.district },
                          { label: 'State', value: profileData.state },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px' }}>{f.value || 'â€”'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Identity */}
                    <div style={{ background: dark ? 'rgba(204,168,129,0.04)' : 'rgba(204,168,129,0.03)', border: '1px solid rgba(204,168,129,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#CCA881', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CCA881', display: 'inline-block' }} />
                        IDENTITY
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Aadhaar No', value: profileData.aadhaar_no, mask: true },
                          { label: 'PAN No', value: profileData.pan_no, panMask: true, mono: true },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px', fontFamily: f.mono || f.mask ? 'monospace' : 'inherit', letterSpacing: f.mask ? '0.1em' : 'normal' }}>
                              {f.mask && f.value ? `XXXX-XXXX-${f.value.slice(-4)}` : f.panMask && f.value ? `XXXXXXX${f.value.slice(-4)}` : (f.value || 'â€”')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Occupation */}
                    <div style={{ background: dark ? 'rgba(187,137,88,0.04)' : 'rgba(187,137,88,0.03)', border: '1px solid rgba(187,137,88,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#BB8958', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BB8958', display: 'inline-block' }} />
                        OCCUPATION
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Type', value: profileData.occupation ? profileData.occupation.charAt(0).toUpperCase() + profileData.occupation.slice(1) : 'â€”' },
                          { label: 'Detail', value: profileData.occupation_detail },
                          { label: 'Annual Salary', value: profileData.annual_salary ? `â‚¹ ${Number(profileData.annual_salary).toLocaleString('en-IN')}` : 'â€”' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: text, fontSize: '13px' }}>{f.value || 'â€”'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Info */}
                    <div style={{ background: dark ? 'rgba(12,64,68,0.06)' : 'rgba(12,64,68,0.04)', border: '1.5px solid rgba(12,64,68,0.35)', borderRadius: '16px', padding: '18px 20px' }}>
                      <div style={{ color: '#0C4044', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0C4044', display: 'inline-block', boxShadow: '0 0 6px #0C4044' }} />
                        ADMIN INFO
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'Admin ID', value: profileData.admin_id, mono: true, color: '#0C4044' },
                          { label: 'Admin Name', value: profileData.admin_name },
                          { label: 'Contact No', value: profileData.admin_contact_no },
                          { label: 'Member Since', value: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'â€”' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                            <div style={{ color: f.color || text, fontSize: '13px', fontFamily: f.mono ? 'monospace' : 'inherit', fontWeight: f.mono ? 700 : 500 }}>{f.value || 'â€”'}</div>
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

        {showProfileEdit && (
          <div
            onClick={() => setShowProfileEdit(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,23,0.88)',
              backdropFilter: 'blur(12px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <form
              onSubmit={submitProfileUpdate}
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#F3F3F0,#E7EDEC)' : '#FDFDFC',
                border: '1px solid rgba(12,64,68,0.35)',
                borderRadius: '24px',
                width: '96%',
                maxWidth: '1050px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 32px 90px rgba(17,24,23,0.8)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(12,64,68,0.16)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px', letterSpacing: '1px' }}>
                    âœŽ PROFILE UPDATE REQUEST
                  </div>
                  <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                    Existing details compare pannitu correct details full ah enter pannunga
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  style={{
                    background: 'rgba(201,32,53,0.1)',
                    border: '1px solid rgba(201,32,53,0.3)',
                    color: '#C92035',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    cursor: 'pointer'
                  }}
                >
                  âœ• Close
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(12,64,68,0.08)' }}>
                      {['Existing Details Description', 'Existing Details', 'Details To Updated'].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '14px',
                            color: '#0C4044',
                            textAlign: 'left',
                            border: '1px solid rgba(12,64,68,0.2)',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {PROFILE_FIELDS.map(([key, label]) => (
                      <tr key={key}>
                        <td style={{
                          padding: '12px 14px',
                          border: '1px solid rgba(253,253,252,0.08)',
                          color: '#073B3F',
                          fontWeight: 700
                        }}>
                          {label}
                        </td>

                        <td style={{
                          padding: '12px 14px',
                          border: '1px solid rgba(253,253,252,0.08)',
                          color: text,
                          wordBreak: 'break-all'
                        }}>
                          {profileData?.[key] || 'â€”'}
                        </td>

                        <td style={{
                          padding: '10px',
                          border: '1px solid rgba(253,253,252,0.08)'
                        }}>
                          {key === 'gender' ? (
                            <select
                              name={key}
                              value={updateForm[key] || 'male'}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            >
                              <option value="male" style={{ background: optionBg, color: text }}>Male</option>
                              <option value="female" style={{ background: optionBg, color: text }}>Female</option>
                              <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                            </select>
                          ) : key === 'married_status' ? (
                            <select
                              name={key}
                              value={updateForm[key] || 'single'}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            >
                              <option value="single" style={{ background: optionBg, color: text }}>Single</option>
                              <option value="married" style={{ background: optionBg, color: text }}>Married</option>
                              <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                            </select>
                          ) : key === 'dob' ? (
                            <input
                              type="date"
                              name={key}
                              value={updateForm[key] || ''}
                              onChange={handleUpdateChange}
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            />
                          ) : key === 'anniversary_date' ? (
                            updateForm.married_status === 'married' ? (
                              <input
                                type="date"
                                name={key}
                                value={updateForm[key] || ''}
                                onChange={handleUpdateChange}
                                style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                              />
                            ) : (
                              <span style={{ color: subtext, fontSize: '12px' }}>Only married select panna show aagum</span>
                            )
                          ) : (
                            <input
                              name={key}
                              value={updateForm[key] || ''}
                              onChange={handleUpdateChange}
                              required
                              style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 12px', color: text, outline: 'none', boxSizing: 'border-box' }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', color: subtext, fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>
                    Message / Reason
                  </label>

                  <textarea
                    value={updateMessage}
                    onChange={e => setUpdateMessage(e.target.value)}
                    placeholder="Example: My mobile number is wrong, please update it..."
                    rows={3}
                    style={{
                      width: '100%',
                      background: inpBg,
                      border: `1px solid ${inpBorder}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: text,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>


                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', color: subtext, fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>
                    Upload Proof Document
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setProofDocument(e.target.files[0])}
                    style={{
                      width: '100%',
                      background: inpBg,
                      border: `1px solid ${inpBorder}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: text,
                      boxSizing: 'border-box'
                    }}
                  />

                  {proofDocument && (
                    <div style={{ color: '#0C4044', fontSize: '12px', marginTop: '8px' }}>
                      âœ… Selected: {proofDocument.name}
                    </div>
                  )}


                  <div style={{ color: subtext, fontSize: '12px', marginTop: '8px' }}>
                    PAN / Aadhaar / supporting document upload pannunga. Max size: 2 MB.
                  </div>

                  {/* {updateDoc && (
            <div style={{ color: '#0C4044', fontSize: '12px', marginTop: '8px' }}>
              Selected: {updateDoc.name}
            </div>
          )} */}
                </div>
              </div>

              <div style={{
                padding: '18px 28px',
                borderTop: '1px solid rgba(12,64,68,0.14)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  style={{
                    padding: '12px 22px',
                    background: inpBg,
                    border: `1px solid ${border}`,
                    borderRadius: '12px',
                    color: subtext,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(90deg,#0C4044,#BDCFCE)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FDFDFC',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {showForm && (
          <div style={card}>
            <p style={secHead('#192b1f')}>Create New Dealer</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <p style={secLabel('#073B3F')}>Account Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Initial</label><input name="initial" maxLength={5} value={form.initial} onChange={handleChange} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>First Name *</label><input name="first_name" maxLength={100} value={form.first_name} onChange={handleChange} required className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>Last Name *</label><input name="last_name" maxLength={100} value={form.last_name} onChange={handleChange} required className="ad-inp" style={inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Mobile *</label><input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required placeholder="10-digit" className="ad-inp" style={inp} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '10px' }}>
                  <div>
                    <label style={lbl}>Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="sa-inp" style={selectInput}>
                      <option value="male" style={{ background: optionBg, color: text }}>Male</option>
                      <option value="female" style={{ background: optionBg, color: text }}>Female</option>
                      <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>DOB</label>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange} className="sa-inp" style={inp} />
                  </div>

                  <div>
                    <label style={lbl}>Married Status</label>
                    <select name="married_status" value={form.married_status} onChange={handleChange} className="sa-inp" style={selectInput}>
                      <option value="single" style={{ background: optionBg, color: text }}>Single</option>
                      <option value="married" style={{ background: optionBg, color: text }}>Married</option>
                      <option value="other" style={{ background: optionBg, color: text }}>Other</option>
                    </select>
                  </div>
                </div>

                {form.married_status === 'married' && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={lbl}>Anniversary Date</label>
                    <input
                      type="date"
                      name="anniversary_date"
                      value={form.anniversary_date}
                      onChange={handleChange}
                      className="sa-inp"
                      style={inp}
                    />
                  </div>
                )}
               <div><label style={lbl}>Email *</label><input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@example.com" className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>Password *</label><input type="password" name="password" value={form.password} onChange={handleChange} required className="ad-inp" style={inp} /></div>
                <div>
                  <label style={lbl}>Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
                    required
                    className="ad-inp"
                    style={{ ...inp, border: `1px solid ${passwordError ? '#C92035' : inpBorder}` }}
                  />
                  {passwordError && (
                    <div style={{ color: '#C92035', fontSize: '12px', marginTop: '6px' }}>{passwordError}</div>
                  )}
                </div>
              </div>

              <p style={secLabel('#073B3F')}>Address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Door No *</label><input name="door_no" value={form.door_no} onChange={handleChange} required maxLength={25} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required maxLength={100} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>Town *</label><input name="town_name" value={form.town_name} onChange={handleChange} required maxLength={100} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>City *</label><input name="city_name" value={form.city_name} onChange={handleChange} required maxLength={25} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>District *</label><input name="district" value={form.district} onChange={handleChange} required maxLength={25} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>State *</label><input name="state" value={form.state} onChange={handleChange} required maxLength={25} className="ad-inp" style={inp} /></div>
              </div>

              <p style={secLabel('#073B3F')}>Identity</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Aadhaar No *</label><input name="aadhaar_no" value={form.aadhaar_no} onChange={handleChange} required maxLength={12} placeholder="12-digit" className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>PAN No *</label><input name="pan_no" value={form.pan_no} onChange={handleChange} required maxLength={10} placeholder="ABCDE1234F" className="ad-inp" style={inp} /></div>
              </div>

              <p style={secLabel('#073B3F')}>Occupation</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Occupation *</label>
                  <select name="occupation" value={form.occupation} onChange={handleChange} required className="ad-inp" style={{ ...inp, cursor: 'pointer' }}>
                    <option value="" style={{ background: '#F3F3F0' }}>Select</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o} style={{ background: '#F3F3F0' }}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Detail</label><input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} maxLength={25} className="ad-inp" style={inp} /></div>
                <div><label style={lbl}>Annual Salary *</label><input name="annual_salary" value={form.annual_salary} onChange={handleChange} required maxLength={10} placeholder="e.g. 500000" className="ad-inp" style={inp} /></div>
              </div>

              <p style={secLabel('#073B3F')}>Admin Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div><label style={lbl}>Admin ID *</label>
                  <select onChange={handleAdminChange} className="ad-inp" style={{ ...inp, cursor: 'pointer' }}>
                    <option value="" style={{ background: '#F3F3F0' }}>Select Admin ID</option>
                    {admins.map(a => <option key={a.id} value={a.id} style={{ background: '#F3F3F0' }}>{a.admin_id}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Admin Name</label>
                  <input value={selectedAdmin?.first_name || ''} readOnly placeholder="Auto fetch" style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div><label style={lbl}>Admin Contact</label>
                  <input value={selectedAdmin?.admin_contact_no || ''} readOnly placeholder="Auto fetch" style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="submit" className="ad-grad-btn"
                  style={{ padding: '12px 28px', background: 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#FDFDFC', fontSize: '14px', cursor: 'pointer' }}>
                  Create Dealer
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '12px 24px', background: inpBg, border: `1px solid ${border}`, borderRadius: '12px', color: subtext, fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dealers Table */}
        <div style={card}>
          <p style={secHead('#073B3F')}>My Dealers ({dealers.length})</p>
          {dealers.length === 0 ? (
            <p style={{ color: subtext, textAlign: 'center', padding: '60px 0', fontSize: '15px' }}>No dealers yet!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${inpBorder}` }}>
                    {['Dealer ID', 'First Name', 'Last Name', 'Email', 'Mobile', 'City', 'Created'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: subtext, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dealers.map((c, i) => (
                    <tr key={i} className="ad-tr" style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '14px 16px', color: '#0C4044', fontFamily: 'monospace', fontSize: '13px' }}>{c.dealer_id}</td>
                      <td style={{ padding: '14px 16px', color: text }}>{c.first_name || ''}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{c.email}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{c.mobile_number}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{c.city_name}</td>
                      <td style={{ padding: '14px 16px', color: subtext, whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {showBuyCoin && (
  <div onClick={() => setShowBuyCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '16px' }}>Buy Coin â€” Request</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>Add coin types and weights, then send request to Super Admin</div>
        </div>
        <button onClick={() => setShowBuyCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['gold_22k', 'gold_24k', 'silver_999'].map(m => (
          <div key={m} onClick={() => { setSelCoinMetal(m); setSelCoinWeight('') }}
            style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
              background: selCoinMetal === m ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${selCoinMetal === m ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.1)'}`,
              color: selCoinMetal === m ? '#fbbf24' : '#94a3b8' }}>
            {COIN_METAL_LABELS_TEXT[m]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>WEIGHT</label>
          <select value={selCoinWeight} onChange={e => setSelCoinWeight(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}>
            <option value="" style={{ background: '#0a1628', color: '#fff' }}>-- Select --</option>
            {(selCoinMetal === 'silver_999' ? COIN_WEIGHTS_SILVER : COIN_WEIGHTS_GOLD).map(w => (
              <option key={w.label} value={w.label} style={{ background: '#0a1628', color: '#fff' }}>{w.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>QTY</label>
          <input type="number" min="1" value={selCoinQty} onChange={e => setSelCoinQty(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={addToCoinCart}
            style={{ padding: '11px 18px', background: 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '10px', color: '#3b0024', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {coinCart.length > 0 && (
        <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {coinCart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} â€” {item.weight_label} Ã— {item.qty}</span>
              <button onClick={() => removeCoinCartItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '11px' }}>âœ•</button>
            </div>
          ))}
        </div>
      )}

      {coinBuyMsg && (
        <div style={{
          background: coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${coinBuyMsg.startsWith('success:') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: coinBuyMsg.startsWith('success:') ? '#4ade80' : '#f87171',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px'
        }}>
          {coinBuyMsg.replace('success:', '').replace('error:', '')}
        </div>
      )}

      <button
        disabled={coinBuySubmitting || coinCart.length === 0}
        onClick={submitCoinRequest}
        style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#3b0024', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
        {coinBuySubmitting ? 'Sending Request...' : 'Confirm & Send Request'}
      </button>
    </div>
  </div>
)}

{showStoredCoin && (
  <div onClick={() => setShowStoredCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '24px', width: '95%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(74,222,128,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '15px' }}>Stored Coins</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Coins approved by Super Admin</div>
        </div>
        <button onClick={() => setShowStoredCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coinStockLoading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Loading...</div>
        ) : coinStock.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No stock yet â€” send a Buy Coin request</div>
        ) : coinStock.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '12px' }}>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px' }}>{COIN_METAL_LABELS_TEXT[s.metal_type]}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{s.weight_label}</div>
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', fontFamily: 'monospace' }}>{s.qty}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{showRequestCoin && (
  <div onClick={() => { setShowRequestCoin(false); setRejectingReqId(null); setRejectReason('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '24px', width: '95%', maxWidth: '620px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(251,191,36,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '15px' }}>Coin Requests</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Pending requests received from dealers</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!coinReqLoading && coinRequests.filter(r => r.status === 'pending').length > 0 && (
            <button disabled={approvingAll} onClick={approveAllCoinRequests}
              style={{ padding: '8px 16px', background: approvingAll ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '11px', cursor: approvingAll ? 'not-allowed' : 'pointer' }}>
              {approvingAll ? 'Approving...' : 'Approve All'}
            </button>
          )}
          <button onClick={() => { setShowRequestCoin(false); setRejectingReqId(null); setRejectReason('') }} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>âœ•</button>
        </div>
      </div>

      {coinReqMsg && (
        <div style={{
          margin: '14px 26px 0',
          background: coinReqMsgType === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${coinReqMsgType === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: coinReqMsgType === 'success' ? '#4ade80' : '#f87171',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px'
        }}>
          {coinReqMsg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 26px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {coinReqLoading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Loading...</div>
        ) : coinRequests.filter(r => r.status === 'pending').length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No pending coin requests</div>
        ) : coinRequests.filter(r => r.status === 'pending').map(req => (
          <div key={req.id} style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '14px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>{req.requested_by_id_str || req.requested_by_email}</div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button disabled={approvingReqId === req.id} onClick={() => approveCoinRequest(req.id)}
                  style={{ padding: '9px 18px', background: approvingReqId === req.id ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '12px', cursor: approvingReqId === req.id ? 'not-allowed' : 'pointer' }}>
                  {approvingReqId === req.id ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={() => { setRejectingReqId(rejectingReqId === req.id ? null : req.id); setRejectReason('') }}
                  style={{ padding: '9px 18px', background: rejectingReqId === req.id ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#f87171', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                  Reject
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {req.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#fff' }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} â€” {item.weight_label}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>Ã— {item.qty}</span>
                </div>
              ))}
            </div>

            {rejectingReqId === req.id && (
              <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px' }}>
                <label style={{ display: 'block', color: '#f87171', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>Reason for rejection</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                  placeholder="Explain why this request is being rejected..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={rejectSubmitting} onClick={() => rejectCoinRequest(req.id)}
                    style={{ flex: 1, padding: '9px', background: rejectSubmitting ? 'rgba(239,68,68,0.2)' : 'linear-gradient(90deg,#ef4444,#f87171)', border: 'none', borderRadius: '8px', color: '#3b0000', fontWeight: 800, fontSize: '12px', cursor: rejectSubmitting ? 'not-allowed' : 'pointer' }}>
                    {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                  <button onClick={() => { setRejectingReqId(null); setRejectReason('') }}
                    style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  )
}






import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

// ── SVG ICONS ──
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
const IconPrinter = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconChart = ({ color, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconSearch = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconX = ({ color, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconBack = ({ color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const IconBuilding = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/>
    <line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="9" y2="14"/>
    <line x1="15" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
)

// ── ROLE CONFIG — Promotor root ku keela Customer mattum ──
const ROLE_CFG = {
  promotor: { color: '#d4a017', Icon: IconStar, label: 'PROMOTOR' },
  customer: { color: '#fb7185', Icon: IconUser, label: 'CUSTOMER', idKey: 'customer_id' },
}

function iconSvg(paths, color, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
const ICON_PATHS = {
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mappin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

let _chainHideTimer = null
function removeChainPopup() {
  document.querySelectorAll('#chain-popup-pr').forEach(el => el.remove())
}
function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, promotorInfo) {
  const chain = [
    { type: 'promotor', data: promotorInfo },
    { type: role, data: node },
  ]
  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    if (item.type === 'promotor') {
      const d = item.data || {}
      return `<div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">PROMOTOR</div>
        <div class="chain-id">${d.promotor_id || '—'}</div>
        <div class="chain-name">${[d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}</div>
        <div class="chain-info">Tel: ${d.mobile_number || '—'}</div>
      </div>${idx < chain.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
    }
    const r = ROLE_CFG[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || '—'
    return `<div class="chain-item ${isLast ? 'current' : ''}">
      <div class="chain-role">${r.label}</div>
      <div class="chain-id">${idVal}</div>
      <div class="chain-name">${name}</div>
      <div class="chain-info">Tel: ${phone}</div>
      <div class="chain-info">${city}</div>
    </div>${idx < chain.length - 1 ? `<div class="chain-arrow">↓</div>` : ''}`
  }).join('')
  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const roleLabel = ROLE_CFG[role]?.label || role.toUpperCase()
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${roleLabel} — ${currentName}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Inter',system-ui,sans-serif; background:#f8fafc; padding:40px; display:flex; justify-content:center; }
      .wrapper { max-width:480px; width:100%; }
      .header { text-align:center; margin-bottom:28px; }
      .header h1 { font-size:20px; font-weight:800; color:#020617; }
      .header p { font-size:12px; color:#64748b; margin-top:4px; }
      .chain-item { background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px 18px; margin-bottom:8px; }
      .chain-item.current { border-color:${color}; background:${color}11; }
      .chain-role { font-size:10px; font-weight:800; color:#64748b; letter-spacing:1px; margin-bottom:4px; text-transform:uppercase; }
      .chain-item.current .chain-role { color:${color}; }
      .chain-id { font-family:monospace; font-size:11px; color:${color}; margin-bottom:4px; }
      .chain-name { font-size:16px; font-weight:800; color:#020617; margin-bottom:6px; }
      .chain-info { font-size:12px; color:#475569; margin-top:3px; }
      .chain-arrow { text-align:center; color:#94a3b8; margin:4px 0; font-size:14px; }
      .footer { text-align:center; font-size:10px; color:#94a3b8; margin-top:24px; letter-spacing:0.5px; }
      @media print { body { background:white; padding:20px; } }
    </style></head>
    <body><div class="wrapper">
      <div class="header"><h1>BitByte — ${roleLabel} Profile</h1><p>Hierarchy Chain Report</p></div>
      ${chainHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload = () => { window.print() }<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

function showChainPopup(anchorEl, current, dark, text, subtext, promotorInfo) {
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [
    { type: 'promotor', data: promotorInfo },
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'chain-popup-pr'

  if (!document.getElementById('chain-popup-pr-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-pr-styles'
    s.textContent = `
      #chain-popup-pr::-webkit-scrollbar{width:6px}
      #chain-popup-pr::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #chain-popup-pr::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#d4a017,#fb7185);border-radius:10px;box-shadow:0 0 6px rgba(212,160,23,0.4)}
      #chain-popup-pr::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#eab308,#fb7185)}
      #chain-popup-pr{scrollbar-color:rgba(212,160,23,0.5) rgba(255,255,255,0.03)}
      @keyframes acpSlideInPR{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @keyframes acpPulsePR{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes acpGlowPR{0%,100%{box-shadow:0 0 0px rgba(251,113,133,0)}50%{box-shadow:0 0 20px rgba(251,113,133,0.22)}}
      @keyframes acpShimmerPR{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes acpBadgePopPR{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(212,160,23,0.22)' : 'rgba(37,99,235,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,160,23,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(37,99,235,0.05)'};
    animation:acpSlideInPR 0.3s cubic-bezier(0.22,1,0.36,1) both;
    min-width:200px; max-width:260px;
    max-height:85vh; overflow-y:auto; overflow-x:hidden;
    scroll-behavior:smooth; scrollbar-width:thin;
    scroll-padding:8px;
    -webkit-overflow-scrolling:touch;
    backdrop-filter:blur(28px);
    font-family:'Inter',system-ui,sans-serif;
  `

  const totalNodes = chain.length
  const prColor = ROLE_CFG.promotor.color
  const prRgb = hexToRgb(prColor)

  const itemsHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
    const isPromotor = item.type === 'promotor'

    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(212,160,23,0.5);"></div>
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(212,160,23,0.1),rgba(212,160,23,0.65));"></div>
        </div>
      </div>` : ''

    if (isPromotor) {
      const d = item.data || {}
      const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
      return `
        ${arrowHtml}
        <div style="
          border-radius:14px;padding:14px 16px;
          background:${isDark ? `linear-gradient(135deg,rgba(${prRgb},0.09),rgba(${prRgb},0.04))` : `linear-gradient(135deg,rgba(${prRgb},0.14),rgba(${prRgb},0.06))`};
          border:1px solid rgba(${prRgb},0.3);
          position:relative;overflow:hidden;
        ">
          <div style="position:absolute;top:-10px;right:-10px;width:70px;height:70px;background:radial-gradient(circle,rgba(${prRgb},0.14),transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:${prColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${prRgb},0.35);">${iconSvg(ICON_PATHS.star, '#2e1e02', 15)}</div>
            <div>
              <div style="font-size:9px;color:${prColor};font-weight:800;letter-spacing:1.8px;">PROMOTOR</div>
              <div style="font-size:8px;color:rgba(${prRgb},0.6);margin-top:2px;letter-spacing:0.5px;">${d.promotor_id || ''}</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:acpPulsePR 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(34,197,94,0.9);"></div>
              <span style="font-size:9px;color:#22c55e;font-weight:700;">LIVE</span>
            </div>
          </div>
          <div style="font-size:13px;color:${isDark ? '#f1f5f9' : '#0f172a'};font-weight:700;margin-bottom:6px;">${name}</div>
          <div style="font-size:12px;color:${isDark ? '#cbd5e1' : '#475569'};word-break:break-all;font-family:monospace;letter-spacing:0.3px;">📞 ${d.mobile_number || '—'}</div>
        </div>
      `
    }

    const cfg = ROLE_CFG[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    const rc = hexToRgb(cfg.color)

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
        ${isLast ? `animation:acpGlowPR 3s ease-in-out infinite;` : ''}
      ">
        ${isLast ? `<div style="position:absolute;top:-15px;right:-15px;width:80px;height:80px;background:radial-gradient(circle,rgba(${rc},0.18),transparent 70%);pointer-events:none;"></div>` : ''}

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:${cfg.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${iconSvg(ICON_PATHS.user, '#020617', 15)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
          </div>
          ${isLast ? `
          <div style="font-size:8px;font-weight:800;padding:3px 9px;border-radius:20px;
            background:rgba(${rc},0.18);color:${cfg.color};
            border:1px solid rgba(${rc},0.4);
            animation:acpBadgePopPR 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
            white-space:nowrap;letter-spacing:0.5px;">● CURRENT</div>` : ''}
        </div>

        <div style="font-size:14px;color:${isDark ? '#f1f5f9' : '#0f172a'};font-weight:700;margin-bottom:9px;letter-spacing:-0.3px;">${name}</div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          ${phone !== '—' ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.phone, cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${phone}</span>
          </div>` : ''}
          ${city ? `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:6px;background:rgba(${rc},0.12);border:1px solid rgba(${rc},0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg(ICON_PATHS.mappin, cfg.color, 11)}</div>
            <span style="font-size:12px;color:${isDark ? '#94a3b8' : '#64748b'};">${city}</span>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(212,160,23,0.1)' : 'rgba(37,99,235,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#d4a017,#fb7185);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(212,160,23,0.4);">${iconSvg(ICON_PATHS.star, '#020617', 13)}</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#eab308' : '#a16207'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(212,160,23,0.15),rgba(251,113,133,0.12),rgba(212,160,23,0.15));
        background-size:200% auto;
        animation:acpShimmerPR 2.5s linear infinite;
        border:1px solid rgba(212,160,23,0.22);
        color:${isDark ? '#eab308' : '#a16207'};
        letter-spacing:1px;">● LIVE</div>
    </div>

    ${itemsHtml}

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'};">
      <div style="font-size:9px;color:${isDark ? '#334155' : '#cbd5e1'};text-align:center;letter-spacing:0.8px;font-weight:600;">BitByte Network • Hierarchy View</div>
    </div>
  `

  document.body.appendChild(el)
  el.style.scrollBehavior = 'auto'
  el.scrollTop = el.scrollHeight
  requestAnimationFrame(() => { el.style.scrollBehavior = 'smooth' })

  const rect = anchorEl.getBoundingClientRect()
  const popW = 280
  const popH = Math.min(el.scrollHeight || 460, window.innerHeight * 0.85)
  let left = rect.right + 18
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_chainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideChainPopup())
}

function CustomerNode({ node, dark, text, subtext, promotorInfo = {} }) {
  const navigate = useNavigate()
  const cfg = ROLE_CFG.customer
  const c = cfg.color
  const Icon = cfg.Icon

  return (
    <div className="otree-node-wrap">
      <div
        className="otree-card"
        data-role="customer"
        style={{ '--nc': c, cursor: 'default' }}
        onMouseEnter={e => showChainPopup(e.currentTarget, { node, role: 'customer' }, dark, text, subtext, promotorInfo)}
        onMouseLeave={() => scheduleHideChainPopup()}
      >
        <div className="otree-badge" style={{ '--nc': c }}>
          <Icon color={c} size={11} /> {cfg.label}
        </div>
        <div className="otree-id" style={{ color: c }}>{node[cfg.idKey]}</div>
        <div className="otree-name" style={{ color: text }}>{node.first_name} {node.last_name || ''}</div>
        <div className="otree-sub" style={{ color: subtext }}>
          <IconPhone color={subtext} /> {node.mobile_number}
        </div>
        {node.city_name && (
          <div className="otree-sub" style={{ color: subtext }}>
            <IconMapPin color={subtext} /> {node.city_name}
          </div>
        )}

        <div className="otree-actions">
          <button
            onClick={e => { e.stopPropagation(); printPersonCard(node, 'customer', cfg, c, promotorInfo) }}
            className="otree-btn" style={{ '--nc': c }}
          >
            <IconPrinter color={c} /> PRINT
          </button>
          <button
  onClick={e => {
    e.stopPropagation()
    clearTimeout(_chainHideTimer)
    removeChainPopup()
    navigate(`/hierarchy-sales-count?role=customer&id=${node.id}`)
  }}
  className="otree-btn otree-btn-sales"
>
  <IconChart color="#22c55e" /> SALES ({node.order_count ?? 0})
</button>
        </div>
      </div>
    </div>
  )
}

const IconSwitchView = ({ color, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)


export default function PromotorHierarchy() {
  const navigate = useNavigate()
  const [dark] = useState(true)
  const [customers, setCustomers] = useState([])
  const [promotorInfo, setPromotorInfo] = useState({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const treeWrapperRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const [customerAnchors, setCustomerAnchors] = useState([])
  const [promotorAnchor, setPromotorAnchor] = useState(null)

  useLayoutEffect(() => {
    const wrapper = treeWrapperRef.current
    if (!wrapper) return

    const measure = () => {
      const wrapperRect = wrapper.getBoundingClientRect()

      const custEls = wrapper.querySelectorAll('[data-role="customer"]')
      const anchors = Array.from(custEls).map(el => {
        const r = el.getBoundingClientRect()
        return {
          x: (r.left - wrapperRect.left) + r.width / 2,
          top: (r.top - wrapperRect.top),
        }
      })
      setCustomerAnchors(anchors)

      const prEl = wrapper.querySelector('[data-role="promotor"]')
      if (prEl) {
        const r = prEl.getBoundingClientRect()
        setPromotorAnchor({
          x: (r.right - wrapperRect.left),
          y: (r.top - wrapperRect.top) + r.height / 2,
        })
      }
    }

    measure()
    requestAnimationFrame(() => requestAnimationFrame(measure))

    const ro = new ResizeObserver(measure)
    ro.observe(wrapper)

    const scrollEl = scrollAreaRef.current
    scrollEl?.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      scrollEl?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [customers, debouncedSearch])

  const text = '#f8fafc'
  const subtext = '#94a3b8'
  const inpBg = 'rgba(255,255,255,0.05)'
  const inpBorder = '#374151'
  const border = 'rgba(255,255,255,0.1)'

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 120)
    return () => clearTimeout(t)
  }, [search])

  const fetchHierarchy = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hierarchy/full/')
      const myEmail = localStorage.getItem('email')

      // Ella admins -> dealers -> sub_dealers -> promotors ah walk panni, logged-in promotor ah kandu pidikkurom
      let myPromotor = null
      outer:
      for (const admin of res.data.admins || []) {
        for (const dealer of admin.dealers || []) {
          for (const sd of dealer.sub_dealers || []) {
            const found = (sd.promotors || []).find(pr => pr.email === myEmail)
            if (found) { myPromotor = found; break outer }
          }
        }
      }
      // Fallback
      if (!myPromotor) {
        outer2:
        for (const admin of res.data.admins || []) {
          for (const dealer of admin.dealers || []) {
            for (const sd of dealer.sub_dealers || []) {
              if ((sd.promotors || []).length > 0) { myPromotor = sd.promotors[0]; break outer2 }
            }
          }
        }
      }

      if (myPromotor) {
        setPromotorInfo({
          promotor_id: myPromotor.promotor_id,
          first_name: myPromotor.first_name,
          last_name: myPromotor.last_name,
          mobile_number: myPromotor.mobile_number,
        })
        setCustomers(myPromotor.customers || [])
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchHierarchy() }, [])
  useEffect(() => {
  return () => {
    clearTimeout(_chainHideTimer)
    removeChainPopup()
  }
}, [])

  const searchResults = useMemo(() => {
    if (!debouncedSearch || !customers) return []
    const q = debouncedSearch.trim().toLowerCase()
    return customers.filter(cus => {
      const idVal = (cus.customer_id || '').toString().toLowerCase()
      const nameVal = `${cus.first_name || ''} ${cus.last_name || ''}`.toLowerCase()
      const phoneVal = (cus.mobile_number || '').toString().toLowerCase()
      return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
    })
  }, [debouncedSearch, customers])

  const totalStats = customers ? { customers: customers.length } : null

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: text, fontFamily: '"Inter",system-ui,sans-serif', padding: '28px 32px' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .otree-node-wrap{display:flex;flex-direction:column;align-items:center;}
        .otree-card{
          background:rgba(255,255,255,0.03); border:1px solid var(--nc); border-radius:12px; padding:12px 16px;
          min-width:168px; max-width:210px; position:relative; transition:all .25s ease;
        }
        .otree-card:hover{ transform:translateY(-3px); box-shadow:0 8px 22px rgba(0,0,0,0.35); }
        .otree-badge{ display:inline-flex; align-items:center; gap:5px; font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px; margin-bottom:8px; color:var(--nc); border:1px solid var(--nc); }
        .otree-id{ font-family:monospace; font-size:10px; margin-bottom:4px; word-break:break-all; }
        .otree-name{ font-weight:700; font-size:13px; margin-bottom:6px; }
        .otree-sub{ display:flex; align-items:center; gap:4px; font-size:11px; margin-bottom:2px; }
        .otree-actions{ margin-top:8px; display:flex; gap:6px; }
        .otree-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:3px 0; font-size:9px; font-weight:700; background:transparent; border:1px solid var(--nc); border-radius:6px; color:var(--nc); cursor:pointer; }
        .otree-btn-sales{ border-color:#22c55e; color:#22c55e; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <button onClick={() => navigate('/promotor-hierarchy-grid')} title="Switch to Grid View"
    style={{ background: 'rgba(165,243,252,0.1)', border: '1px solid rgba(165,243,252,0.35)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <IconSwitchView color="#a5f3fc" size={16} />
  </button>
  <span style={{ color: '#a5f3fc', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
    Full Dealer Hierarchy
  </span>
</div>
          {totalStats && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${ROLE_CFG.promotor.color}22`, border: `1px solid ${ROLE_CFG.promotor.color}55`, borderRadius: '20px', padding: '4px 14px' }}>
                <span style={{ color: ROLE_CFG.promotor.color, fontWeight: 800, fontSize: '13px' }}>1</span>
                <span style={{ color: subtext, fontSize: '11px' }}>Promotor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${ROLE_CFG.customer.color}14`, border: `1px solid ${ROLE_CFG.customer.color}44`, borderRadius: '20px', padding: '4px 14px' }}>
                <span style={{ color: ROLE_CFG.customer.color, fontWeight: 800, fontSize: '13px' }}>{totalStats.customers}</span>
                <span style={{ color: subtext, fontSize: '11px' }}>Customers</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <IconSearch color={subtext} />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, Name, Phone..."
              style={{ width: '240px', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '9px 14px 9px 34px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}>
                <IconX color={subtext} />
              </button>
            )}
          </div>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
            <IconBack color="#f87171" /> Back
          </button>
        </div>
      </div>

      <div ref={treeWrapperRef} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: '20px', padding: '28px 0', overflow: 'hidden', minHeight: '100vh', position: 'relative' }}>

        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 200, zIndex: 40, background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
          <div className="otree-card" data-role="promotor" style={{ '--nc': ROLE_CFG.promotor.color, minWidth: 150, cursor: 'default' }}>
            <div className="otree-badge" style={{ '--nc': ROLE_CFG.promotor.color }}>
              <IconStar color={ROLE_CFG.promotor.color} size={11} /> PROMOTOR
            </div>
            <div className="otree-id" style={{ color: ROLE_CFG.promotor.color }}>{promotorInfo.promotor_id}</div>
            <div className="otree-name" style={{ color: text, fontSize: '12px' }}>{promotorInfo.first_name} {promotorInfo.last_name || ''}</div>
            <div className="otree-sub" style={{ color: subtext }}>
              <IconPhone color={subtext} /> {promotorInfo.mobile_number}
            </div>
          </div>
          <div style={{ width: 2, flex: 1, background: ROLE_CFG.promotor.color, marginTop: 6 }} />
        </div>

        {!loading && customers.length > 0 && !debouncedSearch && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 200, height: '100%', zIndex: 45, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute',
              top: customerAnchors[0]?.top != null ? customerAnchors[0].top + 60 : 120,
              left: 118,
              transform: 'translateY(-50%)',
              fontSize: '11px',
              fontWeight: 700,
              color: subtext,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              Level 1
            </div>
          </div>
        )}

        {!loading && customers.length > 0 && !debouncedSearch && customerAnchors.length > 0 && promotorAnchor && (() => {
          const bridgeY = promotorAnchor.y
          const bridgeStartX = promotorAnchor.x
          const farthestX = Math.max(...customerAnchors.map(a => a.x))
          return (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 44, pointerEvents: 'none' }}>
              <line x1={bridgeStartX} y1={bridgeY} x2={Math.max(farthestX, bridgeStartX)} y2={bridgeY} stroke={ROLE_CFG.customer.color} strokeWidth="2" />
              {customerAnchors.map((a, i) => (
                <line key={i} x1={a.x} y1={bridgeY} x2={a.x} y2={a.top} stroke={ROLE_CFG.customer.color} strokeWidth="2" />
              ))}
            </svg>
          )
        })()}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(212,160,23,0.2)', borderTop: '3px solid #d4a017', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: subtext, fontSize: '14px' }}>Loading hierarchy...</span>
          </div>
        )}

        {!loading && customers && (
          debouncedSearch ? (
            searchResults.length === 0 ? (
              <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No results found for "{debouncedSearch}"</div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', padding: '0 32px' }}>
                {searchResults.map((cus, idx) => (
                  <CustomerNode key={cus.id || idx} node={cus} dark={dark} text={text} subtext={subtext} promotorInfo={promotorInfo} />
                ))}
              </div>
            )
          ) : customers.length === 0 ? (
            <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No customers created yet.</div>
          ) : (
            <div ref={scrollAreaRef} style={{ overflowX: 'auto', overflowY: 'hidden', padding: '110px 32px 20px 220px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                {customers.map(cus => (
                  <CustomerNode key={cus.id} node={cus} dark={dark} text={text} subtext={subtext} promotorInfo={promotorInfo} />
                ))}
              </div>
            </div>
          )
        )}

        {!loading && !customers && (
          <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load hierarchy.</div>
        )}

      </div>

      {!loading && (
        <div style={{ marginTop: '20px', padding: '14px 0', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {[{ role: 'Promotor', key: 'promotor' }, { role: 'Customer', key: 'customer' }].map(l => (
            <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: ROLE_CFG[l.key].color }} />
              <span style={{ color: subtext, fontSize: '11px' }}>{l.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
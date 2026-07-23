import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

// ══════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════
const IconLink = ({ color, size = 18 }) => (
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
const IconChevronDown = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconMessage = ({ color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

// ══════════════════════════════════════════════════════════════════
// ROLE CONFIG — sub dealer's own subtree mattum: promotor → customer
// ══════════════════════════════════════════════════════════════════
const ROLE_CFG = {
  sub_dealer: { color: '#ef4444', Icon: IconLink, label: 'SUB DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#d4a017', Icon: IconStar, label: 'PROMOTOR', idKey: 'promotor_id' },
  customer: { color: '#fb7185', Icon: IconUser, label: 'CUSTOMER', idKey: 'customer_id' },
}
const CHILD_ROLE = { sub_dealer: 'promotor', promotor: 'customer' }
const CHILD_KEY = { sub_dealer: 'promotors', promotor: 'customers' }
const LEVEL_NUM = { sub_dealer: 1, promotor: 2, customer: 3 }
const STATUS_COLOR = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e' }

function iconSvg(paths, color, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
const ICON_PATHS = {
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mappin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
}
const ICON_BY_TYPE = { promotor: 'star', customer: 'user' }

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function getPrintStyles(accent) {
  return `
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Inter',system-ui,sans-serif; background:radial-gradient(circle at 20% 0%, #0b1a2e 0%, #020617 55%); color:#f8fafc; padding:40px; }
    .wrapper { max-width:520px; margin:0 auto; }
    .header { text-align:center; margin-bottom:26px; }
    .header h1 { font-size:20px; font-weight:800; background:linear-gradient(90deg,#ef4444,#a78bfa); -webkit-background-clip:text; background-clip:text; color:transparent; letter-spacing:0.3px; }
    .header p { font-size:12px; color:#64748b; margin-top:4px; letter-spacing:0.5px; }
    .chain-item { background:linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015)); border:1.5px solid #334155; border-radius:14px; padding:14px 18px; margin-bottom:8px; }
    .chain-item.current { border-color:${accent}; background:${accent}14; box-shadow:0 0 22px ${accent}33; }
    .chain-role { font-size:10px; font-weight:800; color:#94a3b8; letter-spacing:1.4px; margin-bottom:4px; text-transform:uppercase; }
    .chain-item.current .chain-role { color:${accent}; }
    .chain-id { font-family:monospace; font-size:11px; color:${accent}; margin-bottom:4px; }
    .chain-name { font-size:16px; font-weight:800; color:#f8fafc; margin-bottom:6px; }
    .chain-info { font-size:12px; color:#94a3b8; margin-top:3px; }
    .chain-arrow { text-align:center; color:#475569; margin:4px 0; font-size:14px; }
    .footer { text-align:center; font-size:10px; color:#475569; margin-top:24px; letter-spacing:0.5px; }
    .count-row { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:18px 0 22px; }
    .count-pill { font-size:10px; font-weight:800; border:1px solid; border-radius:20px; padding:4px 12px; }
    .tree-node { margin-bottom:6px; }
    .tree-children { margin-left:22px; padding-left:16px; border-left:2px dashed #334155; margin-top:10px; display:flex; flex-direction:column; gap:10px; }
    .tree-card { background:linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015)); border:1.5px solid; border-radius:12px; padding:10px 14px; }
    .tree-role { font-size:9px; font-weight:800; letter-spacing:1.2px; margin-bottom:2px; }
    .tree-id { font-family:monospace; font-size:10px; margin-bottom:3px; }
    .tree-name { font-size:13px; font-weight:700; color:#f8fafc; margin-bottom:2px; }
    .tree-info { font-size:11px; color:#94a3b8; }
    @media print { body { padding:20px; } }
  `
}

function renderTreeNodeCard(node, role, extraStyle = '') {
  const cfg = ROLE_CFG[role]
  const idVal = node[cfg.idKey] || node.id || '—'
  const name = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const phone = node.mobile_number || '—'
  const city = node.city_name || ''
  return `<div class="tree-card" style="border-color:${cfg.color};${extraStyle}">
    <div class="tree-role" style="color:${cfg.color}">${cfg.label}</div>
    <div class="tree-id" style="color:${cfg.color}">${idVal}</div>
    <div class="tree-name">${name}</div>
    <div class="tree-info">Tel: ${phone}${city ? ' • ' + city : ''}</div>
  </div>`
}

function renderDescendantsTree(node, role) {
  const childRole = CHILD_ROLE[role]
  if (!childRole) return ''
  const children = node[CHILD_KEY[role]] || []
  if (!children.length) return ''
  return `<div class="tree-children">${children.map(ch => `
    <div class="tree-node">
      ${renderTreeNodeCard(ch, childRole)}
      ${renderDescendantsTree(ch, childRole)}
    </div>`).join('')}</div>`
}

function countDescendants(node, role) {
  const counts = {}
  const walk = (n, r) => {
    const childRole = CHILD_ROLE[r]
    if (!childRole) return
    const children = n[CHILD_KEY[r]] || []
    counts[childRole] = (counts[childRole] || 0) + children.length
    children.forEach(ch => walk(ch, childRole))
  }
  walk(node, role)
  return counts
}

// ══════════════════════════════════════════════════════════════════
// HOVER CHAIN POPUP + PRINT
// ══════════════════════════════════════════════════════════════════
let _chainHideTimer = null
function removeChainPopup() {
  document.querySelectorAll('#chain-popup-sd').forEach(el => el.remove())
}
function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, ancestors) {
  const chain = [...ancestors.map(a => ({ type: a.role, data: a.node })), { type: role, data: node }]
  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1
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
    <style>${getPrintStyles(color)}</style></head>
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

function printHierarchyTree(node, role, ancestors) {
  const cfg = ROLE_CFG[role]
  const chainHtml = ancestors.map(a => {
    const r = ROLE_CFG[a.role]
    const d = a.node || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    return `<div class="chain-item" style="border-color:${r.color}">
      <div class="chain-role" style="color:${r.color}">${r.label}</div>
      <div class="chain-id" style="color:${r.color}">${idVal}</div>
      <div class="chain-name">${name}</div>
    </div><div class="chain-arrow">↓</div>`
  }).join('')

  const counts = countDescendants(node, role)
  const countPillsHtml = Object.keys(counts).length
    ? Object.entries(counts).map(([r, c]) => {
        const rc = ROLE_CFG[r]
        return `<span class="count-pill" style="border-color:${rc.color}; color:${rc.color}">${c} ${rc.label}${c === 1 ? '' : 'S'}</span>`
      }).join('')
    : `<span class="count-pill" style="border-color:#475569;color:#94a3b8">No one under this ${cfg.label.toLowerCase()} yet</span>`

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const treeHtml = renderDescendantsTree(node, role)

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${cfg.label} Hierarchy — ${currentName}</title>
    <style>${getPrintStyles(cfg.color)}</style></head>
    <body><div class="wrapper">
      <div class="header"><h1>BitByte — ${cfg.label} Hierarchy Report</h1><p>Full downward chain, every level</p></div>
      ${chainHtml}
      ${renderTreeNodeCard(node, role, `box-shadow:0 0 22px ${cfg.color}33;`)}
      <div class="count-row">${countPillsHtml}</div>
      ${treeHtml}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <script>window.onload = () => { window.print() }<\/script>
    </body></html>
  `)
  printWindow.document.close()
}

function showChainPopup(anchorEl, ancestors, current, dark) {
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [...ancestors.map(a => ({ type: a.role, data: a.node })), { type: current.role, data: current.node }]

  const el = document.createElement('div')
  el.id = 'chain-popup-sd'

  if (!document.getElementById('chain-popup-sd-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-sd-styles'
    s.textContent = `
      #chain-popup-sd::-webkit-scrollbar{width:6px}
      #chain-popup-sd::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #chain-popup-sd::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ef4444,#a78bfa);border-radius:10px;box-shadow:0 0 6px rgba(239,68,68,0.4)}
      #chain-popup-sd::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#f87171,#c4b5fd)}
      #chain-popup-sd{scrollbar-color:rgba(239,68,68,0.5) rgba(255,255,255,0.03)}
      @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
      @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(239,68,68,0)}50%{box-shadow:0 0 20px rgba(239,68,68,0.22)}}
      @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(239,68,68,0.22)' : 'rgba(37,99,235,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(239,68,68,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(37,99,235,0.05)'};
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
    const arrowHtml = idx > 0 ? `
      <div style="display:flex;justify-content:center;padding:5px 0;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(239,68,68,0.5);"></div>
          <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(239,68,68,0.1),rgba(239,68,68,0.65));"></div>
        </div>
      </div>` : ''

    const cfg = ROLE_CFG[item.type]
    if (!cfg) return ''
    const d = item.data || {}
    const idVal = d[cfg.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || ''
    const rc = hexToRgb(cfg.color)
    const iconKey = item.type === 'sub_dealer' ? 'link' : ICON_BY_TYPE[item.type]

    return `
      ${arrowHtml}
      <div style="
        border-radius:14px;padding:14px 16px;
        background:${isLast ? `linear-gradient(135deg,rgba(${rc},0.13),rgba(${rc},0.05))` : `rgba(${rc},0.04)`};
        border:${isLast ? `1.5px solid rgba(${rc},0.55)` : `1px solid rgba(${rc},0.16)`};
        position:relative;overflow:hidden;
        ${isLast ? `animation:acpGlow 3s ease-in-out infinite;` : ''}
      ">
        ${isLast ? `<div style="position:absolute;top:-15px;right:-15px;width:80px;height:80px;background:radial-gradient(circle,rgba(${rc},0.18),transparent 70%);pointer-events:none;"></div>` : ''}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:${cfg.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(${rc},0.3);">${iconSvg(ICON_PATHS[iconKey], '#020617', 15)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9px;color:${cfg.color};font-weight:800;letter-spacing:1.8px;">${cfg.label}</div>
            <div style="font-size:9px;color:${cfg.color};font-family:monospace;opacity:0.6;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idVal}</div>
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#ef4444,#a78bfa);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(239,68,68,0.4);">${iconSvg(ICON_PATHS.link, '#020617', 13)}</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#f87171' : '#16a34a'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(239,68,68,0.15),rgba(167,139,250,0.12),rgba(239,68,68,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(239,68,68,0.22);
        color:${isDark ? '#f87171' : '#16a34a'};
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

// ══════════════════════════════════════════════════════════════════
// LANE CARD
// ══════════════════════════════════════════════════════════════════
function LaneCard({ node, role, active, onClick, ancestors, dark, text, subtext, onMessage, onPrint, activeStatusFilter, onToggleStatusFilter }) {
  const navigate = useNavigate()
  const cfg = ROLE_CFG[role]
  const c = role === 'customer'
    ? STATUS_COLOR.green
    : node.status ? STATUS_COLOR[node.status] : cfg.color
  const Icon = cfg.Icon
  const childRole = CHILD_ROLE[role]
  const childCount = childRole ? (node[CHILD_KEY[role]] || []).length : null

  const childStatusCounts = childRole
    ? (() => {
        const counts = { red: 0, orange: 0, yellow: 0, green: 0 }
        ;(node[CHILD_KEY[role]] || []).forEach(ch => {
          if (ch.status && counts[ch.status] !== undefined) counts[ch.status]++
        })
        return counts
      })()
    : null

  return (
    <div
      className={`gcard ${active ? 'gcard-active' : 'gcard-dim'}`}
      style={{ '--nc': c }}
      onClick={onClick}
      onMouseEnter={e => showChainPopup(e.currentTarget, ancestors, { node, role }, dark)}
      title={node.status ? `Target status: ${node.status?.toUpperCase()} (${node.order_count ?? 0}/10)` : undefined}
      onMouseLeave={() => scheduleHideChainPopup()}
    >
      <button
        onClick={e => { e.stopPropagation(); clearTimeout(_chainHideTimer); removeChainPopup(); onMessage({ node, role }) }}
        className="gcard-msg-btn"
        style={{ '--nc': c }}
        title={`Message ${node.first_name} only`}
      >
        <IconMessage color={c} />
      </button>

      <div className="gcard-badge" style={{ '--nc': c }}>
        <Icon color={c} size={11} /> {cfg.label}
      </div>
      <div className="gcard-id" style={{ color: c }}>{node[cfg.idKey]}</div>
      <div className="gcard-name" style={{ color: text }}>{node.first_name} {node.last_name || ''}</div>
      <div className="gcard-sub" style={{ color: subtext }}>
        <IconPhone color={subtext} /> {node.mobile_number}
      </div>
      {node.city_name && (
        <div className="gcard-sub" style={{ color: subtext }}>
          <IconMapPin color={subtext} /> {node.city_name}
        </div>
      )}

      <div className="gcard-actions">
        <button
          onClick={e => {
            e.stopPropagation()
            if (CHILD_ROLE[role]) {
              onPrint({ node, role, cfg, color: c, ancestors })
            } else {
              printPersonCard(node, role, cfg, c, ancestors)
            }
          }}
          className="gcard-btn" style={{ '--nc': c }}
        >
          <IconPrinter color={c} /> PRINT
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            clearTimeout(_chainHideTimer)
            removeChainPopup()
            navigate(`/hierarchy-sales-count?role=${role}&id=${node.id}`)
          }}
          className="gcard-btn gcard-btn-sales"
        >
          <IconChart color="#22c55e" /> SALES ({node.order_count ?? 0})
        </button>
      </div>

      {node.status && (
        <div className="gcard-status-dots">
          {['red', 'orange', 'yellow', 'green'].map(s => {
            const count = childStatusCounts ? childStatusCounts[s] : (s === node.status ? (node.order_count ?? 0) : 0)
            const isFilterActive = activeStatusFilter && activeStatusFilter.role === role && activeStatusFilter.nodeId === node.id && activeStatusFilter.status === s
            return (
              <span
                key={s}
                onClick={e => { e.stopPropagation(); onToggleStatusFilter && onToggleStatusFilter(role, node, s) }}
                className="gcard-dot"
                style={{
                  background: STATUS_COLOR[s],
                  borderColor: STATUS_COLOR[s],
                  color: '#020617',
                  opacity: count > 0 ? 1 : 0.3,
                  outline: isFilterActive ? '2px solid #f8fafc' : 'none',
                  outlineOffset: '2px',
                  cursor: onToggleStatusFilter ? 'pointer' : 'default',
                }}
                title={`${s.toUpperCase()}: ${count}`}
              >
                {count}
              </span>
            )
          })}
        </div>
      )}

      {childCount !== null && (
        <div className="gcard-count" style={{ background: c }}>
          {childCount} {childRole.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// LANE ROW
// ══════════════════════════════════════════════════════════════════
function LaneRow({ role, items, activeId, onSelect, ancestors, dark, text, subtext, emptyText, onMessage, onPrint, activeStatusFilter, onToggleStatusFilter }) {
  const cfg = ROLE_CFG[role]
  return (
    <div className="glane">
      <div className="glane-label" style={{ '--nc': cfg.color }}>
        <span className="glane-level">LEVEL {LEVEL_NUM[role]}</span>
        <span className="glane-role" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="glane-total" style={{ color: subtext }}>{items.length}</span>
      </div>
      <div className="glane-track" style={{ '--nc': cfg.color, scrollbarColor: `${cfg.color} rgba(255,255,255,0.06)` }}>
        {items.length === 0 ? (
          <div className="glane-empty" style={{ color: subtext }}>{emptyText}</div>
        ) : (
          items.map(item => (
            <LaneCard
              key={item.id}
              node={item}
              role={role}
              active={item.id === activeId}
              onClick={() => onSelect(item)}
              ancestors={ancestors}
              dark={dark} text={text} subtext={subtext}
              onMessage={onMessage}
              onPrint={onPrint}
              activeStatusFilter={activeStatusFilter}
              onToggleStatusFilter={onToggleStatusFilter}
            />
          ))
        )}
      </div>
      <div className="glane-divider" style={{ background: cfg.color }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE — Sub Dealer login: shows ONLY this sub dealer's own promotor → customer chain
// ══════════════════════════════════════════════════════════════════
export default function Subdealer_Hierarchy_grid() {
  const navigate = useNavigate()
  const [dark] = useState(true)
  const [root, setRoot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selPromotor, setSelPromotor] = useState(null)

  const [activeStatusFilter, setActiveStatusFilter] = useState(null)

  const [messageTarget, setMessageTarget] = useState(null)
  const [messageTitle, setMessageTitle] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [messageMsg, setMessageMsg] = useState('')

  const openMessagePopup = (target) => {
    setMessageTarget(target)
    setMessageTitle('')
    setMessageBody('')
    setMessageMsg('')
  }

  const [printTarget, setPrintTarget] = useState(null)
  const openPrintPopup = (target) => setPrintTarget(target)
  const handlePrintOnly = () => {
    const { node, role, cfg, color, ancestors } = printTarget
    printPersonCard(node, role, cfg, color, ancestors)
    setPrintTarget(null)
  }
  const handlePrintHierarchy = () => {
    const { node, role, ancestors } = printTarget
    printHierarchyTree(node, role, ancestors)
    setPrintTarget(null)
  }

  const sendDirectMessage = async () => {
    if (!messageTarget?.node?.user_id) {
      setMessageMsg('❌ user_id missing — hierarchy API refresh pannunga')
      return
    }
    if (!messageTitle.trim() || !messageBody.trim()) {
      setMessageMsg('❌ Title and message required')
      return
    }
    setMessageSending(true)
    try {
      await api.post('/announcements/', {
        title: messageTitle,
        message: messageBody,
        target_user: messageTarget.node.user_id,
      })
      setMessageMsg('✅ Sent! Only they will see this.')
      setTimeout(() => setMessageTarget(null), 1200)
    } catch (err) {
      setMessageMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
    }
    setMessageSending(false)
  }

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
      const res = await api.get('/my-hierarchy/')
      setRoot(res.data.root)
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

  const promotors = root?.promotors || []
  const currentPromotor = useMemo(() => {
    if (!selPromotor) return null
    return promotors.find(p => p.id === selPromotor) || null
  }, [promotors, selPromotor])

  const customers = currentPromotor?.customers || []

  const filteredPromotors = useMemo(() => {
    if (activeStatusFilter && activeStatusFilter.role === 'sub_dealer' && activeStatusFilter.nodeId === root?.id) {
      return promotors.filter(p => p.status === activeStatusFilter.status)
    }
    return promotors
  }, [promotors, activeStatusFilter, root])

  const filteredCustomers = useMemo(() => {
    if (activeStatusFilter && activeStatusFilter.role === 'promotor' && activeStatusFilter.nodeId === currentPromotor?.id) {
      return customers.filter(c => c.status === activeStatusFilter.status)
    }
    return customers
  }, [customers, activeStatusFilter, currentPromotor])

  const promotorAncestors = root ? [{ node: root, role: 'sub_dealer' }] : []
  const customerAncestors = currentPromotor ? [...promotorAncestors, { node: currentPromotor, role: 'promotor' }] : promotorAncestors

  const selectPromotor = (node) => { setSelPromotor(node.id) }

  const selectFns = { sub_dealer: () => {}, promotor: selectPromotor }
  const currentSelIds = { sub_dealer: root?.id, promotor: selPromotor }
  const toggleStatusFilter = (role, node, status) => {
    setActiveStatusFilter(prev =>
      (prev && prev.role === role && prev.nodeId === node.id && prev.status === status) ? null : { role, nodeId: node.id, status }
    )
    if (currentSelIds[role] !== node.id) selectFns[role](node)
  }

  const searchOwnHierarchy = (query) => {
    if (!root || !query.trim()) return []
    const q = query.trim().toLowerCase()
    const result = []
    const checkMatch = (node, idKey) => {
      const idVal = (node[idKey] || '').toString().toLowerCase()
      const nameVal = `${node.first_name || ''} ${node.last_name || ''}`.toLowerCase()
      const phoneVal = (node.mobile_number || '').toString().toLowerCase()
      return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
    }
    ;(root.promotors || []).forEach(pr => {
      if (checkMatch(pr, 'promotor_id')) result.push({ node: pr, role: 'promotor', ancestors: [{ node: root, role: 'sub_dealer' }] })
      ;(pr.customers || []).forEach(cus => {
        if (checkMatch(cus, 'customer_id')) result.push({ node: cus, role: 'customer', ancestors: [{ node: root, role: 'sub_dealer' }, { node: pr, role: 'promotor' }] })
      })
    })
    return result
  }

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return []
    return searchOwnHierarchy(debouncedSearch)
  }, [debouncedSearch, root])

  const jumpToSearchResult = (item) => {
    const map = {}
    item.ancestors.forEach(a => { if (a.role !== 'sub_dealer') map[a.role] = a.node.id })
    map[item.role] = item.node.id
    setSelPromotor(map.promotor ?? null)
    setActiveStatusFilter(null)
    setSearch('')
  }

  const totalCounts = root ? countDescendants(root, 'sub_dealer') : {}
  const statPills = [
    { label: 'Promotors', roleKey: 'promotor', count: totalCounts.promotor || 0 },
    { label: 'Customers', roleKey: 'customer', count: totalCounts.customer || 0 },
  ]

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%, #0b1a2e 0%, #020617 55%)', color: text, fontFamily: '"Inter",system-ui,sans-serif', padding: '28px 32px' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .gcard{ background:linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)); border:1.5px solid var(--nc); border-radius:16px; padding:14px 18px; min-width:172px; max-width:210px; cursor:pointer; position:relative; transition:opacity .2s ease, transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease; flex-shrink:0; }
        .gcard:hover{ transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.35); }
        .gcard-msg-btn{ position:absolute; top:8px; right:8px; z-index:2; width:22px; height:22px; border-radius:6px; background:rgba(255,255,255,0.06); border:1px solid var(--nc); color:var(--nc); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s ease, transform .2s ease; }
        .gcard-msg-btn:hover{ background:rgba(255,255,255,0.18); transform:scale(1.08); }
        .gcard-active{ opacity:1; transform:translateY(-3px); box-shadow:0 0 0 1.5px var(--nc), 0 14px 30px rgba(0,0,0,0.45); }
        .gcard-dim{ opacity:0.45; }
        .gcard-dim:hover{ opacity:0.85; }
        .gcard-badge{ display:inline-flex; align-items:center; gap:5px; font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px; margin-bottom:8px; color:var(--nc); border:1px solid var(--nc); }
        .gcard-id{ font-family:monospace; font-size:10px; margin-bottom:4px; word-break:break-all; }
        .gcard-name{ font-weight:700; font-size:13px; margin-bottom:6px; }
        .gcard-sub{ display:flex; align-items:center; gap:4px; font-size:11px; margin-bottom:2px; }
        .gcard-actions{ margin-top:8px; display:flex; gap:6px; }
        .gcard-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; font-size:9px; font-weight:700; background:rgba(255,255,255,0.03); border:1px solid var(--nc); border-radius:20px; color:var(--nc); cursor:pointer; transition:background .15s ease, transform .1s ease; }
        .gcard-btn:hover{ background:var(--nc); color:#020617; transform:scale(1.03); }
        .gcard-btn-sales{ border-color:#22c55e; color:#22c55e; }
        .gcard-count{ position:absolute; bottom:-9px; left:50%; transform:translateX(-50%); color:#000; font-size:9px; font-weight:800; padding:1px 7px; border-radius:20px; white-space:nowrap; }
        .gcard-status-dots{ display:flex; gap:6px; justify-content:center; margin-top:9px; }
        .gcard-dot{ width:20px; height:20px; border-radius:50%; border:1.5px solid; box-sizing:border-box; transition:all .15s ease; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; }
        .gcard-dot:hover{ transform:scale(1.15); }
        .glane{ margin-bottom:26px; }
        .glane-label{ display:flex; align-items:baseline; gap:10px; margin-bottom:10px; padding-left:2px; }
        .glane-level{ font-size:10px; font-weight:800; letter-spacing:1.4px; color:var(--nc); opacity:0.7; }
        .glane-role{ font-size:13px; font-weight:800; letter-spacing:0.6px; }
        .glane-total{ font-size:11px; }
        .glane-track{ display:flex; gap:14px; overflow-x:auto; overflow-y:visible; padding:6px 4px 14px 4px; scrollbar-width:thin; }
        .glane-track::-webkit-scrollbar{ height:7px; }
        .glane-track::-webkit-scrollbar-track{ background:rgba(255,255,255,0.03); border-radius:10px; }
        .glane-track::-webkit-scrollbar-thumb{ background:var(--nc); border-radius:10px; opacity:0.7; }
        .glane-track::-webkit-scrollbar-thumb:hover{ background:var(--nc); opacity:1; }
        .glane-empty{ font-size:12px; padding:14px 4px; display:flex; align-items:center; gap:8px; opacity:0.75; }
        .glane-divider{ height:3px; border-radius:3px; margin:0 4px 4px 4px; opacity:0.55; }
        .gsa-card{ display:inline-flex; align-items:center; gap:10px; border-radius:12px; padding:10px 18px; margin-bottom:22px; border-width:1.5px; border-style:solid; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBuilding color="#a5f3fc" />
            <span style={{ color: '#a5f3fc', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              My Team Hierarchy
            </span>
          </div>
          {root && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              {statPills.map(s => {
                const color = ROLE_CFG[s.roleKey].color
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${color}14`, border: `1px solid ${color}44`, borderRadius: '20px', padding: '4px 14px' }}>
                    <span style={{ color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
                    <span style={{ color: subtext, fontSize: '11px' }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <IconSearch color={subtext} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, Name, Phone..."
              style={{ width: '240px', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '20px', padding: '9px 14px 9px 34px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s ease, box-shadow .15s ease' }}
              onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)' }}
              onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = 'none' }}
            />
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

      <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: '20px', padding: '24px 28px', minHeight: '70vh' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(239,68,68,0.2)', borderTop: '3px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: subtext, fontSize: '14px' }}>Hold on, pulling up your team tree...</span>
          </div>
        )}

        {!loading && !root && (
          <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load your hierarchy.</div>
        )}

        {!loading && root && debouncedSearch ? (
          searchResults.length === 0 ? (
            <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No results found for "{debouncedSearch}"</div>
          ) : (
            <div className="glane-track" style={{ flexWrap: 'wrap' }}>
              {searchResults.map((item, idx) => (
                <LaneCard
                  key={item.node.id || idx}
                  node={item.node}
                  role={item.role}
                  active={true}
                  onClick={() => jumpToSearchResult(item)}
                  ancestors={item.ancestors}
                  dark={dark} text={text} subtext={subtext}
                  onMessage={openMessagePopup}
                  onPrint={openPrintPopup}
                />
              ))}
            </div>
          )
        ) : !loading && root && (
          <>
            {/* ── viewer's own sub dealer node ── */}
            <div className="gsa-card" style={{ borderColor: ROLE_CFG.sub_dealer.color, background: `${ROLE_CFG.sub_dealer.color}14` }}>
              <IconLink color={ROLE_CFG.sub_dealer.color} size={18} />
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: ROLE_CFG.sub_dealer.color }}>
                  LEVEL 1 · SUB DEALER
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: text, marginTop: 2 }}>
                  {root.first_name} {root.last_name || ''} ({root.sub_dealer_id})
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', color: subtext, marginBottom: 10, marginLeft: 4 }}>
              <IconChevronDown color={subtext} />
            </div>

            <LaneRow role="promotor" items={filteredPromotors} activeId={currentPromotor?.id} onSelect={selectPromotor}
              ancestors={promotorAncestors} dark={dark} text={text} subtext={subtext}
              emptyText="No promotors under you yet." onMessage={openMessagePopup} onPrint={openPrintPopup}
              activeStatusFilter={activeStatusFilter} onToggleStatusFilter={toggleStatusFilter} />

            {currentPromotor && (
              <LaneRow role="customer" items={filteredCustomers} activeId={null} onSelect={() => {}}
                ancestors={customerAncestors} dark={dark} text={text} subtext={subtext}
                emptyText={`No customers match this filter under ${currentPromotor.first_name}.`} onMessage={openMessagePopup} onPrint={openPrintPopup}
                activeStatusFilter={activeStatusFilter} onToggleStatusFilter={toggleStatusFilter} />
            )}
          </>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '20px', padding: '14px 0', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {['sub_dealer', 'promotor', 'customer'].map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: ROLE_CFG[l].color }} />
              <span style={{ color: subtext, fontSize: '11px' }}>{ROLE_CFG[l].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {messageTarget && (
      <div
        onClick={() => setMessageTarget(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg,#0a1628,#060e1c)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMessage color="#f87171" size={14} /> SEND DIRECT MESSAGE
              </div>
              <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                To: <span style={{ color: text, fontWeight: 700 }}>
                  {messageTarget.node.first_name} {messageTarget.node.last_name || ''}
                </span>{' '}
                ({ROLE_CFG[messageTarget.role]?.label}) — only they get this
              </div>
            </div>
            <button onClick={() => setMessageTarget(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconX color="#f87171" size={12} />
            </button>
          </div>

          {messageMsg && (
            <div style={{ background: messageMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${messageMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: messageMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
              {messageMsg}
            </div>
          )}

          <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Subject *</label>
          <input
            value={messageTitle}
            onChange={e => setMessageTitle(e.target.value)}
            placeholder="e.g. Orders running slow"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', fontSize: '14px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#ef4444'}
            onBlur={e => e.target.style.borderColor = '#374151'}
          />

          <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
          <textarea
            value={messageBody}
            onChange={e => setMessageBody(e.target.value)}
            rows={4}
            placeholder="Type your message..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#ef4444'}
            onBlur={e => e.target.style.borderColor = '#374151'}
          />

          <button
            disabled={messageSending || !messageTitle.trim() || !messageBody.trim()}
            onClick={sendDirectMessage}
            style={{ marginTop: '16px', width: '100%', padding: '13px', background: messageSending ? 'rgba(239,68,68,0.25)' : 'linear-gradient(90deg,#ef4444,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', color: messageSending ? '#f87171' : '#1e003b', cursor: (messageSending || !messageTitle.trim() || !messageBody.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {messageSending ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(239,68,68,0.3)', borderTop: '2px solid #f87171', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Sending...
              </>
            ) : (
              <><IconMessage color={(messageSending || !messageTitle.trim() || !messageBody.trim()) ? '#f87171' : '#1e003b'} size={14} /> Send to this person only</>
            )}
          </button>
        </div>
      </div>
    )}

    {printTarget && (
      <div onClick={() => setPrintTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg,#0a1628,#060e1c)', border: `1px solid ${printTarget.color}55`, borderRadius: '20px', padding: '26px', width: '95%', maxWidth: '380px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <IconPrinter color={printTarget.color} size={22} />
          </div>
          <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
            Print {printTarget.node.first_name}'s Profile
          </div>
          <div style={{ color: subtext, fontSize: '12px', marginBottom: '20px' }}>Enna print pannanum nu select pannunga bro</div>

          <button onClick={handlePrintOnly} style={{ width: '100%', padding: '13px', marginBottom: '10px', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${printTarget.color}`, borderRadius: '12px', color: printTarget.color, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
            {ROLE_CFG[printTarget.role]?.label} Only
          </button>
          <button onClick={handlePrintHierarchy} style={{ width: '100%', padding: '13px', marginBottom: '10px', background: `linear-gradient(90deg, ${printTarget.color}, #a78bfa)`, border: 'none', borderRadius: '12px', color: '#020617', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
            {ROLE_CFG[printTarget.role]?.label} Hierarchy (Full Tree)
          </button>
          <button onClick={() => setPrintTarget(null)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: subtext, fontSize: '12px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    )}
    </>
  )
}
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import logo from '../assets/logo.png'

import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin-transparent.png'

const OCCUPATION_OPTIONS = ['employee', 'business', 'others']

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i, size: Math.random() * 60 + 10, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.2 + 0.05,
}))

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#f59e0b', '#60a5fa']

// ─── ROLE CONFIG ───────────────────────────────────────────────────────────────
const ROLE_CFG = {
  admin: { color: '#22d3ee', label: '🛡️ ADMIN', idKey: 'admin_id' },
  dealer: { color: '#4ade80', label: '🏪 DEALER', idKey: 'dealer_id' },
  sub_dealer: { color: '#f59e0b', label: '🔗 SUB DEALER', idKey: 'sub_dealer_id' },
  promotor: { color: '#a78bfa', label: '🌟 PROMOTOR', idKey: 'promotor_id' },
  customer: { color: '#f472b6', label: '👤 CUSTOMER', idKey: 'customer_id' },
}

// ─── TREE NODE COMPONENT ───────────────────────────────────────────────────────
function TreeNode({ node, role, depth = 0, dark, text, subtext, colorIdx = 0, ancestors = [], superAdminEmail = '', flatMode = false }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const cfg = ROLE_CFG[role]
  const c = COLORS[colorIdx % COLORS.length]

  const childRole = {
    admin: 'dealer',
    dealer: 'sub_dealer',
    sub_dealer: 'promotor',
    promotor: 'customer',
  }[role]

  const children = {
    admin: node.dealers,
    dealer: node.sub_dealers,
    sub_dealer: node.promotors,
    promotor: node.customers,
  }[role] || []

  const hasChildren = !flatMode && children.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
      {/* Node Card */}
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          background: dark ? `rgba(${hexToRgb(c)},0.06)` : `rgba(${hexToRgb(c)},0.08)`,
          border: `1px solid rgba(${hexToRgb(c)},0.35)`,
          borderRadius: '12px',
          padding: '12px 16px',
          minWidth: '160px',
          maxWidth: '200px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
        onMouseEnter={e => {
          clearTimeout(_chainHideTimer)
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgb(c)},0.25)`
          e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.7)`
          showChainPopup(e.currentTarget, ancestors, { node, role }, dark, text, subtext, superAdminEmail)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = `rgba(${hexToRgb(c)},0.35)`
          _chainHideTimer = setTimeout(() => removeChainPopup(), 300)
        }}
      >
        {/* Role Badge */}
        <div style={{
          display: 'inline-block', fontSize: '9px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '20px', marginBottom: '8px',
          background: `rgba(${hexToRgb(c)},0.15)`,
          color: c, border: `1px solid rgba(${hexToRgb(c)},0.35)`,
        }}>
          {cfg.label}
        </div>

        {/* ID */}
        <div style={{ color: c, fontFamily: 'monospace', fontSize: '10px', marginBottom: '4px', wordBreak: 'break-all' }}>
          {node[cfg.idKey]}
        </div>

        {/* Name */}
        <div style={{ color: text, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
          {node.first_name} {node.last_name || ''}
        </div>

        {/* Phone */}
        <div style={{ color: subtext, fontSize: '11px', marginBottom: '2px' }}>
          📞 {node.mobile_number}
        </div>

        {/* City */}
        {node.city_name && (
          <div style={{ color: subtext, fontSize: '11px' }}>📍 {node.city_name}</div>
        )}

        {/* Gradient bar */}
        <div style={{
          marginTop: '8px', width: '100%', height: 2, borderRadius: 2,
          background: `linear-gradient(90deg,rgba(${hexToRgb(c)},0.2),${c})`,
        }} />

        {/* Print + Sales Count Buttons */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
          <button
            onClick={e => {
              e.stopPropagation()
              printPersonCard(node, role, cfg, c, ancestors, superAdminEmail)
            }}
            style={{
              flex: 1,
              padding: '3px 0', fontSize: '9px', fontWeight: 700,
              background: `rgba(${hexToRgb(c)},0.1)`,
              border: `1px solid rgba(${hexToRgb(c)},0.35)`,
              borderRadius: '6px', color: c, cursor: 'pointer',
              letterSpacing: '0.8px', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.25)` }}
            onMouseLeave={e => { e.currentTarget.style.background = `rgba(${hexToRgb(c)},0.1)` }}
          >
            🖨️ PRINT
          </button>

          <button
            onClick={e => {
              e.stopPropagation()
              window.open(`/hierarchy-sales-count?role=${role}&id=${node.id}`, 'hierarchy_sales_count_tab')
            }}
            style={{
              flex: 1,
              padding: '3px 0', fontSize: '9px', fontWeight: 700,
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.4)',
              borderRadius: '6px', color: '#4ade80', cursor: 'pointer',
              letterSpacing: '0.8px', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)' }}
          >
            📊 SALES
            <span style={{
              background: '#4ade80', color: '#000', borderRadius: '10px',
              padding: '0 5px', fontSize: '9px', fontWeight: 900, minWidth: '14px',
            }}>
              {node.order_count || 0}
            </span>
          </button>
        </div>

        {/* Expand indicator */}
        {hasChildren && (
          <div style={{
            position: 'absolute', top: '8px', right: '10px',
            color: c, fontSize: '10px', fontWeight: 700,
            transition: 'transform 0.3s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>
            ▲
          </div>
        )}

        {/* Children count badge */}
        {hasChildren && (
          <div style={{
            position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
            background: c, color: '#000', fontSize: '9px', fontWeight: 800,
            padding: '1px 7px', borderRadius: '20px', whiteSpace: 'nowrap',
          }}>
            {children.length} {childRole?.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          {/* ── Vertical stem down from parent ── */}
          <div style={{ width: 2, height: 28, background: `linear-gradient(180deg,${c},rgba(${hexToRgb(c)},0.3))`, marginTop: '10px' }} />

          {/* ── Horizontal line + children ── */}
          <div style={{ position: 'relative', width: '100%' }}>

            {/* Horizontal connector line — spans full width */}
            {children.length > 1 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `rgba(${hexToRgb(c)},0.45)`,
              }} />
            )}

            {/* Children row */}
            <div style={{
              display: 'flex',
              justifyContent: children.length === 1 ? 'center' : 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
              paddingTop: '0',
            }}>
              {children.map((child, ci) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: children.length === 1 ? '0 0 auto' : 1 }}>
                  {/* Vertical stem down to each child */}
                  <div style={{ width: 2, height: 20, background: `rgba(${hexToRgb(c)},0.5)` }} />
                  <TreeNode
                    node={child}
                    role={childRole}
                    depth={depth + 1}
                    dark={dark}
                    text={text}
                    subtext={subtext}
                    colorIdx={colorIdx + ci + 1}
                    ancestors={[...ancestors, { node, role }]}
                    superAdminEmail={superAdminEmail}
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

// hex to rgb helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

let _popupEl = null
let _hideTimer = null

// ─── CHAIN POPUP (hover on any tree node) ──────────────────────────────────
const ROLE_LABELS = {
  admin: { emoji: '🛡️', label: 'ADMIN', color: '#22d3ee', idKey: 'admin_id' },
  dealer: { emoji: '🏪', label: 'DEALER', color: '#4ade80', idKey: 'dealer_id' },
  sub_dealer: { emoji: '🔗', label: 'SUB DEALER', color: '#f59e0b', idKey: 'sub_dealer_id' },
  promotor: { emoji: '🌟', label: 'PROMOTOR', color: '#a78bfa', idKey: 'promotor_id' },
  customer: { emoji: '👤', label: 'CUSTOMER', color: '#f472b6', idKey: 'customer_id' },
}

let _chainPopupEl = null
let _chainHideTimer = null

function removeChainPopup() {
  document.querySelectorAll('#chain-popup').forEach(el => el.remove())
  _chainPopupEl = null
}

function scheduleHideChainPopup() {
  clearTimeout(_chainHideTimer)
  _chainHideTimer = setTimeout(() => removeChainPopup(), 200)
}

function printPersonCard(node, role, cfg, color, ancestors, superAdminEmail) {
  const ROLE_PRINT = {
    admin: { label: 'ADMIN', emoji: '🛡️', idKey: 'admin_id' },
    dealer: { label: 'DEALER', emoji: '🏪', idKey: 'dealer_id' },
    sub_dealer: { label: 'SUB DEALER', emoji: '🔗', idKey: 'sub_dealer_id' },
    promotor: { label: 'PROMOTOR', emoji: '🌟', idKey: 'promotor_id' },
    customer: { label: 'CUSTOMER', emoji: '👤', idKey: 'customer_id' },
  }

  // Full chain: Super Admin + ancestors + current
  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: role, data: node },
  ]

  const chainHtml = chain.map((item, idx) => {
    const isLast = idx === chain.length - 1

    if (item.type === 'super_admin') {
      return `
        <div class="chain-item ${isLast ? 'current' : ''}">
          <div class="chain-role">🛡️ SUPER ADMIN</div>
          <div class="chain-email">${item.data.email || '—'}</div>
        </div>
        ${idx < chain.length - 1 ? `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #94a3b8;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#94a3b8,rgba(148,163,184,0.2));"></div></div></div>` : ''}      `
    }

    const r = ROLE_PRINT[item.type]
    if (!r) return ''
    const d = item.data || {}
    const idVal = d[r.idKey] || d.id || '—'
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || '—'
    const phone = d.mobile_number || '—'
    const city = d.city_name || '—'

    return `
      <div class="chain-item ${isLast ? 'current' : ''}">
        <div class="chain-role">${r.emoji} ${r.label}</div>
        <div class="chain-id">${idVal}</div>
        <div class="chain-name">${name}</div>
        <div class="chain-info">📞 ${phone}</div>
        <div class="chain-info">📍 ${city}</div>
      </div>
      ${idx < chain.length - 1 ? `<div class="chain-arrow"><div style="display:flex;flex-direction:column;align-items:center;gap:0px;"><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #94a3b8;"></div><div style="width:2px;height:12px;background:linear-gradient(180deg,#94a3b8,rgba(148,163,184,0.2));"></div></div></div>` : ''}
    `
  }).join('')

  const currentName = [node.first_name, node.last_name].filter(Boolean).join(' ') || '—'
  const roleLabel = ROLE_PRINT[role]?.label || role.toUpperCase()

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${roleLabel} — ${currentName}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #f8fafc;
          padding: 40px;
          display: flex; justify-content: center;
        }
        .wrapper {
          max-width: 480px; width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 28px;
        }
        .header h1 {
          font-size: 20px; font-weight: 800; color: #020617;
        }
        .header p {
          font-size: 12px; color: #64748b; margin-top: 4px;
        }
        .chain-item {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
        }
        .chain-item.current {
          border-color: ${color};
          background: ${color}11;
          box-shadow: 0 4px 16px ${color}22;
        }
        .chain-role {
          font-size: 10px; font-weight: 800;
          color: #64748b; letter-spacing: 1px;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .chain-item.current .chain-role {
          color: ${color};
        }
        .chain-id {
          font-family: monospace; font-size: 11px;
          color: ${color}; margin-bottom: 4px;
        }
        .chain-name {
          font-size: 16px; font-weight: 800;
          color: #020617; margin-bottom: 6px;
        }
        .chain-email {
          font-size: 12px; color: #475569;
        }
        .chain-info {
          font-size: 12px; color: #475569;
          margin-top: 3px;
        }
        .chain-arrow {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.chain-arrow::before {
  content: '';
  display: flex;
  flex-direction: column;
  align-items: center;
}
        .footer {
          text-align: center;
          font-size: 10px; color: #94a3b8;
          margin-top: 24px; letter-spacing: 0.5px;
        }
        @media print {
          body { background: white; padding: 20px; }
          .chain-item { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>BitByte — ${roleLabel} Profile</h1>
          <p>Hierarchy Chain Report</p>
        </div>
        ${chainHtml}
        <div class="footer">
          Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <script>window.onload = () => { window.print() }<\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

function showChainPopup(anchorEl, ancestors, current, dark, text, subtext, superAdminEmail) {
  clearTimeout(_chainHideTimer)
  removeChainPopup()

  const chain = [
    { type: 'super_admin', data: { email: superAdminEmail } },
    ...ancestors.map(a => ({ type: a.role, data: a.node })),
    { type: current.role, data: current.node },
  ]

  const el = document.createElement('div')
  el.id = 'chain-popup'

  // Inject scrollbar styles once
  if (!document.getElementById('chain-popup-styles')) {
    const s = document.createElement('style')
    s.id = 'chain-popup-styles'
    s.textContent = `
      #chain-popup::-webkit-scrollbar{width:6px}
      #chain-popup::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:10px;margin:4px 0}
      #chain-popup::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#22d3ee,#4ade80);border-radius:10px;box-shadow:0 0 6px rgba(34,211,238,0.4)}
      #chain-popup::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#67e8f9,#86efac)}
      #chain-popup{scrollbar-color:rgba(34,211,238,0.5) rgba(255,255,255,0.03)}
    `
    document.head.appendChild(s)
  }

  const isDark = dark
  el.style.cssText = `
    position:fixed; z-index:9999;
    background:${isDark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)'};
    border:1px solid ${isDark ? 'rgba(34,211,238,0.22)' : 'rgba(37,99,235,0.18)'};
    border-radius:20px; padding:20px;
    box-shadow:${isDark
      ? '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
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
    const isSuperAdmin = item.type === 'super_admin'

const arrowHtml = idx > 0 ? `
  <div style="display:flex;justify-content:center;padding:5px 0;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid rgba(34,211,238,0.5);"></div>
      <div style="width:1.5px;height:16px;background:linear-gradient(180deg,rgba(34,211,238,0.1),rgba(34,211,238,0.65));"></div>
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

    const cfg = ROLE_LABELS[item.type]
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${isDark ? 'rgba(34,211,238,0.1)' : 'rgba(37,99,235,0.08)'};">
      <div style="display:flex;align-items:center;gap:9px;">
        <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#4ade80);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 4px 10px rgba(34,211,238,0.4);">🔗</div>
        <div>
          <div style="font-size:11px;color:${isDark ? '#22d3ee' : '#2563eb'};font-weight:800;letter-spacing:1.8px;">HIERARCHY CHAIN</div>
          <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:2px;">${totalNodes} level${totalNodes !== 1 ? 's' : ''} deep</div>
        </div>
      </div>
      <div style="
        font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;
        background:linear-gradient(90deg,rgba(34,211,238,0.15),rgba(74,222,128,0.12),rgba(34,211,238,0.15));
        background-size:200% auto;
        animation:acpShimmer 2.5s linear infinite;
        border:1px solid rgba(34,211,238,0.22);
        color:${isDark ? '#67e8f9' : '#2563eb'};
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
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 12) left = rect.left - popW - 18
  if (top < 12) top = 12
  if (top + popH > window.innerHeight - 12) top = window.innerHeight - popH - 12
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_chainHideTimer))
  el.addEventListener('mouseleave', () => scheduleHideChainPopup())
  _chainPopupEl = el
}

function removeAdminPopup() {
  document.querySelectorAll('#admin-popup').forEach(el => el.remove())
  _popupEl = null
}

function scheduleHidePopup(setActiveAdmin) {
  clearTimeout(_hideTimer)
  _hideTimer = setTimeout(() => {
    removeAdminPopup()
    setActiveAdmin(null)
  }, 120)
}

function createAdminPopup(a, i, anchorEl, dark, subtext, text) {
  removeAdminPopup()
  const c = COLORS[i % COLORS.length]
  const popupBg = dark ? 'linear-gradient(160deg,#091525,#060e1c)' : 'linear-gradient(160deg,#ffffff,#f1f5f9)'
  const popupBorder = dark ? 'rgba(34,211,238,0.25)' : 'rgba(37,99,235,0.25)'
  const saBoxBg = dark ? 'rgba(255,215,0,0.05)' : 'rgba(255,193,7,0.08)'
  const saBoxBorder = dark ? 'rgba(255,215,0,0.22)' : 'rgba(255,193,7,0.35)'
  const adminBoxBg = dark ? 'rgba(34,211,238,0.04)' : 'rgba(37,99,235,0.05)'
  const adminBoxBd = dark ? 'rgba(34,211,238,0.14)' : 'rgba(37,99,235,0.2)'
  const accentColor = dark ? '#22d3ee' : '#2563eb'

  const el = document.createElement('div')
  el.id = 'admin-popup'
  el.style.cssText = `
  position:fixed; z-index:9999;
  background:${popupBg}; border:1px solid ${popupBorder};
  border-radius:14px; padding:14px;
  box-shadow:0 16px 48px rgba(0,0,0,0.45);
  animation:popupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
  min-width:200px; max-width:240px;
  max-height:82vh;
  overflow-y:auto;
  overflow-x:hidden;
  scroll-behavior:smooth;
  scrollbar-width:thin;
  scrollbar-color:rgba(34,211,238,0.4) transparent;
`
  el.innerHTML = `
    <div style="font-size:9px;color:${accentColor};font-weight:700;letter-spacing:1.3px;margin-bottom:11px;padding-bottom:9px;border-bottom:1px solid ${popupBorder};display:flex;align-items:center;gap:6px;">
      <span style="width:5px;height:5px;border-radius:50%;background:${accentColor};display:inline-block;"></span>
      CREATED BY
    </div>
    <div style="border-radius:9px;padding:11px;margin-bottom:10px;background:${saBoxBg};border:1px solid ${saBoxBorder};">
      <div style="font-size:9px;color:#ffd700;font-weight:700;margin-bottom:5px;">🛡️ SUPER ADMIN</div>
      <div style="font-size:11px;color:${subtext};word-break:break-all;">${localStorage.getItem('email')}</div>
      <div style="margin-top:6px;font-size:9px;padding:2px 8px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.25);border-radius:20px;color:#ffd700;display:inline-block;">● ONLINE</div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;padding:4px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${accentColor};"></div>
        <div style="width:2px;height:7px;background:linear-gradient(180deg,${accentColor},${accentColor}44);"></div>
      </div>
    </div>
    <div style="background:${adminBoxBg};border:1px solid ${adminBoxBd};border-radius:10px;padding:11px;">
      <div style="display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(34,211,238,0.12);color:#22d3ee;border:1px solid rgba(34,211,238,0.25);margin-bottom:6px;">ADMIN</div>
      <div style="font-size:10px;color:${c};font-family:monospace;margin-bottom:3px;">${a.admin_id}</div>
      <div style="font-size:13px;color:${text};font-weight:700;margin-bottom:6px;">${a.first_name}</div>
      <div style="font-size:11px;color:${subtext};margin-bottom:3px;">📞 ${a.mobile_number}</div>
      <div style="font-size:11px;color:${subtext};">📍 ${a.city_name}</div>
    </div>
  `
  document.body.appendChild(el)

  const rect = anchorEl.getBoundingClientRect()
  const popW = el.offsetWidth || 230
  const popH = el.offsetHeight || 220
  let left = rect.right + 14
  let top = rect.top + (rect.height / 2) - (popH / 2)
  if (left + popW > window.innerWidth - 10) left = rect.left - popW - 14
  if (top < 8) top = 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - popH - 8
  el.style.left = left + 'px'
  el.style.top = top + 'px'

  el.addEventListener('mouseenter', () => clearTimeout(_hideTimer))
  el.addEventListener('mouseleave', () => scheduleHidePopup(setActiveAdmin))
  _popupEl = el
}


// ─── ORDER TREND CHART — clean area chart, peak marker, no duplicate axis ──
function OrderTrendChart({ dark }) {
  const [period, setPeriod] = useState('today')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7D' },
    { key: 'month', label: '1M' },
    { key: '3month', label: '3M' },
    { key: 'year', label: '1Y' },
    { key: 'all', label: 'All' },
  ]

  const formatFullLabel = (iso) => {
    const d = new Date(iso)
    const datePart = d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
    const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    return { datePart, timePart }
  }

  const formatAxisLabel = (iso, p) => {
    const d = new Date(iso)
    if (p === 'today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (p === 'week' || p === 'month' || p === '3month') {
      return `${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
    }
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  const fetchData = async (p = period) => {
    setLoading(true)
    try {
      const res = await api.get('/order-timeseries/', { params: { period: p } })
      const formatted = (res.data.data || []).map(d => ({
        ...d,
        label: formatAxisLabel(d.time, p),
        full: formatFullLabel(d.time),
      }))
      setData(formatted)
    } catch {
      setData([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData(period) }, [period])

  // ── KPI: total orders + trend % (second half avg vs first half avg) ──
  const totalOrders = data.reduce((sum, d) => sum + (d.count || 0), 0)
  const mid = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, mid)
  const secondHalf = data.slice(mid)
  const avg = arr => arr.length ? arr.reduce((s, d) => s + d.count, 0) / arr.length : 0
  const firstAvg = avg(firstHalf)
  const secondAvg = avg(secondHalf)
  const trendPercent = firstAvg > 0 ? (((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1) : (secondAvg > 0 ? 100 : 0)
  const isUp = trendPercent >= 0

  // ── Peak point index — used to show a highlighted dot on the busiest bucket ──
  const peakIndex = data.length
    ? data.reduce((maxIdx, d, i, arr) => (d.count > arr[maxIdx].count ? i : maxIdx), 0)
    : -1

  // ── Only label buckets that actually have orders (skip empty stretches) ──
  const activeLabels = data.filter(d => d.count > 0).map(d => d.label)
  const tickFormatter = (label) => (activeLabels.includes(label) ? label : '')

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <div style={{
        background: '#1a2332', border: 'none', borderRadius: 8,
        padding: '14px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        minWidth: 220,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{p.full.datePart}</span>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 5 }}>{p.full.timePart}</span>
        </div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{p.count} orders</div>
      </div>
    )
  }

  // ── Custom dot: only render a visible marker on the peak bucket ──
  const PeakDot = (props) => {
    const { cx, cy, index } = props
    if (index !== peakIndex || cx == null || cy == null) return null
    return (
      <circle cx={cx} cy={cy} r={5} fill="#38bdf8" stroke="#0a1628" strokeWidth={2} />
    )
  }

  return (
    <div style={{ width: '65%', padding: '20px 40px 0' }}>
      <div style={{
        background: '#0a1628',
        border: '1px solid rgba(56,189,248,0.25)',
        borderRadius: 20, padding: '20px 24px',
      }}>
        {/* Header row: title + % badge, period tabs, refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#38bdf8' }}>Order Volume</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isUp ? '#4ade80' : '#f87171' }}>
                {isUp ? '+' : ''}{trendPercent}%
              </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 500, margin: '2px 0 0', color: '#f8fafc' }}>{totalOrders} orders</p>
          </div>
          <button onClick={() => fetchData(period)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.08)', color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, marginTop: 12 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ padding: '6px 14px', borderRadius: 20, border: period === p.key ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: period === p.key ? 'rgba(56,189,248,0.15)' : 'transparent', color: period === p.key ? '#38bdf8' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ height: 480 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>No orders in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="rgba(148,163,184,0.6)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={tickFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  stroke="rgba(148,163,184,0.6)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickCount={5}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#orderGrad)"
                  dot={<PeakDot />}
                  activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0a1628', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(true)
  const [admins, setAdmins] = useState([])
  const [hierarchyData, setHierarchyData] = useState(null)
  const [hierarchyLoading, setHierarchyLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [hierarchyFilter, setHierarchyFilter] = useState(null)
 const [hierarchySearch, setHierarchySearch] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

// Debounce — typing niruthi 300ms aana appuram than search run aagum
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(hierarchySearch.trim()), 120)
  return () => clearTimeout(t)
}, [hierarchySearch])
  const [activeAdmin, setActiveAdmin] = useState(null)
  const hideTimer = useRef(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    initial: '', first_name: '', last_name: '', mobile_number: '',
    gender: 'male', dob: '', married_status: 'single', anniversary_date: '',
    door_no: '', street_name: '', town_name: '',
    city_name: '', district: '', state: '', email: '', password: '',
    aadhaar_no: '', pan_no: '', occupation: 'employee', occupation_detail: '',
    annual_salary: '', admin_name: '', admin_id: '', admin_contact_no: ''
  })
   const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', roles: [] })
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [announcingSending, setAnnouncingSending] = useState(false)
  const [announcementCount, setAnnouncementCount] = useState(0)
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false)
  const [showRequests, setShowRequests] = useState(false)
  const [profileRequests, setProfileRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestMsg, setRequestMsg] = useState('')
  const [proofModal, setProofModal] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [proofType, setProofType] = useState('')
  const [proofLoading, setProofLoading] = useState(false)
  const [showBirthdayList, setShowBirthdayList] = useState(false)
  const [showAnniversaryList, setShowAnniversaryList] = useState(false)
  const [showJoinDateList, setShowJoinDateList] = useState(false)
  const [birthdayList, setBirthdayList] = useState([])
  const [anniversaryList, setAnniversaryList] = useState([])
  const [joinDateList, setJoinDateList] = useState([])
  const [specialAnnForm, setSpecialAnnForm] = useState({ title: '', message: '', roles: [] })
  const [showSpecialAnn, setShowSpecialAnn] = useState(false)
  const [specialAnnMsg, setSpecialAnnMsg] = useState('')
  const [specialAnnSending, setSpecialAnnSending] = useState(false)


  const [replyAnn, setReplyAnn] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [repliedIds, setRepliedIds] = useState(new Set())
  const [annReplies, setAnnReplies] = useState({})
  const [replyPopupAnnId, setReplyPopupAnnId] = useState(null)
  const [metalPrices, setMetalPrices] = useState({
  gold22k: null, gold24k: null, silver: null,
  diamond18k: null, diamond22k: null, platinum92: null,
})
const [showTodayRates, setShowTodayRates] = useState(false)
  const [metalLoading, setMetalLoading] = useState(false)
  const [usdToInr, setUsdToInr] = useState(null)




  // NEW — Rate entry popup
  const [showRatePopup, setShowRatePopup] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    category: '', metal: '', grade: '', name: '', description: '',
    weight_grams: '', tag: '',
  })


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
const [showAddCoin, setShowAddCoin] = useState(false)
const [coinCart, setCoinCart] = useState([])
const [coinBuyMsg, setCoinBuyMsg] = useState('')
const [coinBuySubmitting, setCoinBuySubmitting] = useState(false)
const [selCoinMetal, setSelCoinMetal] = useState('gold_22k')
const [selCoinWeight, setSelCoinWeight] = useState('')
const [selCoinQty, setSelCoinQty] = useState('')
const [showStoredCoin, setShowStoredCoin] = useState(false)
const [coinStock, setCoinStock] = useState([])
const [coinStockLoading, setCoinStockLoading] = useState(false)


  const [productImages, setProductImages] = useState([])  // File objects
  const [productPreviewUrls, setProductPreviewUrls] = useState([])  // preview URLs
  const [productMsg, setProductMsg] = useState('')
  const [productSaving, setProductSaving] = useState(false)
  const [previewImageIdx, setPreviewImageIdx] = useState(null) // for lightbox
  const [livePrice, setLivePrice] = useState(null)
  const [rateForm, setRateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gold_22k: '',
    gold_24k: '',
    silver_999: '',
    diamond_18k: '',
    diamond_22k: '',
    platinum_92: '',
  })
  const [rateMsg, setRateMsg] = useState('')
  const [rateSaving, setRateSaving] = useState(false)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [orderStats, setOrderStats] = useState({
    today: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
    week: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
    month: { gold_22k: { count: 0, grams: 0, amount: 0 }, gold_24k: { count: 0, grams: 0, amount: 0 }, silver_999: { count: 0, grams: 0, amount: 0 } },
  })

  const [orderDetails, setOrderDetails] = useState({
    today: { gold_22k: {}, gold_24k: {}, silver_999: {} },
    week: { gold_22k: {}, gold_24k: {}, silver_999: {} },
    month: { gold_22k: {}, gold_24k: {}, silver_999: {} },
  })

  const [orderPopupState, setOrderPopupState] = useState({
    visible: false,
    period: null,
    metalKey: null,
    left: 0,
    top: 0,
  })

  const orderHideTimer = useRef(null)
  const getOrderPopupPosition = (anchorEl, side = 'right') => {
  const rect = anchorEl.getBoundingClientRect()

  const popupWidth = 320
  const popupHeight = Math.min(window.innerHeight * 0.82, 620)
  const gap = 14
  const margin = 12

  let left =
    side === 'left'
      ? rect.left - popupWidth - gap
      : rect.right + gap

  if (left + popupWidth > window.innerWidth - margin) {
    left = rect.left - popupWidth - gap
  }

  if (left < margin) {
    left = rect.right + gap
  }

  let top = rect.top + rect.height / 2 - popupHeight / 2

  // popup konjam mela irunthu show aaganum na offset reduce pannalam
  top = top - 60

  if (top < margin) {
    top = margin
  }

  if (top + popupHeight > window.innerHeight - margin) {
    top = window.innerHeight - popupHeight - margin
  }

  return { left, top }
}

  const canvasRef = useRef(null)

  const bg = dark ? '#020617' : '#f8fafc'
  const text = dark ? '#f8fafc' : '#020617'
  const subtext = dark ? '#94a3b8' : '#64748b'
  const accent = dark ? '#22d3ee' : '#2563eb'
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const glass = dark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)'
  const cardBg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const cardBorder = dark ? '1px solid rgba(103,232,249,0.1)' : '1px solid rgba(0,0,0,0.1)'
  const inpBg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const inpBorder = dark ? '#374151' : '#d1d5db'  // ADD THIS
  const optionBg = dark ? '#1a2035' : '#ffffff'
  const selectInput = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }

  // Particle canvas
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
    function init() { particlesArray = []; for (let i = 0; i < 60; i++) particlesArray.push(new Particle()) }
    function connect() {
      for (let a = 0; a < particlesArray.length; a++) for (let b = a; b < particlesArray.length; b++) {
        let dx = particlesArray[a].x - particlesArray[b].x, dy = particlesArray[a].y - particlesArray[b].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 150) { ctx.strokeStyle = dark ? `rgba(34,211,238,${1 - d / 150})` : `rgba(37,99,235,${0.5 - d / 300})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke() }
      }
    }
    function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particlesArray.forEach(p => { p.update(); p.draw() }); connect(); animationFrameId = requestAnimationFrame(animate) }
    init(); animate()

    // ── PLANETS & COMETS ADD ──────────────────────────────────────────
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

    function createComet2() {
      const sides = ['top', 'bottom', 'left', 'right']
      const side = sides[Math.floor(Math.random() * 4)]
      let x, y, vx, vy
      const speed = 0.4 + Math.random() * 0.3
      if (side === 'top') { x = Math.random() * canvas2.width; y = -100; vx = 0.1; vy = speed }
      else if (side === 'bottom') { x = Math.random() * canvas2.width; y = canvas2.height + 100; vx = -0.1; vy = -speed }
      else if (side === 'left') { x = -100; y = Math.random() * canvas2.height; vx = speed; vy = 0.1 }
      else { x = canvas2.width + 100; y = Math.random() * canvas2.height; vx = -speed; vy = -0.1 }
      return { x, y, vx, vy, history: [], tailLength: 130 }
    }

    // Second canvas for planets/comets
    const canvas2 = document.createElement('canvas')
    canvas2.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2;opacity:0.5;'
    canvas2.width = window.innerWidth
    canvas2.height = window.innerHeight
    document.body.appendChild(canvas2)
    const ctx2 = canvas2.getContext('2d')

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
    // ── END PLANETS & COMETS ──────────────────────────────────────────

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize2)
      cancelAnimationFrame(animationFrameId)
      cancelAnimationFrame(planetAnimId)
      canvas2.remove()
    }
  }, [dark])



  // AFTER
const fetchAdmins = async () => {
  try {
    const res = await api.get('/admins/')
    setAdmins(res.data)
    return res.data
  } catch { return [] }
}

  // AFTER
const fetchAnnouncementCount = (data) => {
  const lastSeen = parseInt(localStorage.getItem('superAdminAnnouncementSeen') || '0')
  const unread = data.filter(a => new Date(a.created_at).getTime() > lastSeen).length
  setAnnouncementCount(unread)
}

  // AFTER
const [myAnnouncements, setMyAnnouncements] = useState([])

const fetchMyAnnouncements = async (data = null) => {
  try {
    const res = data ? { data } : await api.get('/announcements/')
    const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setMyAnnouncements(sorted)
    return res.data
  } catch { return [] }
}


  // AFTER
const fetchAllMembers = async (adminsData = []) => {
  try {
    const [dealerRes, sdRes, proRes, cusRes] = await Promise.allSettled([
      api.get('/dealers/list/'),
      api.get('/sub-dealers/list/'),
      api.get('/promotors/list/'),
      api.get('/customers/'),
    ])
    const admins = adminsData
    const dealers = dealerRes.status === 'fulfilled' ? dealerRes.value.data : []
    const sds = sdRes.status === 'fulfilled' ? sdRes.value.data : []
    const pros = proRes.status === 'fulfilled' ? proRes.value.data : []
    const cuss = cusRes.status === 'fulfilled' ? cusRes.value.data : []

      const allMembers = [
        ...admins.map(m => ({ ...m, _role: 'Admin', _id: m.admin_id, _roleColor: '#22d3ee', _dob: m.dob, _ann: m.anniversary_date, _joined: m.user?.created_at || null })),
        ...dealers.map(m => ({ ...m, _role: 'Dealer', _id: m.dealer_id, _roleColor: '#4ade80', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...sds.map(m => ({ ...m, _role: 'SubDealer', _id: m.sub_dealer_id, _roleColor: '#f59e0b', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...pros.map(m => ({ ...m, _role: 'Promotor', _id: m.promotor_id, _roleColor: '#a78bfa', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...cuss.map(m => ({ ...m, _role: 'Customer', _id: m.customer_id, _roleColor: '#f472b6', _dob: m.dob || null, _ann: m.anniversary_date || null, _joined: m.user?.created_at || m.created_at || null })),
      ]


      // REPLACE WITH:
      const today = new Date()
      const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // Helper: parse YYYY-MM-DD without timezone shift
      function parseDateLocal(str) {
        if (!str) return null
        const [y, m, d] = str.split('-').map(Number)
        return new Date(y, m - 1, d)
      }

      // BIRTHDAY LIST
      const bdays = allMembers.filter(m => {
        if (!m._dob) return false
        const d = parseDateLocal(m._dob)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setBirthdayList(bdays)

      // ANNIVERSARY LIST
      const anns = allMembers.filter(m => {
        if (!m._ann) return false
        const d = parseDateLocal(m._ann)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setAnniversaryList(anns)

      // JOIN DATE LIST
      const joins = allMembers.filter(m => {
        if (!m._joined) return false
        const d = new Date(m._joined)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      }).map(m => {
        const joinedDate = new Date(m._joined)
        const years = today.getFullYear() - joinedDate.getFullYear()
        return { ...m, _yearsCompleted: years }
      })
      setJoinDateList(joins)

    } catch (e) { console.error('fetchAllMembers error:', e) }
  }

  const fetchProfileRequests = async () => {
    try {
      const res = await api.get('/profile-update-request/')
      setProfileRequests(res.data)
    } catch (err) {
      setRequestMsg('❌ Failed to load requests')
    }
  }

  const approveProfileRequest = async (id) => {
    try {
      await api.post(`/profile-update-request/${id}/approve/`)
      setRequestMsg('✅ Request approved successfully!')
      setSelectedRequest(null)
      fetchProfileRequests()
      fetchAdmins()
      fetchHierarchy()
    } catch (err) {
      setRequestMsg('❌ Approve failed: ' + JSON.stringify(err.response?.data))
    }
  }


  const fetchHierarchy = async () => {
    setHierarchyLoading(true)
    try {
      const res = await api.get('/hierarchy/full/')
      setHierarchyData(res.data)
    } catch (err) {
      console.error('Hierarchy fetch error:', err)
    }
    setHierarchyLoading(false)
  }

  const [loginStatus, setLoginStatus] = useState({ active_count: 0, inactive_count: 0 })
  const fetchLoginStatus = async () => {
    try {
      const res = await api.get('/today-login-status/')
      setLoginStatus(res.data)
    } catch (err) {
      console.error('Login status fetch error:', err)
    }
  }

const fetchMetalPrices = async () => {
    setMetalLoading(true)
    try {
      const res = await api.get('/metal-rates/')
      const d = res.data
      setMetalPrices({
        gold22k: d.gold_22k ? parseFloat(d.gold_22k) : null,
        gold24k: d.gold_24k ? parseFloat(d.gold_24k) : null,
        silver: d.silver_999 ? parseFloat(d.silver_999) : null,
        diamond18k: d.diamond_18k ? parseFloat(d.diamond_18k) : null,
        diamond22k: d.diamond_22k ? parseFloat(d.diamond_22k) : null,
        platinum92: d.platinum_92 ? parseFloat(d.platinum_92) : null,
      })
      setDbRateDate(d.date)
    } catch (e) {
      setMetalPrices({ gold22k: null, gold24k: null, silver: null, diamond18k: null, diamond22k: null, platinum92: null })
      setDbRateDate(null)
    } finally {
      setMetalLoading(false)
    }
  }

  const formatWeight = (grams) => {
    if (grams < 1) {
      return `${(grams * 1000).toFixed(2)} mg`
    }
    return `${grams.toFixed(2)} gm`
  }

  const fetchOrderStats = async () => {
    try {
      const res = await api.get('/metal-orders/')
      const orders = res.data

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek + 1)
      weekStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const empty = () => ({ count: 0, grams: 0, amount: 0 })
      const stats = {
        today: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
        week: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
        month: { gold_22k: empty(), gold_24k: empty(), silver_999: empty() },
      }

      // ── NEW: per-customer breakdown ──────────────────────────────────
      const details = {
        today: { gold_22k: {}, gold_24k: {}, silver_999: {} },
        week: { gold_22k: {}, gold_24k: {}, silver_999: {} },
        month: { gold_22k: {}, gold_24k: {}, silver_999: {} },
      }

      orders.forEach(order => {
        const d = new Date(order.created_at)
        const m = order.metal_type
        if (!stats.today[m]) return
        const grams = parseFloat(order.weight_grams) * parseInt(order.count)
        const amount = parseFloat(order.total_amount)
        const cnt = parseInt(order.count)
        const custId = order.customer_id

        const inMonth = d >= monthStart
        const inWeek = d >= weekStart
        const inToday = d >= todayStart

        if (inMonth) {
          stats.month[m].count += cnt; stats.month[m].grams += grams; stats.month[m].amount += amount
          if (custId) {
            if (!details.month[m][custId]) {
              details.month[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.month[m][custId].count += cnt
            details.month[m][custId].amount += amount
          }
        }
        if (inWeek) {
          stats.week[m].count += cnt; stats.week[m].grams += grams; stats.week[m].amount += amount
          if (custId) {
            if (!details.week[m][custId]) {
              details.week[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.week[m][custId].count += cnt
            details.week[m][custId].amount += amount
          }
        }
        if (inToday) {
          stats.today[m].count += cnt; stats.today[m].grams += grams; stats.today[m].amount += amount
          if (custId) {
            if (!details.today[m][custId]) {
              details.today[m][custId] = { customer_id: custId, email: order.email, count: 0, amount: 0 }
            }
            details.today[m][custId].count += cnt
            details.today[m][custId].amount += amount
          }
        }
      })

      setOrderStats(stats)
      setOrderDetails(details) // ── NEW
    } catch (e) {
      console.error('fetchOrderStats error:', e)
    }
  }

   const calcLivePrice = (weight, metal, grade) => {
    if (!weight || !metal) { setLivePrice(null); return }
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) { setLivePrice(null); return }
    let rate = null
    if (metal === 'gold') {
      rate = grade === '22k' ? metalPrices.gold22k : metalPrices.gold24k
    } else if (metal === 'silver') {
      rate = metalPrices.silver
    }
    if (rate) setLivePrice((w * rate).toFixed(2))
    else setLivePrice(null)
  }


  // AFTER
// AFTER
useEffect(() => {
  (async () => {
    const adminsData = await fetchAdmins()
    fetchAllMembers(adminsData)
  })()
  ;(async () => {
    const annData = await fetchMyAnnouncements()
    fetchAnnouncementCount(annData)
  })()
  fetchProfileRequests()
  fetchMetalPrices()
  fetchOrderStats()
  fetchHierarchy()
  fetchLoginStatus()
}, [])


  const handleOpenHierarchy = () => {
  setShowHierarchy(true)
  setHierarchyFilter(null)
  setHierarchySearch('')
  fetchHierarchy()
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

    if (form.password !== confirmPassword) {
      setPasswordError('❌ Passwords do not match')
      return
    }

    try {
      const cleanedForm = {
        ...form,
        dob: form.dob || null,
        anniversary_date: form.anniversary_date || null,
        admin_name: undefined,
        admin_id: undefined,
        admin_contact_no: undefined,
      }

      console.log('📤 SENDING:', JSON.stringify(cleanedForm, null, 2))  // ← ADD

      await api.post('/admins/', cleanedForm)
      setMsg('✅ Admin created successfully!')
      setShowForm(false)
      setConfirmPassword('')
      setPasswordError('')
      fetchAdmins()
    } catch (err) {
      console.log('❌ ERROR RESPONSE:', err.response?.data)  // ← ADD
      setMsg('❌ Error: ' + JSON.stringify(err.response?.data))
    }
  }



  const flattenByRole = (role) => {
  if (!hierarchyData) return []
  const result = []
  hierarchyData.admins.forEach(admin => {
    if (role === 'admin') { result.push({ node: admin, ancestors: [] }); return }
    admin.dealers.forEach(dealer => {
      if (role === 'dealer') { result.push({ node: dealer, ancestors: [{ node: admin, role: 'admin' }] }); return }
      dealer.sub_dealers.forEach(sd => {
        if (role === 'sub_dealer') { result.push({ node: sd, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }] }); return }
        sd.promotors.forEach(pr => {
          if (role === 'promotor') { result.push({ node: pr, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }] }); return }
          pr.customers.forEach(cus => {
            if (role === 'customer') { result.push({ node: cus, ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }, { node: pr, role: 'promotor' }] }) }
          })
        })
      })
    })
  })
  return result
}

const searchAllHierarchy = (query) => {
  if (!hierarchyData || !query.trim()) return []
  const q = query.trim().toLowerCase()
  const result = []

  const checkMatch = (node, idKey) => {
    const idVal = (node[idKey] || '').toString().toLowerCase()
    const nameVal = `${node.first_name || ''} ${node.last_name || ''}`.toLowerCase()
    const phoneVal = (node.mobile_number || '').toString().toLowerCase()
    return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
  }

  hierarchyData.admins.forEach(admin => {
    if (checkMatch(admin, 'admin_id')) result.push({ node: admin, role: 'admin', ancestors: [] })
    admin.dealers.forEach(dealer => {
      if (checkMatch(dealer, 'dealer_id')) result.push({ node: dealer, role: 'dealer', ancestors: [{ node: admin, role: 'admin' }] })
      dealer.sub_dealers.forEach(sd => {
        if (checkMatch(sd, 'sub_dealer_id')) result.push({ node: sd, role: 'sub_dealer', ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }] })
        sd.promotors.forEach(pr => {
          if (checkMatch(pr, 'promotor_id')) result.push({ node: pr, role: 'promotor', ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }] })
          pr.customers.forEach(cus => {
            if (checkMatch(cus, 'customer_id')) result.push({ node: cus, role: 'customer', ancestors: [{ node: admin, role: 'admin' }, { node: dealer, role: 'dealer' }, { node: sd, role: 'sub_dealer' }, { node: pr, role: 'promotor' }] })
          })
        })
      })
    })
  })
  return result
}

// ✅ NEW — idha inga add pannunga (function-ku keezha)
const searchResults = useMemo(() => {
  if (!debouncedSearch) return []
  return searchAllHierarchy(debouncedSearch)
}, [debouncedSearch, hierarchyData])

  // ── ORDER HIERARCHY BUILDER ─────────────────────────────────────────────────
const buildHierarchyOrders = (period, metalKey) => {
  if (!hierarchyData) return null
  const custOrders = orderDetails[period]?.[metalKey] || {}
  const superAdminEmail = localStorage.getItem('email') || ''
  let superTotal = 0
  const matchedIds = new Set()

  const admins = (hierarchyData.admins || []).map(admin => {
    let adminTotal = 0
    const dealers = (admin.dealers || []).map(dealer => {
      let dealerTotal = 0
      const subDealers = (dealer.sub_dealers || []).map(sd => {
        let sdTotal = 0
        const promotors = (sd.promotors || []).map(pr => {
          let prTotal = 0

          // ✅ FIX: Try all possible customer array keys
          const customerList = pr.customers || pr.customer || []
          
          const customers = customerList.map(c => {
            // ✅ FIX: Try all possible id fields
            const custId = c.customer_id || c.id || c.pk
            const o = custOrders[custId] || { count: 0, amount: 0 }
          
            if (o.count > 0) matchedIds.add(custId)
            prTotal += o.count
            return { ...c, orderCount: o.count, orderAmount: o.amount }
          }).filter(c => c.orderCount > 0)
          
          sdTotal += prTotal
          return { ...pr, customers, orderCount: prTotal }
        }).filter(pr => pr.orderCount > 0)
        
        dealerTotal += sdTotal
        return { ...sd, promotors, orderCount: sdTotal }
      }).filter(sd => sd.orderCount > 0)
      
      adminTotal += dealerTotal
      return { ...dealer, subDealers, orderCount: dealerTotal }
    }).filter(d => d.orderCount > 0)
    
    superTotal += adminTotal
    return { ...admin, dealers, orderCount: adminTotal }
  }).filter(a => a.orderCount > 0)

  const unlinked = Object.values(custOrders).filter(o => !matchedIds.has(o.customer_id))
  const unlinkedTotal = unlinked.reduce((s, o) => s + o.count, 0)
  superTotal += unlinkedTotal

  return { superAdminEmail, superTotal, admins, unlinked, unlinkedTotal }
}


  const s = {
    card: { background: cardBg, border: cardBorder, borderRadius: '20px', padding: '32px 36px', marginBottom: '24px' },
    secHead: { color: '#a5f3fc', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px', paddingBottom: '14px', borderBottom: cardBorder },
    secSub: { color: '#a5f3fc', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 0', paddingBottom: '10px', borderBottom: cardBorder },
    lbl: { display: 'block', color: subtext, fontSize: '12px', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    inp: { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  }

  // Count total members
  const totalStats = hierarchyData ? {
    admins: hierarchyData.admins.length,
    dealers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.length, 0),
    subDealers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.length, 0), 0),
    promotors: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.reduce((c, sd) => c + sd.promotors.length, 0), 0), 0),
    customers: hierarchyData.admins.reduce((a, ad) => a + ad.dealers.reduce((b, d) => b + d.sub_dealers.reduce((c, sd) => c + sd.promotors.reduce((e, pr) => e + pr.customers.length, 0), 0), 0), 0),
  } : null


  const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }
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

const fetchCoinRequests = async () => {
  setCoinReqLoading(true)
  try {
    const res = await api.get('/coin-requests/')
    setCoinRequests(res.data)
  } catch { setCoinRequests([]) }
  setCoinReqLoading(false)
}

const approveCoinRequest = async (reqId) => {
  setApprovingReqId(reqId)
  setCoinReqMsg('')
  try {
    await api.post(`/coin-requests/${reqId}/approve/`)
    setCoinReqMsgType('success')
    setCoinReqMsg('Request approved successfully.')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to approve request. Please try again.')
  }
  setApprovingReqId(null)
}

const approveAllCoinRequests = async () => {
  setApprovingAll(true)
  setCoinReqMsg('')
  try {
    await api.post('/coin-requests/approve-all/')
    setCoinReqMsgType('success')
    setCoinReqMsg('All requests approved successfully.')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to approve requests. Please try again.')
  }
  setApprovingAll(false)
}

const rejectCoinRequest = async (reqId) => {
  if (!rejectReason.trim()) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Please enter a reason for rejection.')
    return
  }
  setRejectSubmitting(true)
  setCoinReqMsg('')
  try {
    await api.post(`/coin-requests/${reqId}/reject/`, { message: rejectReason.trim() })
    setCoinReqMsgType('success')
    setCoinReqMsg('Request rejected successfully.')
    setRejectingReqId(null)
    setRejectReason('')
    fetchCoinRequests()
  } catch (err) {
    setCoinReqMsgType('error')
    setCoinReqMsg('Failed to reject request. Please try again.')
  }
  setRejectSubmitting(false)
}

const addToCoinCart = () => {
  if (!selCoinWeight || !selCoinQty || Number(selCoinQty) < 1) {
    setCoinBuyMsg('error:Please select weight and quantity')
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

const submitAddCoins = async () => {
  if (coinCart.length === 0) {
    setCoinBuyMsg('error:Add at least one item to the cart')
    return
  }
  setCoinBuySubmitting(true)
  try {
    await api.post('/coin-stock/add/', { items: coinCart })
    setCoinBuyMsg('success:Coins added to your stock!')
    setCoinCart([])
    setTimeout(() => { setShowAddCoin(false); setCoinBuyMsg('') }, 1400)
  } catch (err) {
    setCoinBuyMsg('error:' + (err.response?.data?.error || 'Failed to add coins'))
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

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, transition: 'background 0.8s ease, color 0.4s ease', fontFamily: '"Inter",system-ui,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float-orb{0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}100%{transform:translate(0,0) scale(1)}}
        @keyframes antigravity{0%{transform:translateY(110vh) rotate(0deg);opacity:0}10%{opacity:var(--op)}90%{opacity:var(--op)}100%{transform:translateY(-20vh) rotate(360deg);opacity:0}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 8px rgba(34,211,238,0.15);}50%{box-shadow:0 0 22px rgba(34,211,238,0.35);}}
        @keyframes dotPulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.6);opacity:1;}}
        @keyframes popupIn{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .sa-inp:focus{border-color:#22d3ee !important}
        .sa-grad-btn{position:relative;overflow:hidden}
        .sa-grad-btn::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:translateX(-100%)}
        .sa-grad-btn:hover::after{animation:shimmer 1s infinite}
        .sa-tr:hover td{background:rgba(255,255,255,.02)}
        @keyframes acpSlideIn{from{opacity:0;transform:translateX(18px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes acpPulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes acpGlow{0%,100%{box-shadow:0 0 0px rgba(34,211,238,0)}50%{box-shadow:0 0 20px rgba(34,211,238,0.22)}}
        @keyframes acpShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes acpBadgePop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}

        .h-card{background:rgba(255,255,255,0.03);border:1px solid rgba(165,243,252,0.18);border-radius:14px;padding:14px 18px;min-width:140px;cursor:pointer;position:relative;overflow:hidden;transition:background 0.35s ease,border-color 0.35s ease,transform 0.4s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.35s ease;}
        .h-card.h-active{background:rgba(34,211,238,0.07);border-color:rgba(34,211,238,0.65);transform:translateY(-6px) scale(1.02);box-shadow:0 12px 32px rgba(34,211,238,0.18);animation:pulseGlow 2.5s ease-in-out infinite;}
        .tree-node-enter{animation:fadeIn 0.4s ease both;}
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.45 }} />

      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, top: '8%', left: '8%', width: '380px', height: '380px', background: dark ? 'rgba(34,211,238,0.08)' : 'rgba(37,99,235,0.08)' }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, bottom: '10%', right: '4%', width: '460px', height: '460px', background: dark ? 'rgba(236,72,153,0.05)' : 'rgba(219,39,119,0.05)', animationDelay: '-5s' }} />

      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, bottom: '-100px', width: p.size, height: p.size, borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%', border: `1px solid ${accent}44`, opacity: p.opacity, animation: `antigravity ${p.duration}s ${p.delay}s infinite linear`, '--op': p.opacity, pointerEvents: 'none', zIndex: 0 }} />
      ))}

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, background: glass, borderBottom: `1px solid ${border}`, padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(16px)', transition: 'background 0.8s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
          <img src={logo} alt="BitByte Logo" style={{ width: 60, height: 50, borderRadius: '10px', objectFit: 'contain' }} />
          <span style={{ color: '#a5f3fc', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a5f3fc" strokeWidth="2">
    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" strokeLinejoin="round"/>
    <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  Super Admin
</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>


          {/* 💰 Rate Entry Button */}
          <div
            onClick={() => {
              setShowRatePopup(true)
              setRateMsg('')
              // Pre-fill form with today's date
              setRateForm(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
              }))
            }}
            title="Enter Today's Metal Rates"
            style={{
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,215,0,0.45)',
              background: 'rgba(255,215,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.25)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2">
  <circle cx="12" cy="12" r="9"/>
  <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1 2.5 2c0 2-5 1.5-5 4 0 1 1.1 2 2.5 2s2.5-1.1 2.5-2.5" strokeLinecap="round"/>
</svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffd700' }}>Rate</span>
          </div>



            {/* 🛍️ Add Product Button */}
          <div
            onClick={() => navigate('/add-product')}
            title="Add Jewelry Product"
            style={{
              cursor: 'pointer', padding: '6px 12px', borderRadius: '10px',
              border: '1px solid rgba(167,139,250,0.45)',
              background: 'rgba(167,139,250,0.1)',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
  <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round"/>
  <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round"/>
</svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>Add Product</span>
          </div>

          {/* 📋 Orders Button — NEW */}
<div
  onClick={() => navigate('/admin-orders')}
  title="View All Jewelry Orders"
  style={{
    cursor: 'pointer', padding: '6px 12px', borderRadius: '10px',
    border: '1px solid rgba(74,222,128,0.45)',
    background: 'rgba(74,222,128,0.1)',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
  <rect x="5" y="4" width="14" height="17" rx="2"/>
  <path d="M9 3h6v3H9z"/>
  <path d="M8 11h8M8 15h5" strokeLinecap="round"/>
</svg>
  <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80' }}>Orders</span>
</div>


          <div
            onClick={() => { setShowRequests(true); setRequestMsg('') }}
            style={{
              position: 'relative',          // ← badge-ku base
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid rgba(167,139,250,0.35)',
              background: 'rgba(167,139,250,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease'
            }}


            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(167,139,250,0.25)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(167,139,250,0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
  <rect x="3" y="5" width="18" height="14" rx="2"/>
  <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>Requests</span>
            {profileRequests.length > 0 && (
              <div style={{
                position: 'absolute', top: '-7px', right: '-7px',   // ← இப்போ சரியா work ஆகும்
                background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
                color: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px',
                fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '0 3px',
                boxShadow: '0 2px 8px rgba(167,139,250,0.5)', border: '1.5px solid #020617'
              }}>
                {profileRequests.length > 99 ? '99+' : profileRequests.length}
              </div>
            )}
          </div>

          {/* 🎂 Birthday Icon */}
          <div
            onClick={() => { setShowBirthdayList(true) }}
            title="Today's Birthdays"
            style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '10px', border: '1px solid rgba(244,114,182,0.35)', background: 'rgba(244,114,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2">
  <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/>
  <path d="M4 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1" strokeLinecap="round"/>
  <path d="M12 10V6M9 6c0-1 1-1 1-2s-1-1-1-2M15 6c0-1-1-1-1-2s1-1 1-2" strokeLinecap="round"/>
</svg>
            {birthdayList.length > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#f472b6,#a78bfa)', color: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(244,114,182,0.5)', border: '1.5px solid #020617' }}>
                {birthdayList.length}
              </div>
            )}
          </div>

          {/* 💍 Anniversary Icon */}
          <div
            onClick={() => { setShowAnniversaryList(true) }}
            title="Today's Anniversaries"
            style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.35)', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>💍</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
  <circle cx="12" cy="15" r="6"/>
  <path d="M9 9l3-6 3 6" strokeLinejoin="round"/>
</svg>{anniversaryList.length > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(167,139,250,0.5)', border: '1.5px solid #020617' }}>
                {anniversaryList.length}
              </div>
            )}
          </div>

          {/* 🏆 Join Date Icon */}
          <div
            onClick={() => { setShowJoinDateList(true) }}
            title="Today's Work Anniversaries"
            style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
  <path d="M8 4h8v6a4 4 0 01-8 0V4z"/>
  <path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4" strokeLinecap="round"/>
  <path d="M12 14v3M9 21h6M9 21l1-4h4l1 4" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
            {joinDateList.length > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#f59e0b,#fb923c)', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(245,158,11,0.5)', border: '1.5px solid #020617' }}>
                {joinDateList.length}
              </div>
            )}
          </div>


          {/* 📢 Announcement Icon */}
          <div
            onClick={() => {
              setShowAnnouncement(true)  // keep existing behavior (send modal)
              localStorage.setItem('superAdminAnnouncementSeen', Date.now().toString())
              setAnnouncementCount(0)
              setAnnouncementMsg('')
            }}

            style={{ position: 'relative', cursor: 'pointer', padding: '6px', borderRadius: '10px', border: '1px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2">
  <path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z" strokeLinejoin="round"/>
  <path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12" strokeLinecap="round"/>
</svg>
            {announcementCount > 0 && (
              <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 2px 8px rgba(251,146,60,0.5)', border: '1.5px solid #020617' }}>
                {announcementCount > 99 ? '99+' : announcementCount}
              </div>
            )}
          </div>

          {/* 📬 Super Admin View Announcements */}
          <div
            onClick={() => {
              setShowMyAnnouncements(true)
              fetchMyAnnouncements()
            }}
            title="View My Announcements"
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid rgba(34,211,238,0.35)',
              background: 'rgba(34,211,238,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(34,211,238,0.25)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(34,211,238,0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
  <rect x="2" y="7" width="20" height="13" rx="2"/>
  <path d="M2 9l10 6 10-6" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M16 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
          </div>

          {/* 📊 Today Rates Icon */}
          <div
            onClick={() => setShowTodayRates(true)}
            title="Today's Metal Rates"
            style={{
              cursor: 'pointer', padding: '6px 12px', borderRadius: '10px',
              border: '1px solid rgba(255,215,0,0.45)',
              background: 'rgba(255,215,0,0.1)',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2">
  <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffd700' }}>Today Rates</span>
          </div>

          

          <div onClick={() => { setShowAddCoin(true); setCoinCart([]); setCoinBuyMsg('') }}
  style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Add Coins</span>
</div>

<div onClick={() => { setShowStoredCoin(true); fetchCoinStock() }}
  style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>Stored Coin</span>
</div>

<div onClick={() => { setShowRequestCoin(true); fetchCoinRequests(); setCoinReqMsg('') }}
  style={{ position: 'relative', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Coin Requests</span>
  {coinRequests.filter(r => r.status === 'pending').length > 0 && (
    <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: '#fbbf24', color: '#000', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {coinRequests.filter(r => r.status === 'pending').length}
    </div>
  )}
</div>

          <button onClick={() => setDark(!dark)}


            style={{ padding: '8px 16px', borderRadius: '16px', border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.3s ease' }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }}
            style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%' }}>
        <OrderTrendChart dark={dark} />

        {/* ── RIGHT SIDE: Role Distribution + Login Status Pies ── */}
        <div style={{ width: '35%', padding: '20px 40px 0 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Role Distribution Pie */}
          <div style={{ background: '#0a1628', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>Role Distribution</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>
              {totalStats ? (totalStats.admins + totalStats.dealers + totalStats.subDealers + totalStats.promotors + totalStats.customers) : 0} total
            </div>
            {totalStats && (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Admin', value: totalStats.admins },
                      { name: 'Dealer', value: totalStats.dealers },
                      { name: 'Sub Dealer', value: totalStats.subDealers },
                      { name: 'Promotor', value: totalStats.promotors },
                      { name: 'Customer', value: totalStats.customers },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    <Cell fill="#22d3ee" />
                    <Cell fill="#4ade80" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#a78bfa" />
                    <Cell fill="#f472b6" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2332', border: 'none', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
              {[
                { label: 'Admin', color: '#22d3ee', count: totalStats?.admins || 0 },
                { label: 'Dealer', color: '#4ade80', count: totalStats?.dealers || 0 },
                { label: 'Sub Dealer', color: '#f59e0b', count: totalStats?.subDealers || 0 },
                { label: 'Promotor', color: '#a78bfa', count: totalStats?.promotors || 0 },
                { label: 'Customer', color: '#f472b6', count: totalStats?.customers || 0 },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{l.label} {l.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active/Inactive Login Pie */}
          <div style={{ background: '#0a1628', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>Today's Login Status</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>
              {loginStatus.active_count + loginStatus.inactive_count} total users
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: loginStatus.active_count },
                    { name: 'Inactive', value: loginStatus.inactive_count },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  onClick={(entry) => {
                    if (entry.name === 'Active') navigate('/login-active')
                    else navigate('/login-inactive')
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Cell fill="#4ade80" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2332', border: 'none', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
              <div
                onClick={() => navigate('/login-active')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>Active {loginStatus.active_count}</span>
              </div>
              <div
                onClick={() => navigate('/login-inactive')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
                <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>Inactive {loginStatus.inactive_count}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '36px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        {msg && (
          <div style={{ background: msg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.includes('✅') ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.3)'}`, color: msg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        {/* ── GOLD & SILVER PRICE TABLE — HORIZONTAL LAYOUT ── */}
        <div style={{
          display: 'flex',
          gap: '0',
          background: cardBg,
          border: cardBorder,
          borderRadius: '20px',
          marginBottom: '24px',
          overflow: 'hidden',
          minHeight: '420px',
        }}>

          {/* ── LEFT 20% : Sales Summary ── */}
          <div style={{
            width: '20%',
            minWidth: '160px',
            borderRight: `1px solid ${border}`,
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{
              color: '#a5f3fc', fontSize: '10px', fontWeight: 800,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              paddingBottom: '10px', borderBottom: `1px solid ${border}`,
            }}>
              📊 Order Summary
            </div>

            {[
              { label: 'Today Order', color: '#22d3ee', data: orderStats.today, periodKey: 'today' },
              { label: 'This Week Order', color: '#4ade80', data: orderStats.week, periodKey: 'week' },
              { label: 'This Month Order', color: '#a78bfa', data: orderStats.month, periodKey: 'month' },
            ].map(s => {
              const total22k = s.data.gold_22k
              const total24k = s.data.gold_24k
              const totalSilver = s.data.silver_999
              return (
                <div key={s.label} style={{
                  background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: cardBorder,
                  borderRadius: '10px',
                  padding: '10px',
                }}>
                  <div style={{ fontSize: '9px', color: s.color, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {s.label}
                  </div>

                  {/* 22K */}
                  <div
                    onMouseEnter={e => {
                      clearTimeout(orderHideTimer.current)
                      const pos = getOrderPopupPosition(e.currentTarget, 'right')

                     setOrderPopupState({
                      visible: true,
                      period: s.periodKey,
                       metalKey: 'gold_22k',
                      left: pos.left,
                       top: pos.top,
                         })
                    }}
                    onMouseLeave={() => {
                      orderHideTimer.current = setTimeout(
                        () => setOrderPopupState(p => ({ ...p, visible: false })),
                        300
                      )
                    }}
                    style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: `1px solid ${border}`, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '8px', color: '#fbbf24', fontWeight: 700, marginBottom: '3px' }}>🏅 22K</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Orders</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>{total22k.count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Grams</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>{formatWeight(total22k.grams)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Value</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>₹{total22k.amount.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* 24K */}
                  <div
                    onMouseEnter={e => {
                      clearTimeout(orderHideTimer.current)
                      const pos = getOrderPopupPosition(e.currentTarget, 'right')

setOrderPopupState({
  visible: true,
  period: s.periodKey,
  metalKey: 'gold_24k',
  left: pos.left,
  top: pos.top,
})
                    }}
                    onMouseLeave={() => {
                      orderHideTimer.current = setTimeout(
                        () => setOrderPopupState(p => ({ ...p, visible: false })),
                        300
                      )
                    }}
                    style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: `1px solid ${border}`, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '8px', color: '#ffd700', fontWeight: 700, marginBottom: '3px' }}>🥇 24K</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Orders</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffd700' }}>{total24k.count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Grams</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffd700' }}>{formatWeight(total24k.grams)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Value</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffd700' }}>₹{total24k.amount.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Silver */}
                  <div
                    onMouseEnter={e => {
                      clearTimeout(orderHideTimer.current)
                     const pos = getOrderPopupPosition(e.currentTarget, 'right')

setOrderPopupState({
  visible: true,
  period: s.periodKey,
  metalKey: 'silver_999',
  left: pos.left,
  top: pos.top,
})
                    }}
                    onMouseLeave={() => {
                      orderHideTimer.current = setTimeout(
                        () => setOrderPopupState(p => ({ ...p, visible: false })),
                        300
                      )
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '8px', color: '#c0c0c0', fontWeight: 700, marginBottom: '3px' }}>🥈 Silver</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Orders</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#c0c0c0' }}>{totalSilver.count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Grams</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#c0c0c0' }}>{formatWeight(totalSilver.grams)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: subtext }}>Value</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#c0c0c0' }}>₹{totalSilver.amount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#334155' }}>Live • Auto refresh</div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', margin: '6px auto 0', boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
            </div>
          </div>

          {/* ── CENTER 60% : Gold & Silver Table ── */}
          <div style={{ width: '60%', padding: '20px 18px', overflowX: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚖️</span>
                <div>
                  <div style={{ color: '#a5f3fc', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
              {/* <button
        onClick={fetchMetalPrices}
        style={{ padding: '6px 14px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '8px', color: '#22d3ee', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
      >
        🔄 Refresh
      </button> */}
            </div>

            {metalLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: subtext }}>Loading prices...</div>
            ) : (() => {
              const WEIGHTS = [
                { label: '50 mg', grams: 0.05 },
                { label: '100 mg', grams: 0.10 },
                { label: '150 mg', grams: 0.15 },
                { label: '200 mg', grams: 0.20 },
                { label: '500 mg', grams: 0.50 },
                { label: '1 gm', grams: 1 },
                { label: '2 gm', grams: 2 },
                { label: '4 gm', grams: 4 },
                { label: '8 gm', grams: 8 },
              ]
return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

    {/* ── GOLD 22K CARDS ── */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🏅</span>
        <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>
          GOLD 22K
        </span>
        {metalPrices.gold22k && (
          <span style={{ color: 'rgba(251,191,36,0.55)', fontSize: '11px' }}>
            ₹{metalPrices.gold22k.toFixed(2)}/gm
          </span>
        )}
      </div>
<div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
        {WEIGHTS.map((w, i) => (
          <div key={w.label} style={{
            flex: 1,
            minWidth: 0,
            background: dark ? 'rgba(251,191,36,0.05)' : 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '14px',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Coin Image */}
           <div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '12px 0',
}}>
              <img
  src={goldCoin}
  alt="Gold 22K"
  style={{
    width: '70px',
    height: '70px',
    objectFit: 'contain',
    background: 'transparent',
    display: 'block',
    filter: 'drop-shadow(0 2px 6px rgba(251,191,36,0.5))'
  }}
/>
            </div>

            {/* Weight Label */}
            <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 800,
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '20px', padding: '2px 8px',
                marginBottom: '6px'
              }}>
                {w.label}
              </div>

              {/* Price */}
              <div style={{
                color: '#fbbf24', fontWeight: 900, fontSize: '12px',
                fontFamily: 'monospace', paddingBottom: '8px'
              }}>
                {metalPrices.gold22k != null
                  ? `₹${(w.grams * metalPrices.gold22k).toFixed(2)}`
                  : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ── GOLD 24K CARDS ── */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🥇</span>
        <span style={{ color: '#ffd700', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>
          GOLD 24K
        </span>
        {metalPrices.gold24k && (
          <span style={{ color: 'rgba(255,215,0,0.55)', fontSize: '11px' }}>
            ₹{metalPrices.gold24k.toFixed(2)}/gm
          </span>
        )}
      </div>
<div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
        {WEIGHTS.map((w, i) => (
          <div key={w.label} style={{
            flex: 1,
            minWidth: 0,
            background: dark ? 'rgba(255,215,0,0.05)' : 'rgba(255,215,0,0.07)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '14px',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,215,0,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
          <div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '12px 0',
}}>

              <img
  src={goldCoin}
  alt="Gold 24K"
  style={{
    width: '70px',
    height: '70px',
    objectFit: 'contain',
    background: 'transparent',
    display: 'block',
    filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.5))'
  }}
/>
            </div>

            <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 800,
                color: '#ffd700',
                background: 'rgba(255,215,0,0.12)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '20px', padding: '2px 8px',
                marginBottom: '6px'
              }}>
                {w.label}
              </div>
              <div style={{
                color: '#ffd700', fontWeight: 900, fontSize: '12px',
                fontFamily: 'monospace', paddingBottom: '8px'
              }}>
                {metalPrices.gold24k != null
                  ? `₹${(w.grams * metalPrices.gold24k).toFixed(2)}`
                  : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ── SILVER 999 CARDS ── */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🥈</span>
        <span style={{ color: '#c0c0c0', fontWeight: 800, fontSize: '12px', letterSpacing: '1px' }}>
          SILVER 999
        </span>
        {metalPrices.silver && (
          <span style={{ color: 'rgba(192,192,192,0.55)', fontSize: '11px' }}>
            ₹{metalPrices.silver.toFixed(2)}/gm
          </span>
        )}
      </div>
<div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
        {WEIGHTS.map((w, i) => (
          <div key={w.label} style={{
            flex: 1,
            minWidth: 0,
            background: dark ? 'rgba(192,192,192,0.04)' : 'rgba(192,192,192,0.07)',
            border: '1px solid rgba(192,192,192,0.25)',
            borderRadius: '14px',
            overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(192,192,192,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
           <div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '12px 0',
}}>

<img
  src={silverCoin}
  alt="Silver 999"
  style={{
    width: '70px',
    height: '70px',
    objectFit: 'contain',
    background: 'transparent',
    display: 'block',
    filter: 'drop-shadow(0 2px 6px rgba(192,192,192,0.45))'
  }}
/>
            </div>

            <div style={{ padding: '8px 8px 4px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 800,
                color: '#c0c0c0',
                background: 'rgba(192,192,192,0.1)',
                border: '1px solid rgba(192,192,192,0.25)',
                borderRadius: '20px', padding: '2px 8px',
                marginBottom: '6px'
              }}>
                {w.label}
              </div>
              <div style={{
                color: '#c0c0c0', fontWeight: 900, fontSize: '12px',
                fontFamily: 'monospace', paddingBottom: '8px'
              }}>
                {metalPrices.silver != null
                  ? `₹${(w.grams * metalPrices.silver).toFixed(2)}`
                  : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
)

            })()}
          </div>

          {/* ── RIGHT 20% : Today's Sales Breakdown ── */}
          <div style={{
            width: '20%',
            minWidth: '160px',
            borderLeft: `1px solid ${border}`,
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{
              color: '#a5f3fc', fontSize: '10px', fontWeight: 800,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              paddingBottom: '10px', borderBottom: `1px solid ${border}`,
            }}>
              🏆 Today Orders
            </div>

            {[
              {
                icon: '🏅', label: 'Gold 22K', color: '#fbbf24',
                bg: 'rgba(251,191,36,0.06)', bd: 'rgba(251,191,36,0.25)',
                data: orderStats.today.gold_22k,
                metalKey: 'gold_22k'
              },
              {
                icon: '🥇', label: 'Gold 24K', color: '#ffd700',
                bg: 'rgba(255,215,0,0.06)', bd: 'rgba(255,215,0,0.25)',
                data: orderStats.today.gold_24k,
                metalKey: 'gold_24k'
              },
              {
                icon: '🥈', label: 'Silver 999', color: '#c0c0c0',
                bg: 'rgba(192,192,192,0.05)', bd: 'rgba(192,192,192,0.2)',
                data: orderStats.today.silver_999,
                metalKey: 'silver_999',
              },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: s.bg, border: `1px solid ${s.bd}`,
                  borderRadius: '10px', padding: '12px 10px',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  clearTimeout(orderHideTimer.current)
                  const pos = getOrderPopupPosition(e.currentTarget, 'left')

setOrderPopupState({
  visible: true,
  period: 'today',
  metalKey: s.metalKey,
  left: pos.left,
  top: pos.top,
})
                }}
                onMouseLeave={() => {
                  orderHideTimer.current = setTimeout(
                    () => setOrderPopupState(p => ({ ...p, visible: false })),
                    300
                  )
                }}
              >

                <div style={{ fontSize: '14px', marginBottom: '5px' }}>{s.icon}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: s.color, marginBottom: '8px' }}>
                  {s.label}
                </div>
                {[
                  { key: 'Order', val: s.data.count },
                  { key: 'Grams', val: formatWeight(s.data.grams) },
                ].map(r => (
                  <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', color: subtext }}>{r.key}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: s.color }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ height: '1px', background: `rgba(255,255,255,0.05)`, margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '9px', color: subtext }}>Total Amount</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: s.color }}>₹{s.data.amount.toFixed(0)}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#334155' }}>BitByte Network</div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Admin Management</h2>
          <div style={{ display: 'flex', gap: '12px' }}>

            <button onClick={() => navigate('/superadmin-hierarchy-grid')}
  style={{ padding: '11px 28px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', fontWeight: 700, color: '#a78bfa', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
  Hierarchy Grid
</button>

<button onClick={() => navigate('/sales-report')}
  style={{ padding: '11px 28px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px', fontWeight: 700, color: '#4ade80', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  Sales Report
</button>
<button onClick={() => navigate('/superadmin-hierarchy')}
  style={{ padding: '11px 28px', background: 'rgba(165,243,252,0.08)', border: '1px solid rgba(103,232,249,0.3)', borderRadius: '12px', fontWeight: 700, color: '#a5f3fc', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5f3fc" strokeWidth="2">
    <rect x="3" y="10" width="6" height="10" rx="1"/>
    <rect x="9" y="4" width="6" height="16" rx="1"/>
    <rect x="15" y="13" width="6" height="7" rx="1"/>
  </svg>
  Admin Hierarchy
</button>
            <button onClick={() => setShowForm(!showForm)} className="sa-grad-btn"
              style={{ padding: '11px 28px', background: 'linear-gradient(90deg,#22d3ee,#4ade80)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#006165', fontSize: '14px', cursor: 'pointer' }}>
              {showForm ? 'Cancel' : '+ Create Admin'}
            </button>
          </div>
        </div>

        {/* ── RATE ENTRY POPUP ── */}
     {showRatePopup && (
          <div
            onClick={() => setShowRatePopup(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(2,6,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
             style={{
                background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc',
                border: '1px solid rgba(255,215,0,0.35)',
                borderRadius: '24px',
                width: '95%', maxWidth: '640px',
                maxHeight: '95vh',
                overflowY: 'auto',
                padding: '28px 32px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M8 6h8l3 5-3 9H8l-3-9 3-5z"/>
                      <path d="M9.5 12c0-1.1.9-2 2.5-2s2.5 1 2.5 2-1.5 1.5-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#ffd700', fontWeight: 800, fontSize: '16px' }}>ENTER METAL RATES</div>
                    <div style={{ color: subtext, fontSize: '12px', marginTop: '2px' }}>
                      {dbRateDate ? `Current: ${dbRateDate}` : 'No rate entered yet'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRatePopup(false)}
                  style={{
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {rateMsg && (
                <div style={{
                  background: rateMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${rateMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: rateMsg.includes('✅') ? '#4ade80' : '#f87171',
                  borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px'
                }}>
                  {rateMsg}
                </div>
              )}

              {/* Date — full width */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Date *
                </label>
                <input
                  type="date"
                  value={rateForm.date}
                  onChange={e => setRateForm({ ...rateForm, date: e.target.value })}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#ffd700'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Grid: 2 columns for all rate fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* 22K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Gold 22K (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12800"
                    value={rateForm.gold_22k}
                    onChange={e => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(251,191,36,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#fbbf24', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#fbbf24'}
                    onBlur={e => e.target.style.borderColor = 'rgba(251,191,36,0.4)'}
                  />
                  {rateForm.gold_22k && (
                    <div style={{ color: '#fbbf24', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.gold_22k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* 24K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffd700', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Gold 24K (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 13900"
                    value={rateForm.gold_24k}
                    onChange={e => setRateForm({ ...rateForm, gold_24k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(255,215,0,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#ffd700', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#ffd700'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,215,0,0.4)'}
                  />
                  {rateForm.gold_24k && (
                    <div style={{ color: '#ffd700', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.gold_24k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Silver */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c0c0c0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/>
                    </svg>
                    Silver 999 (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 225"
                    value={rateForm.silver_999}
                    onChange={e => setRateForm({ ...rateForm, silver_999: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(192,192,192,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#c0c0c0', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#c0c0c0'}
                    onBlur={e => e.target.style.borderColor = 'rgba(192,192,192,0.4)'}
                  />
                  {rateForm.silver_999 && (
                    <div style={{ color: '#c0c0c0', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.silver_999).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Diamond 18K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#67e8f9', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>
                    </svg>
                    Diamond 18K (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={rateForm.diamond_18k}
                    onChange={e => setRateForm({ ...rateForm, diamond_18k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(103,232,249,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#67e8f9', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#67e8f9'}
                    onBlur={e => e.target.style.borderColor = 'rgba(103,232,249,0.4)'}
                  />
                  {rateForm.diamond_18k && (
                    <div style={{ color: '#67e8f9', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.diamond_18k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Diamond 22K */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5f3fc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>
                    </svg>
                    Diamond 22K (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 55000"
                    value={rateForm.diamond_22k}
                    onChange={e => setRateForm({ ...rateForm, diamond_22k: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(165,243,252,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#a5f3fc', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#a5f3fc'}
                    onBlur={e => e.target.style.borderColor = 'rgba(165,243,252,0.4)'}
                  />
                  {rateForm.diamond_22k && (
                    <div style={{ color: '#a5f3fc', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.diamond_22k).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Platinum 92 */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#e2e8f0"/>
                    </svg>
                    Platinum 92 (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3200"
                    value={rateForm.platinum_92}
                    onChange={e => setRateForm({ ...rateForm, platinum_92: e.target.value })}
                    style={{ width: '100%', background: inpBg, border: `1px solid rgba(226,232,240,0.4)`, borderRadius: '10px', padding: '12px 16px', color: '#e2e8f0', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#e2e8f0'}
                    onBlur={e => e.target.style.borderColor = 'rgba(226,232,240,0.4)'}
                  />
                  {rateForm.platinum_92 && (
                    <div style={{ color: '#e2e8f0', fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                      1gm = ₹{parseFloat(rateForm.platinum_92).toFixed(2)}
                    </div>
                  )}
                </div>

              </div>

              {/* Save Button */}
              <button
                disabled={rateSaving}
                onClick={async () => {
                  if (!rateForm.date || !rateForm.gold_22k || !rateForm.gold_24k || !rateForm.silver_999) {
                    setRateMsg('❌ Gold and Silver fields are required.')
                    return
                  }
                  setRateSaving(true)
                  try {
                    await api.post('/metal-rates/', {
                      date: rateForm.date,
                      gold_22k: rateForm.gold_22k,
                      gold_24k: rateForm.gold_24k,
                      silver_999: rateForm.silver_999,
                      diamond_18k: rateForm.diamond_18k || 0,
                      diamond_22k: rateForm.diamond_22k || 0,
                      platinum_92: rateForm.platinum_92 || 0,
                    })
                    setRateMsg('✅ Rate saved successfully!')
                    fetchMetalPrices()
                    setTimeout(() => setShowRatePopup(false), 1400)
                  } catch (err) {
                    setRateMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                  }
                  setRateSaving(false)
                }}
                style={{
                  marginTop: '20px',
                  width: '100%', padding: '14px',
                  background: rateSaving ? 'rgba(255,215,0,0.3)' : 'linear-gradient(90deg,#fbbf24,#ffd700)',
                  border: 'none', borderRadius: '12px',
                  fontWeight: 800, color: rateSaving ? '#ffd700' : '#431407',
                  fontSize: '15px', cursor: rateSaving ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {rateSaving ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(67,20,7,0.3)', borderTop: '2px solid #431407', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Rate
                  </>
                )}
              </button>
            </div>
          </div>
        )}


{/* ── ADD PRODUCT POPUP ── */}
{showAddProduct && (
  <div onClick={() => setShowAddProduct(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)', zIndex:1400, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border:'1px solid rgba(167,139,250,0.35)', borderRadius:'24px', width:'96%', maxWidth:'620px', maxHeight:'92vh', overflowY:'auto', padding:'32px', boxShadow:'0 32px 90px rgba(0,0,0,0.8)', animation:'fadeIn 0.25s ease' }}>
      
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🛍️</div>
          <div>
            <div style={{ color:'#a78bfa', fontWeight:800, fontSize:'15px' }}>ADD JEWELRY PRODUCT</div>
            <div style={{ color:subtext, fontSize:'11px', marginTop:'2px' }}>Fill all details and upload images</div>
          </div>
        </div>
        <button onClick={() => setShowAddProduct(false)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'12px' }}>✕ Close</button>
      </div>

      {productMsg && (
        <div style={{ background: productMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${productMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: productMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', marginBottom:'18px' }}>
          {productMsg}
        </div>
      )}

      {/* STEP 1: Category */}
      <div style={{ marginBottom:'20px' }}>
        <label style={{ display:'block', color:'#a78bfa', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
          Step 1 — Select Category
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {['rings','necklaces','bangles','earrings','chains','coins'].map(cat => (
            <div key={cat} onClick={() => setProductForm(f => ({ ...f, category: cat, metal:'', grade:'' }))}
              style={{ padding:'8px 16px', borderRadius:'20px', cursor:'pointer', fontWeight:700, fontSize:'12px', textTransform:'capitalize', transition:'all 0.2s ease',
                background: productForm.category === cat ? 'rgba(167,139,250,0.25)' : 'rgba(167,139,250,0.05)',
                border: `1.5px solid ${productForm.category === cat ? 'rgba(167,139,250,0.7)' : 'rgba(167,139,250,0.2)'}`,
                color: productForm.category === cat ? '#a78bfa' : subtext,
              }}>
              { {rings:'💍',necklaces:'📿',bangles:'⭕',earrings:'✨',chains:'⛓️',coins:'🪙'}[cat] } {cat}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2: Metal */}
      {productForm.category && (
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', color:'#fbbf24', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
            Step 2 — Select Metal
          </label>
          <div style={{ display:'flex', gap:'10px' }}>
            {['gold','silver'].map(m => (
              <div key={m} onClick={() => setProductForm(f => ({ ...f, metal: m, grade:'' }))}
                style={{ padding:'10px 24px', borderRadius:'20px', cursor:'pointer', fontWeight:800, fontSize:'13px', textTransform:'capitalize', transition:'all 0.2s ease',
                  background: productForm.metal === m ? (m==='gold' ? 'rgba(251,191,36,0.2)' : 'rgba(192,192,192,0.15)') : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${productForm.metal === m ? (m==='gold' ? 'rgba(251,191,36,0.7)' : 'rgba(192,192,192,0.6)') : border}`,
                  color: productForm.metal === m ? (m==='gold' ? '#fbbf24' : '#c0c0c0') : subtext,
                }}>
                {m === 'gold' ? '🏅 Gold' : '🥈 Silver'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Grade */}
      {productForm.metal && (
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', color:'#22d3ee', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
            Step 3 — Select Grade
          </label>
          <div style={{ display:'flex', gap:'10px' }}>
            {(productForm.metal === 'gold' ? ['22k','24k'] : ['999']).map(g => (
              <div key={g} onClick={() => setProductForm(f => ({ ...f, grade: g }))}
                style={{ padding:'10px 24px', borderRadius:'20px', cursor:'pointer', fontWeight:800, fontSize:'13px', textTransform:'uppercase', transition:'all 0.2s ease',
                  background: productForm.grade === g ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.04)',
                  border: `1.5px solid ${productForm.grade === g ? 'rgba(34,211,238,0.7)' : 'rgba(34,211,238,0.2)'}`,
                  color: productForm.grade === g ? '#22d3ee' : subtext,
                }}>
                {g.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Product Details */}
      {productForm.grade && (
        <>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Product Name *
            </label>
            <input
              value={productForm.name}
              onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Blossom Ring"
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 16px', color:text, fontSize:'14px', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#a78bfa'}
              onBlur={e => e.target.style.borderColor=inpBorder}
            />
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Description
            </label>
            <textarea
              value={productForm.description}
              onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="e.g. Floral petal design with a vintage soul"
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 16px', color:text, fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#a78bfa'}
              onBlur={e => e.target.style.borderColor=inpBorder}
            />
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Tag (Optional)
            </label>
            <select
              value={productForm.tag}
              onChange={e => setProductForm(f => ({ ...f, tag: e.target.value }))}
              style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 16px', color:text, fontSize:'14px', outline:'none', cursor:'pointer' }}
            >
              <option value="" style={{ background:optionBg }}>-- Select Tag --</option>
              {['Bestseller','Bridal','Premium','Statement','Stackable','New','Limited'].map(t => (
                <option key={t} value={t} style={{ background:optionBg }}>{t}</option>
              ))}
            </select>
          </div>

          {/* Weight + Live Price */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
            <div>
              <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
                Weight (grams) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={productForm.weight_grams}
                onChange={e => {
                  const val = e.target.value
                  setProductForm(f => ({ ...f, weight_grams: val }))
                  calcLivePrice(val, productForm.metal, productForm.grade)
                }}
                placeholder="e.g. 2.5"
                style={{ width:'100%', background:inpBg, border:`1px solid ${inpBorder}`, borderRadius:'10px', padding:'12px 16px', color:text, fontSize:'14px', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#a78bfa'}
                onBlur={e => e.target.style.borderColor=inpBorder}
              />
            </div>
            <div>
              <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
                Live Rate Price
              </label>
              <div style={{ background:inpBg, border:`1px solid ${livePrice ? 'rgba(74,222,128,0.5)' : inpBorder}`, borderRadius:'10px', padding:'12px 16px', fontFamily:'monospace', fontWeight:800, fontSize:'16px', color: livePrice ? '#4ade80' : subtext, display:'flex', alignItems:'center', minHeight:'46px' }}>
                {livePrice ? `₹ ${livePrice}` : '—'}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', color:subtext, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>
              Product Images (Multiple allowed)
            </label>
            <label htmlFor="product-img-upload" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px', background:'rgba(167,139,250,0.08)', border:'2px dashed rgba(167,139,250,0.4)', borderRadius:'12px', cursor:'pointer', color:'#a78bfa', fontWeight:700, fontSize:'13px', transition:'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(167,139,250,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(167,139,250,0.08)'}
            >
              📷 Add Image
            </label>
            <input
              id="product-img-upload"
              type="file"
              accept="image/*"
              multiple
              style={{ display:'none' }}
              onChange={e => {
                const files = Array.from(e.target.files)
                setProductImages(prev => [...prev, ...files])
                const urls = files.map(f => URL.createObjectURL(f))
                setProductPreviewUrls(prev => [...prev, ...urls])
                e.target.value = ''
              }}
            />

            {/* Preview Grid */}
            {productPreviewUrls.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginTop:'14px' }}>
                {productPreviewUrls.map((url, idx) => (
                  <div key={idx} style={{ position:'relative', width:'90px', height:'90px', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(167,139,250,0.3)' }}>
                    <img src={url} alt={`img-${idx}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    {/* View button */}
                    <button
                      onClick={() => setPreviewImageIdx(idx)}
                      style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'4px 0', border:'none', cursor:'pointer', backdropFilter:'blur(4px)' }}
                    >
                      👁 View
                    </button>
                    {/* Remove button */}
                    <button
                      onClick={() => {
                        setProductImages(prev => prev.filter((_,i) => i !== idx))
                        setProductPreviewUrls(prev => prev.filter((_,i) => i !== idx))
                      }}
                      style={{ position:'absolute', top:'4px', right:'4px', background:'rgba(239,68,68,0.85)', color:'#fff', fontSize:'10px', fontWeight:900, width:'18px', height:'18px', borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={productSaving || !productForm.name || !productForm.weight_grams}
            onClick={async () => {
              if (!productForm.name.trim()) { setProductMsg('❌ Product name required'); return }
              if (!productForm.weight_grams) { setProductMsg('❌ Weight required'); return }
              setProductSaving(true)
              try {
                const fd = new FormData()
                fd.append('category', productForm.category)
                fd.append('metal', productForm.metal)
                fd.append('grade', productForm.grade)
                fd.append('name', productForm.name)
                fd.append('description', productForm.description)
                fd.append('weight_grams', productForm.weight_grams)
                fd.append('tag', productForm.tag)
                if (livePrice) fd.append('price', livePrice)
                productImages.forEach(img => fd.append('uploaded_images', img))
                await api.post('/jewelry-products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                setProductMsg('✅ Product added successfully!')
                setProductForm({ category:'', metal:'', grade:'', name:'', description:'', weight_grams:'', tag:'' })
                setProductImages([])
                setProductPreviewUrls([])
                setLivePrice(null)
              } catch (err) {
                setProductMsg('❌ Failed: ' + JSON.stringify(err.response?.data || err.message))
              }
              setProductSaving(false)
            }}
            style={{ width:'100%', padding:'14px', background: productSaving ? 'rgba(167,139,250,0.3)' : 'linear-gradient(90deg,#a78bfa,#22d3ee)', border:'none', borderRadius:'12px', fontWeight:900, fontSize:'15px', color: productSaving ? '#a78bfa' : '#1a0040', cursor: productSaving ? 'not-allowed' : 'pointer', transition:'all 0.3s ease' }}>
            {productSaving ? '⏳ Saving...' : '✅ Add Product'}
          </button>
        </>
      )}
    </div>
  </div>
)}

{/* Image Lightbox */}
{previewImageIdx !== null && (
  <div onClick={() => setPreviewImageIdx(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', backdropFilter:'blur(16px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ position:'relative', maxWidth:'90vw', maxHeight:'90vh' }}>
      <img src={productPreviewUrls[previewImageIdx]} alt="preview" style={{ maxWidth:'100%', maxHeight:'85vh', objectFit:'contain', borderRadius:'16px', border:'1px solid rgba(167,139,250,0.3)' }} />
      
      {/* Left Arrow */}
      {previewImageIdx > 0 && (
        <button onClick={() => setPreviewImageIdx(i => i - 1)}
          style={{ position:'absolute', left:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(167,139,250,0.2)', border:'1px solid rgba(167,139,250,0.4)', color:'#a78bfa', width:'40px', height:'40px', borderRadius:'50%', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          ‹
        </button>
      )}
      {/* Right Arrow */}
      {previewImageIdx < productPreviewUrls.length - 1 && (
        <button onClick={() => setPreviewImageIdx(i => i + 1)}
          style={{ position:'absolute', right:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(167,139,250,0.2)', border:'1px solid rgba(167,139,250,0.4)', color:'#a78bfa', width:'40px', height:'40px', borderRadius:'50%', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          ›
        </button>
      )}
      
      {/* Counter */}
      <div style={{ position:'absolute', bottom:'-36px', left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.6)', fontSize:'12px', fontWeight:600 }}>
        {previewImageIdx + 1} / {productPreviewUrls.length}
      </div>

      <button onClick={() => setPreviewImageIdx(null)}
        style={{ position:'absolute', top:'-16px', right:'-16px', background:'rgba(239,68,68,0.85)', border:'none', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', fontSize:'14px', cursor:'pointer', fontWeight:900 }}>
        ✕
      </button>
    </div>
  </div>
)}

        {/* ── BIRTHDAY LIST MODAL ── */}
        {showBirthdayList && (
          <div onClick={() => setShowBirthdayList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ flexShrink: 0, padding: '22px 28px', borderBottom: '1px solid rgba(244,114,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/>
                      <path d="M4 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1"/>
                      <path d="M12 10V6M9 6c0-1 1-1 1-2s-1-1-1-2M15 6c0-1-1-1-1-2s1-1 1-2"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#f472b6', fontWeight: 800, fontSize: '14px' }}>TODAY'S BIRTHDAYS</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBirthdayList(false)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {birthdayList.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: subtext, padding: '50px 0', fontSize: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/>
                      <path d="M12 10V6"/>
                    </svg>
                    No birthdays today
                  </div>
                ) : birthdayList.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSpecialAnnForm({
                        title: `🎂 Happy Birthday ${m.first_name} ${m.last_name || ''} (${m._id})`,
                        message: `By BitByte Technologies — Wishing you a wonderful birthday! May this special day bring you joy, happiness, and all the success you deserve. Here's to another amazing year! 🎉🎂`,
                        roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                      })
                      setShowBirthdayList(false)
                      setShowSpecialAnn(true)
                      setSpecialAnnMsg('')
                    }}
                    style={{ background: dark ? 'rgba(244,114,182,0.06)' : 'rgba(244,114,182,0.04)', border: '1px solid rgba(244,114,182,0.25)', borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,114,182,0.12)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(244,114,182,0.06)' : 'rgba(244,114,182,0.04)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.25)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: `rgba(${m._roleColor === '#22d3ee' ? '34,211,238' : m._roleColor === '#4ade80' ? '74,222,128' : m._roleColor === '#f59e0b' ? '245,158,11' : m._roleColor === '#a78bfa' ? '167,139,250' : '244,114,182'},0.15)`, color: m._roleColor, border: `1px solid rgba(${m._roleColor === '#22d3ee' ? '34,211,238' : m._roleColor === '#4ade80' ? '74,222,128' : m._roleColor === '#f59e0b' ? '245,158,11' : m._roleColor === '#a78bfa' ? '167,139,250' : '244,114,182'},0.35)` }}>{m._role}</span>
                          <span style={{ color: '#f472b6', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px', marginTop: '3px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/><path d="M12 10V6"/>
                          </svg>
                          {new Date(m._dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                        </div>
                      </div>
                      <div style={{ color: '#f472b6', fontSize: '11px', fontWeight: 700 }}>Click to Wish →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

 {/* ── ANNIVERSARY LIST MODAL ── */}
        {showAnniversaryList && (
          <div onClick={() => setShowAnniversaryList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ flexShrink: 0, padding: '22px 28px', borderBottom: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '14px' }}>TODAY'S ANNIVERSARIES</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnniversaryList(false)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {anniversaryList.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: subtext, padding: '50px 0', fontSize: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6"/>
                    </svg>
                    No anniversaries today
                  </div>
                ) : anniversaryList.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSpecialAnnForm({
                        title: `💍 Happy Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                        message: `By BitByte Technologies — Wishing you a beautiful anniversary! May your bond grow stronger with each passing year. Here's to celebrating love and togetherness! 💕💍`,
                        roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                      })
                      setShowAnniversaryList(false)
                      setShowSpecialAnn(true)
                      setSpecialAnnMsg('')
                    }}
                    style={{ background: dark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.12)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)' }}>{m._role}</span>
                          <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px', marginTop: '3px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6"/>
                          </svg>
                          {new Date(m._ann).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                        </div>
                      </div>
                      <div style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 700 }}>Click to Wish →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

{/* ── JOIN DATE LIST MODAL ── */}
        {showJoinDateList && (
          <div onClick={() => setShowJoinDateList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ flexShrink: 0, padding: '22px 28px', borderBottom: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4h8v6a4 4 0 01-8 0V4z"/>
                      <path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4"/>
                      <path d="M12 14v3M9 21h6M9 21l1-4h4l1 4"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '14px' }}>WORK ANNIVERSARIES</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowJoinDateList(false)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {joinDateList.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: subtext, padding: '50px 0', fontSize: '14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M12 14v3"/>
                    </svg>
                    No work anniversaries today
                  </div>
                ) : joinDateList.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const yrs = m._yearsCompleted
                      const ordinal = yrs === 1 ? '1st' : yrs === 2 ? '2nd' : yrs === 3 ? '3rd' : `${yrs}th`
                      setSpecialAnnForm({
                        title: `🏆 Happy ${ordinal} Work Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                        message: `By BitByte Technologies — Congratulations on completing ${yrs} amazing year${yrs > 1 ? 's' : ''} with us! Your dedication and hard work are truly valued. Here's to many more years of success together! 🌟🏆`,
                        roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                      })
                      setShowJoinDateList(false)
                      setShowSpecialAnn(true)
                      setSpecialAnnMsg('')
                    }}
                    style={{ background: dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}>{m._role}</span>
                          <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                        </div>
                        <div style={{ color: text, fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b', fontSize: '12px', fontWeight: 700, marginTop: '3px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M12 14v3"/>
                          </svg>
                          {m._yearsCompleted === 1 ? '1st' : m._yearsCompleted === 2 ? '2nd' : m._yearsCompleted === 3 ? '3rd' : `${m._yearsCompleted}th`} Year Anniversary
                        </div>
                        <div style={{ color: subtext, fontSize: '11px' }}>Joined: {new Date(m._joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700 }}>Click to Wish →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SPECIAL ANNOUNCEMENT MODAL (Birthday/Anniversary/JoinDate) ── */}
        {showSpecialAnn && (
          <div onClick={() => setShowSpecialAnn(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📢</div>
                  <div>
                    <div style={{ color: '#fb923c', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Review & send the wish</div>
                  </div>
                </div>
                <button onClick={() => setShowSpecialAnn(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
              </div>

              {specialAnnMsg && (
                <div style={{ background: specialAnnMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${specialAnnMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: specialAnnMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                  {specialAnnMsg}
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title</label>
                <input
                  value={specialAnnForm.title}
                  onChange={e => setSpecialAnnForm({ ...specialAnnForm, title: e.target.value })}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#fb923c'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message</label>
                <textarea
                  value={specialAnnForm.message}
                  onChange={e => setSpecialAnnForm({ ...specialAnnForm, message: e.target.value })}
                  rows={4}
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                  onFocus={e => e.target.style.borderColor = '#fb923c'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Role Checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { key: 'admin', label: '🛡️ Admin', color: '#22d3ee' },
                    { key: 'dealer', label: '🏪 Dealer', color: '#4ade80' },
                    { key: 'sub_dealer', label: '🔗 Sub Dealer', color: '#f59e0b' },
                    { key: 'promotor', label: '🌟 Promotor', color: '#a78bfa' },
                    { key: 'customer', label: '👤 Customer', color: '#f472b6' },
                  ].map(role => {
                    const checked = specialAnnForm.roles.includes(role.key)
                    const rgb = { '#22d3ee': '34,211,238', '#4ade80': '74,222,128', '#f59e0b': '245,158,11', '#a78bfa': '167,139,250', '#f472b6': '244,114,182' }[role.color]
                    return (
                      <div key={role.key}
                        onClick={() => {
                          const updated = checked ? specialAnnForm.roles.filter(x => x !== role.key) : [...specialAnnForm.roles, role.key]
                          setSpecialAnnForm({ ...specialAnnForm, roles: updated })
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', background: checked ? `rgba(${rgb},0.14)` : `rgba(${rgb},0.04)`, border: `1.5px solid ${checked ? `rgba(${rgb},0.6)` : `rgba(${rgb},0.18)`}`, transition: 'all 0.2s ease', userSelect: 'none' }}
                      >
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `rgba(${rgb},0.35)`}`, background: checked ? role.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <span style={{ color: '#000', fontSize: '9px', fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{ color: checked ? role.color : subtext, fontSize: '12px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Send Button */}
              <button
                disabled={specialAnnSending}
                onClick={async () => {
                  if (!specialAnnForm.title.trim() || !specialAnnForm.message.trim()) { setSpecialAnnMsg('❌ Title and Message required.'); return }
                  if (specialAnnForm.roles.length === 0) { setSpecialAnnMsg('❌ Select at least one role.'); return }
                  setSpecialAnnSending(true)
                  // AFTER
try {
  await api.post('/announcements/', { title: specialAnnForm.title, message: specialAnnForm.message, target_roles: specialAnnForm.roles })
  setSpecialAnnMsg('✅ Announcement sent successfully!')
  const annData = await fetchMyAnnouncements()
  fetchAnnouncementCount(annData)
  setTimeout(() => setShowSpecialAnn(false), 1500)
} catch (err) {
  setSpecialAnnMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
}
                  setSpecialAnnSending(false)
                }}
                style={{ width: '100%', padding: '14px', background: specialAnnSending ? 'rgba(251,146,60,0.3)' : 'linear-gradient(90deg,#fb923c,#f97316)', border: 'none', borderRadius: '12px', fontWeight: 800, color: specialAnnSending ? '#fb923c' : '#431407', fontSize: '15px', cursor: specialAnnSending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
              >
                {specialAnnSending ? '⏳ Sending...' : '📢 Send Announcement'}
              </button>
            </div>
          </div>
        )}


        {/* ── FULL HIERARCHY MODAL ── */}
        {/* {showHierarchy && (
          <div
            onClick={() => { setShowHierarchy(false); setActiveAdmin(null); removeAdminPopup() }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
  onClick={e => e.stopPropagation()}
  style={{ background: dark ? '#0a1628' : '#f8fafc', border: '1px solid rgba(103,232,249,0.2)', borderRadius: '24px', width: '98%', maxWidth: '1400px', height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
>

          
              <div style={{ flexShrink: 0, padding: '20px 28px', borderBottom: '1px solid rgba(103,232,249,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <span style={{ color: '#a5f3fc', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🏢 Full Organization Hierarchy</span>
                 {totalStats && (
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
    {[
      { label: 'Super Admin', roleKey: 'super_admin', count: 1, color: '#ffd700' },
      { label: 'Admins', roleKey: 'admin', count: totalStats.admins, color: '#22d3ee' },
      { label: 'Dealers', roleKey: 'dealer', count: totalStats.dealers, color: '#4ade80' },
      { label: 'Sub Dealers', roleKey: 'sub_dealer', count: totalStats.subDealers, color: '#f59e0b' },
      { label: 'Promotors', roleKey: 'promotor', count: totalStats.promotors, color: '#a78bfa' },
      { label: 'Customers', roleKey: 'customer', count: totalStats.customers, color: '#f472b6' },
    ].map(s => {
      const isActive = hierarchyFilter === s.roleKey
      return (
        <div
          key={s.label}
          onClick={() => setHierarchyFilter(isActive ? null : s.roleKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: isActive ? `rgba(${hexToRgb(s.color)},0.22)` : `rgba(${hexToRgb(s.color)},0.08)`,
            border: `1px solid rgba(${hexToRgb(s.color)},${isActive ? 0.8 : 0.25})`,
            borderRadius: '20px', padding: '3px 12px', cursor: 'pointer',
            transform: isActive ? 'translateY(-2px)' : 'none',
            boxShadow: isActive ? `0 4px 14px rgba(${hexToRgb(s.color)},0.3)` : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span style={{ color: s.color, fontWeight: 800, fontSize: '13px' }}>{s.count}</span>
          <span style={{ color: subtext, fontSize: '11px' }}>{s.label}</span>
        </div>
      )
    })}
  </div>
)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {(
  <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: subtext, pointerEvents: 'none' }}>🔍</span>
                      <input
                        value={hierarchySearch}
                        onChange={e => setHierarchySearch(e.target.value)}
                        placeholder="Search ID, Name, Phone..."
                        style={{
                          width: '220px', background: inpBg, border: `1px solid ${inpBorder}`,
                          borderRadius: '10px', padding: '8px 12px 8px 32px', color: text,
                          fontSize: '12px', outline: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = '#22d3ee'}
                        onBlur={e => e.target.style.borderColor = inpBorder}
                      />
                      {hierarchySearch && (
                        <button
                          onClick={() => setHierarchySearch('')}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subtext, cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                        >✕</button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowHierarchy(false); setActiveAdmin(null); removeAdminPopup() }}
                    style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >✕ Close</button>
                </div>
              </div>


<div style={{ flex: 1, minHeight: '65vh', overflowX: 'auto', overflowY: 'auto', padding: '28px 32px', scrollBehavior: 'smooth', scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.4) rgba(255,255,255,0.03)' }}>

                {hierarchyLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(34,211,238,0.2)', borderTop: '3px solid #22d3ee', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: subtext, fontSize: '14px' }}>Loading hierarchy...</span>
                  </div>
                )}


{!hierarchyLoading && hierarchyData && (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'max-content', margin: '0 auto' }}>


    {hierarchySearch.trim() ? (() => {

  const filteredResults = hierarchyFilter && hierarchyFilter !== 'super_admin'
    ? searchResults.filter(item => item.role === hierarchyFilter)
    : searchResults

  if (debouncedSearch !== hierarchySearch.trim()) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        🔍 Searching...
      </div>
    )
  }
  if (filteredResults.length === 0) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        No {hierarchyFilter ? hierarchyFilter.replace('_', ' ') + ' ' : ''}results found for "{hierarchySearch}"
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px' }}>
      {filteredResults.map((item, idx) => (
        <TreeNode
          key={item.node.id || idx}
          node={item.node}
          role={item.role}
          depth={0}
          dark={dark}
          text={text}
          subtext={subtext}
          colorIdx={idx}
          ancestors={item.ancestors}
          superAdminEmail={localStorage.getItem('email') || ''}
          flatMode={true}
        />
      ))}
    </div>
  )
})() : (
      <>

        {hierarchyFilter && (
          <button
            onClick={() => { setHierarchyFilter(null); setHierarchySearch('') }}
            style={{ marginBottom: '20px', padding: '8px 18px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.35)', borderRadius: '10px', color: '#22d3ee', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to Full Tree
          </button>
        )}


    {(!hierarchyFilter || hierarchyFilter === 'super_admin') && (
      <>
        <div style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,215,0,0.05))', border: '1px solid rgba(255,215,0,0.5)', borderRadius: '20px', padding: '24px 64px', fontWeight: 800, fontSize: '20px', color: '#ffd700', animation: 'pulseGlow 3s ease-in-out infinite', boxShadow: '0 0 24px rgba(255,215,0,0.1)', textAlign: 'center' }}>
          🛡️ Super Admin
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400, marginTop: '6px' }}>
            {localStorage.getItem('email')}
          </div>
        </div>
        {!hierarchyFilter && <div style={{ width: 2, height: 32, background: 'rgba(34,211,238,0.6)' }} />}
      </>
    )}


    {!hierarchyFilter && hierarchyData.admins.length > 0 && (
      <>
        <div style={{ height: 2, background: 'rgba(34,211,238,0.5)', width: '100%' }} />
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {hierarchyData.admins.map((admin, ai) => (
            <div key={admin.id} className="tree-node-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 24, background: 'rgba(255,215,0,0.5)' }} />
              <TreeNode
                node={admin}
                role="admin"
                depth={0}
                dark={dark}
                text={text}
                subtext={subtext}
                colorIdx={ai}
                ancestors={[]}
                superAdminEmail={localStorage.getItem('email') || ''}
              />
            </div>
          ))}
        </div>
      </>
    )}

    {!hierarchyFilter && hierarchyData.admins.length === 0 && (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>No admins created yet.</div>
    )}


{hierarchyFilter && hierarchyFilter !== 'super_admin' && (() => {
  const cfg = ROLE_LABELS[hierarchyFilter]
  const idKey = cfg?.idKey || 'id'
  let flatList = flattenByRole(hierarchyFilter)

 if (hierarchySearch.trim()) {
  const q = hierarchySearch.trim().toLowerCase()
  flatList = flatList.filter(item => {
    const n = item.node
    const idVal = (n[idKey] || '').toString().toLowerCase()
    const nameVal = `${n.first_name || ''} ${n.last_name || ''}`.toLowerCase()
    const phoneVal = (n.mobile_number || '').toString().toLowerCase()
    return idVal.includes(q) || nameVal.includes(q) || phoneVal.includes(q)
  })
}

  if (flatList.length === 0) {
    return (
      <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>
        {hierarchySearch.trim() ? `No results found for "${hierarchySearch}"` : `No ${hierarchyFilter.replace('_', ' ')} found.`}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px' }}>
      {flatList.map((item, idx) => (
        <TreeNode
          key={item.node.id || idx}
          node={item.node}
          role={hierarchyFilter}
          depth={0}
          dark={dark}
          text={text}
          subtext={subtext}
          colorIdx={idx}
          ancestors={item.ancestors}
          superAdminEmail={localStorage.getItem('email') || ''}
          flatMode={true}
        />
      ))}
    </div>
  )
})()}
      </>
    )}

  </div>
)}
                {!hierarchyLoading && !hierarchyData && (
                  <div style={{ color: subtext, padding: '60px', textAlign: 'center', fontSize: '15px' }}>Failed to load hierarchy.</div>
                )}

              </div>


              {!hierarchyLoading && (
                <div style={{ flexShrink: 0, padding: '14px 28px', borderTop: '1px solid rgba(103,232,249,0.08)', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                  {[
                    { role: 'Super Admin', color: '#ffd700', emoji: '🛡️' },
                    { role: 'Admin', color: '#22d3ee', emoji: '🛡️' },
                    { role: 'Dealer', color: '#4ade80', emoji: '🏪' },
                    { role: 'Sub Dealer', color: '#f59e0b', emoji: '🔗' },
                    { role: 'Promotor', color: '#a78bfa', emoji: '🌟' },
                    { role: 'Customer', color: '#f472b6', emoji: '👤' },
                  ].map(l => (
                    <div key={l.role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
                      <span style={{ color: subtext, fontSize: '11px' }}>{l.emoji} {l.role}</span>
                    </div>
                  ))}
                  <div style={{ color: subtext, fontSize: '11px', width: '100%', textAlign: 'center' }}>
                    💡 Click any node to expand/collapse its children
                  </div>
                </div>
              )}

            </div>
          </div>
        )} */}



        {/* ── TODAY RATES MODAL ── */}
        {showTodayRates && (
          <div
            onClick={() => setShowTodayRates(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="modal-scroll"
              style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(255,215,0,0.35)', borderRadius: '24px', width: '95%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', animation: 'fadeIn 0.3s ease' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#ffd700', fontWeight: 800, fontSize: '15px' }}>TODAY'S METAL RATES</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: subtext, fontSize: '11px', marginTop: '2px' }}>
                      {dbRateDate ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </>
                      ) : 'No rate entered yet'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowTodayRates(false)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Rate Cards */}
              {[
                { label: 'Gold 22K', color: '#fbbf24', rgb: '251,191,36', value: metalPrices.gold22k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Gold 24K', color: '#ffd700', rgb: '255,215,0', value: metalPrices.gold24k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Silver 999', color: '#c0c0c0', rgb: '192,192,192', value: metalPrices.silver, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h3.5a2 2 0 010 4H10M9 15h4M12 7v2M12 15v2"/></svg> },
                { label: 'Diamond 18K', color: '#67e8f9', rgb: '103,232,249', value: metalPrices.diamond18k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg> },
                { label: 'Diamond 22K', color: '#a5f3fc', rgb: '165,243,252', value: metalPrices.diamond22k, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg> },
                { label: 'Platinum 92', color: '#e2e8f0', rgb: '226,232,240', value: metalPrices.platinum92, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="#e2e8f0"/></svg> },
              ].map(item => (
                <div key={item.label} style={{ background: `rgba(${item.rgb},0.06)`, border: `1px solid rgba(${item.rgb},0.3)`, borderRadius: '14px', padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(${item.rgb},0.15)`, border: `1px solid rgba(${item.rgb},0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                    <div>
                      <div style={{ color: item.color, fontWeight: 800, fontSize: '13px' }}>{item.label}</div>
                      <div style={{ color: subtext, fontSize: '10px', marginTop: '2px' }}>per gram</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: item.color, fontWeight: 900, fontSize: '20px', fontFamily: 'monospace' }}>
                      {item.value ? `₹${item.value.toFixed(2)}` : <span style={{ color: subtext, fontSize: '13px' }}>Not set</span>}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setShowTodayRates(false); setShowRatePopup(true); setRateMsg('') }}
                style={{ width: '100%', marginTop: '8px', padding: '13px', background: 'linear-gradient(90deg,#fbbf24,#ffd700)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#431407', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Update Rates
              </button>
            </div>
          </div>
        )}




{/* ── ORDER HIERARCHY POPUP ─────────────────────────────────────────── */}
{orderPopupState.visible && orderPopupState.period && orderPopupState.metalKey && (() => {
  if (!hierarchyData) return null

  
  const hData = buildHierarchyOrders(orderPopupState.period, orderPopupState.metalKey)
  if (!hData) return null

  const periodLabel = { today: "TODAY'S", week: "THIS WEEK'S", month: "THIS MONTH'S" }[orderPopupState.period]
  const renderOrderNode = (node, role) => {
    const cfg = ROLE_LABELS[role]
    const color = cfg?.color || '#22d3ee'
    const rgb = hexToRgb(color)

    const children =
      role === 'admin' ? (node.dealers || []) :
      role === 'dealer' ? (node.subDealers || node.sub_dealers || []) :
      role === 'sub_dealer' ? (node.promotors || []) :
      role === 'promotor' ? (node.customers || []) :
      []

    const nextRole =
      role === 'admin' ? 'dealer' :
      role === 'dealer' ? 'sub_dealer' :
      role === 'sub_dealer' ? 'promotor' :
      role === 'promotor' ? 'customer' :
      null

    const idVal = node[cfg?.idKey] || node.id || ''
    const name = `${node.first_name || ''} ${node.last_name || ''}`.trim() || 'Unknown'

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Node card */}
        <div style={{
          background: `rgba(${rgb},0.08)`,
          border: `1px solid rgba(${rgb},0.4)`,
          borderRadius: '12px',
          padding: '9px 11px',
          minWidth: '145px',
          maxWidth: '170px',
        }}>
          <div style={{
            fontSize: '8px',
            color,
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: '4px',
          }}>
            {cfg?.emoji} {cfg?.label}
          </div>

          <div style={{
            fontSize: '8px',
            color: `rgba(${rgb},0.65)`,
            fontFamily: 'monospace',
            marginBottom: '3px',
            wordBreak: 'break-all',
          }}>
            {idVal}
          </div>

          <div style={{
            fontSize: '11px',
            color: dark ? '#f1f5f9' : '#0f172a',
            fontWeight: 800,
          }}>
            {name}
          </div>

          {node.mobile_number && (
            <div style={{
              fontSize: '9px',
              color: `rgba(${rgb},0.7)`,
              marginTop: '3px',
            }}>
              📞 {node.mobile_number}
            </div>
          )}

          {node.orderCount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '5px',
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 900,
                color,
                fontFamily: 'monospace',
              }}>
                {node.orderCount}
              </span>
              <span style={{
                fontSize: '8px',
                color: `rgba(${rgb},0.65)`,
                marginLeft: '3px',
                alignSelf: 'flex-end',
              }}>
                orders
              </span>
            </div>
          )}
        </div>

        {/* Children tree */}
        {children.length > 0 && (
          <>
            <div style={{
              width: '2px',
              height: '16px',
              background: `rgba(${rgb},0.55)`,
            }} />

            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '14px',
              paddingTop: '12px',
            }}>
              {children.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: `rgba(${rgb},0.45)`,
                }} />
              )}

              {children.map((child, idx) => (
                <div
                  key={child.id || child.admin_id || child.dealer_id || child.sub_dealer_id || child.promotor_id || child.customer_id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: '2px',
                    height: '12px',
                    background: `rgba(${rgb},0.55)`,
                  }} />

                  {renderOrderNode(child, nextRole)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
            <div
              style={{
                position: 'fixed', zIndex: 900,
                left: Math.max(10, Math.min(orderPopupState.left || 10, window.innerWidth - 320)),
                top: Math.max(10, Math.min(orderPopupState.top || 10, window.innerHeight - 520)),
                background: dark ? 'rgba(5,10,20,0.97)' : 'rgba(248,250,252,0.98)',
                border: '1px solid rgba(34,211,238,0.22)',
                borderRadius: '16px', padding: '16px',
                minWidth: '260px', maxWidth: '300px',
                maxHeight: '78vh', overflow: 'auto',
                boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
                fontFamily: 'Inter,system-ui,sans-serif',
                animation: 'popupIn 0.25s cubic-bezier(0.22,1,0.36,1) both',
                scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.4) transparent',
              }}
              onMouseEnter={() => clearTimeout(orderHideTimer.current)}
              onMouseLeave={() => {
                orderHideTimer.current = setTimeout(
                  () => setOrderPopupState(p => ({ ...p, visible: false })), 300
                )
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(34,211,238,0.12)' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>📊</div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#22d3ee', letterSpacing: '1.5px' }}>{periodLabel} ORDER CHAIN</div>
                  <div style={{ fontSize: '9px', color: dark ? '#475569' : '#94a3b8', marginTop: '2px' }}>Full hierarchy breakdown</div>
                </div>
              </div>

              {/* States */}
              {!hierarchyData && (
                <div style={{ textAlign: 'center', color: subtext, padding: '18px 0', fontSize: '12px' }}>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(34,211,238,0.2)', borderTop: '2px solid #22d3ee', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  Loading hierarchy...
                </div>
              )}
              {hData && hData.admins.length === 0 && hData.unlinked.length === 0 && (
                <div style={{ textAlign: 'center', color: subtext, padding: '18px 0', fontSize: '12px' }}>No orders in this period</div>
              )}

              {hData && (hData.admins.length > 0 || hData.unlinked.length > 0) && (
                <div>
                  {/* ── Super Admin ── */}
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '10px', padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '8px', color: '#ffd700', fontWeight: 800, letterSpacing: '1px' }}>🛡️ SUPER ADMIN</div>
                        <div style={{ fontSize: '10px', color: dark ? '#cbd5e1' : '#475569', marginTop: '3px', wordBreak: 'break-all' }}>{hData.superAdminEmail}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '8px', flexShrink: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffd700', fontFamily: 'monospace' }}>{hData.superTotal}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,215,0,0.55)' }}>orders</div>
                      </div>
                    </div>
                  </div>

{/* ── Hierarchy chain tree style ── */}
{/* ── Hierarchy chain tree style ── */}
{hData.admins.length > 0 && (
  <div>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '4px 0 8px',
    }}>
      <div style={{
        width: '2px',
        height: '18px',
        background: 'rgba(34,211,238,0.55)',
      }} />
    </div>

    <div style={{
      overflowX: 'auto',
      padding: '10px 0 14px',
    }}>
    
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        minWidth: 'max-content',
      }}>
        {hData.admins.map((admin, idx) => (
          <div key={admin.id || admin.admin_id || idx}>
            {renderOrderNode(admin, 'admin')}
          </div>
        ))}
      </div>
    </div>
  </div>
)}

                  {/* ── Unlinked customers (no assigned promotor in hierarchy) ── */}
                  {hData.unlinked && hData.unlinked.length > 0 && (
                    <div>
                      <Arrow rgb="244,114,182" />
                      <div style={{ background: 'rgba(244,114,182,0.06)', border: '1px dashed rgba(244,114,182,0.4)', borderRadius: '10px', padding: '9px 12px' }}>
                        <div style={{ fontSize: '8px', color: '#f472b6', fontWeight: 800, letterSpacing: '1px', marginBottom: '6px' }}>
                          👤 DIRECT CUSTOMERS — {hData.unlinked.length} customer{hData.unlinked.length > 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '8px', color: 'rgba(244,114,182,0.5)', marginBottom: '8px', fontStyle: 'italic' }}>
                          ⚠️ Not linked to any promotor in hierarchy
                        </div>
                        {hData.unlinked.map(o => (
                          <div key={o.customer_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(244,114,182,0.1)' }}>
                            <div>
                              <div style={{ fontSize: '9px', color: 'rgba(244,114,182,0.7)', fontFamily: 'monospace' }}>{o.customer_id}</div>
                              <div style={{ fontSize: '9px', color: 'rgba(244,114,182,0.5)' }}>{o.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f472b6', fontFamily: 'monospace' }}>{o.count}</div>
                              <div style={{ fontSize: '8px', color: 'rgba(244,114,182,0.55)' }}>orders</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })()}


        {/* ── PROFILE UPDATE REQUESTS MODAL ── */}
        {showRequests && (
          <div
            onClick={() => {
              setShowRequests(false)
              setSelectedRequest(null)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,6,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: '24px',
                width: '95%',
                maxWidth: selectedRequest ? '900px' : '560px',
                maxHeight: '88vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid rgba(167,139,250,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                    </svg>
                    PROFILE UPDATE REQUESTS
                  </div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '3px' }}>
                    {profileRequests.length} pending requests
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowRequests(false)
                    setSelectedRequest(null)
                  }}
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {requestMsg && (
                <div style={{
                  margin: '14px 28px 0',
                  background: requestMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${requestMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: requestMsg.includes('✅') ? '#4ade80' : '#f87171',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}>
                  {requestMsg}
                </div>
              )}

              {!selectedRequest ? (
                <div style={{ padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profileRequests.length === 0 ? (
                    <div style={{ color: subtext, textAlign: 'center', padding: '50px 0' }}>
                      No pending profile requests.
                    </div>
                  ) : profileRequests.map(req => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(167,139,250,0.22)',
                        borderRadius: '14px',
                        padding: '16px 18px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                            {req.role}
                          </div>
                          <div style={{ color: text, fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>
                            {req.first_name} {req.last_name}
                          </div>
                          <div style={{ color: subtext, fontSize: '12px', marginTop: '4px' }}>
                            {req.email}
                          </div>
                        </div>
                        <div style={{ color: subtext, fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {new Date(req.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>

                      {req.message && (
                        <div style={{ color: subtext, fontSize: '13px', marginTop: '10px', lineHeight: 1.5 }}>
                          💬 {req.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px 28px', overflowY: 'auto' }}>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    style={{
                      marginBottom: '14px',
                      background: 'rgba(167,139,250,0.1)',
                      border: '1px solid rgba(167,139,250,0.3)',
                      color: '#a78bfa',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ← Back to Requests
                  </button>

                  <div style={{ color: '#a78bfa', fontWeight: 800, marginBottom: '14px' }}>
                    REQUEST DETAILS
                  </div>

                  {selectedRequest.message && (
                    <div style={{
                      background: 'rgba(34,211,238,0.06)',
                      border: '1px solid rgba(34,211,238,0.2)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      color: text,
                      fontSize: '14px',
                      marginBottom: '16px',
                      lineHeight: 1.6
                    }}>
                      💬 {selectedRequest.message}
                    </div>
                  )}

                  {selectedRequest.proof_document && (
                    <button
                      onClick={async () => {
                        const url = selectedRequest.proof_document
                        const fullUrl = url.startsWith('http')
                          ? url
                          : `https://bitbyte-e-commerce.onrender.com/${url.replace(/^\//, '')}`

                        setProofUrl('')
                        setProofType('')
                        setProofLoading(true)
                        setProofModal(true)

                        try {
                          const token = localStorage.getItem('token')
                          const response = await fetch(fullUrl, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          if (!response.ok) throw new Error('fetch failed')

                          const contentType = response.headers.get('content-type') || ''
                          const blob = await response.blob()
                          const objectUrl = URL.createObjectURL(blob)

                          // PDF-க்கு type check
                          const isPdf = contentType.includes('pdf') ||
                            fullUrl.toLowerCase().includes('.pdf')

                          setProofType(isPdf ? 'pdf' : 'image')
                          setProofUrl(objectUrl)
                        } catch {
                          // Fallback: direct URL try பண்ணு
                          const isPdf = fullUrl.toLowerCase().includes('.pdf')
                          setProofType(isPdf ? 'pdf' : 'image')
                          setProofUrl(fullUrl)
                        } finally {
                          setProofLoading(false)
                        }
                      }}
                      style={{
                        marginBottom: '16px',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#f59e0b',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      📎 View Proof Document
                    </button>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', color: '#a78bfa', padding: '10px', borderBottom: `1px solid ${border}` }}>Field</th>
                          <th style={{ textAlign: 'left', color: '#a78bfa', padding: '10px', borderBottom: `1px solid ${border}` }}>Details To Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['initial', 'Initial'],
                          ['first_name', 'First Name'],
                          ['last_name', 'Last Name'],
                          ['mobile_number', 'Mobile Number'],
                          ['gender', 'Gender'],
                          ['dob', 'DOB'],
                          ['married_status', 'Married Status'],
                          ['anniversary_date', 'Anniversary Date'],
                          ['door_no', 'Door No'],
                          ['street_name', 'Street Name'],
                          ['town_name', 'Town Name'],
                          ['city_name', 'City Name'],
                          ['district', 'District'],
                          ['state', 'State'],
                          ['aadhaar_no', 'Aadhaar No'],
                          ['pan_no', 'PAN No'],
                          ['occupation', 'Occupation'],
                          ['occupation_detail', 'Occupation Detail'],
                          ['annual_salary', 'Annual Salary'],
                        ].map(([key, label]) => (
                          selectedRequest[key] ? (
                            <tr key={key}>
                              <td style={{ padding: '10px', color: subtext, borderBottom: `1px solid ${border}` }}>{label}</td>
                              <td style={{ padding: '10px', color: text, borderBottom: `1px solid ${border}` }}>{selectedRequest[key]}</td>
                            </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => approveProfileRequest(selectedRequest.id)}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '13px',
                      background: 'linear-gradient(90deg,#a78bfa,#22d3ee)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#020617',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENT SEND MODAL (Super Admin) ── */}
        {showAnnouncement && (
          <div
            onClick={() => setShowAnnouncement(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="modal-scroll"
              style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(251,146,60,0.3),rgba(249,115,22,0.15))', border: '1px solid rgba(251,146,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(251,146,60,0.2)' }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/>
                      <path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#fb923c', fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em' }}>SEND ANNOUNCEMENT</div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>Notify selected roles instantly</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnnouncement(false)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {announcementMsg && (
                <div style={{ background: announcementMsg.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${announcementMsg.includes('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color: announcementMsg.includes('✅') ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                  {announcementMsg}
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title *</label>
                <input
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Tomorrow Leave, Low Orders Alert..."
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#fb923c'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
                <textarea
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  rows={4}
                  placeholder="Type your announcement here..."
                  style={{ width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '10px', padding: '12px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                  onFocus={e => e.target.style.borderColor = '#fb923c'}
                  onBlur={e => e.target.style.borderColor = inpBorder}
                />
              </div>

              {/* Role Checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To (Select Roles) *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { key: 'admin', label: 'Admin', color: '#22d3ee', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg> },
                    { key: 'dealer', label: 'Dealer', color: '#4ade80', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="6" height="10" rx="1"/><rect x="9" y="4" width="6" height="16" rx="1"/><rect x="15" y="13" width="6" height="7" rx="1"/></svg> },
                    { key: 'sub_dealer', label: 'Sub Dealer', color: '#f59e0b', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5"/></svg> },
                    { key: 'promotor', label: 'Promotor', color: '#a78bfa', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> },
                    { key: 'customer', label: 'Customer', color: '#f472b6', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></svg> },
                  ].map(role => {
                    const checked = announcementForm.roles.includes(role.key)
                    const r = parseInt(role.color.slice(1, 3), 16), g = parseInt(role.color.slice(3, 5), 16), b = parseInt(role.color.slice(5, 7), 16)
                    const rgb = `${r},${g},${b}`
                    return (
                      <div key={role.key}
                        onClick={() => {
                          const updated = checked ? announcementForm.roles.filter(x => x !== role.key) : [...announcementForm.roles, role.key]
                          setAnnouncementForm({ ...announcementForm, roles: updated })
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', background: checked ? `rgba(${rgb},0.14)` : `rgba(${rgb},0.04)`, border: `1.5px solid ${checked ? `rgba(${rgb},0.6)` : `rgba(${rgb},0.18)`}`, transition: 'all 0.2s ease', userSelect: 'none' }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `rgba(${rgb},0.35)`}`, background: checked ? role.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ color: checked ? role.color : subtext, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {role.icon}
                          <span style={{ fontSize: '13px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Select All */}
                <button
                  onClick={() => {
                    const all = ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    const allSelected = all.every(r => announcementForm.roles.includes(r))
                    setAnnouncementForm({ ...announcementForm, roles: allSelected ? [] : all })
                  }}
                  style={{ marginTop: '10px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '8px', color: '#fb923c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) && <polyline points="8 12 11 15 16 9"/>}
                  </svg>
                  {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Send Button */}
              <button
                disabled={announcingSending}
                onClick={async () => {
                  if (!announcementForm.title.trim() || !announcementForm.message.trim()) { setAnnouncementMsg('❌ Title and Message are required.'); return }
                  if (announcementForm.roles.length === 0) { setAnnouncementMsg('❌ Please select at least one role.'); return }
                  setAnnouncingSending(true)
                  try {
                    // AFTER
await api.post('/announcements/', { title: announcementForm.title, message: announcementForm.message, target_roles: announcementForm.roles })
setAnnouncementMsg('✅ Announcement sent successfully!')
setAnnouncementForm({ title: '', message: '', roles: [] })
const annData = await fetchMyAnnouncements()
fetchAnnouncementCount(annData)
                  } catch (err) {
                    setAnnouncementMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                  }
                  setAnnouncingSending(false)
                }}
                style={{ width: '100%', padding: '14px', background: announcingSending ? 'rgba(251,146,60,0.3)' : 'linear-gradient(90deg,#fb923c,#f97316)', border: 'none', borderRadius: '12px', fontWeight: 800, color: announcingSending ? '#fb923c' : '#431407', fontSize: '15px', cursor: announcingSending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {announcingSending ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(67,20,7,0.3)', borderTop: '2px solid #431407', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/>
                      <path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12"/>
                    </svg>
                    Send Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SUPER ADMIN ANNOUNCEMENT VIEW MODAL ── */}
        {/* ── SUPER ADMIN ANNOUNCEMENT VIEW MODAL ── */}
        {showMyAnnouncements && (
          <div
            onClick={() => setShowMyAnnouncements(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,6,23,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '24px',
                width: '95%',
                maxWidth: '560px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{
                flexShrink: 0,
                padding: '24px 28px',
                borderBottom: '1px solid rgba(34,211,238,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(34,211,238,0.15)',
                    border: '1px solid rgba(34,211,238,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="13" rx="2"/>
                      <path d="M2 9l10 6 10-6"/>
                      <path d="M16 3l3 3-3 3"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#22d3ee', fontWeight: 800, fontSize: '14px' }}>
                      MY ANNOUNCEMENTS
                    </div>
                    <div style={{ color: subtext, fontSize: '11px', marginTop: '2px' }}>
                      {myAnnouncements.length} total sent by Super Admin
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowMyAnnouncements(false)}
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="modal-scroll" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {myAnnouncements.length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '60px 0', fontSize: '15px' }}>
                    No announcements yet.
                  </div>
                ) : myAnnouncements.map((ann, idx) => (
                  <div
                    key={ann.id}
                    style={{
                      background: idx === 0
                        ? (dark ? 'rgba(34,211,238,0.07)' : 'rgba(34,211,238,0.05)')
                        : (dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                      border: `1px solid ${idx === 0 ? 'rgba(34,211,238,0.35)' : border}`,
                      borderRadius: '14px',
                      padding: '16px 18px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {idx === 0 && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: 'rgba(34,211,238,0.15)',
                            color: '#22d3ee',
                            border: '1px solid rgba(34,211,238,0.3)'
                          }}>
                            ● NEW
                          </span>
                        )}
                        <span style={{ color: idx === 0 ? '#22d3ee' : text, fontWeight: 700, fontSize: '14px' }}>
                          {ann.title}
                        </span>
                      </div>

                      <span style={{ color: subtext, fontSize: '10px', whiteSpace: 'nowrap' }}>
                        {new Date(ann.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div style={{ color: subtext, fontSize: '13px', lineHeight: 1.6 }}>
                      {ann.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUPER ADMIN: VIEW REPLIES MODAL ── */}
        {replyAnn && (
          <div
            onClick={() => { setReplyAnn(null); setReplyMsg(''); setReplyText('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '20px', padding: '28px', width: '95%', maxWidth: '520px', maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexShrink: 0 }}>
                <div>
                  <div style={{ color: '#22d3ee', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>💬 WISHES RECEIVED</div>
                  <div style={{ color: subtext, fontSize: '11px', marginTop: '4px' }}>{replyAnn.title}</div>
                </div>
                <button onClick={() => setReplyAnn(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.4) transparent' }}>
                {(annReplies[replyAnn.id] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: subtext, padding: '40px 0', fontSize: '14px' }}>No wishes received yet.</div>
                ) : (annReplies[replyAnn.id] || []).map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '12px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#22d3ee' }}>{r.replied_by_name}</span>
                      <span style={{ fontSize: '10px', color: subtext }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: dark ? '#cbd5e1' : '#475569' }}>{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}




        {/* ── PROOF DOCUMENT PREVIEW MODAL ── */}
        {proofModal && (
          <div
            onClick={() => {
              if (proofUrl?.startsWith('blob:')) URL.revokeObjectURL(proofUrl)
              setProofModal(false)
              setProofUrl('')
              setProofType('')
            }}

            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(14px)',
              zIndex: 1400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? 'linear-gradient(145deg,#0a1628,#060e1c)' : '#f8fafc',
                border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: '20px',
                width: '95%',
                maxWidth: '780px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid rgba(245,158,11,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                  >
                    📎
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#f59e0b',
                        fontWeight: 800,
                        fontSize: '13px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      PROOF DOCUMENT
                    </div>

                    <div style={{ color: subtext, fontSize: '10px', marginTop: '2px' }}>
                      {selectedRequest?.first_name} {selectedRequest?.last_name} — {selectedRequest?.role?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setProofModal(false); setProofUrl('') }}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Document Preview */}
              <div style={{
                flex: 1, overflow: 'auto', padding: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '400px', flexDirection: 'column'
              }}>

                {proofLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: 40, height: 40,
                      border: '3px solid rgba(245,158,11,0.2)',
                      borderTop: '3px solid #f59e0b',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: subtext, fontSize: '14px' }}>Loading document...</span>
                  </div>
                )}

                {/* ✅ IMAGE */}
                {!proofLoading && proofType === 'image' && proofUrl && (
                  <img
                    src={proofUrl}
                    alt="Proof"
                    style={{
                      maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain',
                      borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)',
                      display: 'block'
                    }}
                    onError={() => setProofType('error')}
                  />
                )}

                {/* ✅ PDF — blob: URL-க்கு iframe use பண்ணு */}
                {!proofLoading && proofType === 'pdf' && proofUrl && (
                  <iframe
                    src={proofUrl}
                    style={{
                      width: '100%',
                      height: '65vh',
                      borderRadius: '10px',
                      border: 'none',
                      display: 'block',
                      background: '#fff'
                    }}
                    title="Proof Document"
                  />
                )}

                {/* ✅ Error fallback */}
                {!proofLoading && proofType === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '40px' }}>
                    <div style={{ fontSize: '40px' }}>⚠️</div>
                    <div style={{ color: subtext, fontSize: '14px', textAlign: 'center' }}>
                      Document load ஆகல
                    </div>

                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.4)',
                        borderRadius: '10px',
                        color: '#f59e0b',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Create Admin Form - unchanged */}
        {showForm && (
          <div style={s.card}>
            <p style={s.secHead}>Create New Admin</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={s.secSub}>👤 Personal Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1fr', gap: '14px' }}>
                <div><label style={s.lbl}>Initial</label>
                  <input name="initial" maxLength={5} value={form.initial} onChange={handleChange} className="sa-inp" style={s.inp} />
                </div>
                <div><label style={s.lbl}>First Name *</label>
                  <input name="first_name" maxLength={100} value={form.first_name} onChange={handleChange} required className="sa-inp" style={s.inp} />
                </div>
                <div><label style={s.lbl}>Last Name *</label>
                  <input name="last_name" maxLength={100} value={form.last_name} onChange={handleChange} required className="sa-inp" style={s.inp} />
                </div>
              </div>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={s.lbl}>Mobile *</label>
                  <input
                    name="mobile_number"
                    maxLength={10}
                    value={form.mobile_number}
                    onChange={handleChange}
                    required
                    className="sa-inp"
                    style={s.inp}
                  />
                </div>

                <div>
                  <label style={s.lbl}>Admin ID</label>
                  <div style={{ ...s.inp, opacity: 0.55, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '13px' }}>
                      BBADM{new Date().getFullYear()}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      &lt;auto-generated&gt;
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '10px' }}>
                <div>
                  <label style={s.lbl}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="sa-inp" style={s.inp}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={s.lbl}>DOB</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleChange} className="sa-inp" style={s.inp} />
                </div>

                <div>
                  <label style={s.lbl}>Married Status</label>
                  <select name="married_status" value={form.married_status} onChange={handleChange} className="sa-inp" style={s.inp}>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              {form.married_status === 'married' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={s.lbl}>Anniversary Date</label>
                  <input
                    type="date"
                    name="anniversary_date"
                    value={form.anniversary_date}
                    onChange={handleChange}
                    className="sa-inp"
                    style={s.inp}
                  />
                </div>
              )}
              <p style={s.secSub}>Account Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={s.lbl}>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="sa-inp" style={s.inp} />
                </div>
                <div><label style={s.lbl}>Password *</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required className="sa-inp" style={s.inp} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                <div>
                  <label style={s.lbl}>Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
                    required
                    className="sa-inp"
                    style={{ ...s.inp, border: `1px solid ${passwordError ? '#f87171' : inpBorder}` }}
                  />
                  {passwordError && (
                    <div style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                      {passwordError}
                    </div>
                  )}
                </div>
              </div>

              <p style={s.secSub}>📍 Address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div><label style={s.lbl}>Door No *</label><input name="door_no" value={form.door_no} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>Town *</label><input name="town_name" value={form.town_name} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>City *</label><input name="city_name" value={form.city_name} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>District *</label><input name="district" value={form.district} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>State *</label><input name="state" value={form.state} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
              </div>
              <p style={s.secSub}>🪪 Identity</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={s.lbl}>Aadhaar No *</label><input name="aadhaar_no" maxLength={12} value={form.aadhaar_no} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>PAN No *</label><input name="pan_no" maxLength={10} value={form.pan_no} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
              </div>
              <p style={s.secSub}>💼 Occupation</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div><label style={s.lbl}>Occupation *</label>
                  <select name="occupation" value={form.occupation} onChange={handleChange} className="sa-inp" style={{ ...s.inp, cursor: 'pointer' }}>
                    {OCCUPATION_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#1a1f26' }}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={s.lbl}>Detail</label><input name="occupation_detail" value={form.occupation_detail} onChange={handleChange} className="sa-inp" style={s.inp} /></div>
                <div><label style={s.lbl}>Annual Salary *</label><input name="annual_salary" value={form.annual_salary} onChange={handleChange} required className="sa-inp" style={s.inp} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="submit" className="sa-grad-btn"
                  style={{ padding: '12px 28px', background: 'linear-gradient(90deg,#22d3ee,#4ade80)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#006165', fontSize: '14px', cursor: 'pointer' }}>
                  Create Admin
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '12px 24px', background: inpBg, border: `1px solid ${border}`, borderRadius: '12px', color: subtext, fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins Table */}
        <div style={s.card}>
          <p style={s.secHead}>All Admins ({admins.length})</p>
          {admins.length === 0 ? (
            <p style={{ color: subtext, textAlign: 'center', padding: '60px 0', fontSize: '15px' }}>No admins yet!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${inpBorder}` }}>
                    {['First Name', 'Last Name', 'Email', 'Mobile', 'Admin ID', 'City'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: subtext, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a, i) => (
                    <tr key={i} className="sa-tr" style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '14px 16px', color: text }}>{a.first_name}</td>
                      <td style={{ padding: '14px 16px', color: text }}>{a.last_name}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{a.email}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{a.mobile_number}</td>
                      <td style={{ padding: '14px 16px', color: '#22d3ee', fontFamily: 'monospace' }}>{a.admin_id}</td>
                      <td style={{ padding: '14px 16px', color: subtext }}>{a.city_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddCoin && (
  <div onClick={() => setShowAddCoin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0a1628', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '16px' }}>Add Coins to Stock</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>Coins added here go directly into your stock — no approval needed</div>
        </div>
        <button onClick={() => setShowAddCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
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
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label} × {item.qty}</span>
              <button onClick={() => removeCoinCartItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
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
        onClick={submitAddCoins}
        style={{ width: '100%', padding: '14px', background: coinBuySubmitting || coinCart.length === 0 ? 'rgba(244,114,182,0.2)' : 'linear-gradient(90deg,#f472b6,#a78bfa)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: '#3b0024', cursor: coinBuySubmitting || coinCart.length === 0 ? 'not-allowed' : 'pointer' }}>
        {coinBuySubmitting ? 'Adding...' : 'Confirm & Add to Stock'}
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
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Your coin stock</div>
        </div>
        <button onClick={() => setShowStoredCoin(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coinStockLoading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Loading...</div>
        ) : coinStock.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No stock yet — use Add Coins</div>
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
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Pending requests received from admins</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!coinReqLoading && coinRequests.filter(r => r.status === 'pending').length > 0 && (
            <button disabled={approvingAll} onClick={approveAllCoinRequests}
              style={{ padding: '8px 16px', background: approvingAll ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '11px', cursor: approvingAll ? 'not-allowed' : 'pointer' }}>
              {approvingAll ? 'Approving...' : 'Approve All'}
            </button>
          )}
          <button onClick={() => { setShowRequestCoin(false); setRejectingReqId(null); setRejectReason('') }} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
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
                  <span style={{ color: '#fff' }}>{COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>× {item.qty}</span>
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
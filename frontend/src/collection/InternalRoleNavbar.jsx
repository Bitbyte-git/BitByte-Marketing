import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import logo from '../assets/logo.png'

function NavIcon({ type = 'dot', size = 17 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    chevron: <path d="m6 9 6 6 6-6" />,
    rate: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M9 9h4a2 2 0 1 1 0 4h-3M9 15h6" /></>,
    dot: <circle cx="12" cy="12" r="3" />,
  }
  return <svg {...common}>{icons[type] || icons.dot}</svg>
}

export default function InternalRoleNavbar({
  roleTitle = 'ADMIN',
  homePath = '/admin',
  managementItems = [],
  celebrationItems = [],
  announcementItems = [],
  coinItems = [],
  reportItems = [],
  actionItems = [],
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)
  const runItem = item => {
    setMenuOpen(false)
    setActiveGroup(null)
    if (item?.action) {
      item.action()
      return
    }
    if (item?.path) navigate(item.path)
  }
  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }
  
  const ROLE_SWITCH_LABELS = {
    PROMOTER: 'Retailer',
    'SUB DEALER': 'Wholesale Dealer',
    DEALER: 'Distributor',
    ADMIN: 'Super Stockist',
  }
  const currentTierLabel = ROLE_SWITCH_LABELS[roleTitle]
  const roleSwitchItems = currentTierLabel
    ? [
        { label: currentTierLabel, path: homePath },
        { label: 'Customer', path: '/customer' },
      ]
    : []

  const myRewardsItems = [{ label: 'AUG Coin', path: '/recharge' }]

  const groups = [
    { label: 'Management', items: managementItems },
    { label: 'Celebrations', items: celebrationItems },
    { label: 'Announcements', items: announcementItems },
    { label: 'My Rewards', items: myRewardsItems },
    { label: 'Coins', items: coinItems },
    { label: 'Reports', items: reportItems },
    { label: 'Role', items: roleSwitchItems },
  ].filter(group => group.items.length)

  const actions = actionItems.length ? actionItems : [{ label: 'Logout', icon: 'logout', variant: 'danger', action: logout }]

  return (
    <>
      <style>{`
        .irn-shell *{box-sizing:border-box}.irn-top{position:sticky;top:0;z-index:80;background:rgba(253,253,252,.96);border-bottom:1px solid rgba(189,207,206,.72);box-shadow:0 18px 44px rgba(7,59,63,.07);backdrop-filter:blur(22px)}.irn-inner{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;padding:12px 38px 0;column-gap:28px}.irn-brand{min-width:220px;height:76px;border:0;background:transparent;display:flex;align-items:center;gap:10px;padding:0;cursor:pointer}.irn-brand img{width:55px;height:55px;object-fit:contain}.irn-brand strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:.95;font-weight:850;letter-spacing:.04em;color:#073B3F}.irn-brand small{display:block;margin-top:6px;color:#BB8958;font-size:10px;font-weight:900;letter-spacing:.25em;text-transform:uppercase}.irn-menu{grid-column:1/-1;display:flex;align-items:stretch;justify-content:space-between;min-width:0;height:62px;margin-top:8px;border-top:1px solid rgba(189,207,206,.55)}.irn-group{position:relative;display:flex;flex:1}.irn-trigger{width:100%;border:0;background:transparent;padding:0 16px;color:#073B3F;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:850;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;border-radius:12px}.irn-trigger:hover,.irn-trigger.is-active{background:#EDF3F1}.irn-drop{position:absolute;top:calc(100% + 1px);left:50%;transform:translateX(-50%) translateY(10px);min-width:292px;padding:22px 24px;background:rgba(253,253,252,.99);border:1px solid rgba(189,207,206,.82);box-shadow:0 28px 70px rgba(7,59,63,.17);border-radius:16px;opacity:0;visibility:hidden;pointer-events:none;transition:.18s ease;z-index:100}.irn-group:hover .irn-drop,.irn-group.is-active .irn-drop{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}.irn-title{display:flex;align-items:center;gap:12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:900;color:#073B3F;margin-bottom:15px}.irn-title span{color:#BB8958}.irn-link{width:100%;border:0;background:transparent;padding:11px 9px;border-radius:9px;text-align:left;color:#111817;font-size:13px;font-weight:780;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer}.irn-link:hover{color:#0C4044;background:#EDF3F1;transform:translateX(3px)}.irn-badge{min-width:19px;height:19px;border-radius:999px;background:#C92035;color:#FDFDFC;font-size:10px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}.irn-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px}.irn-action,.irn-mobile-toggle{min-height:44px;border:1px solid transparent;background:transparent;color:#0C4044;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;border-radius:999px;padding:0 14px;position:relative;white-space:nowrap}.irn-action:hover,.irn-mobile-toggle:hover{background:#F3F3F0;border-color:rgba(189,207,206,.7);box-shadow:0 12px 28px rgba(7,59,63,.08)}.irn-action.danger{color:#C92035}.irn-action .irn-badge{position:absolute;top:2px;right:1px}.irn-mobile-toggle{display:none;width:46px;padding:0}
        @media(max-width:980px){.irn-inner{grid-template-columns:minmax(0,1fr) auto auto;padding:10px 18px 0;column-gap:8px}.irn-brand{min-width:0;height:66px}.irn-brand img{width:47px;height:47px}.irn-brand strong{font-size:25px}.irn-actions{grid-column:2}.irn-actions .irn-action:not(:first-child){display:none}.irn-action{width:44px;padding:0;font-size:0}.irn-mobile-toggle{display:flex;grid-column:3}.irn-menu{display:none;grid-column:1/-1;height:auto;margin:8px -18px 0;padding:10px 18px 18px;flex-direction:column;align-items:stretch;background:rgba(253,253,252,.98)}.irn-menu.is-open{display:flex}.irn-group{display:block}.irn-trigger{height:50px;justify-content:space-between;padding:0 14px}.irn-drop{position:static;min-width:0;width:100%;padding:0 14px;max-height:0;overflow:hidden;border:0;border-radius:10px;box-shadow:none;opacity:0;visibility:hidden;transform:none!important}.irn-group:hover .irn-drop{opacity:0;visibility:hidden;pointer-events:none}.irn-group.is-active .irn-drop{max-height:420px;padding:14px;opacity:1;visibility:visible;pointer-events:auto;background:#F7F9F8}.irn-title{font-size:18px;margin-bottom:8px}}
        .irn-brand{grid-column:1;grid-row:1}.irn-menu{grid-row:2}.irn-menu>.irn-trigger{flex:1}.irn-actions{grid-column:2;grid-row:1}.irn-mobile-toggle{grid-row:1}
        @media(max-width:520px){.irn-inner{padding-inline:12px}.irn-menu{margin-inline:-12px;padding-inline:12px}.irn-brand img{width:42px;height:42px}.irn-brand strong{font-size:22px}.irn-brand small{font-size:8px}.irn-actions .irn-action:first-child{display:none}}
      `}</style>
      <div className="irn-shell">
        <header className="irn-top">
          <div className="irn-inner">
            <button className="irn-brand" type="button" onClick={() => navigate(homePath)} title="Go to dashboard">
              <img src={logo} alt="Luxiva" />
              <span><strong>LUXIVA</strong><small>{roleTitle}</small></span>
            </button>
            <nav className={`irn-menu ${menuOpen ? 'is-open' : ''}`}>
              {groups.map(group => (
                group.label === 'My Rewards' ? (
                  // ── NEW: dropdown illama, direct click-able button ── 
                  <button
                    key={group.label}
                    type="button"
                    className="irn-trigger"
                    onClick={() => runItem(group.items[0])}
                  >
                    {group.items[0].label}
                  </button>
                ) : (
                  <div className={`irn-group ${activeGroup === group.label ? 'is-active' : ''}`} key={group.label}>
                    <button className={`irn-trigger ${activeGroup === group.label ? 'is-active' : ''}`} type="button" onClick={() => setActiveGroup(current => current === group.label ? null : group.label)} aria-expanded={activeGroup === group.label}>{group.label}<NavIcon type="chevron" size={15} /></button>
                    <div className="irn-drop">
                      <div className="irn-title"><span>D</span>{group.label}</div>
                      {group.items.map(item => (
                        <button key={item.label} type="button" className="irn-link" onClick={() => runItem(item)}>
                          <span>{item.label}</span>
                          {item.badge ? <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span> : <b>-&gt;</b>}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </nav>
            <button className="irn-mobile-toggle" type="button" onClick={() => setMenuOpen(open => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <div className="irn-actions">
  {actions.map(item => {
    const iconOnly = item.icon === 'bell'
    return (
      <button key={item.label} type="button" className={`irn-action ${item.variant === 'danger' ? 'danger' : ''}`} onClick={() => item.action ? item.action() : logout()} title={item.label}>
        <NavIcon type={item.icon || 'dot'} />{!iconOnly && item.label}
        {item.badge ? <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span> : null}
      </button>
    )
  })}
</div>
          </div>
        </header>
      </div>
    </>
  )
}

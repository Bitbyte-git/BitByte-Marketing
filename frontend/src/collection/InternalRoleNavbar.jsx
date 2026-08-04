import { useNavigate } from 'react-router-dom'
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
  const runItem = item => {
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

  const myRewardsItems = [{ label: 'My Rewards (AUG Coin)', path: '/recharge' }]

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
        .irn-shell *{box-sizing:border-box}.irn-top{position:sticky;top:0;z-index:80;background:rgba(253,253,252,.985);border-bottom:1px solid rgba(189,207,206,.68);box-shadow:0 18px 44px rgba(7,59,63,.06);backdrop-filter:blur(18px)}.irn-inner{min-height:104px;display:flex;align-items:stretch;gap:18px;padding:0 28px}.irn-brand{width:260px;border:0;background:transparent;display:flex;align-items:center;gap:14px;padding:0 30px;cursor:pointer}.irn-brand img{width:54px;height:54px;object-fit:contain}.irn-brand strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:.95;font-weight:850;letter-spacing:.04em;color:#073B3F}.irn-brand small{display:block;margin-top:5px;color:#BB8958;font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase}.irn-menu{flex:1;display:flex;justify-content:space-evenly;align-items:stretch;gap:8px}.irn-group{position:relative;display:flex}.irn-trigger{border:0;background:transparent;min-width:168px;padding:0 18px;color:#073B3F;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:850;letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer}.irn-trigger:hover{background:#F3F3F0;border-radius:999px}.irn-drop{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(10px);min-width:292px;padding:24px 28px;background:rgba(253,253,252,.99);border:1px solid rgba(189,207,206,.8);box-shadow:0 26px 68px rgba(7,59,63,.14);border-radius:8px;opacity:0;visibility:hidden;pointer-events:none;transition:.18s ease;z-index:100}.irn-group:hover .irn-drop{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}.irn-title{display:flex;align-items:center;gap:12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:900;color:#073B3F;margin-bottom:18px}.irn-title span{font-size:24px;color:#BB8958}.irn-link{width:100%;border:0;background:transparent;padding:10px 0;text-align:left;color:#111817;font-size:14px;font-weight:780;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer}.irn-link:hover{color:#0C4044;transform:translateX(3px)}.irn-badge{min-width:19px;height:19px;border-radius:999px;background:#C92035;color:#FDFDFC;font-size:10px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}.irn-actions{display:flex;align-items:center;gap:12px}.irn-action{min-width:128px;min-height:42px;border:0;background:transparent;color:#0C4044;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;border-radius:999px;padding:0 18px;position:relative}.irn-action:hover{background:#F3F3F0;box-shadow:0 12px 28px rgba(7,59,63,.08);transform:translateY(-1px)}.irn-action.danger{color:#C92035}.irn-action .irn-badge{position:absolute;top:8px;right:5px}@media(max-width:1200px){.irn-inner{display:block;padding:0}.irn-brand{width:100%;height:78px;justify-content:center}.irn-menu{justify-content:flex-start;overflow-x:auto;padding:0 16px;border-top:1px solid rgba(189,207,206,.45)}.irn-trigger{height:56px;min-width:158px}.irn-actions{overflow-x:auto;padding:10px 16px 14px}.irn-action{min-width:120px}}
      `}</style>
      <div className="irn-shell">
        <header className="irn-top">
          <div className="irn-inner">
            <button className="irn-brand" type="button" onClick={() => navigate(homePath)} title="Go to dashboard">
              <img src={logo} alt="Luxiva" />
              <span><strong>LUXIVA</strong><small>{roleTitle}</small></span>
            </button>
            <nav className="irn-menu">
              {groups.map(group => (
                <div className="irn-group" key={group.label}>
                  <button className="irn-trigger" type="button">{group.label}<NavIcon type="chevron" size={15} /></button>
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
              ))}
            </nav>
            <div className="irn-actions">
              {actions.map(item => (
                <button key={item.label} type="button" className={`irn-action ${item.variant === 'danger' ? 'danger' : ''}`} onClick={() => item.action ? item.action() : logout()}>
                  <NavIcon type={item.icon || 'dot'} />{item.label}
                  {item.badge ? <span className="irn-badge">{item.badge > 99 ? '99+' : item.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>
    </>
  )
}

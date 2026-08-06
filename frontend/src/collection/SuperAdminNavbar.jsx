import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Icon({ name, size = 17 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V21h14V10.5" /><path d="M9 21v-6h6v6" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    orders: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    rate: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.03 3.84l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.38.5.7.9.9.34.18.72.27 1.1.27H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  }
  return <svg {...common}>{icons[name]}</svg>
}

export default function SuperAdminNavbar({
  showSidebar = false,
  onGoldRate,
  onTodayRates,
  onAddCoins,
  onRequests,
  onBirthdays,
  onAnniversaries,
  onWorkAnniversaries,
  onSendAnnouncement,
  onMyAnnouncements,
}) {
  const navigate = useNavigate()
  const run = (handler, fallback) => {
    if (handler) {
      handler()
      return
    }
    if (fallback) navigate(fallback)
  }
  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const management = [
    ['Gold Rate', () => run(onGoldRate, '/super-admin')],
    ['Add Product', () => navigate('/add-product')],
    ['Orders', () => navigate('/admin-orders')],
    ['Requests', () => run(onRequests, '/super-admin')],
    ['Hierarchy Grid', () => navigate('/superadmin-hierarchy-grid')],
    ['Hierarchy Tree', () => navigate('/superadmin-hierarchy')],
  ]
  const celebrations = [
    ["Today's Birthdays", () => run(onBirthdays, '/super-admin')],
    ["Today's Anniversaries", () => run(onAnniversaries, '/super-admin')],
    ['Work Anniversaries', () => run(onWorkAnniversaries, '/super-admin')],
  ]
  const announcements = [
    ['Send Announcement', () => run(onSendAnnouncement, '/super-admin')],
    ['My Announcements', () => run(onMyAnnouncements, '/super-admin')],
  ]
  const coins = [
    ['Buy Coin', () => navigate('/buy-coin')],
    ['Stored Coin', () => navigate('/stored-coins')],
    ['Coin Requests', () => navigate('/coin-requests-page')],
    ['Coin Transactions', () => navigate('/coin-transactions')],
  ]
  const reports = [
    ['Hierarchy', () => navigate('/superadmin-hierarchy-grid')],
    ['Hierarchy Sales Report', () => navigate('/hierarchy-sales-count')],
    ['Sales Report', () => navigate('/sales-report')],
    ['Login Active', () => navigate('/login-active')],
    ['Login Inactive', () => navigate('/login-inactive')],
  ]
   const promotion = [
    ['Retailers', () => navigate('/promotions/retailer')],
    ['Wholesale Dealer', () => navigate('/promotions/wholesale-dealer')],
    ['Distributor', () => navigate('/promotions/distributor')],
    ['Super Stockist', () => navigate('/promotions/super-stockist')],
  ]
  const payment = [
    ['Revenue & Payments', () => navigate('/superadmin-payments')],
    ['Add AUG Coins', () => navigate('/superadmin-send-coins')],
  ]

  const MenuGroup = ({ label, items, footer }) => (
    <div className="san-menu-group">
      <button className="san-menu-trigger" type="button">{label}<Icon name="chevron" size={15} /></button>
      <div className="san-menu-dropdown">
        <div className="san-menu-title"><span>D</span>{label}</div>
        {items.map(([text, action]) => <button key={text} type="button" className="san-menu-link" onClick={action}>{text}<b>-&gt;</b></button>)}
        {footer && <button type="button" className="san-menu-foot" onClick={footer.action}>{footer.label}</button>}
      </div>
    </div>
  )

  return (
    <>
      <style>{`
.san-shell * { box-sizing: border-box; }
.san-sidebar { position: fixed; inset: 0 auto 0 0; width: 286px; z-index: 70; background: rgba(253,253,252,.98); border-right: 1px solid rgba(189,207,206,.76); box-shadow: 20px 0 48px rgba(7,59,63,.07); padding: 28px 18px; display: flex; flex-direction: column; }
.san-brand { display: flex; align-items: center; gap: 13px; padding: 0 8px 26px; border-bottom: 1px solid rgba(189,207,206,.66); cursor: pointer; }
.san-brand img { width: 54px; height: 54px; object-fit: contain; }
.san-brand-name { font-family: Georgia, 'Times New Roman', serif; font-size: 31px; line-height: .95; font-weight: 800; color: #073B3F; letter-spacing: .03em; }
.san-role { margin-top: 5px; color: #BB8958; font-size: 11px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
.san-side-nav { display: flex; flex-direction: column; gap: 9px; margin-top: 24px; }
.san-side-link { height: 54px; border: 0; border-radius: 8px; background: transparent; color: #073B3F; display: flex; align-items: center; gap: 14px; padding: 0 18px; font-size: 15px; font-weight: 900; text-align: left; cursor: pointer; }
.san-side-link:hover, .san-side-link.is-active { background: linear-gradient(135deg, #073B3F, #0C575B); color: #FDFDFC; box-shadow: 0 18px 34px rgba(7,59,63,.16); }
.san-quick { border-top: 1px solid #E4ECEB; margin-top: 24px; padding: 22px 16px 0; }
.san-quick-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #111817; margin-bottom: 18px; }
.san-quick-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; margin-bottom: 18px; color: #0C4044; }
.san-quick-row strong { display: block; font-size: 18px; line-height: 1.1; color: #111817; }
.san-quick-row small { display: block; font-size: 12px; color: #0C4044; font-weight: 800; }
.san-quick-row b { font-size: 11px; color: #009957; }
.san-secure { margin-top: auto; border-radius: 8px; background: linear-gradient(145deg, #073B3F, #0C4044); border: 1px solid rgba(204,168,129,.32); padding: 24px 20px; color: #FDFDFC; box-shadow: 0 18px 36px rgba(7,59,63,.14); }
.san-secure strong { display: block; font-size: 16px; margin-bottom: 8px; }
.san-secure span { display: block; color: #D1DFDE; font-size: 13px; line-height: 1.6; }
.san-top-shell { position: sticky; top: 0; z-index: 65; background: rgba(253,253,252,.98); border-bottom: 1px solid rgba(189,207,206,.74); box-shadow: 0 16px 38px rgba(7,59,63,.055); backdrop-filter: blur(16px); }
.san-top-inner { min-height: 104px; display: flex; align-items: stretch; gap: 24px; padding: 0 32px; }
.san-navbar-brand { width: 260px; border: 0; background: transparent; display: flex; align-items: center; gap: 14px; padding: 0 30px; cursor: pointer; }
.san-navbar-brand img { width: 54px; height: 54px; object-fit: contain; }
.san-navbar-brand strong { display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 31px; line-height: .95; font-weight: 850; letter-spacing: .04em; color: #073B3F; }
.san-navbar-brand small { display: block; margin-top: 5px; color: #BB8958; font-size: 10px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
.san-search-block { width: 260px; display: flex; align-items: center; padding: 0 18px; }
.san-search { height: 48px; width: 100%; border: 1px solid rgba(189,207,206,.95); border-radius: 10px; background: #FDFDFC; color: #073B3F; display: flex; align-items: center; gap: 12px; padding: 0 16px; font-size: 14px; font-weight: 700; }
.san-menu-center { flex: 1; display: flex; justify-content: center; align-items: stretch; gap: 6px; min-width: 0; }
.san-menu-group { position: relative; display: flex; }
.san-menu-trigger { border: 0; background: transparent; min-width: auto; padding: 0 16px; color: #073B3F; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 7px; cursor: pointer; white-space: nowrap; }
.san-menu-trigger:hover { background: #F3F3F0; border-radius: 999px; }
.san-menu-dropdown { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 0; padding: 32px 28px 24px; min-width: 286px; background: rgba(253,253,252,.98); border: 1px solid rgba(189,207,206,.8); box-shadow: 0 26px 68px rgba(7,59,63,.14); border-radius: 8px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .18s ease, visibility .18s ease; z-index: 90; }
.san-menu-group:hover .san-menu-dropdown { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%); }
.san-menu-title { display: flex; align-items: center; gap: 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 900; color: #073B3F; margin-bottom: 18px; }
.san-menu-title span { font-size: 24px; color: #BB8958; }
.san-menu-link { width: 100%; border: 0; background: transparent; padding: 10px 0; text-align: left; color: #111817; font-size: 14px; font-weight: 750; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.san-menu-link:hover { color: #0C4044; transform: translateX(3px); }
.san-menu-link b, .san-menu-foot { color: #0C4044; }
.san-menu-foot { margin-top: 22px; border: 0; background: transparent; font-size: 13px; font-weight: 900; letter-spacing: .02em; cursor: pointer; }
.san-actions { display: flex; align-items: center; border-left: 0; gap: 18px; padding-left: 8px; }
.san-action { min-width: auto; padding: 0 12px; border: 0; background: transparent; color: #0C4044; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; white-space: nowrap; }
.san-action:hover { background: #F3F3F0; box-shadow: 0 12px 28px rgba(7,59,63,.08); transform: translateY(-1px); }
.san-action.logout { color: #C92035; }
.san-mobile-logo { display: none; }
.san-mobile-logo img { width: 46px; height: 46px; }
.san-mobile-logo strong { font-family: Georgia, 'Times New Roman', serif; color: #073B3F; font-size: 25px; line-height: 1; }
.san-mobile-logo small { display: block; color: #BB8958; font-size: 9px; font-weight: 900; letter-spacing: .2em; }
@media (max-width: 1100px) {
  .san-navbar-brand { width: 100%; height: 76px; border-right: 0; justify-content: center; }
  .san-sidebar { position: relative; width: 100%; min-height: 0; padding: 16px; border-right: 0; border-bottom: 1px solid rgba(189,207,206,.72); }
  .san-side-nav { flex-direction: row; overflow: auto; }
  .san-side-link { height: 42px; flex: 0 0 auto; }
  .san-quick, .san-secure { display: none; }
  .san-top-shell { margin-left: 0 !important; }
  .san-top-inner { min-height: auto; display: block; }
  .san-mobile-logo { display: none !important; }
  .san-search-block { width: 100%; border-right: 0; padding: 14px 18px; }
  .san-menu-center { overflow-x: auto; justify-content: flex-start; border-top: 0; }
  .san-menu-trigger { min-width: 160px; height: 54px; }
  .san-actions { border-left: 0; overflow: auto; }
  .san-action { height: 52px; min-width: 140px; }
}
      `}</style>
      <div className="san-shell">
        {showSidebar && (
          <aside className="san-sidebar">
            <div className="san-brand" onClick={() => navigate('/super-admin')} title="Go to dashboard">
              <img src={logo} alt="Luxiva" />
              <div><div className="san-brand-name">LUXIVA</div><div className="san-role">Super Admin</div></div>
            </div>
            <nav className="san-side-nav">
              <button className="san-side-link is-active" type="button" onClick={() => navigate('/super-admin')}><Icon name="home" />Dashboard</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/add-product')}><Icon name="box" />Products</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/admin-orders')}><Icon name="orders" />Orders</button>
              <button className="san-side-link" type="button" onClick={() => run(onTodayRates, '/super-admin')}><Icon name="rate" />Gold Rate</button>
              <button className="san-side-link" type="button"><Icon name="settings" />Settings</button>
            </nav>
            <div className="san-quick">
              <div className="san-quick-title">Quick Summary</div>
              {[['Total Orders', '0', '+0%'], ['Total Customers', '588', '+12.5%'], ['Total Dealers', '41', '+6.8%'], ['Total Products', '256', '+5.2%'], ['Active Users', '7', '+8.3%']].map(([label, value, growth]) => (
                <div className="san-quick-row" key={label}><Icon name="orders" size={19} /><div><small>{label}</small><strong>{value}</strong></div><b>{growth}</b></div>
              ))}
            </div>
            <div className="san-secure"><strong>Manual Control</strong><span>Reports and charts update only when you choose refresh.</span></div>
          </aside>
        )}
        <header className="san-top-shell" style={{ marginLeft: showSidebar ? 286 : 0 }}>
          <div className="san-mobile-logo" onClick={() => navigate('/super-admin')}><img src={logo} alt="Luxiva" /><div><strong>LUXIVA</strong><small>SUPER ADMIN</small></div></div>
          <div className="san-top-inner">
            <button className="san-navbar-brand" type="button" onClick={() => navigate('/super-admin')} title="Go to dashboard"><img src={logo} alt="Luxiva" /><span><strong>LUXIVA</strong><small>SUPER ADMIN</small></span></button>
            <div className="san-menu-center">
              <MenuGroup label="Management" items={management} footer={{ label: 'View All Management ->', action: () => navigate('/superadmin-hierarchy-grid') }} />
              <MenuGroup label="Celebrations" items={celebrations} footer={{ label: 'View All Celebrations ->', action: () => run(onBirthdays, '/super-admin') }} />
              <MenuGroup label="Announcements" items={announcements} footer={{ label: 'View All Announcements ->', action: () => run(onMyAnnouncements, '/super-admin') }} />
              <MenuGroup label="Coins" items={coins} footer={{ label: 'View All Coins ->', action: () => navigate('/stored-coins') }} />
              <MenuGroup label="Reports" items={reports} footer={{ label: 'View All Reports ->', action: () => navigate('/sales-report') }} />
              <MenuGroup label="Promotion" items={promotion} footer={{ label: 'View All Promotion ->', action: () => navigate('/promotions/retailer') }} />
              <MenuGroup label="Payment" items={payment} footer={{ label: 'View Revenue & Payments ->', action: () => navigate('/superadmin-payments') }} />  
            </div>
            <div className="san-actions">
              <button className="san-action" type="button" onClick={() => run(onTodayRates, '/super-admin')}><Icon name="rate" />Today Rates</button>
              <button className="san-action logout" type="button" onClick={logout}><Icon name="logout" />Logout</button>
            </div>
          </div>
        </header>
      </div>
    </>
  )
}





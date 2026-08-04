import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerNavbar from './collection/CustomerNavbar'
import SuperAdminNavbar from './collection/SuperAdminNavbar'
import InternalRoleNavbar from './collection/InternalRoleNavbar'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'))
const SuperadminHierarchy = lazy(() => import('./Hierarchy/Superadmin_Hierarchy'))
const SuperadminHierarchyGrid = lazy(() => import('./Grid/Superadmin_Hierarchy_grid'))
const SuperAdminHierarchySalesCount = lazy(() => import('./Hierarchy/superadmin_Hierarchy_SalesCount'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminHierarchy = lazy(() => import('./Hierarchy/Admin_Hierarchy'))
const AdminHierarchyGrid = lazy(() => import('./Grid/Admin_Hierarchy_grid'))
const DealerDashboard = lazy(() => import('./pages/DealerDashboard'))
const DealerHierarchy = lazy(() => import('./Hierarchy/Dealer_Hierarchy'))
const DealerHierarchyGrid = lazy(() => import('./Grid/Dealer_Hierarchy_grid'))
const SubDealerDashboard = lazy(() => import('./pages/SubDealerDashboard'))
const SubdealerHierarchy = lazy(() => import('./Hierarchy/Subdealer_Hierarchy'))
const SubdealerHierarchyGrid = lazy(() => import('./Grid/Subdealer_Hierarchy_grid'))
const PromotorDashboard = lazy(() => import('./pages/PromotorDashboard'))
const PromotorHierarchy = lazy(() => import('./Hierarchy/Promotor_Hierarchy'))
const PromotorHierarchyGrid = lazy(() => import('./Grid/Promotor_Hierarchy_grid'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const Profile = lazy(() => import('./collection/profile'))
const CreateCustomer = lazy(() => import('./collection/create_customer'))
const CoinsCollection = lazy(() => import('./collection/coins_collection'))
const AllCollection = lazy(() => import('./collection/all_collection'))
const ProductDisplay = lazy(() => import('./collection/product_display'))
const CardSection = lazy(() => import('./collection/card_section'))
const WishlistPage = lazy(() => import('./collection/WishlistPage'))
const BBLive = lazy(() => import('./collection/bb-live'))
const AddProduct = lazy(() => import('./Products/add_product'))
const AddBanners = lazy(() => import('./Products/banners/add_banners'))
const HomeBanner = lazy(() => import('./Products/banners/home_banner'))
const OrderConfirm = lazy(() => import('./Orders/Orderconfirm'))
const OrderSummary = lazy(() => import('./Orders/Ordersummary'))
const Recharge = lazy(() => import('./collection/Recharge'))
const AdminOrdersPage = lazy(() => import('./Orders/Adminorderspage'))
const Report = lazy(() => import('./Orders/Report'))
const LoginActive = lazy(() => import('./Orders/login_active'))
const LoginInactive = lazy(() => import('./Orders/login_inactive'))
const CoinsReward = lazy(() => import('./Coins_products/Coins_Reward'))
const BuyCoin = lazy(() => import('./Coins_products/Buy_Coin'))
const StoredCoins = lazy(() => import('./Coins_products/Stored_coins'))
const CoinRequests = lazy(() => import('./Coins_products/Coin_Requests'))
const TransactionHistory = lazy(() => import('./Coins_products/Transaction_History'))
const RetailerPromotions = lazy(() => import('./Promotions/Retailer_Promotions'))
const WholesaleDealerPromotions = lazy(() => import('./Promotions/WholesaleDealer_Promotions'))
const DistributorPromotions = lazy(() => import('./Promotions/Distributor'))
const SuperStokistPromotions = lazy(() => import('./Promotions/SuperStokist'))
const PromotionSalesOrderList = lazy(() => import('./Promotions/Promotion_sales_order_list'))

const collectionPath = (category, metal) => {
  const params = new URLSearchParams({ category })
  if (metal) params.set('metal', metal)
  return `/collection/all?${params.toString()}`
}

const coinsPath = metal => `/collection/coins?metal=${metal}`
const INTERNAL_COIN_ROLES = ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (!token || token === 'undefined' || token === 'null') {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!allowedRoles.includes(userRole)) {
      localStorage.clear()
      return <Navigate to="/login" replace />
    }
  }

  return children
}

function RouteLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,#fffaf4,#fbf7f1)', color: '#1f1712', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 220, borderRadius: 24, padding: 24, background: 'rgba(255,255,255,0.86)', border: '1px solid #eadfd3', boxShadow: '0 18px 48px rgba(63,39,18,0.12)', textAlign: 'center' }}>
        <div style={{ width: 42, height: 42, margin: '0 auto 14px', borderRadius: '50%', border: '3px solid #eadfd3', borderTopColor: '#8b1a1a', animation: 'spinSlow 900ms linear infinite' }} />
        <strong>Loading</strong>
      </div>
    </div>
  )
}

function WithCustomerNavbar({ children }) {
  return <><CustomerNavbar />{children}</>
}

function WithSuperAdminNavbar({ children }) {
  const role = localStorage.getItem('role')
  if (role !== 'super_admin') return children
  return <><SuperAdminNavbar showSidebar={false} />{children}</>
}

function getInternalRoleChrome(role) {
  const map = {
    admin: { title: 'ADMIN', home: '/admin', hierarchy: '/admin-hierarchy', hierarchyLabel: 'Dealer Hierarchy', createLabel: 'Create Dealer' },
    dealer: { title: 'DEALER', home: '/dealer', hierarchy: '/dealer-hierarchy', hierarchyLabel: 'Sub Dealer Hierarchy', createLabel: 'Create Sub Dealer' },
    sub_dealer: { title: 'SUB DEALER', home: '/sub-dealer', hierarchy: '/subdealer-hierarchy', hierarchyLabel: 'Promoter Hierarchy', createLabel: 'Create Promoter' },
    promotor: { title: 'PROMOTER', home: '/promotor', hierarchy: '/promotor-hierarchy', hierarchyLabel: 'Customer Hierarchy', createLabel: 'Create Customer' },
  }
  return map[role] || null
}

function WithInternalRoleNavbar({ children }) {
  const role = localStorage.getItem('role')
  if (role === 'super_admin') return <WithSuperAdminNavbar>{children}</WithSuperAdminNavbar>
  const cfg = getInternalRoleChrome(role)
  if (!cfg) return children
  return (
    <>
      <InternalRoleNavbar
        roleTitle={cfg.title}
        homePath={cfg.home}
        managementItems={[{ label: 'Dashboard', path: cfg.home }, { label: cfg.hierarchyLabel, path: cfg.hierarchy }, { label: cfg.createLabel, path: cfg.home }]}
        celebrationItems={[{ label: "Today's Birthdays", path: cfg.home }, { label: "Today's Anniversaries", path: cfg.home }, { label: 'Work Anniversaries', path: cfg.home }]}
        announcementItems={[{ label: 'Announcements', path: cfg.home }]}
        coinItems={[{ label: 'Buy Coin', path: '/buy-coin' }, { label: 'Stored Coin', path: '/stored-coins' }, { label: role === 'promotor' ? 'My Requests' : 'Coin Requests', path: '/coin-requests-page' }, { label: 'Coin Transactions', path: '/coin-transactions' }]}
        reportItems={[{ label: 'Hierarchy Report', path: cfg.hierarchy }, { label: 'Sales Report', path: '/sales-report' }]}
        actionItems={[{ label: 'Dashboard', icon: 'user', path: cfg.home }, { label: 'Logout', icon: 'logout', variant: 'danger', action: () => { localStorage.clear(); window.location.href = '/login' } }]}
      />
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<WithCustomerNavbar><LandingPage /></WithCustomerNavbar>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/super-admin" element={<ProtectedRoute role="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin-hierarchy" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><SuperadminHierarchy /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/superadmin-hierarchy-grid" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><SuperadminHierarchyGrid /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-hierarchy" element={<ProtectedRoute role="admin"><WithInternalRoleNavbar><AdminHierarchy /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/admin-hierarchy-grid" element={<ProtectedRoute role="admin"><WithInternalRoleNavbar><AdminHierarchyGrid /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/dealer" element={<ProtectedRoute role="dealer"><DealerDashboard /></ProtectedRoute>} />
          <Route path="/dealer-hierarchy" element={<ProtectedRoute role="dealer"><WithInternalRoleNavbar><DealerHierarchy /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/dealer-hierarchy-grid" element={<ProtectedRoute role="dealer"><WithInternalRoleNavbar><DealerHierarchyGrid /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/sub-dealer" element={<ProtectedRoute role="sub_dealer"><SubDealerDashboard /></ProtectedRoute>} />
          <Route path="/subdealer-hierarchy" element={<ProtectedRoute role="sub_dealer"><WithInternalRoleNavbar><SubdealerHierarchy /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/subdealer-hierarchy-grid" element={<ProtectedRoute role="sub_dealer"><WithInternalRoleNavbar><SubdealerHierarchyGrid /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/promotor" element={<ProtectedRoute role="promotor"><PromotorDashboard /></ProtectedRoute>} />
          <Route path="/promotor-hierarchy" element={<ProtectedRoute role="promotor"><WithInternalRoleNavbar><PromotorHierarchy /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/promotor-hierarchy-grid" element={<ProtectedRoute role="promotor"><WithInternalRoleNavbar><PromotorHierarchyGrid /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/customer" element={<ProtectedRoute role={["customer", "promotor", "sub_dealer", "dealer", "admin"]}><WithCustomerNavbar><CustomerDashboard /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/profile" element={<WithCustomerNavbar><Profile /></WithCustomerNavbar>} />
          <Route path="/create-customer" element={<ProtectedRoute role={["customer", "promotor", "sub_dealer", "dealer", "admin"]}><WithCustomerNavbar><CreateCustomer /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/collection/rings" element={<Navigate to={collectionPath('rings')} replace />} />
          <Route path="/gold-rings" element={<Navigate to={collectionPath('rings', 'gold')} replace />} />
          <Route path="/silver-rings" element={<Navigate to={collectionPath('rings', 'silver')} replace />} />
          <Route path="/diamond-rings" element={<Navigate to={collectionPath('rings', 'diamond')} replace />} />
          <Route path="/platinum-rings" element={<Navigate to={collectionPath('rings', 'platinum')} replace />} />
          <Route path="/collection/bangles" element={<Navigate to={collectionPath('bangles')} replace />} />
          <Route path="/gold-bangles" element={<Navigate to={collectionPath('bangles', 'gold')} replace />} />
          <Route path="/silver-bangles" element={<Navigate to={collectionPath('bangles', 'silver')} replace />} />
          <Route path="/diamond-bangles" element={<Navigate to={collectionPath('bangles', 'diamond')} replace />} />
          <Route path="/platinum-bangles" element={<Navigate to={collectionPath('bangles', 'platinum')} replace />} />
          <Route path="/collection/earrings" element={<Navigate to={collectionPath('earrings')} replace />} />
          <Route path="/gold-earrings" element={<Navigate to={collectionPath('earrings', 'gold')} replace />} />
          <Route path="/silver-earrings" element={<Navigate to={collectionPath('earrings', 'silver')} replace />} />
          <Route path="/diamond-earrings" element={<Navigate to={collectionPath('earrings', 'diamond')} replace />} />
          <Route path="/platinum-earrings" element={<Navigate to={collectionPath('earrings', 'platinum')} replace />} />
          <Route path="/collection/chains" element={<Navigate to={collectionPath('chains')} replace />} />
          <Route path="/gold-chain" element={<Navigate to={collectionPath('chains', 'gold')} replace />} />
          <Route path="/silver-chain" element={<Navigate to={collectionPath('chains', 'silver')} replace />} />
          <Route path="/diamond-chain" element={<Navigate to={collectionPath('chains', 'diamond')} replace />} />
          <Route path="/platinum-chain" element={<Navigate to={collectionPath('chains', 'platinum')} replace />} />
          <Route path="/collection/necklaces" element={<Navigate to={collectionPath('necklaces')} replace />} />
          <Route path="/gold-necklaces" element={<Navigate to={collectionPath('necklaces', 'gold')} replace />} />
          <Route path="/silver-necklaces" element={<Navigate to={collectionPath('necklaces', 'silver')} replace />} />
          <Route path="/diamond-necklaces" element={<Navigate to={collectionPath('necklaces', 'diamond')} replace />} />
          <Route path="/platinum-necklaces" element={<Navigate to={collectionPath('necklaces', 'platinum')} replace />} />
          <Route path="/collection/bracelets" element={<Navigate to={collectionPath('bracelets')} replace />} />
          <Route path="/gold-bracelets" element={<Navigate to={collectionPath('bracelets', 'gold')} replace />} />
          <Route path="/silver-bracelets" element={<Navigate to={collectionPath('bracelets', 'silver')} replace />} />
          <Route path="/diamond-bracelets" element={<Navigate to={collectionPath('bracelets', 'diamond')} replace />} />
          <Route path="/platinum-bracelets" element={<Navigate to={collectionPath('bracelets', 'platinum')} replace />} />
          <Route path="/collection/pendants" element={<Navigate to={collectionPath('pendants')} replace />} />
          <Route path="/gold-pendants" element={<Navigate to={collectionPath('pendants', 'gold')} replace />} />
          <Route path="/silver-pendants" element={<Navigate to={collectionPath('pendants', 'silver')} replace />} />
          <Route path="/diamond-pendants" element={<Navigate to={collectionPath('pendants', 'diamond')} replace />} />
          <Route path="/platinum-pendants" element={<Navigate to={collectionPath('pendants', 'platinum')} replace />} />
          <Route path="/collection/mangalsutra" element={<Navigate to={collectionPath('mangalsutra')} replace />} />
          <Route path="/collection/nose-pin" element={<Navigate to={collectionPath('nosepin')} replace />} />
          <Route path="/collection/anklets" element={<Navigate to={collectionPath('anklets')} replace />} />
          <Route path="/collection/necklace-set" element={<Navigate to={collectionPath('necklaces')} replace />} />
          <Route path="/collection/offers" element={<Navigate to="/collection/all?price=below25k" replace />} />
          <Route path="/collection/gifting" element={<Navigate to="/collection/all?occasion=Birthday" replace />} />
          <Route path="/collection/new-arrivals" element={<Navigate to="/collection/all?new=true" replace />} />

          <Route path="/cart" element={<WithCustomerNavbar><CardSection /></WithCustomerNavbar>} />
          <Route path="/product-display" element={<WithCustomerNavbar><ProductDisplay /></WithCustomerNavbar>} />
          <Route path="/add-product" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><AddProduct /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/add-banners" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><AddBanners /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/home-banner" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><HomeBanner /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/collection/all" element={<WithCustomerNavbar><AllCollection /></WithCustomerNavbar>} />
          <Route path="/collection/coins" element={<WithCustomerNavbar><CoinsCollection /></WithCustomerNavbar>} />
          <Route path="/gold-coins" element={<Navigate to={coinsPath('gold')} replace />} />
          <Route path="/silver-coins" element={<Navigate to={coinsPath('silver')} replace />} />
          <Route path="/wishlist" element={<ProtectedRoute role={["customer", "promotor", "sub_dealer", "dealer", "admin"]}><WithCustomerNavbar><WishlistPage /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/order-confirm" element={<WithCustomerNavbar><OrderConfirm /></WithCustomerNavbar>} />
          <Route path="/bj-live" element={<WithCustomerNavbar><BBLive /></WithCustomerNavbar>} />
          <Route path="/order-summary" element={<ProtectedRoute role={["customer", "promotor", "sub_dealer", "dealer", "admin"]}><WithCustomerNavbar><OrderSummary /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/recharge" element={<ProtectedRoute role={["customer", "promotor", "sub_dealer", "dealer", "admin"]}><WithCustomerNavbar><Recharge /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/admin-orders" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><AdminOrdersPage /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/sales-report" element={<ProtectedRoute><WithInternalRoleNavbar><Report /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/hierarchy-sales-count" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><SuperAdminHierarchySalesCount /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/promotions/retailer" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><RetailerPromotions /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/promotions/wholesale-dealer" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><WholesaleDealerPromotions /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/promotions/distributor" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><DistributorPromotions /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/promotions/super-stockist" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><SuperStokistPromotions /></WithSuperAdminNavbar></ProtectedRoute>} />
          <Route path="/login-active" element={<LoginActive />} />
          <Route path="/login-inactive" element={<LoginInactive />} />
          <Route path="/buy-coin" element={<ProtectedRoute role={INTERNAL_COIN_ROLES}><WithInternalRoleNavbar><BuyCoin /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/coins-reward" element={<ProtectedRoute role={INTERNAL_COIN_ROLES}><WithInternalRoleNavbar><CoinsReward /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/stored-coins" element={<ProtectedRoute role={INTERNAL_COIN_ROLES}><WithInternalRoleNavbar><StoredCoins /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/coin-requests-page" element={<ProtectedRoute role={INTERNAL_COIN_ROLES}><WithInternalRoleNavbar><CoinRequests /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/coin-transactions" element={<ProtectedRoute role={INTERNAL_COIN_ROLES}><WithInternalRoleNavbar><TransactionHistory /></WithInternalRoleNavbar></ProtectedRoute>} />
          <Route path="/promotions/sales-order-list" element={<ProtectedRoute role="super_admin"><WithSuperAdminNavbar><PromotionSalesOrderList /></WithSuperAdminNavbar></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

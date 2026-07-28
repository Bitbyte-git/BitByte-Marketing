
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerNavbar from './collection/CustomerNavbar'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'))
const SuperadminHierarchy = lazy(() => import('./Hierarchy/Superadmin_Hierarchy'))
const SuperadminHierarchyGrid = lazy(() => import('./Grid/Superadmin_Hierarchy_grid'))
const SuperAdminHierarchySalesCount = lazy(() => import('./Hierarchy/superadmin_Hierarchy_SalesCount'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminHierarchyGrid = lazy(() => import('./Grid/Admin_Hierarchy_grid'))
const DealerDashboard = lazy(() => import('./pages/DealerDashboard'))
const AdminHierarchy = lazy(() => import('./Hierarchy/Admin_Hierarchy'))
const DealerHierarchyGrid = lazy(() => import('./Grid/Dealer_Hierarchy_grid'))
const DealerHierarchy = lazy(() => import('./Hierarchy/Dealer_Hierarchy'))
const SubDealerDashboard = lazy(() => import('./pages/SubDealerDashboard'))
const SubdealerHierarchy = lazy(() => import('./Hierarchy/Subdealer_Hierarchy'))
const SubdealerHierarchyGrid = lazy(() => import('./Grid/Subdealer_Hierarchy_grid'))
const PromotorDashboard = lazy(() => import('./pages/PromotorDashboard'))
const PromotorHierarchy = lazy(() => import('./Hierarchy/Promotor_Hierarchy'))
const PromotorHierarchyGrid = lazy(() => import('./Grid/Promotor_Hierarchy_grid'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const Profile = lazy(() => import('./collection/profile'))
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
const AdminOrdersPage = lazy(() => import('./Orders/Adminorderspage'))
const Report = lazy(() => import('./Orders/Report'))
const LoginActive = lazy(() => import('./Orders/login_active'))
const LoginInactive = lazy(() => import('./Orders/login_inactive'))
const CoinsReward = lazy(() => import('./Coins_products/Coins_Reward'))
const StoredCoins = lazy(() => import('./Coins_products/Stored_coins'))
const CoinRequests = lazy(() => import('./Coins_products/Coin_Requests'))
const TransactionHistory = lazy(() => import('./Coins_products/Transaction_History'))


const collectionPath = (category, metal) => {
  const params = new URLSearchParams({ category })
  if (metal) params.set('metal', metal)
  return `/collection/all?${params.toString()}`
}

const coinsPath = metal => `/collection/coins?metal=${metal}`

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (!token || token === 'undefined' || token === 'null') {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }

  return children
}

function RouteLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg,#fffaf4,#fbf7f1)',
      color: '#1f1712',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: 220,
        borderRadius: 24,
        padding: 24,
        background: 'rgba(255,255,255,0.86)',
        border: '1px solid #eadfd3',
        boxShadow: '0 18px 48px rgba(63,39,18,0.12)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 42,
          height: 42,
          margin: '0 auto 14px',
          borderRadius: '50%',
          border: '3px solid #eadfd3',
          borderTopColor: '#8b1a1a',
          animation: 'spinSlow 900ms linear infinite',
        }} />
        <strong>Loading</strong>
      </div>
    </div>
  )
}

function WithCustomerNavbar({ children }) {
  return (
    <>
      <CustomerNavbar />
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
          <Route path="/super-admin" element={<ProtectedRoute role="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin-hierarchy" element={<SuperadminHierarchy />} />
          <Route path="/superadmin-hierarchy-grid" element={<SuperadminHierarchyGrid />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-hierarchy" element={<AdminHierarchy />} />
          <Route path="/admin-hierarchy-grid" element={<AdminHierarchyGrid />} />
          <Route path="/dealer" element={<ProtectedRoute role="dealer"><DealerDashboard /></ProtectedRoute>} />
          <Route path="/dealer-hierarchy-grid" element={<DealerHierarchyGrid />} />
          <Route path="/dealer-hierarchy" element={<DealerHierarchy />} />
          <Route path="/sub-dealer" element={<ProtectedRoute role="sub_dealer"><SubDealerDashboard /></ProtectedRoute>} />
          <Route path="/subdealer-hierarchy" element={<SubdealerHierarchy />} />
          <Route path="/subdealer-hierarchy-grid" element={<SubdealerHierarchyGrid />} />
          <Route path="/promotor" element={<ProtectedRoute role="promotor"><PromotorDashboard /></ProtectedRoute>} />
          <Route path="/promotor-hierarchy" element={<PromotorHierarchy />} />
          <Route path="/promotor-hierarchy-grid" element={<PromotorHierarchyGrid />} />
          <Route path="/customer" element={<ProtectedRoute role="customer"><WithCustomerNavbar><CustomerDashboard /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/profile" element={<WithCustomerNavbar><Profile /></WithCustomerNavbar>} />

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
          <Route path="/add-product" element={<ProtectedRoute role="super_admin"><AddProduct /></ProtectedRoute>} />
          <Route path="/add-banners" element={<ProtectedRoute role="super_admin"><AddBanners /></ProtectedRoute>} />
          <Route path="/home-banner" element={<ProtectedRoute role="super_admin"><HomeBanner /></ProtectedRoute>} />
          <Route path="/collection/all" element={<WithCustomerNavbar><AllCollection /></WithCustomerNavbar>} />
          <Route path="/collection/coins" element={<WithCustomerNavbar><CoinsCollection /></WithCustomerNavbar>} />
          <Route path="/gold-coins" element={<Navigate to={coinsPath('gold')} replace />} />
          <Route path="/silver-coins" element={<Navigate to={coinsPath('silver')} replace />} />
          <Route path="/wishlist" element={<ProtectedRoute role="customer"><WithCustomerNavbar><WishlistPage /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/order-confirm" element={<WithCustomerNavbar><OrderConfirm /></WithCustomerNavbar>} />
          <Route path="/bj-live" element={<WithCustomerNavbar><BBLive /></WithCustomerNavbar>} />
          <Route path="/order-summary" element={<ProtectedRoute role="customer"><WithCustomerNavbar><OrderSummary /></WithCustomerNavbar></ProtectedRoute>} />
          <Route path="/admin-orders" element={<ProtectedRoute role="super_admin"><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/sales-report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/hierarchy-sales-count" element={<SuperAdminHierarchySalesCount />} />
          <Route path="/login-active" element={<LoginActive />} />
<Route path="/login-inactive" element={<LoginInactive />} />
<Route path="/coins-reward" element={<ProtectedRoute role="super_admin"><CoinsReward /></ProtectedRoute>} />
<Route path="/stored-coins" element={<ProtectedRoute role="super_admin"><StoredCoins /></ProtectedRoute>} />
<Route path="/coin-requests-page" element={<ProtectedRoute role="super_admin"><CoinRequests /></ProtectedRoute>} />
<Route path="/coin-transactions" element={<ProtectedRoute role="super_admin"><TransactionHistory /></ProtectedRoute>} />
</Routes>
      </Suspense>
    </BrowserRouter>
  )
}



from django import views
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, CreateAdminView, CreateDealerView,
    CreateSubDealerView, CreatePromotorView, CreateCustomerView,
    DashboardView, AdminListForAdminView, DealerListForDealerView,
    SubDealerListForView, PromotorListForView,  FullHierarchyView, AnnouncementView, AnnouncementReplyView, ProfileUpdateRequestView, ProfileUpdateApproveView,MetalRateView,MetalOrderView, MetalOrderSummaryView, JewelryProductView, JewelryProductDetailView, SoldOutProductsView,StockNotifyRequestView, JewelryProductImageDeleteView, HomeBannerView, HomeBannerDetailView, CartView, CartItemQtyView, WishlistView, JewelryOrderView, create_razorpay_order, verify_payment, ping,
HierarchySubtreeOrdersView, HierarchyAdminsView, HierarchyChildrenView, SalesReportView, OrderTimeSeriesView, TodayLoginStatusView,OrderTimeSeriesView, CoinRequestView, CoinRequestApproveView, CoinRequestRejectView, CoinRequestApproveAllView, CoinStockView, SuperAdminAddCoinsView, CoinStockForUserView, MyHierarchyView, TodayRewardsView, MyBasicInfoView,
 RetailerPromotionListView, RetailerPromotionActionView, WholesaleDealerPromotionListView, WholesaleDealerPromotionActionView, DistributorPromotionListView, DistributorPromotionActionView, SuperStockistPromotionListView, SuperStockistPromotionActionView, PromotionCustomerListView, PromotionCustomerListView, PromotionNodeListView,
 ReferrerInfoView, PublicCustomerRegisterView,GenerateReferralLinkView, RechargeCreateOrderView, RechargeVerifyPaymentView, WalletView, RechargeHistoryView, RechargeStatementView, PayWithCoinsView, PaymentsSummaryView, UserLookupView, SendCoinsView, AdminUserHistoryView, AdminSentHistoryView, AutoPayCreateView, AutoPayConfirmView, AutoPayStatusView, AutoPayToggleView, autopay_webhook,AutoPayMandateListView, AffordableProductsView,
 HierarchyPersonSearchView, SalesSummaryView, SalesTrendView, HierarchyNodeOrdersView, HierarchyNodeInfoView,



)

urlpatterns = [
    path('ping/', ping),
    path('login/', LoginView.as_view()),
    path('login/refresh/', TokenRefreshView.as_view()),
    path('admins/', CreateAdminView.as_view()),
    path('admins/list/', AdminListForAdminView.as_view()),
    path('dealers/', CreateDealerView.as_view()),         
    path('dealers/list/', DealerListForDealerView.as_view()),  
    path('sub-dealers/', CreateSubDealerView.as_view()),   
    path('sub-dealers/list/', SubDealerListForView.as_view()),   # NEW
    path('promotors/', CreatePromotorView.as_view()),            # NEW
    path('promotors/list/', PromotorListForView.as_view()),      # NEW
    path('customers/', CreateCustomerView.as_view()),  
    path('my-info/', MyBasicInfoView.as_view()),          # NEW
    path('hierarchy/full/', FullHierarchyView.as_view()),  # ✅ correct
    path('hierarchy/subtree-orders/', HierarchySubtreeOrdersView.as_view()),  # ← NEW
    path('hierarchy/admins/', HierarchyAdminsView.as_view()),
    path('hierarchy/children/', HierarchyChildrenView.as_view()),
    path('hierarchy/node-orders/', HierarchyNodeOrdersView.as_view()),
    path('hierarchy/node-info/', HierarchyNodeInfoView.as_view()),
    path('dashboard/', DashboardView.as_view()),
    path('announcements/', AnnouncementView.as_view()),
    path('announcements/<int:pk>/replies/', AnnouncementReplyView.as_view()),
    path('profile-update-request/', ProfileUpdateRequestView.as_view()),
    path('profile-update-request/<int:pk>/approve/', ProfileUpdateApproveView.as_view()),
    path('metal-rates/', MetalRateView.as_view()),
    path('metal-orders/summary/', MetalOrderSummaryView.as_view()), 
    path('metal-orders/', MetalOrderView.as_view()),
    path('jewelry-products/', JewelryProductView.as_view()),
    path('jewelry-products/<int:pk>/', JewelryProductDetailView.as_view()),
    path('jewelry-products/sold-out/', SoldOutProductsView.as_view()),
    path('notify-me/', StockNotifyRequestView.as_view()),
    path('jewelry-product-images/<int:pk>/', JewelryProductImageDeleteView.as_view()),
    path('home-banners/', HomeBannerView.as_view()),
    path('home-banners/<int:pk>/', HomeBannerDetailView.as_view()),
    path('cart/', CartView.as_view()),
    path('cart/<int:pk>/qty/', CartItemQtyView.as_view()),
    path('wishlist/', WishlistView.as_view()),
    path('orders/', JewelryOrderView.as_view()),
    path('orders/<int:pk>/', JewelryOrderView.as_view()),
    path('create-razorpay-order/', create_razorpay_order),
    path('verify-payment/', verify_payment),
    path('sales-report/', SalesReportView.as_view()),
    path('order-timeseries/', OrderTimeSeriesView.as_view()),
    path('today-login-status/', TodayLoginStatusView.as_view()),
    path('coin-requests/', CoinRequestView.as_view()),
    path('coin-requests/<int:pk>/approve/', CoinRequestApproveView.as_view()),
    path('coin-requests/<int:pk>/reject/', CoinRequestRejectView.as_view()),
    path('coin-requests/approve-all/', CoinRequestApproveAllView.as_view()),
    path('coin-stock/', CoinStockView.as_view()),
    path('coin-stock/for-user/', CoinStockForUserView.as_view()),
    path('coin-stock/add/', SuperAdminAddCoinsView.as_view()),
    path('my-hierarchy/', MyHierarchyView.as_view()),
    path('rewards/today/', TodayRewardsView.as_view()),
    path('retailer-promotions/', RetailerPromotionListView.as_view()),
    path('retailer-promotions/<int:user_id>/action/', RetailerPromotionActionView.as_view()),
    path('wholesale-dealer-promotions/', WholesaleDealerPromotionListView.as_view()),
    path('wholesale-dealer-promotions/<int:user_id>/action/', WholesaleDealerPromotionActionView.as_view()),
    path('distributor-promotions/', DistributorPromotionListView.as_view()),
    path('distributor-promotions/<int:user_id>/action/', DistributorPromotionActionView.as_view()),
    path('super-stockist-promotions/', SuperStockistPromotionListView.as_view()),
    path('super-stockist-promotions/<int:user_id>/action/', SuperStockistPromotionActionView.as_view()),
    path('promotion-customers/', PromotionCustomerListView.as_view(), name='promotion-customers'),
    path('promotion-nodes/', PromotionNodeListView.as_view(), name='promotion-nodes'),
    path('referrer-info/', ReferrerInfoView.as_view(), name='referrer-info'),
    path('public-register-customer/', PublicCustomerRegisterView.as_view(), name='public-register-customer'),
    path('generate-referral-link/', GenerateReferralLinkView.as_view(), name='generate-referral-link'),
    path('recharge/create-order/', RechargeCreateOrderView.as_view()),
    path('recharge/verify/', RechargeVerifyPaymentView.as_view()),
    path('wallet/', WalletView.as_view()),
    path('recharge/history/', RechargeHistoryView.as_view()),
    path('recharge/statement/', RechargeStatementView.as_view()),
    path('orders/pay-with-coins/', PayWithCoinsView.as_view()),
    path('superadmin/payments/', PaymentsSummaryView.as_view()),
    path('users/lookup/', UserLookupView.as_view()),
    path('admin/send-coins/', SendCoinsView.as_view()),
    path('admin/user-history/', AdminUserHistoryView.as_view()),
    path('admin/sent-history/', AdminSentHistoryView.as_view()),
    path('autopay/create/', AutoPayCreateView.as_view()),
    path('autopay/confirm/', AutoPayConfirmView.as_view()),
    path('autopay/status/', AutoPayStatusView.as_view()),
    path('autopay/toggle/', AutoPayToggleView.as_view()),
    path('autopay/webhook/', autopay_webhook),
    path('autopay/mandates/', AutoPayMandateListView.as_view()),
    path('products/affordable/', AffordableProductsView.as_view()),
    path('hierarchy/search-person/', HierarchyPersonSearchView.as_view()),
    path('sales-report/summary/', SalesSummaryView.as_view()),
    path('sales-report/trend/', SalesTrendView.as_view()),

    


    
    
]


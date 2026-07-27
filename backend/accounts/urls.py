from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, CreateAdminView, CreateDealerView,
    CreateSubDealerView, CreatePromotorView, CreateCustomerView,
    DashboardView, AdminListForAdminView, DealerListForDealerView,
    SubDealerListForView, PromotorListForView,  FullHierarchyView, AnnouncementView, AnnouncementReplyView, ProfileUpdateRequestView, ProfileUpdateApproveView,MetalRateView,MetalOrderView, MetalOrderSummaryView, JewelryProductView, JewelryProductDetailView, JewelryProductImageDeleteView, HomeBannerView, HomeBannerDetailView, CartView, CartItemQtyView, WishlistView, JewelryOrderView, create_razorpay_order, verify_payment, ping,
HierarchySubtreeOrdersView, SalesReportView, OrderTimeSeriesView, TodayLoginStatusView, CoinRequestView, CoinRequestApproveView, CoinRequestRejectView, CoinRequestApproveAllView, CoinStockView, SuperAdminAddCoinsView, CoinStockForUserView, MyHierarchyView, TodayRewardsView
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
    path('customers/', CreateCustomerView.as_view()),            # NEW
    path('hierarchy/full/', FullHierarchyView.as_view()),  # ✅ correct
    path('hierarchy/subtree-orders/', HierarchySubtreeOrdersView.as_view()),  # ← NEW
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
    
    
]


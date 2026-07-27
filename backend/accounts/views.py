from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from .models import User, AdminProfile, DealerProfile, SubDealerProfile, PromotorProfile, CustomerProfile, Announcement, AnnouncementReply, ProfileUpdateRequest, MetalRate, MetalOrder, JewelryProduct, JewelryProductImage, HomeBanner, CartItem, Wishlist, JewelryOrder, CoinRequest, CoinRequestItem, CoinStock, DailyLoginLog, CoinRewardLog 
from django.db.models import Prefetch, Count, Q, Sum
from django.db.models.functions import TruncHour, TruncDate, TruncWeek, TruncMonth
from .serializers import *
from django.utils import timezone
from datetime import timedelta
import razorpay
import hmac
import hashlib
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q 

# ── NEW: Monthly target status logic ──
MONTHLY_TARGET = 10

def get_target_status(order_count):
    if order_count >= MONTHLY_TARGET:
        return 'green'
    elif order_count >= 7:
        return 'yellow'
    elif order_count >= 1:
        return 'orange'
    else:
        return 'red'

STATUS_SEVERITY = {'red': 0, 'orange': 1, 'yellow': 2, 'green': 3}

def worst_status(statuses):
    """Worst (lowest) status among children. No children => red."""
    if not statuses:
        return 'red'
    return min(statuses, key=lambda s: STATUS_SEVERITY[s])


# ── NEW: Reward coin values ──
REWARD_COINS = {
    'first_login': 5,
    'daily_login': 1,
    'bonus_10': 3,
    'bonus_20': 6,
    'bonus_30': 10,
}

def get_login_streak(user, upto_date):
    """upto_date-la irundhu backward-a consecutive days evlo login pannirukanga nu count pannum."""
    streak = 0
    day = upto_date
    while DailyLoginLog.objects.filter(user=user, login_date=day).exists():
        streak += 1
        day -= timedelta(days=1)
    return streak

# ── NEW: level/position map — Admin=2 ... Customer=6 (super_admin=1 rewards-la varaadhu) ──
ROLE_LEVEL = {'admin': 2, 'dealer': 3, 'sub_dealer': 4, 'promotor': 5, 'customer': 6}
ROLE_LABEL = {'admin': 'Admin', 'dealer': 'Dealer', 'sub_dealer': 'Sub Dealer', 'promotor': 'Promotor', 'customer': 'Customer'}

def get_user_display_info(user):
    role_map = {
        'admin': ('admin_profile', 'admin_id'),
        'dealer': ('dealer_profile', 'dealer_id'),
        'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
        'promotor': ('promotor_profile', 'promotor_id'),
        'customer': ('customer_profile', 'customer_id'),
    }
    if user.role in role_map:
        attr, id_field = role_map[user.role]
        try:
            p = getattr(user, attr)
            return {
                'user_id_str': getattr(p, id_field, None),
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'phone': p.mobile_number,
                'level': ROLE_LEVEL.get(user.role),
                'position': ROLE_LABEL.get(user.role),
            }
        except Exception:
            pass
    return {'user_id_str': None, 'name': user.email, 'phone': None, 'level': None, 'position': None}


def get_user_profile_id(user):
    """Returns the user's role-specific ID string."""
    try:
        role_map = {
            'admin':      ('admin_profile',      'admin_id'),
            'dealer':     ('dealer_profile',     'dealer_id'),
            'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
            'promotor':   ('promotor_profile',   'promotor_id'),
            'customer':   ('customer_profile',   'customer_id'),
        }
        if user.role in role_map:
            profile_attr, id_field = role_map[user.role]
            p = getattr(user, profile_attr)
            return getattr(p, id_field)
    except Exception:
        pass
    return None

def is_user_mentioned_in_title(title, user):
    """Check if user's ID appears in the announcement title."""
    user_id = get_user_profile_id(user)
    if not user_id:
        return False
    return user_id in title

    

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Step 1: Email exist ஆ இல்லையா check pannu
        user_obj = User.objects.filter(email=email).first()
        if not user_obj:
            return Response({'error': 'No account found with this email'}, status=400)

        # Step 2: Email correct — password check pannu
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Incorrect password'}, status=400)

        # Step 3: last_login update pannu (Active/Inactive pie chart-ku idhu than base)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # ── NEW: Reward logic — super_admin ku reward venaam ──
        if user.role != 'super_admin':
            today = timezone.now().date()
            is_first_ever_login = not DailyLoginLog.objects.filter(user=user).exists()
            _, created_today_log = DailyLoginLog.objects.get_or_create(user=user, login_date=today)

            if created_today_log:
                if is_first_ever_login:
                    CoinRewardLog.objects.create(
                        user=user, reward_type='first_login',
                        coins=REWARD_COINS['first_login'], date=today
                    )
                else:
                    CoinRewardLog.objects.create(
                        user=user, reward_type='daily_login',
                        coins=REWARD_COINS['daily_login'], date=today
                    )

                streak = get_login_streak(user, today)
                bonus_map = {10: 'bonus_10', 20: 'bonus_20', 30: 'bonus_30'}
                if streak in bonus_map:
                    rtype = bonus_map[streak]
                    CoinRewardLog.objects.create(
                        user=user, reward_type=rtype,
                        coins=REWARD_COINS[rtype], date=today
                    )

        # Step 4: Success
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'email': user.email,
        })


class CreateAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = AdminProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Admin created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        admins = AdminProfile.objects.all()
        serializer = AdminListSerializer(admins, many=True)
        return Response(serializer.data)


class CreateDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = DealerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Dealer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        dealers = DealerProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = DealerListSerializer(dealers, many=True)
        return Response(serializer.data)


class CreateSubDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'dealer':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = SubDealerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Sub Dealer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'dealer':
            return Response({'error': 'Permission denied'}, status=403)
        sub_dealers = SubDealerProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = SubDealerListSerializer(sub_dealers, many=True)
        return Response(serializer.data)


class DealerListForDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        dealers = DealerProfile.objects.select_related('user', 'assigned_admin').all()
        serializer = DealerListSerializer(dealers, many=True)
        return Response(serializer.data)


class AdminListForAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        admins = AdminProfile.objects.all()
        serializer = AdminListSerializer(admins, many=True)
        return Response(serializer.data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {'role': user.role, 'email': user.email}

        if user.role == 'admin':
            try:
                p = AdminProfile.objects.get(user=user)
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'admin_id': p.admin_id,
                    'admin_name': p.admin_name,
                    'admin_contact_no': p.admin_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.user.created_at,
                })
            except Exception:
                pass

        elif user.role == 'dealer':
            try:
                p = user.dealer_profile
                data.update({
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'dealer_id': p.dealer_id,
                    'dealer_name': p.dealer_name,
                    'dealer_contact_no': p.dealer_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'admin_name': p.assigned_admin.admin_name if p.assigned_admin else None,
                    'admin_id': p.assigned_admin.admin_id if p.assigned_admin else None,
                    'admin_contact_no': p.assigned_admin.admin_contact_no if p.assigned_admin else None,
                })
            except DealerProfile.DoesNotExist:
                pass

        elif user.role == 'sub_dealer':
            try:
                p = user.sub_dealer_profile
                data.update({
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'sub_dealer_id': p.sub_dealer_id,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'dealer_name': p.assigned_dealer.dealer_name if p.assigned_dealer else None,
                    'dealer_id': p.assigned_dealer.dealer_id if p.assigned_dealer else None,
                    'dealer_contact_no': p.assigned_dealer.dealer_contact_no if p.assigned_dealer else None,
                })
            except SubDealerProfile.DoesNotExist:
                pass

        elif user.role == 'promotor':
            try:
                p = user.promotor_profile
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'promotor_id': p.promotor_id,
                    'promotor_name': p.promotor_name,
                    'promotor_contact_no': p.promotor_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'sub_dealer_name': f"{p.assigned_sub_dealer.first_name} {p.assigned_sub_dealer.last_name}" if p.assigned_sub_dealer else None,
                    'sub_dealer_id': p.assigned_sub_dealer.sub_dealer_id if p.assigned_sub_dealer else None,
                    'sub_dealer_contact_no': p.assigned_sub_dealer.mobile_number if p.assigned_sub_dealer else None,
                })
            except PromotorProfile.DoesNotExist:
                pass

        elif user.role == 'customer':
            try:
                p = user.customer_profile
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'customer_id': p.customer_id,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'promotor_name': f"{p.assigned_promotor.first_name} {p.assigned_promotor.last_name}" if p.assigned_promotor else None,
                    'promotor_id': p.assigned_promotor.promotor_id if p.assigned_promotor else None,
                    'promotor_contact_no': p.assigned_promotor.promotor_contact_no if p.assigned_promotor else None,
                })
            except CustomerProfile.DoesNotExist:
                pass

        return Response(data)


class CreatePromotorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'sub_dealer':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = PromotorProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Promotor created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'sub_dealer':
            return Response({'error': 'Permission denied'}, status=403)
        promotors = PromotorProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = PromotorListSerializer(promotors, many=True)
        return Response(serializer.data)


class CreateCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'promotor':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = CustomerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Customer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        customers = CustomerProfile.objects.select_related(
            'user', 'assigned_promotor'
        ).all().order_by('-created_at')
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)


class PromotorListForView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        promotors = PromotorProfile.objects.select_related(
            'user', 'assigned_sub_dealer__assigned_dealer__assigned_admin'
        ).all()
        serializer = PromotorListSerializer(promotors, many=True)
        return Response(serializer.data)


class SubDealerListForView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        sub_dealers = SubDealerProfile.objects.select_related('user', 'assigned_dealer').all()
        serializer = SubDealerListSerializer(sub_dealers, many=True)
        return Response(serializer.data)


class FullHierarchyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Permission denied'}, status=403)

        # ✅ Nested prefetch - loop-ku ulla query podathu,
        # ella data-yum ore 5-6 queries-la fetch pannidum (N+1 fix)
        customers_pf = Prefetch(
            'assigned_customers',
            queryset=CustomerProfile.objects.filter(assigned_promotor__isnull=False)
        )
        promotors_pf = Prefetch(
            'assigned_promotors',
            queryset=PromotorProfile.objects.filter(assigned_sub_dealer__isnull=False).prefetch_related(customers_pf)
        )
        sub_dealers_pf = Prefetch(
            'assigned_sub_dealers',
            queryset=SubDealerProfile.objects.filter(assigned_dealer__isnull=False).prefetch_related(promotors_pf)
        )
        dealers_pf = Prefetch(
            'assigned_dealers',
            queryset=DealerProfile.objects.filter(assigned_admin__isnull=False).prefetch_related(sub_dealers_pf)
        )

        # ✅ Order count per customer — oru query-la ella customer order count-um edukurom
        now = timezone.now()
        order_counts = dict(
               JewelryOrder.objects.filter(
               created_at__year=now.year, created_at__month=now.month
        ).values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
        )

        if request.user.role == 'admin':
            admins = AdminProfile.objects.filter(user=request.user).prefetch_related(dealers_pf)
        else:
            admins = AdminProfile.objects.all().prefetch_related(dealers_pf)

        tree = []
        for admin in admins:
            dealer_list = []
            for dealer in admin.assigned_dealers.all():
                sub_dealer_list = []
                for sd in dealer.assigned_sub_dealers.all():
                    promotor_list = []
                    for pr in sd.assigned_promotors.all():
                        customer_list = [
    {
        'id': c.id,
        'user_id': c.user_id,
        'customer_id': c.customer_id,
        'first_name': c.first_name,
        'last_name': c.last_name,
        'mobile_number': c.mobile_number,
        'city_name': c.city_name,
        'order_count': order_counts.get(c.user_id, 0),
        'status': get_target_status(order_counts.get(c.user_id, 0)),   # ← NEW
    }
    for c in pr.assigned_customers.all()
]
                        promotor_order_count = sum(c['order_count'] for c in customer_list)
                        promotor_status = worst_status([c['status'] for c in customer_list])   # ← NEW
                        promotor_list.append({
    'id': pr.id,
    'user_id': pr.user_id,
    'promotor_id': pr.promotor_id,
    'first_name': pr.first_name,
    'last_name': pr.last_name,
    'mobile_number': pr.mobile_number,
    'city_name': pr.city_name,
    'customers': customer_list,
    'order_count': promotor_order_count,
    'status': promotor_status,   # ← NEW
})

                    sub_dealer_order_count = sum(pr['order_count'] for pr in promotor_list)
                    sub_dealer_status = worst_status([pr['status'] for pr in promotor_list])   # ← NEW
                    sub_dealer_list.append({
                        'id': sd.id,
                        'user_id': sd.user_id,
                        'sub_dealer_id': sd.sub_dealer_id,
                        'first_name': sd.first_name,
                        'last_name': sd.last_name,
                        'mobile_number': sd.mobile_number,
                        'city_name': sd.city_name,
                        'promotors': promotor_list,
                        'order_count': sub_dealer_order_count,
                        'status': sub_dealer_status,   # ← NEW
                    })

                dealer_order_count = sum(sd['order_count'] for sd in sub_dealer_list)
                dealer_status = worst_status([sd['status'] for sd in sub_dealer_list])   # ← NEW
                dealer_list.append({
                    'id': dealer.id,
                    'user_id': dealer.user_id,
                    'dealer_id': dealer.dealer_id,
                    'first_name': dealer.first_name,
                    'last_name': dealer.last_name,
                    'mobile_number': dealer.mobile_number,
                    'city_name': dealer.city_name,
                    'sub_dealers': sub_dealer_list,
                    'order_count': dealer_order_count,
                    'status': dealer_status,   # ← NEW
                })

            admin_order_count = sum(d['order_count'] for d in dealer_list)
            admin_status = worst_status([d['status'] for d in dealer_list])   # ← NEW
            tree.append({
                'id': admin.id,
                'user_id': admin.user_id,
                'admin_id': admin.admin_id,
                'first_name': admin.first_name,
                'last_name': admin.last_name,
                'mobile_number': admin.mobile_number,
                'city_name': admin.city_name,
                'dealers': dealer_list,
                'order_count': admin_order_count,
                'status': admin_status,   # ← NEW
            })

        return Response({'super_admin_email': request.user.email, 'admins': tree})



class AnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get('target_user')

        # ── CASE 1: Personal message — oru specific person ku mattum ──
        if target_user_id:
            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({'error': 'Target user not found'}, status=404)

            title = request.data.get('title', '').strip()
            message = request.data.get('message', '').strip()
            if not title or not message:
                return Response({'error': 'Title and message required'}, status=400)

            Announcement.objects.create(
                title=title,
                message=message,
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Message sent to this person only'}, status=201)

        # ── CASE 2: Broadcast — Super Admin மட்டும் ──
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response({'message': 'Announcement sent successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        role = request.user.role
        if role == 'super_admin':
            announcements = Announcement.objects.filter(is_active=True).filter(
                Q(target_user__isnull=True) | Q(target_user=request.user) | Q(created_by=request.user)
            ).order_by('-created_at')
        else:
            announcements = Announcement.objects.filter(is_active=True).filter(
                Q(target_user=request.user) |
                Q(target_user__isnull=True, target_roles__contains=role)
            ).order_by('-created_at')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)


class AnnouncementReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Only super_admin OR the mentioned person can read replies."""
        try:
            announcement = Announcement.objects.get(id=pk)
        except Announcement.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        user = request.user
        if user.role != 'super_admin' and not is_user_mentioned_in_title(announcement.title, user):
            return Response({'error': 'Permission denied'}, status=403)

        replies = AnnouncementReply.objects.filter(
            announcement=announcement
        ).order_by('-created_at')
        serializer = AnnouncementReplySerializer(replies, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        """Anyone can reply, but only once per announcement."""
        try:
            announcement = Announcement.objects.get(id=pk)
        except Announcement.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if AnnouncementReply.objects.filter(
            announcement=announcement, replied_by=request.user
        ).exists():
            return Response({'error': 'Already replied'}, status=400)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message required'}, status=400)

        reply = AnnouncementReply.objects.create(
            announcement=announcement,
            replied_by=request.user,
            message=message
        )
        return Response(AnnouncementReplySerializer(reply).data, status=201)        

class ProfileUpdateRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        qs = ProfileUpdateRequest.objects.filter(status='pending').order_by('-created_at')
        serializer = ProfileUpdateRequestSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProfileUpdateRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Profile update request submitted'}, status=201)
        return Response(serializer.errors, status=400)


class ProfileUpdateApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        req = ProfileUpdateRequest.objects.get(id=pk)

        profile_map = {
            'admin': 'admin_profile',
            'dealer': 'dealer_profile',
            'sub_dealer': 'sub_dealer_profile',
            'promotor': 'promotor_profile',
            'customer': 'customer_profile',
        }

        profile = getattr(req.user, profile_map[req.user.role])

        fields = [
            'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary'
        ]

        for field in fields:
            value = getattr(req, field)
            if value not in ['', None]:
                setattr(profile, field, value)

        profile.save()
        req.status = 'approved'
        req.save()

        return Response({'message': 'Request approved and profile updated'})

        


class MetalRateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return today's rate; if not entered yet, return latest available."""
        from django.utils import timezone
        today = timezone.now().date()

        rate = MetalRate.objects.filter(date=today).first()
        if not rate:
            rate = MetalRate.objects.order_by('-date').first()

        if not rate:
            return Response({'error': 'No rates entered yet'}, status=404)

        serializer = MetalRateSerializer(rate)
        return Response(serializer.data)

    def post(self, request):
        """Super admin sets/updates rate for a given date."""
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        date = request.data.get('date')
        if not date:
            return Response({'error': 'date is required'}, status=400)

        existing = MetalRate.objects.filter(date=date).first()
        if existing:
            serializer = MetalRateSerializer(existing, data=request.data, partial=True)
        else:
            serializer = MetalRateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    

class MetalOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Customer places an order."""
        data = request.data
        metal_type = data.get('metal_type')
        weight_label = data.get('weight_label')
        weight_grams = float(data.get('weight_grams', 0))
        count = int(data.get('count', 1))
        rate_per_gram = float(data.get('rate_per_gram', 0))

        if not all([metal_type, weight_label, weight_grams, count, rate_per_gram]):
            return Response({'error': 'All fields required'}, status=400)

        unit_price = round(weight_grams * rate_per_gram, 2)
        total_amount = round(unit_price * count, 2)

        order = MetalOrder.objects.create(
            user=request.user,
            metal_type=metal_type,
            weight_label=weight_label,
            weight_grams=weight_grams,
            count=count,
            rate_per_gram=rate_per_gram,
            unit_price=unit_price,
            total_amount=total_amount,
        )
        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.id,
            'total_amount': total_amount,
        }, status=201)

    def get(self, request):
        """Super admin sees all orders; customer sees own orders."""
        if request.user.role == 'super_admin':
            orders = MetalOrder.objects.all().order_by('-created_at')
        else:
            orders = MetalOrder.objects.filter(user=request.user).order_by('-created_at')
        serializer = MetalOrderSerializer(orders, many=True)
        return Response(serializer.data)
class MetalOrderSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        def summarize(qs):
            from django.db.models import Sum, Count
            result = {}
            for metal in ['gold_22k', 'gold_24k', 'silver_999']:
                metal_qs = qs.filter(metal_type=metal)
                agg = metal_qs.aggregate(
                    total_orders=Count('id'),
                    total_grams=Sum('weight_grams'),
                    total_amount=Sum('total_amount'),
                )
                result[metal] = {
                    'orders': agg['total_orders'] or 0,
                    'grams': float(agg['total_grams'] or 0),
                    'amount': float(agg['total_amount'] or 0),
                }
            return result

        base = MetalOrder.objects.filter(user=user)

        return Response({
            'today': summarize(base.filter(created_at__date=today)),
            'week':  summarize(base.filter(created_at__date__gte=week_start)),
            'month': summarize(base.filter(created_at__date__gte=month_start)),
        })    


# ADD AT BOTTOM OF views.py (before the ping function):

class JewelryProductView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        images = request.FILES.getlist('uploaded_images')

        serializer = JewelryProductSerializer(
            data={**data, 'uploaded_images': images},
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Product created!', 'data': serializer.data}, status=201)
        return Response(serializer.errors, status=400)

   
    def get(self, request):
        if request.user.is_authenticated and getattr(request.user, 'role', None) == 'super_admin':
            qs = JewelryProduct.objects.all().prefetch_related('images')
        else:
            qs = JewelryProduct.objects.filter(is_active=True).prefetch_related('images')

        # ── Existing filters (உன்னோட பழைய code — same) ──

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        new = request.query_params.get('new')
        if new == 'true':
            qs = qs.filter(tag__icontains='New')

        bestseller = request.query_params.get('bestseller')
        if bestseller == 'true':
            qs = qs.filter(tag__icontains='Bestseller')

        metal = request.query_params.get('metal')
        if metal:
            qs = qs.filter(metal__iexact=metal)

        gender = request.query_params.get('gender')
        if gender and gender != 'all':
            qs = qs.filter(gender=gender)

        occasion = request.query_params.get('occasion')
        if occasion:
            qs = qs.filter(occasion__icontains=occasion)

        wedding_category = request.query_params.get('wedding_category')
        if wedding_category:
            qs = qs.filter(wedding_category__icontains=wedding_category)

        grade = request.query_params.get('grade')
        if grade:
            qs = qs.filter(grade=grade)

        # ── Price filter (NEW) ──
        price = request.query_params.get('price')
        if price == 'below25k':
            qs = qs.filter(price__lt=25000)
        elif price == '25k-50k':
            qs = qs.filter(price__gte=25000, price__lt=50000)
        elif price == '50k-1L':
            qs = qs.filter(price__gte=50000, price__lt=100000)
        elif price == 'above1L':
            qs = qs.filter(price__gte=100000)

        # ── Search filter (NEW) ──
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            try:
                # Number type பண்ணா — weight search
                num = float(search)
                qs = qs.filter(
                    Q(net_weight=num) |
                    Q(cross_weight=num)
                )
            except ValueError:
                # Text type பண்ணா — name, metal, category எல்லாத்திலயும் search
                qs = qs.filter(
                    Q(name__icontains=search) |
                    Q(metal__icontains=search) |
                    Q(category__icontains=search) |
                    Q(grade__icontains=search) |
                    Q(description__icontains=search) |
                    Q(tag__icontains=search) |
                    Q(occasion__icontains=search) |
                    Q(gender__icontains=search) |
                    Q(wedding_category__icontains=search)
                )

        qs = qs.order_by('-created_at')
        serializer = JewelryProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

class JewelryProductDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            product = JewelryProduct.objects.get(id=pk)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        for field in ['category', 'metal', 'grade', 'name', 'description',
                      'cross_weight', 'stone_weight', 'net_weight',
                      'making_charge', 'wastage_charge', 'stone_value', 'tax_percent',
                      'price', 'original_price', 'tag', 'occasion', 'wedding_category',
                      'gender', 'is_active']:
            if field in request.data:
                setattr(product, field, request.data[field])
        product.save()

        new_images = request.FILES.getlist('uploaded_images')
        if new_images:
            last_order = product.images.count()
            for i, img in enumerate(new_images):
                JewelryProductImage.objects.create(product=product, image=img, order=last_order + i)

        serializer = JewelryProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        if request.user.role != 'super_admin':  # ✅ 8 spaces
            return Response({'error': 'Permission denied'}, status=403)
        try:
            product = JewelryProduct.objects.get(id=pk)
            product.delete()
            return Response({'message': 'Product deleted'})
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Not found'}, status=404) 


class JewelryProductImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            img = JewelryProductImage.objects.get(id=pk)
            img.image.delete()
            img.delete()
            return Response({'message': 'Image deleted'})
        except JewelryProductImage.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)



class HomeBannerView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        banners = HomeBanner.objects.filter(is_active=True).order_by('slot')
        serializer = HomeBannerSerializer(banners, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        slot = request.data.get('slot')
        image = request.FILES.get('image')
        if not slot or not image:
            return Response({'error': 'slot and image required'}, status=400)
        existing = HomeBanner.objects.filter(slot=slot).first()
        if existing:
            existing.image.delete(save=False)
            existing.image = image
            existing.is_active = True
            existing.save()
            serializer = HomeBannerSerializer(existing, context={'request': request})
            return Response(serializer.data)
        banner = HomeBanner.objects.create(slot=slot, image=image)
        serializer = HomeBannerSerializer(banner, context={'request': request})
        return Response(serializer.data, status=201)


class HomeBannerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            banner = HomeBanner.objects.get(id=pk)
        except HomeBanner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if 'image' in request.FILES:
            banner.image.delete(save=False)
            banner.image = request.FILES['image']
        if 'is_active' in request.data:
            banner.is_active = request.data['is_active'] in [True, 'true', '1']
        banner.save()
        serializer = HomeBannerSerializer(banner, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            banner = HomeBanner.objects.get(id=pk)
            banner.image.delete(save=False)
            banner.delete()
            return Response({'message': 'Banner deleted'})
        except HomeBanner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)   


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """User's cart items fetch"""
        items = CartItem.objects.filter(user=request.user).select_related('product').prefetch_related('product__images')
        serializer = CartItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Add to cart - product_id + qty"""
        product_id = request.data.get('product_id')
        qty = int(request.data.get('qty', 1))

        if not product_id:
            return Response({'error': 'product_id required'}, status=400)

        try:
            product = JewelryProduct.objects.get(id=product_id, is_active=True)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # Already in cart → qty update
        item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'qty': qty}
        )
        if not created:
            item.qty += qty
            item.save()

        serializer = CartItemSerializer(item, context={'request': request})
        return Response(serializer.data, status=201 if created else 200)

    def delete(self, request):
        """Remove specific item - product_id send பண்ணு"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)

        CartItem.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'message': 'Removed from cart'})


class CartItemQtyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        """Update qty for a cart item"""
        try:
            item = CartItem.objects.get(id=pk, user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        qty = int(request.data.get('qty', 1))
        if qty < 1:
            item.delete()
            return Response({'message': 'Item removed'})

        item.qty = qty
        item.save()
        serializer = CartItemSerializer(item, context={'request': request})
        return Response(serializer.data)                     

class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related('product').prefetch_related('product__images')
        serializer = WishlistItemSerializer(items, many=True, context={'request': request})
        return Response({'count': items.count(), 'items': serializer.data})

    def post(self, request):
        """Toggle wishlist — add if not exists, remove if exists"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        try:
            product = JewelryProduct.objects.get(id=product_id, is_active=True)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        existing = Wishlist.objects.filter(user=request.user, product=product).first()
        if existing:
            existing.delete()
            return Response({'action': 'removed', 'message': 'Removed from wishlist'})
        else:
            Wishlist.objects.create(user=request.user, product=product)
            return Response({'action': 'added', 'message': 'Added to wishlist'}, status=201)

    def delete(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'message': 'Removed from wishlist'})

class JewelryOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Customer places a jewelry order"""
        data = request.data
        
        product_id = data.get('product_id')
        product_image_url = data.get('product_image_url', '')
        
        try:
            product = JewelryProduct.objects.get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # Get first image URL if not provided
        if not product_image_url:
            first_img = product.images.first()
            if first_img:
                product_image_url = request.build_absolute_uri(first_img.image.url)

        order = JewelryOrder.objects.create(
            user=request.user,
            product=product,
            product_name=product.name,
            product_metal=product.metal,
            product_grade=product.grade or '',
            product_category=product.category,
            product_image_url=product_image_url,
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            customer_alt_phone=data.get('customer_alt_phone', ''),
            customer_dob=data.get('customer_dob') or None,
            customer_anniversary=data.get('customer_anniversary') or None,
            pincode=data.get('pincode', ''),
            address_line1=data.get('address_line1', ''),
            address_line2=data.get('address_line2', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            quantity=int(data.get('quantity', 1)),
            unit_price=float(data.get('unit_price', 0)),
            total_price=float(data.get('total_price', 0)),
            payment_method=data.get('payment_method', 'upi'),
            payment_status='pending',
            status='pending',
        )

        serializer = JewelryOrderSerializer(order, context={'request': request})
        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.order_id,
            'data': serializer.data
        }, status=201)
    

    # AFTER — select_related + prefetch_related add pannuna N+1 fix aagum
    def get(self, request):
        """Super admin sees all orders; customer sees own orders"""
        base_qs = JewelryOrder.objects.select_related(
            'user', 'product'
        ).prefetch_related(
            'product__images'
        )
        if request.user.role == 'super_admin':
            orders = base_qs.all().order_by('-created_at')
        else:
            orders = base_qs.filter(user=request.user).order_by('-created_at')
        
        serializer = JewelryOrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            order = JewelryOrder.objects.get(id=pk)
        except JewelryOrder.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        status_val = request.data.get('status')
        if status_val:
            order.status = status_val
            order.save()
        return Response(JewelryOrderSerializer(order, context={'request': request}).data)
    
# ── VIEW 1: Razorpay Order Create ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    try:
        amount = request.data.get('amount')  # Frontend ₹ amount அனுப்பும்
        
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        
        # Razorpay-ல order create பண்ணு
        razorpay_order = client.order.create({
            "amount": int(float(amount)) * 100,  # Paise-ல அனுப்பணும்
            "currency": "INR",
            "payment_capture": 1
        })
        
        return Response({
            "razorpay_order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# ── VIEW 2: Payment Verify + Order Save ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        data = request.data
        
        # Signature verify பண்ணு (Security check)
        body = data['razorpay_order_id'] + "|" + data['razorpay_payment_id']
        
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_sig != data['razorpay_signature']:
            return Response({"status": "failed", "msg": "Invalid signature"}, status=400)
        
        # ✅ Payment genuine! - Order Database-ல save பண்ணு
        # உன் existing Order model இருந்தா இங்க use பண்ணு
        order_id = "BB" + data['razorpay_payment_id'][-8:].upper()
        
        

        # ✅ JewelryOrder model-ல save பண்ணு
        try:
            product = JewelryProduct.objects.get(id=data.get('product_id'))
            product_image_url = data.get('product_image_url', '')
            if not product_image_url:
                first_img = product.images.first()
                if first_img:
                    product_image_url = request.build_absolute_uri(first_img.image.url)
            order = JewelryOrder.objects.create(
                user=request.user,
                product=product,
                product_name=product.name,
                product_metal=product.metal,
                product_grade=product.grade or '',
                product_category=product.category,
                product_image_url=product_image_url,
                customer_name=data.get('customer_name', ''),
                customer_phone=data.get('customer_phone', ''),
                customer_alt_phone='',
                pincode=data.get('pincode', ''),
                address_line1=data.get('address_line1', ''),
                address_line2=data.get('address_line2', ''),
                city=data.get('city', ''),
                state=data.get('state', ''),
                quantity=int(data.get('quantity', 1)),
                unit_price=float(data.get('unit_price', 0)),
                total_price=float(data.get('total_price', 0)),
                payment_method='razorpay',
                payment_status='paid',
                status='confirmed',
                razorpay_order_id=data['razorpay_order_id'],
                razorpay_payment_id=data['razorpay_payment_id'],
            )
            order_id = order.order_id
        except Exception as e:
            print('❌ JewelryOrder SAVE FAILED:', repr(e))
            order_id = "BB" + data['razorpay_payment_id'][-8:].upper()
        
        return Response({
            "status": "success",
            "order_id": order_id,
            "payment_id": data['razorpay_payment_id']
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)


def _serialize_order(o):
    img_url = o.product_image_url
    if not img_url and o.product:
        first_img = o.product.images.first()
        if first_img:
            img_url = first_img.image.url
    return {
        'id': o.id,
        'order_id': o.order_id,
        'product_name': o.product_name,
        'metal': o.product_metal,
        'grade': o.product_grade,
        'category': o.product_category,
        'net_weight': str(o.product.net_weight) if o.product and o.product.net_weight else None,
        'product_image_url': img_url,
        'quantity': o.quantity,
        'unit_price': float(o.unit_price),
        'total_price': float(o.total_price),
        'status': o.status,
        'created_at': o.created_at,
    }

def _orders_by_user_map(user_ids):
    orders_by_user = {}
    qs = JewelryOrder.objects.filter(user_id__in=user_ids).select_related('product').order_by('-created_at')
    for o in qs:
        orders_by_user.setdefault(o.user_id, []).append(_serialize_order(o))
    return orders_by_user

def _collect_user_ids_admin(a):
    ids = []
    for d in a.assigned_dealers.all():
        for sd in d.assigned_sub_dealers.all():
            for p in sd.assigned_promotors.all():
                for c in p.assigned_customers.all():
                    ids.append(c.user_id)
    return ids

def _collect_user_ids_dealer(d):
    ids = []
    for sd in d.assigned_sub_dealers.all():
        for p in sd.assigned_promotors.all():
            for c in p.assigned_customers.all():
                ids.append(c.user_id)
    return ids

def _collect_user_ids_sub_dealer(sd):
    ids = []
    for p in sd.assigned_promotors.all():
        for c in p.assigned_customers.all():
            ids.append(c.user_id)
    return ids

def _bulk_orders_for_admin(a):
    return _orders_by_user_map(_collect_user_ids_admin(a))

def _bulk_orders_for_dealer(d):
    return _orders_by_user_map(_collect_user_ids_dealer(d))

def _bulk_orders_for_sub_dealer(sd):
    return _orders_by_user_map(_collect_user_ids_sub_dealer(sd))

def _bulk_orders_for_promotor(p):
    ids = [c.user_id for c in p.assigned_customers.all()]
    return _orders_by_user_map(ids)


def _monthly_order_count(orders):
    """orders list (each dict has 'created_at') la irundhu, indha current
    month-ku mattum order count edukurom — FullHierarchyView same logic. ──"""
    now = timezone.now()
    count = 0
    for o in orders:
        created = o.get('created_at')
        if created and created.year == now.year and created.month == now.month:
            count += 1
    return count


def _build_customer(c, orders_by_user):
    orders = orders_by_user.get(c.user_id, [])
    monthly_count = _monthly_order_count(orders)
    return {
        'type': 'customer', 'id': c.id, 'customer_id': c.customer_id,
        'first_name': c.first_name, 'last_name': c.last_name,
        'mobile_number': c.mobile_number, 'city_name': c.city_name,
        'orders': orders,
        'order_count': monthly_count,           # ← NEW
        'status': get_target_status(monthly_count),   # ← NEW
    }

def _build_promotor(p, orders_by_user):
    customers = [_build_customer(c, orders_by_user) for c in p.assigned_customers.all()]
    return {
        'type': 'promotor', 'id': p.id, 'promotor_id': p.promotor_id, 'user_id': p.user_id,
        'first_name': p.first_name, 'last_name': p.last_name,
        'mobile_number': p.mobile_number, 'city_name': p.city_name,
        'customers': customers,
        'order_count': sum(c['order_count'] for c in customers),         # ← NEW
        'status': worst_status([c['status'] for c in customers]),        # ← NEW
    }

def _build_sub_dealer(sd, orders_by_user):
    promotors = [_build_promotor(p, orders_by_user) for p in sd.assigned_promotors.all()]
    return {
        'type': 'sub_dealer', 'id': sd.id, 'sub_dealer_id': sd.sub_dealer_id, 'user_id': sd.user_id,
        'first_name': sd.first_name, 'last_name': sd.last_name,
        'mobile_number': sd.mobile_number, 'city_name': sd.city_name,
        'promotors': promotors,
        'order_count': sum(p['order_count'] for p in promotors),         # ← NEW
        'status': worst_status([p['status'] for p in promotors]),        # ← NEW
    }

def _build_dealer(d, orders_by_user):
    sub_dealers = [_build_sub_dealer(sd, orders_by_user) for sd in d.assigned_sub_dealers.all()]
    return {
        'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id, 'user_id': d.user_id,
        'first_name': d.first_name, 'last_name': d.last_name,
        'mobile_number': d.mobile_number, 'city_name': d.city_name,
        'sub_dealers': sub_dealers,
        'order_count': sum(sd['order_count'] for sd in sub_dealers),     # ← NEW
        'status': worst_status([sd['status'] for sd in sub_dealers]),    # ← NEW
    }

def _build_admin(a, orders_by_user):
    dealers = [_build_dealer(d, orders_by_user) for d in a.assigned_dealers.all()]
    return {
        'type': 'admin', 'id': a.id, 'admin_id': a.admin_id, 'user_id': a.user_id,
        'first_name': a.first_name, 'last_name': a.last_name,
        'mobile_number': a.mobile_number, 'city_name': a.city_name,
        'dealers': dealers,
        'order_count': sum(d['order_count'] for d in dealers),           # ← NEW
        'status': worst_status([d['status'] for d in dealers]),          # ← NEW
    }


class HierarchySubtreeOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        if not role or not node_id:
            return Response({'error': 'role and id required'}, status=400)

        try:
            if role == 'admin':
                node = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_admin(node)
                root = _build_admin(node, orders_by_user)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_dealer(node)
                root = _build_dealer(node, orders_by_user)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                root = _build_sub_dealer(node, orders_by_user)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(id=node_id)
                orders_by_user = _bulk_orders_for_promotor(node)
                root = _build_promotor(node, orders_by_user)
            elif role == 'customer':
                node = CustomerProfile.objects.get(id=node_id)
                orders_by_user = _orders_by_user_map([node.user_id])
                root = _build_customer(node, orders_by_user)
            else:
                return Response({'error': 'invalid role'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        return Response({'root': root})

# ── NEW: role-scoped hierarchy for Admin / Dealer / Sub Dealer / Promotor logins.
# Ovvoruthar their own subtree mattum kaanpanum — SuperAdmin mari full tree venaam. ──
class MyHierarchyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role not in ['admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Use /hierarchy/full/ for your role'}, status=403)

        try:
            if role == 'admin':
                node = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_admin(node)
                root = _build_admin(node, orders_by_user)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_dealer(node)
                root = _build_dealer(node, orders_by_user)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                root = _build_sub_dealer(node, orders_by_user)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(user=user)
                orders_by_user = _bulk_orders_for_promotor(node)
                root = _build_promotor(node, orders_by_user)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        return Response({
            'super_admin_email': User.objects.filter(role='super_admin').first().email if User.objects.filter(role='super_admin').exists() else '',
            'viewer_role': role,
            'root': root,
        })

def get_report_ancestors(role, profile):
    """Build the chain from Super Admin down to (but not including) the logged-in user's own node."""
    ancestors = [{'type': 'super_admin'}]

    if role == 'admin':
        return ancestors

    if role == 'dealer':
        a = profile.assigned_admin
        if a:
            ancestors.append({
                'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                'first_name': a.first_name, 'last_name': a.last_name,
                'mobile_number': a.mobile_number, 'city_name': a.city_name,
            })
        return ancestors

    if role == 'sub_dealer':
        d = profile.assigned_dealer
        if d:
            a = d.assigned_admin
            if a:
                ancestors.append({
                    'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                    'first_name': a.first_name, 'last_name': a.last_name,
                    'mobile_number': a.mobile_number, 'city_name': a.city_name,
                })
            ancestors.append({
                'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id,
                'first_name': d.first_name, 'last_name': d.last_name,
                'mobile_number': d.mobile_number, 'city_name': d.city_name,
            })
        return ancestors

    if role == 'promotor':
        sd = profile.assigned_sub_dealer
        if sd:
            d = sd.assigned_dealer
            if d:
                a = d.assigned_admin
                if a:
                    ancestors.append({
                        'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                        'first_name': a.first_name, 'last_name': a.last_name,
                        'mobile_number': a.mobile_number, 'city_name': a.city_name,
                    })
                ancestors.append({
                    'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id,
                    'first_name': d.first_name, 'last_name': d.last_name,
                    'mobile_number': d.mobile_number, 'city_name': d.city_name,
                })
            ancestors.append({
                'type': 'sub_dealer', 'id': sd.id, 'sub_dealer_id': sd.sub_dealer_id,
                'first_name': sd.first_name, 'last_name': sd.last_name,
                'mobile_number': sd.mobile_number, 'city_name': sd.city_name,
            })
        return ancestors

    return ancestors


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role == 'customer':
            return Response({'error': 'Report not available for customer'}, status=403)

        if role == 'super_admin':
            admins = list(AdminProfile.objects.all().prefetch_related(
                'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
            ))
            all_ids = []
            for a in admins:
                all_ids.extend(_collect_user_ids_admin(a))
            orders_by_user = _orders_by_user_map(all_ids)
            return Response({
                'role': role,
                'data': [_build_admin(a, orders_by_user) for a in admins],
                'ancestors': [],
            })

        elif role == 'admin':
            try:
                admin = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_admin(admin)
                return Response({
                    'role': role,
                    'data': [_build_admin(admin, orders_by_user)],
                    'ancestors': get_report_ancestors(role, admin),
                })
            except AdminProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'dealer':
            try:
                dealer = DealerProfile.objects.select_related('assigned_admin').prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_dealer(dealer)
                return Response({
                    'role': role,
                    'data': [_build_dealer(dealer, orders_by_user)],
                    'ancestors': get_report_ancestors(role, dealer),
                })
            except DealerProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'sub_dealer':
            try:
                sd = SubDealerProfile.objects.select_related('assigned_dealer__assigned_admin').prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_sub_dealer(sd)
                return Response({
                    'role': role,
                    'data': [_build_sub_dealer(sd, orders_by_user)],
                    'ancestors': get_report_ancestors(role, sd),
                })
            except SubDealerProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'promotor':
            try:
                p = PromotorProfile.objects.select_related(
                    'assigned_sub_dealer__assigned_dealer__assigned_admin'
                ).prefetch_related('assigned_customers').get(user=user)
                orders_by_user = _bulk_orders_for_promotor(p)
                return Response({
                    'role': role,
                    'data': [_build_promotor(p, orders_by_user)],
                    'ancestors': get_report_ancestors(role, p),
                })
            except PromotorProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        return Response({'error': 'Invalid role'}, status=400)


class OrderTimeSeriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'today')
        now = timezone.localtime(timezone.now())
        qs = JewelryOrder.objects.all()

        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncHour('created_at'))
            step = timedelta(hours=1)
            bucket_start = start
        elif period == 'week':
            start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncDate('created_at'))
            step = timedelta(days=1)
            bucket_start = start
        elif period == 'month':
            start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncDate('created_at'))
            step = timedelta(days=1)
            bucket_start = start
        elif period == '3month':
            start = (now - timedelta(days=90)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncWeek('created_at'))
            step = timedelta(weeks=1)
            bucket_start = start
        elif period == 'year':
            start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncMonth('created_at'))
            step = timedelta(days=30)
            bucket_start = start.replace(day=1)
        else:  # all
            earliest = JewelryOrder.objects.order_by('created_at').first()
            start = earliest.created_at if earliest else now
            end = now
            qs = qs.annotate(bucket=TruncMonth('created_at'))
            step = timedelta(days=30)
            bucket_start = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        rows = (
            qs.values('bucket')
              .annotate(count=Count('id'))
              .order_by('bucket')
        )

        # ── FIX: TruncHour returns datetime, but TruncDate/TruncWeek/TruncMonth
        # return date objects (no time part). Normalize both sides so the
        # lookup actually matches — otherwise week/month/year/all always show 0. ──
        is_hourly = (period == 'today')

        def normalize_key(value):
            if value is None:
                return None
            if is_hourly:
                return value
            return value.date() if hasattr(value, 'date') else value

        counts_map = {}
        for row in rows:
            key = normalize_key(row['bucket'])
            if key is not None:
                counts_map[key] = row['count']

        # ── Fill every bucket in the range, even with 0 orders ──
        data = []
        cursor = bucket_start
        safety_limit = 500  # avoid infinite loop
        i = 0
        while cursor <= end and i < safety_limit:
            lookup_key = cursor if is_hourly else cursor.date()
            data.append({
                'time': cursor.isoformat(),
                'count': counts_map.get(lookup_key, 0),
            })
            cursor += step
            i += 1

        return Response({'period': period, 'data': data})


# ── NEW: today order count map — module level function (class-க்கு வெளிய) ──
def _today_order_counts():
    """user_id -> today order count map (JewelryOrder based)"""
    today = timezone.localtime(timezone.now()).date()
    counts = dict(
        JewelryOrder.objects.filter(created_at__date=today)
        .values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )
    return counts


class TodayLoginStatusView(APIView):
    permission_classes = [IsAuthenticated]

    # ── NEW: period dropdown-ku evlo days count pannanumnu ──
    PERIOD_DAYS = {
        '3days': 3,
        'week': 7,
        'month': 30,
        'year': 365,
    }

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'today')   # ── NEW
        today = timezone.now().date()
        today_order_counts = _today_order_counts() 

        def build_entry(profile, id_field, role_label, level):
            u = profile.user
            last_login_date = u.last_login.date() if u.last_login else None

            # ── NEW: never login pannalanna, account create panna date-la irundhu count ──
            reference_date = last_login_date or (u.created_at.date() if u.created_at else today)
            days_inactive = (today - reference_date).days

            if period == 'today':
                is_active = bool(last_login_date and last_login_date == today)
            else:
                days_needed = self.PERIOD_DAYS.get(period, 0)
                is_active = bool(last_login_date and (today - last_login_date).days < days_needed)

            return {
                'level': level,
                'level_role': role_label,
                'id': getattr(profile, id_field, None),
                'db_id': profile.id,   # ── NEW: actual database primary key (for SalesCount navigation)
                'name': f"{profile.first_name} {profile.last_name or ''}".strip(),
                'email': u.email,
                'phone': profile.mobile_number,
                'location': profile.city_name,
                'active': is_active,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'days_inactive': days_inactive,          # ── NEW
                'order_count': today_order_counts.get(u.id, 0),   # ── NEW: today's order count
            }

        all_entries = []
        for p in AdminProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'admin_id', 'Admin', 2))
        for p in DealerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'dealer_id', 'Dealer', 3))
        for p in SubDealerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'sub_dealer_id', 'Sub Dealer', 4))
        for p in PromotorProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'promotor_id', 'Promotor', 5))
        for p in CustomerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'customer_id', 'Customer', 6))

        active_list = [e for e in all_entries if e['active']]
        inactive_list = [e for e in all_entries if not e['active']]

        return Response({
            'period': period,          # ── NEW
            'active_count': len(active_list),
            'inactive_count': len(inactive_list),
            'active': active_list,
            'inactive': inactive_list,
        })

class CoinRequestView(APIView):
    """
    POST — Promotor/SubDealer/Dealer/Admin creates a coin request to their assigned parent.
           (Super Admin uses SuperAdminAddCoinsView instead — no request needed.)
    GET   — Returns requests: 'received' (pending, sent to me) or 'sent' (my own requests).
            Defaults: sub_dealer/dealer/admin/super_admin see received-pending,
                      everyone else (promotor) sees their own sent history.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.user.role
        target_user = None

        if role == 'promotor':
            try:
                profile = request.user.promotor_profile
            except PromotorProfile.DoesNotExist:
                return Response({'error': 'Promotor profile not found'}, status=404)
            if not profile.assigned_sub_dealer:
                return Response({'error': 'No sub dealer assigned to you'}, status=400)
            target_user = profile.assigned_sub_dealer.user

        elif role == 'sub_dealer':
            try:
                profile = request.user.sub_dealer_profile
            except SubDealerProfile.DoesNotExist:
                return Response({'error': 'Sub dealer profile not found'}, status=404)
            if not profile.assigned_dealer:
                return Response({'error': 'No dealer assigned to you'}, status=400)
            target_user = profile.assigned_dealer.user

        elif role == 'dealer':
            try:
                profile = request.user.dealer_profile
            except DealerProfile.DoesNotExist:
                return Response({'error': 'Dealer profile not found'}, status=404)
            if not profile.assigned_admin:
                return Response({'error': 'No admin assigned to you'}, status=400)
            target_user = profile.assigned_admin.user

        elif role == 'admin':
            target_user = User.objects.filter(role='super_admin').first()
            if not target_user:
                return Response({'error': 'Super admin account not found'}, status=404)

        else:
            return Response({'error': 'Your role cannot request coins'}, status=403)

        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'At least one coin item required'}, status=400)

        coin_request = CoinRequest.objects.create(
            requested_by=request.user,
            requested_to=target_user,
        )
        for item in items:
            CoinRequestItem.objects.create(
                request=coin_request,
                metal_type=item.get('metal_type'),
                weight_label=item.get('weight_label'),
                weight_grams=item.get('weight_grams'),
                qty=item.get('qty'),
            )

        serializer = CoinRequestSerializer(coin_request)
        return Response({'message': 'Request sent successfully!', 'data': serializer.data}, status=201)

    def get(self, request):
        role = request.user.role
        box = request.query_params.get('box')  # optional override: 'sent', 'received', or 'history'
        receiver_roles = ['sub_dealer', 'dealer', 'admin', 'super_admin']

        if box == 'sent':
            reqs = CoinRequest.objects.filter(requested_by=request.user)
        elif box == 'received':
            reqs = CoinRequest.objects.filter(requested_to=request.user, status='pending')
        elif box == 'history':
            # Full transaction history: every request ever sent TO me, any status
            reqs = CoinRequest.objects.filter(requested_to=request.user)
        elif role in receiver_roles:
            reqs = CoinRequest.objects.filter(requested_to=request.user, status='pending')
        else:
            reqs = CoinRequest.objects.filter(requested_by=request.user)

        reqs = reqs.prefetch_related('items').order_by('-created_at')
        serializer = CoinRequestSerializer(reqs, many=True)
        return Response(serializer.data)


class CoinRequestApproveView(APIView):
    """Any role approves a pending request sent to them — deducts coins from
    the approver's own stock and adds them into the requester's stock."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            coin_request = CoinRequest.objects.prefetch_related('items').get(
                id=pk, requested_to=request.user, status='pending'
            )
        except CoinRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        for item in coin_request.items.all():
            approver_stock = CoinStock.objects.filter(
                user=request.user, metal_type=item.metal_type, weight_label=item.weight_label
            ).first()
            available = approver_stock.qty if approver_stock else 0
            if available < item.qty:
                return Response({
                    'error': f'Insufficient stock for {item.metal_type} {item.weight_label}. '
                             f'Available: {available}, Requested: {item.qty}'
                }, status=400)

        for item in coin_request.items.all():
            approver_stock = CoinStock.objects.get(
                user=request.user, metal_type=item.metal_type, weight_label=item.weight_label
            )
            approver_stock.qty -= item.qty
            approver_stock.save()

            requester_stock, created = CoinStock.objects.get_or_create(
                user=coin_request.requested_by,
                metal_type=item.metal_type,
                weight_label=item.weight_label,
                defaults={'weight_grams': item.weight_grams, 'qty': 0}
            )
            requester_stock.qty += item.qty
            requester_stock.save()

        coin_request.status = 'sent'
        coin_request.sent_at = timezone.now()
        coin_request.save()

        return Response({'message': 'Request approved successfully!'})


class CoinRequestRejectView(APIView):
    """Any role rejects a pending request sent to them, with a reason message."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Reject reason is required'}, status=400)

        try:
            coin_request = CoinRequest.objects.get(
                id=pk, requested_to=request.user, status='pending'
            )
        except CoinRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        coin_request.status = 'rejected'
        coin_request.reject_reason = message
        coin_request.sent_at = timezone.now()
        coin_request.save()

        return Response({'message': 'Request rejected successfully!'})


class CoinRequestApproveAllView(APIView):
    """Any role approves ALL pending requests sent to them in one click.
    Deducts from approver's stock and adds to each requester's stock."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pending = CoinRequest.objects.filter(requested_to=request.user, status='pending').prefetch_related('items')

        needed = {}
        for coin_request in pending:
            for item in coin_request.items.all():
                key = (item.metal_type, item.weight_label)
                needed[key] = needed.get(key, 0) + item.qty
        for (metal_type, weight_label), qty_needed in needed.items():
            approver_stock = CoinStock.objects.filter(
                user=request.user, metal_type=metal_type, weight_label=weight_label
            ).first()
            available = approver_stock.qty if approver_stock else 0
            if available < qty_needed:
                return Response({
                    'error': f'Insufficient stock for {metal_type} {weight_label}. '
                             f'Available: {available}, Needed: {qty_needed}'
                }, status=400)

        count = 0
        for coin_request in pending:
            for item in coin_request.items.all():
                approver_stock = CoinStock.objects.get(
                    user=request.user, metal_type=item.metal_type, weight_label=item.weight_label
                )
                approver_stock.qty -= item.qty
                approver_stock.save()

                requester_stock, created = CoinStock.objects.get_or_create(
                    user=coin_request.requested_by,
                    metal_type=item.metal_type,
                    weight_label=item.weight_label,
                    defaults={'weight_grams': item.weight_grams, 'qty': 0}
                )
                requester_stock.qty += item.qty
                requester_stock.save()

            coin_request.status = 'sent'
            coin_request.sent_at = timezone.now()
            coin_request.save()
            count += 1

        return Response({'message': f'{count} requests approved successfully!'})

class SuperAdminAddCoinsView(APIView):
    """Super Admin adds coins directly into their own stock — no approval flow needed."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Only super admin can add coins directly'}, status=403)

        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'At least one coin item required'}, status=400)

        for item in items:
            stock, created = CoinStock.objects.get_or_create(
                user=request.user,
                metal_type=item.get('metal_type'),
                weight_label=item.get('weight_label'),
                defaults={'weight_grams': item.get('weight_grams'), 'qty': 0}
            )
            stock.qty += int(item.get('qty', 0))
            stock.save()

        return Response({'message': 'Coins added to your stock successfully!'})


class CoinStockView(APIView):
    """Logged-in user sees their own coin stock."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stock = CoinStock.objects.filter(user=request.user, qty__gt=0).order_by('metal_type', 'weight_grams')
        serializer = CoinStockSerializer(stock, many=True)
        return Response(serializer.data)


class CoinStockForUserView(APIView):
    """View any user's (admin/dealer/sub_dealer/promotor) coin stock by user_id —
    used by the Sales Report page's coin distribution pie chart."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'customer':
            return Response({'error': 'Permission denied'}, status=403)

        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        stock = CoinStock.objects.filter(user=target_user, qty__gt=0).order_by('metal_type', 'weight_grams')
        serializer = CoinStockSerializer(stock, many=True)
        return Response(serializer.data)


# ── NEW: Today's Rewards View ──
class TodayRewardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        # ── NEW: super_admin ku reward kaanpikkathu — level 2 (admin) mudhal mattum ──
        qs_today = CoinRewardLog.objects.filter(date=today).exclude(user__role='super_admin').select_related('user')
        total_coins_today = qs_today.aggregate(t=Sum('coins'))['t'] or 0

        summary = []
        for rtype, label in CoinRewardLog.REWARD_TYPES:
            rows = qs_today.filter(reward_type=rtype)
            summary.append({
                'reward_type': rtype,
                'label': label,
                'users': rows.values('user').distinct().count(),
                'coins': rows.aggregate(c=Sum('coins'))['c'] or 0,
            })

        range_param = request.query_params.get('range', 'all')
        list_qs = qs_today
        if range_param == '1-10':
            list_qs = list_qs.filter(coins__gte=1, coins__lte=10)
        elif range_param == '11-50':
            list_qs = list_qs.filter(coins__gte=11, coins__lte=50)
        elif range_param == '51-100':
            list_qs = list_qs.filter(coins__gte=51, coins__lte=100)
        elif range_param == '100+':
            list_qs = list_qs.filter(coins__gt=100)

        list_qs = list_qs.order_by('-created_at')
        rewards = []
        for r in list_qs:
            info = get_user_display_info(r.user)
            rewards.append({
                'id': r.id,
                'level': info['level'],
                'position': info['position'],
                'user_id': info['user_id_str'],
                'name': info['name'],
                'phone': info['phone'],
                'reward_type': r.reward_type,
                'reward_label': dict(CoinRewardLog.REWARD_TYPES).get(r.reward_type),
                'coins': r.coins,
                'date': r.date.isoformat(),
            })

        return Response({
            'date': today.isoformat(),
            'total_coins_today': total_coins_today,
            'summary': summary,
            'rewards': rewards,
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({'status': 'ok'})

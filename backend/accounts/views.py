from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from .models import User, AdminProfile, DealerProfile, SubDealerProfile, PromotorProfile, CustomerProfile, Announcement, AnnouncementReply, ProfileUpdateRequest, MetalRate, MetalOrder, JewelryProduct, JewelryProductImage, HomeBanner, CartItem, Wishlist, JewelryOrder, CoinRequest, CoinRequestItem, CoinStock, DailyLoginLog, CoinRewardLog, ReferralLink,  Wallet, CoinRecharge, AutoPayMandate
from django.db.models import Prefetch, Count, Q, Sum
from django.db.models.functions import TruncHour, TruncDate, TruncWeek, TruncMonth
from .serializers import *
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models.functions import TruncMonth
import razorpay
import hmac
import hashlib
import random
import string
from django.conf import settings
from io import BytesIO
from django.http import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
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


# ── NEW: recursive customer node builder — customer kீழ customer, evלavu level venalum cover pannும் ──
def build_customer_node(c, children_by_creator, order_counts):
    own_count = order_counts.get(c.user_id, 0)
    nested = [
        build_customer_node(sc, children_by_creator, order_counts)
        for sc in children_by_creator.get(c.user_id, [])
    ]
    total_count = own_count + sum(n['order_count'] for n in nested)
    status = worst_status([get_target_status(own_count)] + [n['status'] for n in nested])
    return {
        'id': c.id,
        'user_id': c.user_id,
        'customer_id': c.customer_id,
        'first_name': c.first_name,
        'last_name': c.last_name,
        'mobile_number': c.mobile_number,
        'city_name': c.city_name,
        'order_count': total_count,
        'status': status,
        'customers': nested,   # ← same key name 'customers' — frontend-ku label maatha vendam
    }


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

class MyBasicInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        info = get_user_display_info(user)   # already defined at the top of this file
        return Response({
            'role': user.role,
            'id': info['user_id_str'],
            'name': info['name'],
            'phone': info['phone'],
        })


# ── NEW: One-time-use public referral link system ──
class GenerateReferralLinkView(APIView):
    """IsAuthenticated — 'Copy URL' click pannумпோது idhu call aagும்.
    Fresh unused token generate pannі return pannும்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import secrets
        token = secrets.token_urlsafe(24)
        ReferralLink.objects.create(token=token, referrer=request.user)
        return Response({'token': token})


class ReferrerInfoView(APIView):
    """AllowAny — register page load aagумпோது token valid-a, used-a nu check pannі
    referrer id/name/phone return pannும்."""
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('ref')
        if not token:
            return Response({'error': 'ref required'}, status=400)
        try:
            link = ReferralLink.objects.select_related('referrer').get(token=token)
        except ReferralLink.DoesNotExist:
            return Response({'error': 'Invalid referral link'}, status=404)

        if link.used:
            return Response({'error': 'This link has already been used'}, status=410)

        info = get_user_display_info(link.referrer)
        return Response({
            'id': info['user_id_str'],
            'name': info['name'],
            'phone': info['phone'],
        })


class PublicCustomerRegisterView(APIView):
    """AllowAny — token-based one-time registration.
    Token used=True aana udanE, andha link vera evarukum vela pannaadhu."""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        token = data.get('ref')
        if not token:
            return Response({'error': 'Invalid referral link'}, status=400)
        try:
            link = ReferralLink.objects.select_related('referrer').get(token=token)
        except ReferralLink.DoesNotExist:
            return Response({'error': 'Invalid referral link'}, status=404)

        if link.used:
            return Response({'error': 'This link has already been used'}, status=410)

        referrer = link.referrer
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=400)

        assigned_promotor = None
        if referrer.role == 'promotor':
            try:
                assigned_promotor = referrer.promotor_profile
            except PromotorProfile.DoesNotExist:
                assigned_promotor = None

        profile_fields = [
            'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
        ]
        profile_data = {f: data.get(f) for f in profile_fields if data.get(f) not in [None, '']}

        user = User.objects.create_user(email=email, password=password, role='customer')
        try:
            CustomerProfile.objects.create(
                user=user,
                created_by=referrer,
                assigned_promotor=assigned_promotor,
                **profile_data
            )
        except Exception as e:
            user.delete()
            return Response({'error': str(e)}, status=400)

        # ── Mark the token as permanently used — link now dead ──
        link.used = True
        link.used_by = user
        link.used_at = timezone.now()
        link.save(update_fields=['used', 'used_by', 'used_at'])

        return Response({'message': 'Customer registered successfully'}, status=201)
    
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
        if request.user.role not in ['promotor', 'customer']:
            return Response({'error': 'Permission denied'}, status=403)
        serializer = CustomerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Customer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin', 'customer']:
            return Response({'error': 'Permission denied'}, status=403)

        customers = CustomerProfile.objects.select_related(
            'user', 'assigned_promotor'
        ).order_by('-created_at')

        if request.user.role in ['promotor', 'customer']:
            customers = customers.filter(created_by=request.user)

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

        now = timezone.now()
        # ── FIX: year/month extract panradhukku pathila date RANGE use pandrom.
        # Idhu database INDEX-ah use pannum (full table scan aagadhu) — romba fast aagum. ──
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month_start = month_start.replace(year=now.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=now.month + 1)

        order_counts = dict(
            JewelryOrder.objects.filter(
                created_at__gte=month_start, created_at__lt=next_month_start
            ).values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
        )

        # ── NEW: customer -> customer chain (created_by) — ella depth-um map pannும் ──
        children_by_creator = {}
        for cust in CustomerProfile.objects.all().only('id', 'user_id', 'created_by_id'):
            children_by_creator.setdefault(cust.created_by_id, []).append(cust)

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
    build_customer_node(c, children_by_creator, order_counts)
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
    
# ── COMMISSION DISTRIBUTION ENGINE ──
# Order oda buyer-ஐ irundhu மேலே ஏறி, created_by chain walk pண்ணி commission distribute pண்ணும்.
COMMISSION_POOL_PERCENT = Decimal('27.00')
COMMISSION_LEVEL1_PERCENT = Decimal('7.00')
COMMISSION_LEVEL_PERCENT = Decimal('1.00')

_ROLE_PROFILE_MAP = {
    'customer': CustomerProfile,
    'promotor': PromotorProfile,
    'sub_dealer': SubDealerProfile,
    'dealer': DealerProfile,
    'admin': AdminProfile,
}

def _get_creator_user(user):
    """Idha user-ஐ direct create pண்ணின User-ஐ return pண்ணும் (role edhுவும் ஆகலாம்)."""
    model = _ROLE_PROFILE_MAP.get(user.role)
    if not model:
        return None
    try:
        profile = model.objects.get(user=user)
        return profile.created_by
    except model.DoesNotExist:
        return None


def build_commission_chain(buyer_user):
    """Buyer-ஐ இருந்து மேலே ஏறி, Super Admin varaikkum chain build pண்ணும்.
    Loop-safe — seen ids track pண்ணுறோம்."""
    chain = []
    current = buyer_user
    seen = set()
    while True:
        creator = _get_creator_user(current)
        if not creator or creator.id in seen:
            break
        seen.add(creator.id)
        chain.append(creator)
        if creator.role == 'super_admin':
            break
        current = creator
    return chain


def distribute_commission(order):
    """Order success aana odane call pண்ணனும் — 27% chain ku distribute pண்ணும்,
    balance Super Admin ku pogும்."""
    buyer = order.user
    if buyer.role != 'customer':
        return

    total_amount = Decimal(str(order.total_price))
    chain = build_commission_chain(buyer)

    remaining_percent = COMMISSION_POOL_PERCENT
    level = 0

    for creator_user in chain:
        if creator_user.role == 'super_admin':
            break   # Super Admin ku balance kீழே handle pண்ணுறோம்

        if remaining_percent <= 0:
            break

        level += 1
        pct = COMMISSION_LEVEL1_PERCENT if level == 1 else COMMISSION_LEVEL_PERCENT
        if pct > remaining_percent:
            pct = remaining_percent

        amount = (total_amount * pct / Decimal('100')).quantize(Decimal('0.01'))
        coins = int(amount * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=creator_user)
        wallet.balance_coins += coins
        wallet.save(update_fields=['balance_coins'])

        try:
            CoinRecharge.objects.create(
                user=creator_user, amount_paid=amount, coins_credited=coins,
                payment_method='commission', status='success',
                entry_type='credit', source='commission',
                related_order=order, commission_level=level,
            )
        except Exception as e:
            print(f'❌ Commission log FAILED for {creator_user.email}:', repr(e))
        remaining_percent -= pct

    # ── Balance percent (evlo mudியalaiyோ) — direct Super Admin ku ──
    if remaining_percent > 0:
        super_admin = User.objects.filter(role='super_admin').first()
        if super_admin:
            amount = (total_amount * remaining_percent / Decimal('100')).quantize(Decimal('0.01'))
            coins = int(amount * COIN_RATE_PER_RUPEE)

            wallet, _ = Wallet.objects.get_or_create(user=super_admin)
            wallet.balance_coins += coins
            wallet.save(update_fields=['balance_coins'])

            try:
                CoinRecharge.objects.create(
                    user=super_admin, amount_paid=amount, coins_credited=coins,
                    payment_method='commission', status='success',
                    entry_type='credit', source='commission',
                    related_order=order, commission_level=0,
                )
            except Exception as e:
                print('❌ Super Admin commission log FAILED:', repr(e))


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
            distribute_commission(order)   # ── NEW: commission chain ku pogும் ──
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
    return _orders_by_user_map(_collect_user_ids_admin(a) + [a.user_id])

def _bulk_orders_for_dealer(d):
    return _orders_by_user_map(_collect_user_ids_dealer(d) + [d.user_id])

def _bulk_orders_for_sub_dealer(sd):
    return _orders_by_user_map(_collect_user_ids_sub_dealer(sd) + [sd.user_id])

def _bulk_orders_for_promotor(p):
    ids = [c.user_id for c in p.assigned_customers.all()]
    return _orders_by_user_map(ids)


def _monthly_order_counts_map(user_ids):
    """DB level la ella customer kum ore query la group-by + count.
    Python loop venaam — idhu than 3 min ஆனத்துக்கு main reason."""
    now = timezone.now()
    counts = dict(
        JewelryOrder.objects.filter(
            user_id__in=user_ids,
            created_at__year=now.year,
            created_at__month=now.month,
        ).values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )
    return counts


def _build_customer(c, orders_by_user, monthly_counts):
    orders = orders_by_user.get(c.user_id, [])
    monthly_count = monthly_counts.get(c.user_id, 0)   # ← O(1) dict lookup, loop illa
    return {
        'type': 'customer', 'id': c.id, 'customer_id': c.customer_id,
        'first_name': c.first_name, 'last_name': c.last_name,
        'mobile_number': c.mobile_number, 'city_name': c.city_name,
        'orders': orders,
        'order_count': monthly_count,
        'status': get_target_status(monthly_count),
    }

def _build_promotor(p, orders_by_user, monthly_counts):
    customers = [_build_customer(c, orders_by_user, monthly_counts) for c in p.assigned_customers.all()]
    own_orders = orders_by_user.get(p.user_id, [])
    own_monthly = monthly_counts.get(p.user_id, 0)
    return {
        'type': 'promotor', 'id': p.id, 'promotor_id': p.promotor_id, 'user_id': p.user_id,
        'first_name': p.first_name, 'last_name': p.last_name,
        'mobile_number': p.mobile_number, 'city_name': p.city_name,
        'customers': customers,
        'own_orders': own_orders,
        'order_count': sum(c['order_count'] for c in customers) + own_monthly,
        'status': worst_status([c['status'] for c in customers] + [get_target_status(own_monthly)]),
    }

def _build_sub_dealer(sd, orders_by_user, monthly_counts):
    promotors = [_build_promotor(p, orders_by_user, monthly_counts) for p in sd.assigned_promotors.all()]
    own_orders = orders_by_user.get(sd.user_id, [])
    own_monthly = monthly_counts.get(sd.user_id, 0)
    return {
        'type': 'sub_dealer', 'id': sd.id, 'sub_dealer_id': sd.sub_dealer_id, 'user_id': sd.user_id,
        'first_name': sd.first_name, 'last_name': sd.last_name,
        'mobile_number': sd.mobile_number, 'city_name': sd.city_name,
        'promotors': promotors,
        'own_orders': own_orders,
        'order_count': sum(p['order_count'] for p in promotors) + own_monthly,
        'status': worst_status([p['status'] for p in promotors] + [get_target_status(own_monthly)]),
    }

def _build_dealer(d, orders_by_user, monthly_counts):
    sub_dealers = [_build_sub_dealer(sd, orders_by_user, monthly_counts) for sd in d.assigned_sub_dealers.all()]
    own_orders = orders_by_user.get(d.user_id, [])
    own_monthly = monthly_counts.get(d.user_id, 0)
    return {
        'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id, 'user_id': d.user_id,
        'first_name': d.first_name, 'last_name': d.last_name,
        'mobile_number': d.mobile_number, 'city_name': d.city_name,
        'sub_dealers': sub_dealers,
        'own_orders': own_orders,
        'order_count': sum(sd['order_count'] for sd in sub_dealers) + own_monthly,
        'status': worst_status([sd['status'] for sd in sub_dealers] + [get_target_status(own_monthly)]),
    }

def _build_admin(a, orders_by_user, monthly_counts):
    dealers = [_build_dealer(d, orders_by_user, monthly_counts) for d in a.assigned_dealers.all()]
    own_orders = orders_by_user.get(a.user_id, [])
    own_monthly = monthly_counts.get(a.user_id, 0)
    return {
        'type': 'admin', 'id': a.id, 'admin_id': a.admin_id, 'user_id': a.user_id,
        'first_name': a.first_name, 'last_name': a.last_name,
        'mobile_number': a.mobile_number, 'city_name': a.city_name,
        'dealers': dealers,
        'own_orders': own_orders,
        'order_count': sum(d['order_count'] for d in dealers) + own_monthly,
        'status': worst_status([d['status'] for d in dealers] + [get_target_status(own_monthly)]),
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
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(node))
                root = _build_admin(node, orders_by_user, monthly_counts)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(node))
                root = _build_dealer(node, orders_by_user, monthly_counts)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(node))
                root = _build_sub_dealer(node, orders_by_user, monthly_counts)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(id=node_id)
                orders_by_user = _bulk_orders_for_promotor(node)
                monthly_counts = _monthly_order_counts_map(
                    [c.user_id for c in node.assigned_customers.all()]
                )
                root = _build_promotor(node, orders_by_user, monthly_counts)
            elif role == 'customer':
                node = CustomerProfile.objects.get(id=node_id)
                orders_by_user = _orders_by_user_map([node.user_id])
                monthly_counts = _monthly_order_counts_map([node.user_id])
                root = _build_customer(node, orders_by_user, monthly_counts)
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
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(node))
                root = _build_admin(node, orders_by_user, monthly_counts)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(node) + [node.user_id])
                root = _build_dealer(node, orders_by_user, monthly_counts)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(node) + [node.user_id])
                root = _build_sub_dealer(node, orders_by_user, monthly_counts)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(user=user)
                orders_by_user = _bulk_orders_for_promotor(node)
                monthly_counts = _monthly_order_counts_map(
                    [c.user_id for c in node.assigned_customers.all()] + [node.user_id]
                )
                root = _build_promotor(node, orders_by_user, monthly_counts)
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
            monthly_counts = _monthly_order_counts_map(all_ids)
            return Response({
                'role': role,
                'data': [_build_admin(a, orders_by_user, monthly_counts) for a in admins],
                'ancestors': [],
            })

        elif role == 'admin':
            try:
                admin = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_admin(admin)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(admin))
                return Response({
                    'role': role,
                    'data': [_build_admin(admin, orders_by_user, monthly_counts)],
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
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(dealer) + [dealer.user_id])
                return Response({
                    'role': role,
                    'data': [_build_dealer(dealer, orders_by_user, monthly_counts)],
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
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(sd) + [sd.user_id])
                return Response({
                    'role': role,
                    'data': [_build_sub_dealer(sd, orders_by_user, monthly_counts)],
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
                monthly_counts = _monthly_order_counts_map([c.user_id for c in p.assigned_customers.all()] + [p.user_id])
                return Response({
                    'role': role,
                    'data': [_build_promotor(p, orders_by_user, monthly_counts)],
                    'ancestors': get_report_ancestors(role, p),
                })
            except PromotorProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})


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



def _today_order_counts():
    """user_id -> today order count map (JewelryOrder based)"""
    today = timezone.localtime(timezone.now()).date()
    counts = dict(
        JewelryOrder.objects.filter(created_at__date=today)
        .values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )
    return counts



def _today_rollup_counts():
    """Returns dict: key = (role, profile_id) -> today's order count (rolled up).
    role-kal: 'customer' (key=user_id), 'promotor', 'sub_dealer', 'dealer', 'admin' (key=profile.id)."""
    today = timezone.localtime(timezone.now()).date()
    orders = JewelryOrder.objects.filter(created_at__date=today).select_related(
        'user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin'
    )

    counts = {}

    def bump(key):
        counts[key] = counts.get(key, 0) + 1

    for o in orders:
        u = o.user
        cp = getattr(u, 'customer_profile', None)
        if not cp:
            continue  

        bump(('customer', u.id))

        pr = cp.assigned_promotor
        if not pr:
            continue
        bump(('promotor', pr.id))

        sd = pr.assigned_sub_dealer
        if not sd:
            continue
        bump(('sub_dealer', sd.id))

        d = sd.assigned_dealer
        if not d:
            continue
        bump(('dealer', d.id))

        a = d.assigned_admin
        if not a:
            continue
        bump(('admin', a.id))

    return counts

class TodayLoginStatusView(APIView):
    permission_classes = [IsAuthenticated]

   
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
        rollup_counts = _today_rollup_counts()   # ← NEW: (role, profile_id) -> today's rolled-up count

        # ── NEW: role_key add pannom — rollup dict-la correct key vachu lookup pannanum ──
        def build_entry(profile, id_field, role_label, level, role_key):
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

            # ── NEW: customer ku key=user_id, meethi ellarukum key=profile.id ──
            lookup_key = u.id if role_key == 'customer' else profile.id

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
                'order_count': rollup_counts.get((role_key, lookup_key), 0),   # ← CHANGED: rolled-up today count
            }

        all_entries = []
        for p in AdminProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'admin_id', 'Admin', 2, 'admin'))
        for p in DealerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'dealer_id', 'Dealer', 3, 'dealer'))
        for p in SubDealerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'sub_dealer_id', 'Sub Dealer', 4, 'sub_dealer'))
        for p in PromotorProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'promotor_id', 'Promotor', 5, 'promotor'))
        for p in CustomerProfile.objects.select_related('user'):
            all_entries.append(build_entry(p, 'customer_id', 'Customer', 6, 'customer'))

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

# ── NEW: Retailer Promotion System ──
class RetailerPromotionListView(APIView):
    """
    Customers who have created sub-customers, whose sub-customers' total
    order value crossed ₹5L OR sub-customer count crossed 7 — eligible
    for Retailer promotion.
    """
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 500000          # ₹5 Lakh
    CUSTOMER_COUNT_THRESHOLD = 7

    # AFTER
    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()

        creator_profiles = list(
            CustomerProfile.objects.filter(
                user__role='customer', user__created_customers__isnull=False
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response([])

        creator_ids = [cp.user_id for cp in creator_profiles]

        # ── NEW: fetch ALL customers ONE query, build a created_by → children map
        # for a recursive walk (A→B→C→D... any depth) ──
        all_customers = list(
            CustomerProfile.objects.all().values('user_id', 'created_by_id', 'created_at')
        )
        children_by_parent = {}
        for c in all_customers:
            children_by_parent.setdefault(c['created_by_id'], []).append(c)

        def collect_descendants(root_user_id):
            """BFS keezhe poi ella level layume customers-a collect pannum (loop-safe)."""
            collected, seen = [], set()
            queue = list(children_by_parent.get(root_user_id, []))
            while queue:
                node = queue.pop(0)
                uid = node['user_id']
                if uid in seen:
                    continue
                seen.add(uid)
                collected.append(node)
                queue.extend(children_by_parent.get(uid, []))
            return collected

        descendants_by_creator = {}
        all_relevant_user_ids = set(creator_ids)
        for creator_id in creator_ids:
            desc = collect_descendants(creator_id)
            descendants_by_creator[creator_id] = desc
            all_relevant_user_ids.update(d['user_id'] for d in desc)

        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=list(all_relevant_user_ids))
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_customers = descendants_by_creator.get(creator_id, [])

            total_customers = len(my_customers)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = total_value >= self.SALES_THRESHOLD or total_customers >= self.CUSTOMER_COUNT_THRESHOLD
            if not eligible and cp.retailer_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'customer_id': cp.customer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_value': float(total_value),
                'status': cp.retailer_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)


class RetailerPromotionActionView(APIView):
    """Approve converts the customer into a real Promotor; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='customer')
            target_profile = target_user.customer_profile
        except (User.DoesNotExist, CustomerProfile.DoesNotExist):
            return Response({'error': 'Customer not found'}, status=404)

        if action == 'reject':
            target_profile.retailer_status = 'rejected'
            target_profile.save(update_fields=['retailer_status'])
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'promotor_profile'):
                return Response({'error': 'Already a promotor'}, status=400)

            promotor = PromotorProfile.objects.create(
                user=target_user,
                created_by=request.user,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            all_customers = list(CustomerProfile.objects.all().values('id', 'user_id', 'created_by_id'))
            children_by_parent = {}
            for c in all_customers:
                children_by_parent.setdefault(c['created_by_id'], []).append(c)

            def collect_descendant_ids(root_user_id):
                ids, seen = [], set()
                queue = list(children_by_parent.get(root_user_id, []))
                while queue:
                    node = queue.pop(0)
                    if node['id'] in seen:
                        continue
                    seen.add(node['id'])
                    ids.append(node['id'])
                    queue.extend(children_by_parent.get(node['user_id'], []))
                return ids

            descendant_ids = collect_descendant_ids(target_user.id)
            CustomerProfile.objects.filter(id__in=descendant_ids).update(assigned_promotor=promotor)

            target_profile.retailer_status = 'approved'
            target_profile.save(update_fields=['retailer_status'])

            target_user.role = 'promotor'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — customer promoted to Retailer'})

        return Response({'error': 'Invalid action'}, status=400)

    # ── Shared helper: recursive customer-chain collector (any depth A→B→C→D...→1000+) ──
def _recursive_customers_by_creator(creator_user_ids):
    """creator_user_ids = promotor user_ids who directly create customers.
    Returns dict: creator_user_id -> list of customer dicts {user_id, created_by_id, created_at}
    covering EVERY level of the downline chain, not just direct children."""
    all_customers = list(
        CustomerProfile.objects.all().values('user_id', 'created_by_id', 'created_at')
    )
    children_by_parent = {}
    for c in all_customers:
        children_by_parent.setdefault(c['created_by_id'], []).append(c)

    def collect_descendants(root_user_id):
        collected, seen = [], set()
        queue = list(children_by_parent.get(root_user_id, []))
        while queue:
            node = queue.pop(0)
            uid = node['user_id']
            if uid in seen:
                continue
            seen.add(uid)
            collected.append(node)
            queue.extend(children_by_parent.get(uid, []))
        return collected

    result = {}
    for cid in creator_user_ids:
        result[cid] = collect_descendants(cid)
    return result    

# ── NEW: Wholesale Dealer Promotion System (Promotor -> SubDealer) ──
class WholesaleDealerPromotionListView(APIView):
    """Promotors (Retailers) who built 20+ customers (any depth in downline chain)
    AND crossed ₹35 Lakh overall sales — eligible for Wholesale Dealer."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 3500000        # ₹35 Lakh
    CUSTOMER_THRESHOLD = 20

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()

        creator_profiles = list(
            PromotorProfile.objects.filter(
                user__role='promotor', user__created_customers__isnull=False
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response([])

        creator_ids = [cp.user_id for cp in creator_profiles]

        # ── NEW: recursive walk — ella level customer chain-um (A→B→C→D...) cover pannum ──
        customers_by_creator = _recursive_customers_by_creator(creator_ids)

        all_relevant_user_ids = list(creator_ids)
        for cid in creator_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_creator.get(cid, []))

        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_customers = customers_by_creator.get(creator_id, [])

            total_customers = len(my_customers)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = total_customers >= self.CUSTOMER_THRESHOLD and total_value >= self.SALES_THRESHOLD
            if not eligible and cp.wholesale_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'promotor_id': cp.promotor_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_value': float(total_value),
                'status': cp.wholesale_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)


class WholesaleDealerPromotionActionView(APIView):
    """Approve converts the Promotor into a real SubDealer; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='promotor')
            target_profile = target_user.promotor_profile
        except (User.DoesNotExist, PromotorProfile.DoesNotExist):
            return Response({'error': 'Promotor not found'}, status=404)

        if action == 'reject':
            target_profile.wholesale_status = 'rejected'
            target_profile.save(update_fields=['wholesale_status'])
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'sub_dealer_profile'):
                return Response({'error': 'Already a sub dealer'}, status=400)

            SubDealerProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,   # original parent preserve pannurom, tier roll-up ku
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.wholesale_status = 'approved'
            target_profile.save(update_fields=['wholesale_status'])

            target_user.role = 'sub_dealer'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Wholesale Dealer'})

        return Response({'error': 'Invalid action'}, status=400)


class DistributorPromotionListView(APIView):
    """SubDealers (Wholesale Dealers) who built 40+ customers (any depth) AND crossed
    ₹2.5 Crore overall sales — eligible for Distributor."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 25000000       # ₹2.5 Crore
    CUSTOMER_THRESHOLD = 40

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()

        creator_profiles = list(
            SubDealerProfile.objects.filter(
                user__role='sub_dealer', user__created_promotors__isnull=False
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response([])

        creator_ids = [cp.user_id for cp in creator_profiles]

        wholesale_counts = dict(
            SubDealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
        )

        promotors = list(
            PromotorProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id', 'user_id')
        )
        promotors_by_creator = {}
        for p in promotors:
            promotors_by_creator.setdefault(p['created_by_id'], []).append(p['user_id'])
        all_promotor_ids = [p['user_id'] for p in promotors]

        # ── NEW: recursive walk — ella level customer chain-um cover pannum ──
        customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)

        all_relevant_user_ids = list(creator_ids) + list(all_promotor_ids)
        for pid in all_promotor_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_promotor.get(pid, []))

        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_promotor_ids = promotors_by_creator.get(creator_id, [])

            my_customers = []
            for pid in my_promotor_ids:
                my_customers.extend(customers_by_promotor.get(pid, []))

            total_wholesale_dealers = wholesale_counts.get(creator_id, 0)
            total_retailers = len(my_promotor_ids)
            total_customers = len(my_customers)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += sum(order_totals.get(pid, 0) or 0 for pid in my_promotor_ids)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = (
                total_customers >= self.CUSTOMER_THRESHOLD and
                total_value >= self.SALES_THRESHOLD
            )
            if not eligible and cp.distributor_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'sub_dealer_id': cp.sub_dealer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_retailers': total_retailers,
                'total_wholesale_dealers': total_wholesale_dealers,
                'total_value': float(total_value),
                'status': cp.distributor_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)

class DistributorPromotionActionView(APIView):
    """Approve converts the SubDealer into a real Dealer; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='sub_dealer')
            target_profile = target_user.sub_dealer_profile
        except (User.DoesNotExist, SubDealerProfile.DoesNotExist):
            return Response({'error': 'Sub dealer not found'}, status=404)

        if action == 'reject':
            target_profile.distributor_status = 'rejected'
            target_profile.save(update_fields=['distributor_status'])
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'dealer_profile'):
                return Response({'error': 'Already a dealer'}, status=400)

            DealerProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.distributor_status = 'approved'
            target_profile.save(update_fields=['distributor_status'])

            target_user.role = 'dealer'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Distributor'})

        return Response({'error': 'Invalid action'}, status=400)


class SuperStockistPromotionListView(APIView):
    """Dealers (Distributors) who built 80+ customers (any depth), 20+ Retailers,
    10+ Wholesale Dealers, 5+ Distributors keezhе AND crossed ₹12 Crore overall —
    eligible for Super Stockist."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 120000000      # ₹12 Crore
    CUSTOMER_THRESHOLD = 80

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()

        creator_profiles = list(
            DealerProfile.objects.filter(
                user__role='dealer', user__created_sub_dealers__isnull=False
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response([])

        creator_ids = [cp.user_id for cp in creator_profiles]

        distributor_counts = dict(
            DealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
        )

        sub_dealers = list(
            SubDealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id', 'user_id')
        )
        sub_dealers_by_creator = {}
        for sd in sub_dealers:
            sub_dealers_by_creator.setdefault(sd['created_by_id'], []).append(sd['user_id'])
        all_sub_dealer_ids = [sd['user_id'] for sd in sub_dealers]

        promotors = list(
            PromotorProfile.objects.filter(created_by_id__in=all_sub_dealer_ids)
            .values('created_by_id', 'user_id')
        )
        promotors_by_sub_dealer = {}
        for p in promotors:
            promotors_by_sub_dealer.setdefault(p['created_by_id'], []).append(p['user_id'])
        all_promotor_ids = [p['user_id'] for p in promotors]

        # ── NEW: recursive walk — ella level customer chain-um cover pannum ──
        customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)

        all_relevant_user_ids = list(creator_ids) + list(all_sub_dealer_ids) + list(all_promotor_ids)
        for pid in all_promotor_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_promotor.get(pid, []))

        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_sub_dealer_ids = sub_dealers_by_creator.get(creator_id, [])

            my_promotor_ids = []
            for sdid in my_sub_dealer_ids:
                my_promotor_ids.extend(promotors_by_sub_dealer.get(sdid, []))

            my_customers = []
            for pid in my_promotor_ids:
                my_customers.extend(customers_by_promotor.get(pid, []))

            total_distributors = distributor_counts.get(creator_id, 0)
            total_wholesale_dealers = len(my_sub_dealer_ids)
            total_retailers = len(my_promotor_ids)
            total_customers = len(my_customers)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += sum(order_totals.get(pid, 0) or 0 for pid in my_promotor_ids)
            total_value += sum(order_totals.get(sdid, 0) or 0 for sdid in my_sub_dealer_ids)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = (
                total_customers >= self.CUSTOMER_THRESHOLD and
                total_value >= self.SALES_THRESHOLD
            )
            if not eligible and cp.super_stockist_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'dealer_id': cp.dealer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_retailers': total_retailers,
                'total_wholesale_dealers': total_wholesale_dealers,
                'total_distributors': total_distributors,
                'total_value': float(total_value),
                'status': cp.super_stockist_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)

class SuperStockistPromotionActionView(APIView):
    """Approve converts the Dealer into a real Admin; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='dealer')
            target_profile = target_user.dealer_profile
        except (User.DoesNotExist, DealerProfile.DoesNotExist):
            return Response({'error': 'Dealer not found'}, status=404)

        if action == 'reject':
            target_profile.super_stockist_status = 'rejected'
            target_profile.save(update_fields=['super_stockist_status'])
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'admin_profile'):
                return Response({'error': 'Already an admin'}, status=400)

            AdminProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.super_stockist_status = 'approved'
            target_profile.save(update_fields=['super_stockist_status'])

            target_user.role = 'admin'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Super Stockist'})

        return Response({'error': 'Invalid action'}, status=400)

# ── NEW: Generic customer list for any promotion-node "Total Customers" click ──
class PromotionCustomerListView(APIView):
    """node_type = customer / promotor / sub_dealer / dealer
    user_id = that node's User id
    Returns the FULL recursive customer chain under that node with order stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        node_type = request.query_params.get('node_type')
        user_id = request.query_params.get('user_id')
        if not node_type or not user_id:
            return Response({'error': 'node_type and user_id required'}, status=400)

        try:
            user_id = int(user_id)
        except ValueError:
            return Response({'error': 'invalid user_id'}, status=400)

        # Step 1: figure out which promotor user_ids we need customer-chains for
        if node_type == 'customer':
            promotor_user_ids = None
        elif node_type == 'promotor':
            promotor_user_ids = [user_id]
        elif node_type == 'sub_dealer':
            promotor_user_ids = list(
                PromotorProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True)
            )
        elif node_type == 'dealer':
            sub_dealer_ids = list(
                SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True)
            )
            promotor_user_ids = list(
                PromotorProfile.objects.filter(created_by_id__in=sub_dealer_ids).values_list('user_id', flat=True)
            )
        else:
            return Response({'error': 'invalid node_type'}, status=400)

        # Step 2: recursive customer chain collect pannu (already built helper)
        if node_type == 'customer':
            customers_map = _recursive_customers_by_creator([user_id])
            customer_dicts = customers_map.get(user_id, [])
        else:
            customers_map = _recursive_customers_by_creator(promotor_user_ids)
            customer_dicts = []
            for pid in promotor_user_ids:
                customer_dicts.extend(customers_map.get(pid, []))

        customer_user_ids = [c['user_id'] for c in customer_dicts]

        # Step 3: full profile + order stats bulk-a edukurom
        profiles = list(
            CustomerProfile.objects.filter(user_id__in=customer_user_ids).select_related('user')
        )

        order_rows = (
            JewelryOrder.objects.filter(user_id__in=customer_user_ids)
            .values('user_id')
            .annotate(cnt=Count('id'), total=Sum('total_price'))
        )
       
        order_map = {r['user_id']: {'count': r['cnt'], 'value': float(r['total'] or 0)} for r in order_rows}

        order_filter = request.query_params.get('order_filter', 'all')   # ── NEW
        if order_filter == 'orders_only':
            profiles = [p for p in profiles if order_map.get(p.user_id, {}).get('count', 0) > 0]

        node_labels = {
            'customer': 'Retailer',      # customer promoted-to-Retailer nu paakkarom
            'promotor': 'Retailer',
            'sub_dealer': 'Wholesale Dealer',
            'dealer': 'Distributor',
        }
        own_orders_row = None

        own_order_row = (
            JewelryOrder.objects.filter(user_id=user_id)
            .aggregate(cnt=Count('id'), total=Sum('total_price'))
        )
        own_count = own_order_row['cnt'] or 0
        own_value = float(own_order_row['total'] or 0)

        if own_count > 0:
            try:
                node_user = User.objects.get(id=user_id)
                node_profile_map = {
                    'customer': 'customer_profile', 'promotor': 'promotor_profile',
                    'sub_dealer': 'sub_dealer_profile', 'dealer': 'dealer_profile',
                }
                node_id_field_map = {
                    'customer': 'customer_id', 'promotor': 'promotor_id',
                    'sub_dealer': 'sub_dealer_id', 'dealer': 'dealer_id',
                }
                node_profile = getattr(node_user, node_profile_map[node_type])
                own_orders_row = {
                    'position': node_labels.get(node_type, 'Self'),
                    'customer_id': getattr(node_profile, node_id_field_map[node_type], ''),
                    'name': f"{node_profile.first_name} {node_profile.last_name or ''}".strip(),
                    'email': node_user.email,
                    'phone': node_profile.mobile_number,
                    'order_count': own_count,
                    'total_value': own_value,
                }
            except Exception:
                own_orders_row = None

        profiles.sort(key=lambda p: order_map.get(p.user_id, {}).get('value', 0), reverse=True)

        results = []
        if own_orders_row:
            results.append(own_orders_row)   # ── retailer own row mudhalla varum ──

        for idx, p in enumerate(profiles, start=1):
            agg = order_map.get(p.user_id, {'count': 0, 'value': 0})
            results.append({
                'position': idx,
                'customer_id': p.customer_id,
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'email': p.user.email,
                'phone': p.mobile_number,
                'order_count': agg['count'],
                'total_value': agg['value'],
            })

        return Response(results)


# ── NEW: Retailer/Wholesale Dealer/Distributor node list (not customers) ──
class PromotionNodeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        node_type = request.query_params.get('node_type')
        list_type = request.query_params.get('list_type')
        user_id = request.query_params.get('user_id')
        if not node_type or not list_type or not user_id:
            return Response({'error': 'node_type, list_type and user_id required'}, status=400)
        try:
            user_id = int(user_id)
        except ValueError:
            return Response({'error': 'invalid user_id'}, status=400)

        if list_type == 'retailers':
            if node_type == 'sub_dealer':
                promotor_ids = list(PromotorProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            elif node_type == 'dealer':
                sd_ids = list(SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
                promotor_ids = list(PromotorProfile.objects.filter(created_by_id__in=sd_ids).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for retailers'}, status=400)
            profiles = list(PromotorProfile.objects.filter(user_id__in=promotor_ids).select_related('user'))
            id_field = 'promotor_id'

        elif list_type == 'wholesale_dealers':
            if node_type in ('sub_dealer', 'dealer'):
                sd_ids = list(SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for wholesale_dealers'}, status=400)
            profiles = list(SubDealerProfile.objects.filter(user_id__in=sd_ids).select_related('user'))
            id_field = 'sub_dealer_id'

        elif list_type == 'distributors':
            if node_type in ('admin', 'dealer'):
                d_ids = list(DealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for distributors'}, status=400)
            profiles = list(DealerProfile.objects.filter(user_id__in=d_ids).select_related('user'))
            id_field = 'dealer_id'
        else:
            return Response({'error': 'invalid list_type'}, status=400)

        node_user_ids = [p.user_id for p in profiles]

        if list_type == 'retailers':
            customers_map = _recursive_customers_by_creator(node_user_ids)
        elif list_type == 'wholesale_dealers':
            promotors = list(PromotorProfile.objects.filter(created_by_id__in=node_user_ids).values('created_by_id', 'user_id'))
            promotors_by_sd = {}
            for p in promotors:
                promotors_by_sd.setdefault(p['created_by_id'], []).append(p['user_id'])
            all_promotor_ids = [p['user_id'] for p in promotors]
            customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)
            customers_map = {}
            for sd_id in node_user_ids:
                merged = []
                for pid in promotors_by_sd.get(sd_id, []):
                    merged.extend(customers_by_promotor.get(pid, []))
                customers_map[sd_id] = merged
        else:  # distributors
            sub_dealers = list(SubDealerProfile.objects.filter(created_by_id__in=node_user_ids).values('created_by_id', 'user_id'))
            sd_by_dealer = {}
            for sd in sub_dealers:
                sd_by_dealer.setdefault(sd['created_by_id'], []).append(sd['user_id'])
            all_sd_ids = [sd['user_id'] for sd in sub_dealers]
            promotors = list(PromotorProfile.objects.filter(created_by_id__in=all_sd_ids).values('created_by_id', 'user_id'))
            promotors_by_sd = {}
            for p in promotors:
                promotors_by_sd.setdefault(p['created_by_id'], []).append(p['user_id'])
            all_promotor_ids = [p['user_id'] for p in promotors]
            customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)
            customers_map = {}
            for d_id in node_user_ids:
                my_promotors = []
                for sdid in sd_by_dealer.get(d_id, []):
                    my_promotors.extend(promotors_by_sd.get(sdid, []))
                merged = []
                for pid in my_promotors:
                    merged.extend(customers_by_promotor.get(pid, []))
                customers_map[d_id] = merged

        all_customer_ids = list(set(
            [c['user_id'] for lst in customers_map.values() for c in lst] + node_user_ids
        ))
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_customer_ids)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for p in profiles:
            my_customers = customers_map.get(p.user_id, [])
            value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            value += order_totals.get(p.user_id, 0) or 0
            results.append({
                'id_str': getattr(p, id_field, ''),
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'email': p.user.email,
                'phone': p.mobile_number,
                'total_customers': len(my_customers),
                'total_value': float(value),
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)        


# ── WALLET RECHARGE SYSTEM ──
COIN_RATE_PER_RUPEE = 100


def generate_transaction_id():
    """BB + YYMMDD + 6 random alphanumeric chars — example: BB260806A3F9K2"""
    date_part = timezone.now().strftime('%y%m%d')
    rand_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    txn_id = f'BB{date_part}{rand_part}'
    # ── Unique-a confirm pண்ணு, romba rare-a collision aana retry pண்ணு ──
    while CoinRecharge.objects.filter(transaction_id=txn_id).exists():
        rand_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        txn_id = f'BB{date_part}{rand_part}'
    return txn_id


class RechargeCreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Valid amount required'}, status=400)
        if amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=400)

        coins = int(amount * COIN_RATE_PER_RUPEE)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        razorpay_order = client.order.create({
            "amount": int(amount * 100),
            "currency": "INR",
            "payment_capture": 1,
        })

        recharge = CoinRecharge.objects.create(
            user=request.user,
            amount_paid=amount,
            coins_credited=coins,
            razorpay_order_id=razorpay_order['id'],
            status='pending',
        )

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': amount,
            'currency': 'INR',
            'key': settings.RAZORPAY_KEY_ID,
            'recharge_id': recharge.id,
            'coins': coins,
        })


class RechargeVerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        try:
            recharge = CoinRecharge.objects.get(
                id=data.get('recharge_id'), user=request.user, status='pending'
            )
        except CoinRecharge.DoesNotExist:
            return Response({'error': 'Recharge not found'}, status=404)

        body = data['razorpay_order_id'] + "|" + data['razorpay_payment_id']
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
        ).hexdigest()

        if expected_sig != data.get('razorpay_signature'):
            recharge.status = 'failed'
            recharge.save(update_fields=['status'])
            return Response({'status': 'failed', 'msg': 'Invalid signature'}, status=400)

        # ── Razorpay payment fetch pannurom method (card/upi/netbanking/wallet) edukka ──
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        method = 'other'
        try:
            payment = client.payment.fetch(data['razorpay_payment_id'])
            raw_method = payment.get('method', 'other')
            method_map = {'card': 'card', 'upi': 'upi', 'netbanking': 'netbanking', 'wallet': 'wallet'}
            method = method_map.get(raw_method, 'other')
        except Exception:
            pass

        recharge.razorpay_payment_id = data['razorpay_payment_id']
        recharge.payment_method = method
        recharge.status = 'success'
        recharge.transaction_id = generate_transaction_id()   # ── NEW ──
        recharge.save(update_fields=['razorpay_payment_id', 'payment_method', 'status', 'transaction_id'])

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        wallet.balance_coins += recharge.coins_credited
        wallet.save(update_fields=['balance_coins'])

        return Response({
            'status': 'success',
            'coins_credited': recharge.coins_credited,
            'balance_coins': wallet.balance_coins,
        })

class RechargeHistoryView(APIView):
    """Full paginated recharge + commission history — GPay mari, Today/Month/6Month/Custom filter
    + page by page load pannurom (delete pannradhu illa)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = _recharge_period_queryset(request.user, period, start_date, end_date).select_related('related_order__user')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


class RechargeStatementView(APIView):
    """Selected filter (today/month/6month/custom) padi PDF statement generate pannum."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = _recharge_period_queryset(request.user, period, start_date, end_date)

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("BitByte Wallet — Recharge Statement", styles['Title']))
        elements.append(Paragraph(f"Customer: {request.user.email}", styles['Normal']))
        elements.append(Paragraph(
            f"Generated on: {timezone.now().strftime('%d %b %Y, %I:%M %p')}", styles['Normal']
        ))
        elements.append(Spacer(1, 14))

        data = [['Date', 'Amount Paid', 'Coins Credited', 'Method', 'Status']]
        total_amount = 0
        total_coins = 0
        for r in qs:
            data.append([
                r.created_at.strftime('%d %b %Y'),
                f"Rs. {r.amount_paid}",
                str(r.coins_credited),
                r.get_payment_method_display(),
                r.get_status_display(),
            ])
            total_amount += float(r.amount_paid)
            total_coins += r.coins_credited

        if len(data) == 1:
            data.append(['-', '-', '-', '-', '-'])

        table = Table(data, colWidths=[80, 90, 100, 90, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#073B3F')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1DFDE')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F3F0')]),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 16))
        elements.append(Paragraph(f"<b>Total Spent:</b> Rs. {total_amount}", styles['Normal']))
        elements.append(Paragraph(f"<b>Total Coins Credited:</b> {total_coins}", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)

        filename = f"recharge-statement-{period}-{timezone.now().strftime('%Y%m%d')}.pdf"
        return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')


def _recharge_period_queryset(user, period, start_date=None, end_date=None):
    """Common filter logic — Today / Month / 6 Month / Custom date.
    WalletView, RechargeHistoryView, RechargeStatementView ella idhை than use pannum."""
    qs = CoinRecharge.objects.filter(user=user, status='success')
    today = timezone.now().date()

    if period == 'today':
        qs = qs.filter(created_at__date=today)
    elif period == 'month':
        month_start = today.replace(day=1)
        qs = qs.filter(created_at__date__gte=month_start, created_at__date__lte=today)
    elif period == '6month':
        six_months_ago = today - timedelta(days=180)
        qs = qs.filter(created_at__date__gte=six_months_ago, created_at__date__lte=today)
    elif period == 'custom' and start_date and end_date:
        qs = qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    # period == 'all' — no date filter, everything

    return qs.order_by('-created_at')


def _serialize_coin_entry(r):
    """CoinRecharge row ah — recharge/commission/debit edhuvaanalum, frontend ku
    same shape la anuppum (Recharge.jsx already idha expect pannuthu)."""
    entry = {
        'id': r.id,
        'type': {'recharge': 'recharge', 'commission': 'commission', 'purchase': 'debit'}.get(r.source, r.source),
        'direction': r.entry_type,
        'amount_paid': float(r.amount_paid),
        'coins_credited': r.coins_credited,
        'payment_method': r.payment_method,
        'source': None,
        'level': r.commission_level,
        'order_id': r.related_order.order_id if r.related_order else None,
        'transaction_id': r.transaction_id,   # ── NEW ──
        'created_at': r.created_at,
    }
    if r.source == 'commission' and r.related_order:
        buyer = r.related_order.user
        entry['source'] = get_user_profile_id(buyer) or buyer.email
    elif r.source == 'admin_credit' and r.entry_type == 'credit':
        entry['source'] = get_user_profile_id(r.user) or r.user.email
    return entry


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        today = timezone.now().date()

        # ── NEW: ella entry um (recharge/commission/debit) ஒரே table, ஒரே query ──
        history = CoinRecharge.objects.filter(
            user=request.user, status='success'
        ).select_related('related_order__user').order_by('-created_at')[:5]

        # ── "Today Recharged" — actual money recharge mattum (commission/debit illa) ──
        today_agg = CoinRecharge.objects.filter(
            user=request.user, status='success', source='recharge', created_at__date=today
        ).aggregate(coins=Sum('coins_credited'), amount=Sum('amount_paid'))

        lifetime_agg = CoinRecharge.objects.filter(
            user=request.user, status='success', source='recharge'
        ).aggregate(
            coins=Sum('coins_credited'),
            amount=Sum('amount_paid'),
            count=Count('id'),
        )

        return Response({
            'balance_coins': wallet.balance_coins,
            'today_coins': today_agg['coins'] or 0,
            'today_amount': float(today_agg['amount'] or 0),
            'total_spent': float(lifetime_agg['amount'] or 0),
            'total_coins_purchased': lifetime_agg['coins'] or 0,
            'total_recharge_count': lifetime_agg['count'] or 0,
            'history': [_serialize_coin_entry(r) for r in history],
        })


class PayWithCoinsView(APIView):
    """Customer AUG Coin balance vachi jewelry order pண்ணும் view.
    Order amount ku thevayana coins balance la irundha mattum proceed aagும்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        product_id = data.get('product_id')
        total_price = Decimal(str(data.get('total_price', 0)))

        if total_price <= 0:
            return Response({'error': 'Invalid order amount'}, status=400)

        coins_needed = int(total_price * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance_coins < coins_needed:
            return Response({
                'error': 'Insufficient AUG coins',
                'balance_coins': wallet.balance_coins,
                'coins_needed': coins_needed,
            }, status=400)

        try:
            product = JewelryProduct.objects.get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

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
            pincode=data.get('pincode', ''),
            address_line1=data.get('address_line1', ''),
            address_line2=data.get('address_line2', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            quantity=int(data.get('quantity', 1)),
            unit_price=float(data.get('unit_price', 0)),
            total_price=float(total_price),
            payment_method='wallet',   # ── FIX: AUG Coin mூlam pay pண்ணினа, "wallet" nு correct-a store pண்ணு ──
            payment_status='paid',
            status='confirmed',
        )

        # ── Coins deduct pண்ணு ──
        wallet.balance_coins -= coins_needed
        wallet.save(update_fields=['balance_coins'])

        # ── NEW: debit entry — history la "DEBIT" ah kaamikkanum, adhே CoinRecharge table la ──
        try:
            CoinRecharge.objects.create(
                user=request.user, amount_paid=total_price, coins_credited=coins_needed,
                payment_method='purchase', status='success',
                entry_type='debit', source='purchase',
                related_order=order,
            )
        except Exception as e:
            print(f'❌ Debit log FAILED for {request.user.email}:', repr(e))

        # ── Commission distribute pண்ணு (FIX: oru தடவை mattum call pண்ணு, rendு தடவை illa) ──
        try:
            distribute_commission(order)
        except Exception as e:
            print('❌ distribute_commission FAILED:', repr(e))

        return Response({
            'status': 'success',
            'order_id': order.order_id,
            'coins_used': coins_needed,
            'balance_coins': wallet.balance_coins,
        })


def _apply_period_filter(qs, period, start_date, end_date, date_field='created_at'):
    """Today/Month/6Month/Year/Custom — ella report kum share pண்ணும் common filter."""
    today = timezone.now().date()
    f = f'{date_field}__date'

    if period == 'today':
        qs = qs.filter(**{f: today})
    elif period == 'month':
        month_start = today.replace(day=1)
        qs = qs.filter(**{f'{f}__gte': month_start, f'{f}__lte': today})
    elif period == '6month':
        six_months_ago = today - timedelta(days=180)
        qs = qs.filter(**{f'{f}__gte': six_months_ago, f'{f}__lte': today})
    elif period == 'year':
        year_start = today.replace(month=1, day=1)
        qs = qs.filter(**{f'{f}__gte': year_start, f'{f}__lte': today})
    elif period == 'custom' and start_date and end_date:
        qs = qs.filter(**{f'{f}__gte': start_date, f'{f}__lte': end_date})

    return qs        


class PaymentsSummaryView(APIView):
    """Super Admin ku mattum — REAL payment revenue kaamikkum.
    Real money customer Recharge pண்ணும்போது than Razorpay mூlam varum (card/upi/netbanking).
    Order pண்ணும்போது coins spend aaguthu mattum — puthu money varadhu, adhala idhu
    CoinRecharge table (source='recharge') vachi than build pண்ணuறோm, JewelryOrder illa."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 15
        period = request.query_params.get('period', 'today')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # ── Real revenue = ella user (customer/promotor/etc) um Razorpay mூlam recharge pண்ணின paisa ──
        recharges_all = CoinRecharge.objects.filter(status='success', source='recharge')
        recharges_period = _apply_period_filter(recharges_all, period, start_date, end_date)

        total_revenue = recharges_period.aggregate(total=Sum('amount_paid'))['total'] or 0
        total_coins_sold = recharges_period.aggregate(total=Sum('coins_credited'))['total'] or 0

        # ── Chart — evllovadhu period select pண்ணினalum, kadaisi 6 months trend fixed-a kaamikkum ──
        six_months_ago = timezone.now().date() - timedelta(days=180)
        trend_qs = (
            recharges_all.filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('amount_paid'))
            .order_by('month')
        )
        monthly_trend = [
            {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
            for t in trend_qs
        ]

        txn_qs = recharges_period.select_related('user').order_by('-created_at')
        total_transactions = txn_qs.count()
        start = (page - 1) * page_size
        page_txns = txn_qs[start:start + page_size]

        return Response({
            'period': period,
            'total_revenue': float(total_revenue),
            'total_coins_sold': total_coins_sold,
            'total_transactions': total_transactions,
            'monthly_trend': monthly_trend,
            'page': page,
            'has_more': start + page_size < total_transactions,
            'transactions': [
                {
                    'transaction_id': r.transaction_id or r.razorpay_payment_id or '—',
                    'buyer': get_user_profile_id(r.user) or r.user.email,
                    'amount': float(r.amount_paid),
                    'coins': r.coins_credited,
                    'payment_method': r.payment_method,
                    'created_at': r.created_at,
                } for r in page_txns
            ],
        })


def _find_user_by_public_id(public_id):
    """Customer/Promotor/SubDealer/Dealer/Admin ID (BBCUS20260001 mாதிri) vачி User + Profile
    rendும் return pண்ணும் — name/phone Profile model la than irukku, User model la illa."""
    lookups = [
        (CustomerProfile, 'customer_id'),
        (PromotorProfile, 'promotor_id'),
        (SubDealerProfile, 'sub_dealer_id'),
        (DealerProfile, 'dealer_id'),
        (AdminProfile, 'admin_id'),
    ]
    for model, field in lookups:
        try:
            profile = model.objects.select_related('user').get(**{field: public_id})
            return profile.user, profile
        except model.DoesNotExist:
            continue
        except Exception:
            continue
    return None, None


class UserLookupView(APIView):
    """Super Admin ID type pண்ணும்போது, andha person-oda details + recent history fetch pண்ணும்."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        public_id = request.query_params.get('id', '').strip()
        if not public_id:
            return Response({'error': 'ID required'}, status=400)

        target_user, profile = _find_user_by_public_id(public_id)
        if not target_user:
            return Response({'error': 'No user found with this ID'}, status=404)

        # ── Name/phone Profile model la irundhu than fetch pண்ணрадhு, User model la illa ──
        first = getattr(profile, 'first_name', '') or ''
        last = getattr(profile, 'last_name', '') or ''
        name = f'{first} {last}'.strip() or target_user.email
        phone = (
            getattr(profile, 'phone', '') or getattr(profile, 'phone_number', '')
            or getattr(profile, 'mobile', '') or getattr(profile, 'mobile_number', '') or '—'
        )

        wallet, _ = Wallet.objects.get_or_create(user=target_user)
        history = CoinRecharge.objects.filter(
            user=target_user, status='success'
        ).select_related('related_order__user').order_by('-created_at')[:5]

        return Response({
            'user_pk': target_user.id,
            'public_id': public_id,
            'name': name,
            'email': target_user.email,
            'phone': phone,
            'role': target_user.role,
            'balance_coins': wallet.balance_coins,
            'recent_history': [_serialize_coin_entry(r) for r in history],
        })


class SendCoinsView(APIView):
    """Super Admin directly ஒரு user ku coins credit pண்ணும் — commission chain
    touch pண்ணadhu, idhu manual admin gift. Super Admin ku unlimited coins —
    swanth balance edhume check/deduct pண்ணadhu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        data = request.data
        user_pk = data.get('user_pk')
        try:
            amount = Decimal(str(data.get('amount', 0)))
        except Exception:
            return Response({'error': 'Invalid amount'}, status=400)

        if amount <= 0:
            return Response({'error': 'Enter a valid amount'}, status=400)

        try:
            target_user = User.objects.get(id=user_pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        coins = int(amount * COIN_RATE_PER_RUPEE)
        txn_id = generate_transaction_id()

        # ── Target user wallet ku credit pண்ணு — Super Admin balance touch pண்ணadhu ──
        target_wallet, _ = Wallet.objects.get_or_create(user=target_user)
        target_wallet.balance_coins += coins
        target_wallet.save(update_fields=['balance_coins'])
        CoinRecharge.objects.create(
            user=target_user, amount_paid=amount, coins_credited=coins,
            payment_method='admin', status='success',
            entry_type='credit', source='admin_credit',
            transaction_id=txn_id,
        )

        return Response({
            'status': 'success',
            'transaction_id': txn_id,
            'coins_sent': coins,
            'balance_coins': target_wallet.balance_coins,
        })


class AdminUserHistoryView(APIView):
    """Super Admin ku — edho oru target user oda full coin transaction history,
    paginated + period filter kூட (Recharge.jsx Transaction History mாтிри)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        user_pk = request.query_params.get('user_pk')
        try:
            target_user = User.objects.get(id=user_pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = CoinRecharge.objects.filter(user=target_user, status='success', source='admin_credit')
        qs = _apply_period_filter(qs, period, start_date, end_date)
        qs = qs.select_related('related_order__user').order_by('-created_at')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


class AdminSentHistoryView(APIView):
    """Super Admin ku — ID edhுவும் search pண்ணாthapothு default-a kaamikkும் view.
    Ella users-ku-um naan (super admin) kudutha coins (admin_credit) mattum, paginated."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')

        qs = CoinRecharge.objects.filter(status='success', source='admin_credit').select_related('user')
        qs = _apply_period_filter(qs, period, None, None)
        qs = qs.order_by('-created_at')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


# ── AUTOPAY / RECURRING MANDATE SYSTEM ──

def _next_occurrence(day):
    """Given day-of-month, return the next date this month/next month it falls on."""
    from datetime import date
    import calendar
    today = timezone.now().date()
    last_day_this_month = calendar.monthrange(today.year, today.month)[1]
    safe_day = min(day, last_day_this_month)
    candidate = today.replace(day=safe_day)
    if candidate <= today:
        # move to next month
        if today.month == 12:
            ny, nm = today.year + 1, 1
        else:
            ny, nm = today.year, today.month + 1
        last_day_next_month = calendar.monthrange(ny, nm)[1]
        safe_day = min(day, last_day_next_month)
        candidate = date(ny, nm, safe_day)
    return candidate


class AutoPayCreateView(APIView):
    """Autopay ON pண்ண — Razorpay Plan + Subscription create pண்ணி, frontend-ku
    subscription_id anuppுவோம். User idha vechi Razorpay checkout-la UPI mandate authorize pண்ணுவாரு."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        recharge_day = request.data.get('recharge_day')

        try:
            amount = float(amount)
            recharge_day = int(recharge_day)
        except (TypeError, ValueError):
            return Response({'error': 'Valid amount and recharge_day required'}, status=400)

        if amount <= 0 or not (1 <= recharge_day <= 31):
            return Response({'error': 'Invalid amount or day'}, status=400)

        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

            plan = client.plan.create({
                "period": "monthly",
                "interval": 1,
                "item": {
                    "name": f"BitByte Wallet Autopay ₹{amount}",
                    "amount": int(amount * 100),
                    "currency": "INR",
                }
            })

            next_date = _next_occurrence(recharge_day)
            start_at = int(timezone.datetime.combine(next_date, timezone.datetime.min.time()).timestamp())

            subscription = client.subscription.create({
                "plan_id": plan['id'],
                "customer_notify": 1,
                "total_count": 120,
                "start_at": start_at,
                "notes": {"user_id": str(request.user.id)},
            })

            mandate, _ = AutoPayMandate.objects.update_or_create(
                user=request.user,
                defaults={
                    'amount': amount,
                    'recharge_day': recharge_day,
                    'razorpay_plan_id': plan['id'],
                    'razorpay_subscription_id': subscription['id'],
                    'status': 'created',
                    'is_active': False,
                    'next_charge_date': next_date,
                }
            )

            return Response({
                'subscription_id': subscription['id'],
                'key': settings.RAZORPAY_KEY_ID,
                'amount': amount,
                'mandate_id': mandate.id,
            }, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


class AutoPayConfirmView(APIView):
    """Frontend-la user UPI mandate authorize pண்ணி Razorpay handler success aana odane
    idha call pண்ணி status update pண்ணும்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription_id = request.data.get('razorpay_subscription_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        try:
            mandate = AutoPayMandate.objects.get(user=request.user, razorpay_subscription_id=subscription_id)
        except AutoPayMandate.DoesNotExist:
            return Response({'error': 'Mandate not found'}, status=404)

        body = payment_id + "|" + subscription_id
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
        ).hexdigest()
        if expected_sig != signature:
            return Response({'error': 'Invalid signature'}, status=400)

        mandate.status = 'active'
        mandate.is_active = True
        mandate.save(update_fields=['status', 'is_active'])

        return Response({'message': 'Autopay enabled successfully!', 'status': mandate.status})


class AutoPayStatusView(APIView):
    """Current user oda autopay mandate fetch pண்ணும் (button/modal state ku)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mandate = AutoPayMandate.objects.filter(user=request.user).first()
        if not mandate:
            return Response({'exists': False})
        return Response({'exists': True, **AutoPayMandateSerializer(mandate).data})


class AutoPayToggleView(APIView):
    """ON → resume pண்ணும். OFF → pause pண்ணும். Razorpay API mூலம்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action')   # 'on' or 'off'
        try:
            mandate = AutoPayMandate.objects.get(user=request.user)
        except AutoPayMandate.DoesNotExist:
            return Response({'error': 'No autopay mandate found'}, status=404)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        if action == 'off':
            client.subscription.pause(mandate.razorpay_subscription_id, {"pause_at": "now"})
            mandate.status = 'paused'
            mandate.is_active = False
        elif action == 'on':
            client.subscription.resume(mandate.razorpay_subscription_id, {"resume_at": "now"})
            mandate.status = 'active'
            mandate.is_active = True
        else:
            return Response({'error': 'action must be on or off'}, status=400)

        mandate.save(update_fields=['status', 'is_active'])
        return Response({'message': f'Autopay turned {action}', 'status': mandate.status})


@api_view(['POST'])
@permission_classes([AllowAny])
def autopay_webhook(request):
    """Razorpay webhook — subscription.charged event vந்தா wallet ku coins credit pண்ணும்.
    Razorpay Dashboard la webhook URL: https://yourdomain.com/api/autopay/webhook/
    Event: subscription.charged"""
    payload = request.body
    signature = request.headers.get('X-Razorpay-Signature', '')

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        client.utility.verify_webhook_signature(
            payload.decode(), signature, settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception:
        return Response({'error': 'Invalid webhook signature'}, status=400)

    data = request.data
    event = data.get('event')

    if event == 'subscription.charged':
        sub_entity = data['payload']['subscription']['entity']
        payment_entity = data['payload']['payment']['entity']
        subscription_id = sub_entity['id']

        try:
            mandate = AutoPayMandate.objects.get(razorpay_subscription_id=subscription_id)
        except AutoPayMandate.DoesNotExist:
            return Response({'status': 'ignored'})

        amount = Decimal(payment_entity['amount']) / 100
        coins = int(amount * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=mandate.user)
        wallet.balance_coins += coins
        wallet.save(update_fields=['balance_coins'])

        CoinRecharge.objects.create(
            user=mandate.user, amount_paid=amount, coins_credited=coins,
            payment_method='upi', status='success',
            entry_type='credit', source='recharge',
            razorpay_payment_id=payment_entity['id'],
            transaction_id=generate_transaction_id(),
        )

        mandate.next_charge_date = _next_occurrence(mandate.recharge_day)
        mandate.save(update_fields=['next_charge_date'])

    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({'status': 'ok'})
from rest_framework import serializers
from .models import User, AdminProfile, DealerProfile, SubDealerProfile, PromotorProfile, CustomerProfile, ShopProfile, Announcement, AnnouncementReply, ProfileUpdateRequest, MetalRate, MetalOrder,JewelryProduct, JewelryProductImage, HomeBanner, CartItem, Wishlist, JewelryOrder, CoinRequest, CoinRequestItem, CoinStock, Wallet, CoinRecharge, AutoPayMandate , StockNotifyRequest

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class AdminProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = AdminProfile
        fields = [
           'id', 'email', 'password', 'initial', 'first_name', 'last_name', 'mobile_number',
           'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            # auto-generated — read only
            'admin_name', 'admin_id', 'admin_contact_no'
        ]
        read_only_fields = ['admin_name', 'admin_id', 'admin_contact_no']


    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='admin')
        profile = AdminProfile.objects.create(
            user=user,
            created_by=request.user if request.user.is_authenticated else None,
            **validated_data
        )
        return profile

class AdminListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)   # ← NEW

    class Meta:
        model = AdminProfile
        fields = [
            'id', 'user_id', 'first_name', 'last_name', 'admin_name',
            'email', 'mobile_number', 'admin_id', 'admin_contact_no', 'city_name',
            'dob', 'anniversary_date'
        ]


# ✅ Dealer (Admin creates this)
class DealerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    assigned_admin_id = serializers.IntegerField(write_only=True, required=False)

    admin_name = serializers.CharField(source='assigned_admin.admin_name', read_only=True)
    admin_uid = serializers.CharField(source='assigned_admin.admin_id', read_only=True)
    admin_contact = serializers.CharField(source='assigned_admin.admin_contact_no', read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            'id', 'email', 'password', 'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no','street_name', 'town_name', 'city_name','pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            'assigned_admin_id',
            'admin_name', 'admin_uid', 'admin_contact',
            'dealer_name', 'dealer_id', 'dealer_contact_no', 'created_at'
        ]
        read_only_fields = ['dealer_id', 'created_at', 'admin_name', 'admin_uid', 'admin_contact']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        admin_id = validated_data.pop('assigned_admin_id', None)
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='dealer')

        assigned_admin = None
        if admin_id:
            try:
                assigned_admin = AdminProfile.objects.get(id=admin_id)
            except AdminProfile.DoesNotExist:
                pass

        profile = DealerProfile.objects.create(
            user=user,
            created_by=request.user,
            assigned_admin=assigned_admin,
            **validated_data
        )
        return profile

class DealerListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)   # ← NEW
    assigned_admin_id = serializers.IntegerField(source='assigned_admin.id', read_only=True)
    admin_name = serializers.CharField(source='assigned_admin.first_name', read_only=True)
    admin_uid = serializers.CharField(source='assigned_admin.admin_id', read_only=True)
    admin_contact = serializers.CharField(source='assigned_admin.mobile_number', read_only=True)
    admin_city = serializers.CharField(source='assigned_admin.city_name', read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            'id', 'user_id', 'dealer_id', 'first_name', 'last_name', 'email', 'mobile_number',
            'city_name', 'created_at',
            'dob', 'anniversary_date',
            'assigned_admin_id', 'admin_name', 'admin_uid',
            'admin_contact', 'admin_city'
        ]

# ✅ Sub Dealer (Dealer creates this)
class SubDealerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    assigned_dealer_id = serializers.IntegerField(write_only=True, required=False)

    dealer_name = serializers.CharField(source='assigned_dealer.dealer_name', read_only=True)
    dealer_uid = serializers.CharField(source='assigned_dealer.dealer_id', read_only=True)
    dealer_contact = serializers.CharField(source='assigned_dealer.dealer_contact_no', read_only=True)

    class Meta:
        model = SubDealerProfile
        fields = [
            'id', 'email', 'password', 'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            'assigned_dealer_id',
            'dealer_name', 'dealer_uid', 'dealer_contact',
            'sub_dealer_id', 'created_at'
        ]
        read_only_fields = ['sub_dealer_id', 'created_at', 'dealer_name', 'dealer_uid', 'dealer_contact']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        dealer_id = validated_data.pop('assigned_dealer_id', None)
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='sub_dealer')

        assigned_dealer = None
        if dealer_id:
            try:
                assigned_dealer = DealerProfile.objects.get(id=dealer_id)
            except DealerProfile.DoesNotExist:
                pass

        profile = SubDealerProfile.objects.create(
            user=user,
            created_by=request.user,
            assigned_dealer=assigned_dealer,
            **validated_data
        )
        return profile

# In serializers.py, replace SubDealerListSerializer with:
class SubDealerListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)   # ← NEW
    assigned_dealer_id = serializers.IntegerField(source='assigned_dealer.id', read_only=True)
    dealer_name = serializers.CharField(source='assigned_dealer.dealer_name', read_only=True)
    dealer_contact = serializers.CharField(source='assigned_dealer.mobile_number', read_only=True)
    dealer_city = serializers.CharField(source='assigned_dealer.city_name', read_only=True)
    
    class Meta:
        model = SubDealerProfile
        fields = [
            'id', 'user_id', 'sub_dealer_id', 'first_name', 'last_name', 
            'email', 'mobile_number', 'city_name', 'created_at',
            'dob', 'anniversary_date',
            'assigned_dealer_id', 'dealer_name', 'dealer_contact', 'dealer_city'
        ]


class PromotorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    assigned_sub_dealer_id = serializers.IntegerField(write_only=True, required=False)

    sub_dealer_name = serializers.SerializerMethodField(read_only=True)
    sub_dealer_uid = serializers.CharField(source='assigned_sub_dealer.sub_dealer_id', read_only=True)
    sub_dealer_contact = serializers.CharField(
    source='assigned_sub_dealer.mobile_number',
    read_only=True,
    default=''
)
    class Meta:
        model = PromotorProfile
        fields = [
            'id', 'email', 'password', 'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            'assigned_sub_dealer_id',
            'sub_dealer_name', 'sub_dealer_uid', 'sub_dealer_contact',
            'promotor_name', 'promotor_id', 'promotor_contact_no', 'created_at'
        ]
        read_only_fields = ['promotor_id', 'created_at']

    def get_sub_dealer_name(self, obj):
        if obj.assigned_sub_dealer:
            return obj.assigned_sub_dealer.first_name
        return None

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        sub_dealer_id = validated_data.pop('assigned_sub_dealer_id', None)
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='promotor')

        assigned_sub_dealer = None
        if sub_dealer_id:
            try:
                assigned_sub_dealer = SubDealerProfile.objects.get(id=sub_dealer_id)
            except SubDealerProfile.DoesNotExist:
                pass

        profile = PromotorProfile.objects.create(
            user=user,
            created_by=request.user,
            assigned_sub_dealer=assigned_sub_dealer,
            **validated_data
        )
        return profile

class PromotorListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)   # ← NEW

    assigned_sub_dealer_id = serializers.IntegerField(
        source='assigned_sub_dealer.id', read_only=True
    )
    dealer_id = serializers.IntegerField(
        source='assigned_sub_dealer.assigned_dealer.id',
        read_only=True
    )
    admin_id = serializers.IntegerField(
        source='assigned_sub_dealer.assigned_dealer.assigned_admin.id',
        read_only=True
    )

    class Meta:
        model = PromotorProfile
        fields = [
            'id', 'user_id', 'promotor_id', 'first_name', 'last_name',
            'email', 'mobile_number', 'city_name', 'created_at',
            'dob', 'anniversary_date',
            'assigned_sub_dealer_id',
            'dealer_id',
            'admin_id',
        ]

class CustomerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    assigned_promotor_id = serializers.IntegerField(write_only=True, required=False)

    promotor_name = serializers.SerializerMethodField(read_only=True)
    promotor_uid = serializers.CharField(source='assigned_promotor.promotor_id', read_only=True)
    promotor_contact = serializers.CharField(source='assigned_promotor.promotor_contact_no', read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'email', 'password', 'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            'assigned_promotor_id',
            'promotor_name', 'promotor_uid', 'promotor_contact',
            'customer_id', 'created_at'
        ]
        read_only_fields = ['customer_id', 'created_at']

    def get_promotor_name(self, obj):
        if obj.assigned_promotor:
            return f"{obj.assigned_promotor.first_name} {obj.assigned_promotor.last_name}"
        return None

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        promotor_id = validated_data.pop('assigned_promotor_id', None)
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='customer')

        assigned_promotor = None
        if promotor_id:
            try:
                assigned_promotor = PromotorProfile.objects.get(id=promotor_id)
            except PromotorProfile.DoesNotExist:
                pass

        profile = CustomerProfile.objects.create(
            user=user,
            created_by=request.user,
            assigned_promotor=assigned_promotor,
            **validated_data
        )
        return profile

class CustomerListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)   # ← NEW
    assigned_promotor_id = serializers.IntegerField(
        source='assigned_promotor.id', read_only=True
    )

    class Meta:
        model = CustomerProfile
        fields = ['id', 'user_id', 'customer_id', 'first_name', 'last_name', 'email', 
                  'mobile_number', 'city_name', 'created_at',
                  'dob', 'anniversary_date',
                  'assigned_promotor_id']

class ShopProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = ShopProfile
        fields = [
            'id', 'email', 'password', 'shop_name', 'owner_name',
            'mobile_number', 'whatsapp_number',
            'shop_address', 'pincode', 'street_name', 'city', 'district', 'state',
            'shop_type', 'pan_no', 'gst_no', 'msme_no',
            'shop_id', 'created_at'
        ]
        read_only_fields = ['shop_id', 'created_at']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        request = self.context.get('request')
        user = User.objects.create_user(email=email, password=password, role='shop')
        profile = ShopProfile.objects.create(
            user=user,
            created_by=request.user if request.user.is_authenticated else None,
            **validated_data
        )
        return profile


class ShopListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = ShopProfile
        fields = [
            'id', 'user_id', 'shop_id', 'shop_name', 'owner_name',
            'email', 'mobile_number', 'whatsapp_number',
            'city', 'district', 'state', 'shop_type', 'created_at'
        ]

class ShopSelfSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ShopProfile
        fields = [
            'id', 'shop_id', 'email', 'shop_name', 'owner_name',
            'mobile_number', 'whatsapp_number',
            'shop_address', 'pincode', 'street_name', 'city', 'district', 'state',
            'shop_type', 'pan_no', 'gst_no', 'msme_no', 'created_at'
        ]
        read_only_fields = ['shop_id', 'created_at', 'email']
                
class AnnouncementSerializer(serializers.ModelSerializer):
    target_user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    target_user_email = serializers.EmailField(source='target_user.email', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'message', 'target_roles', 'target_user', 'target_user_email', 'created_at', 'is_active']



class AnnouncementReplySerializer(serializers.ModelSerializer):
    replied_by_email = serializers.EmailField(source='replied_by.email', read_only=True)
    replied_by_role  = serializers.CharField(source='replied_by.role',  read_only=True)
    replied_by_name  = serializers.SerializerMethodField()

    class Meta:
        model  = AnnouncementReply
        fields = ['id', 'message', 'replied_by_email', 'replied_by_role',
                  'replied_by_name', 'created_at']

    def get_replied_by_name(self, obj):
        user = obj.replied_by
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
                return f"{p.first_name} {p.last_name} ({getattr(p, id_field)})"
        except Exception:
            pass
        return user.email

class ProfileUpdateRequestSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='user.role', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ProfileUpdateRequest
        fields = [
            'id', 'user', 'role', 'email', 'initial',
            'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
            'message', 'proof_document',
            'status', 'created_at'
        ]
        read_only_fields = ['user', 'status', 'created_at']

class MetalRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetalRate
        fields = ['id', 'date', 'gold_22k', 'gold_24k', 'silver_999','diamond_18k', 'diamond_22k','platinum_92', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class MetalOrderSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    customer_id = serializers.SerializerMethodField()

    class Meta:
        model = MetalOrder
        fields = [
            'id', 'email', 'customer_id', 'metal_type',
            'weight_label', 'weight_grams', 'count',
            'rate_per_gram', 'unit_price', 'total_amount',
            'status', 'created_at'
        ]
        read_only_fields = ['user', 'status', 'created_at']

    def get_customer_id(self, obj):
        try:
            return obj.user.customer_profile.customer_id
        except Exception:
            return None                




class JewelryProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JewelryProductImage
        fields = ['id', 'image', 'order']

class JewelryProductSerializer(serializers.ModelSerializer):
    images = JewelryProductImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    # ── NEW: computed field — frontend badge ku use pannalam ──
    stock_status = serializers.SerializerMethodField()

    class Meta:    # ← 4 spaces — CORRECT
        model = JewelryProduct
        fields = [
            'id', 'product_code', 'category', 'metal', 'grade', 'name', 'description',
            'cross_weight', 'stone_weight', 'net_weight',
            'making_charge','wastage_charge', 'stone_value', 'tax_percent',
            'price', 'original_price', 'tag', 'occasion', 'wedding_category', 'gender', 'is_active',
            'stock_quantity', 'low_stock_threshold', 'stock_status',
            'created_at', 'images', 'uploaded_images'
        ]
        read_only_fields = ['created_at', 'product_code']

    def get_stock_status(self, obj):
        if obj.stock_quantity <= 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= obj.low_stock_threshold:
            return 'low_stock'
        return 'in_stock'
        
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        request = self.context.get('request')
        product = JewelryProduct.objects.create(
            created_by=request.user,
            **validated_data
        )
        for i, img in enumerate(uploaded_images):
            JewelryProductImage.objects.create(product=product, image=img, order=i)
        return product            

class StockNotifyRequestSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_role = serializers.CharField(source='user.role', read_only=True)
    customer_id_str = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    product_stock = serializers.IntegerField(source='product.stock_quantity', read_only=True)

    class Meta:
        model = StockNotifyRequest
        fields = ['id', 'product', 'product_name', 'product_code', 'product_stock',
                  'customer_email', 'customer_role', 'customer_id_str', 'notified', 'created_at']
        read_only_fields = ['created_at', 'notified']

    def get_customer_id_str(self, obj):
        try:
            role_map = {
                'customer': ('customer_profile', 'customer_id'),
                'promotor': ('promotor_profile', 'promotor_id'),
                'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
                'dealer': ('dealer_profile', 'dealer_id'),
                'admin': ('admin_profile', 'admin_id'),
            }
            if obj.user.role in role_map:
                attr, field = role_map[obj.user.role]
                p = getattr(obj.user, attr)
                return getattr(p, field)
        except Exception:
            pass
        return None

class HomeBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeBanner
        fields = ['id', 'slot', 'image', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    product_price = serializers.DecimalField(
        source='product.price', max_digits=12, decimal_places=2, read_only=True
    )
    product_metal = serializers.CharField(source='product.metal', read_only=True)
    product_category = serializers.CharField(source='product.category', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'product_price', 'product_metal', 'product_category', 'qty', 'added_at'
        ]
        read_only_fields = ['added_at']

    def get_product_image(self, obj):
        request = self.context.get('request')
        first_image = obj.product.images.first()
        if first_image and request:
            return request.build_absolute_uri(first_image.image.url)
        return None               


class WishlistItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    product_price = serializers.DecimalField(source='product.price', max_digits=12, decimal_places=2, read_only=True)
    product_metal = serializers.CharField(source='product.metal', read_only=True)
    product_category = serializers.CharField(source='product.category', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product_id', 'product_name', 'product_image', 'product_price', 'product_metal', 'product_category', 'added_at']
        read_only_fields = ['added_at']

    def get_product_image(self, obj):
        request = self.context.get('request')
        first_image = obj.product.images.first()
        if first_image and request:
            return request.build_absolute_uri(first_image.image.url)
        return None

class JewelryOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_role = serializers.CharField(source='user.role', read_only=True)
    customer_id_str = serializers.SerializerMethodField()

    class Meta:
        model = JewelryOrder
        fields = [
            'id', 'order_id', 'customer_email', 'customer_role', 'customer_id_str',
            'product', 'product_name', 'product_metal', 'product_grade',
            'product_category', 'product_image_url',
            'customer_name', 'customer_phone', 'customer_alt_phone',
            'customer_dob', 'customer_anniversary',
            'pincode', 'address_line1', 'address_line2', 'city', 'state',
            'quantity', 'unit_price', 'total_price',
            'payment_method', 'payment_status', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_id', 'created_at', 'updated_at']

    def get_customer_id_str(self, obj):
        try:
            role_map = {
                'customer': ('customer_profile', 'customer_id'),
                'promotor': ('promotor_profile', 'promotor_id'),
            }
            if obj.user.role in role_map:
                attr, field = role_map[obj.user.role]
                p = getattr(obj.user, attr)
                return getattr(p, field)
        except Exception:
            pass
        return None


class CoinRequestItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinRequestItem
        fields = ['id', 'metal_type', 'weight_label', 'weight_grams', 'qty']


class CoinRequestSerializer(serializers.ModelSerializer):
    items = CoinRequestItemSerializer(many=True)
    requested_by_email = serializers.EmailField(source='requested_by.email', read_only=True)
    requested_by_id_str = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    requested_by_phone = serializers.SerializerMethodField()
    requested_by_role = serializers.CharField(source='requested_by.role', read_only=True)

    class Meta:
        model = CoinRequest
        fields = ['id', 'requested_by', 'requested_by_email', 'requested_by_id_str',
                  'requested_by_name', 'requested_by_phone', 'requested_by_role',
                  'requested_to', 'status', 'reject_reason', 'items', 'created_at', 'sent_at']
        read_only_fields = ['requested_by', 'requested_to', 'status', 'reject_reason', 'created_at', 'sent_at']

    def _get_profile(self, obj):
        role_map = {
            'promotor': 'promotor_profile',
            'sub_dealer': 'sub_dealer_profile',
            'dealer': 'dealer_profile',
            'admin': 'admin_profile',
        }
        attr = role_map.get(obj.requested_by.role)
        if not attr:
            return None
        try:
            return getattr(obj.requested_by, attr)
        except Exception:
            return None

    def get_requested_by_id_str(self, obj):
        role_id_field = {
            'promotor': 'promotor_id',
            'sub_dealer': 'sub_dealer_id',
            'dealer': 'dealer_id',
            'admin': 'admin_id',
        }
        p = self._get_profile(obj)
        field = role_id_field.get(obj.requested_by.role)
        if p and field:
            return getattr(p, field, None)
        return None

    def get_requested_by_name(self, obj):
        p = self._get_profile(obj)
        if p:
            return f"{p.first_name} {p.last_name or ''}".strip()
        return None

    def get_requested_by_phone(self, obj):
        p = self._get_profile(obj)
        if p:
            return getattr(p, 'mobile_number', None)
        return None

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        req = CoinRequest.objects.create(**validated_data)
        for item in items_data:
            CoinRequestItem.objects.create(request=req, **item)
        return req


class CoinStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinStock
        fields = ['id', 'metal_type', 'weight_label', 'weight_grams', 'qty']


class CoinRechargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinRecharge
        fields = ['id', 'amount_paid', 'coins_credited', 'payment_method', 'status', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance_coins', 'updated_at']

class AutoPayMandateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutoPayMandate
        fields = [
            'id', 'amount', 'recharge_day', 'status', 'is_active',
            'next_charge_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'is_active', 'next_charge_date', 'created_at', 'updated_at']        
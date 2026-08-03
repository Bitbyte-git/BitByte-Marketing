from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('role', 'super_admin')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)

ROLE_CHOICES = [
    ('super_admin', 'Super Admin'),
    ('admin', 'Admin'),
    ('dealer', 'Dealer'),         # NEW
    ('sub_dealer', 'Sub Dealer'), # NEW
    ('promotor', 'Promotor'),   # NEW
    ('customer', 'Customer'),   # NEW

]

OCCUPATION_CHOICES = [
    ('employee', 'Employee'),
    ('business', 'Business'),
    ('others', 'Others'),
]

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='dealer')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return self.email

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_admins')

    # ✅ CHANGED: name → initial + first_name + last_name
    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=10)
    gender = models.CharField(
    max_length=10,
    choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
    blank=True
    )
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(
    max_length=10,
    choices=[('single', 'Single'), ('married', 'Married'), ('other', 'Other')],
    default='single'
    )
    anniversary_date = models.DateField(null=True, blank=True)

    door_no = models.CharField(max_length=25)
    street_name = models.CharField(max_length=100)
    town_name = models.CharField(max_length=100)
    city_name = models.CharField(max_length=25)
    district = models.CharField(max_length=25)
    state = models.CharField(max_length=25)

    aadhaar_no = models.CharField(max_length=12)
    pan_no = models.CharField(max_length=25)

    occupation = models.CharField(max_length=20, choices=OCCUPATION_CHOICES)
    occupation_detail = models.CharField(max_length=25, blank=True)
    annual_salary = models.CharField(max_length=10)

    # ✅ AUTO-GENERATED fields (not from form)
    admin_name = models.CharField(max_length=100, blank=True)       # = first_name
    admin_id = models.CharField(max_length=25, unique=True, blank=True)  # BBADM20261001
    admin_contact_no = models.CharField(max_length=10, blank=True)  # = mobile_number

    def save(self, *args, **kwargs):
        # Auto-set admin_name from first_name
        if not self.admin_name:
            self.admin_name = self.first_name

        # Auto-set admin_contact_no from mobile_number
        if not self.admin_contact_no:
            self.admin_contact_no = self.mobile_number

        # Auto-generate admin_id: BBADM{year}{1001, 1002, ...}
        if not self.admin_id:
            from django.utils import timezone
            year = timezone.now().year
            count = AdminProfile.objects.count() + 1
            self.admin_id = f"BBADM{year}{1000 + count:04d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


# ✅ Dealer (created by Admin) — replaces old CustomerProfile
class DealerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dealer_profile')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_dealers')

    assigned_admin = models.ForeignKey(
        'AdminProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_dealers'
    )

    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=10)
    gender = models.CharField(
    max_length=10,
    choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
    blank=True
    )
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(
    max_length=10,
    choices=[('single', 'Single'), ('married', 'Married'), ('other', 'Other')],
    default='single'
    )
    anniversary_date = models.DateField(null=True, blank=True)
    door_no = models.CharField(max_length=25, blank=True, null=True)
    street_name = models.CharField(max_length=100, blank=True, null=True)
    town_name = models.CharField(max_length=100, blank=True, null=True)
    city_name = models.CharField(max_length=25, blank=True, null=True)
    district = models.CharField(max_length=25, blank=True, null=True)
    state = models.CharField(max_length=25, blank=True, null=True)

    aadhaar_no = models.CharField(max_length=12, blank=True, null=True)
    pan_no = models.CharField(max_length=10, blank=True, null=True)

    occupation = models.CharField(max_length=20, choices=OCCUPATION_CHOICES, blank=True, null=True)
    occupation_detail = models.CharField(max_length=25, blank=True, null=True)
    annual_salary = models.CharField(max_length=10, blank=True, null=True)

    dealer_name = models.CharField(max_length=50, blank=True)
    dealer_id = models.CharField(max_length=20, unique=True, blank=True)
    dealer_contact_no = models.CharField(max_length=10, blank=True)

    SUPER_STOCKIST_STATUS_CHOICES = [
        ('none', 'Not Eligible'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    super_stockist_status = models.CharField(max_length=10, choices=SUPER_STOCKIST_STATUS_CHOICES, default='none')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.dealer_name:
            self.dealer_name = self.first_name
        if not self.dealer_contact_no:
            self.dealer_contact_no = self.mobile_number
        if not self.dealer_id:
            from django.utils import timezone
            year = timezone.now().year
            count = DealerProfile.objects.count() + 1
            self.dealer_id = f"BBDL{year}{count:07d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


# ✅ Sub Dealer (created by Dealer)
class SubDealerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='sub_dealer_profile')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sub_dealers')

    assigned_dealer = models.ForeignKey(
        'DealerProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_sub_dealers'
    )

    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=10)
    gender = models.CharField(
    max_length=10,
    choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
    blank=True
    )
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(
    max_length=10,
    choices=[('single', 'Single'), ('married', 'Married'), ('other', 'Other')],
    default='single'
    )
    anniversary_date = models.DateField(null=True, blank=True)
    door_no = models.CharField(max_length=25, blank=True, null=True)
    street_name = models.CharField(max_length=100, blank=True, null=True)
    town_name = models.CharField(max_length=100, blank=True, null=True)
    city_name = models.CharField(max_length=25, blank=True, null=True)
    district = models.CharField(max_length=25, blank=True, null=True)
    state = models.CharField(max_length=25, blank=True, null=True)

    aadhaar_no = models.CharField(max_length=12, blank=True, null=True)
    pan_no = models.CharField(max_length=10, blank=True, null=True)

    occupation = models.CharField(max_length=20, choices=OCCUPATION_CHOICES, blank=True, null=True)
    occupation_detail = models.CharField(max_length=25, blank=True, null=True)
    annual_salary = models.CharField(max_length=10, blank=True, null=True)

    sub_dealer_id = models.CharField(max_length=20, unique=True, blank=True)

    DISTRIBUTOR_STATUS_CHOICES = [
        ('none', 'Not Eligible'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    distributor_status = models.CharField(max_length=10, choices=DISTRIBUTOR_STATUS_CHOICES, default='none')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.sub_dealer_id:
            from django.utils import timezone
            year = timezone.now().year
            count = SubDealerProfile.objects.count() + 1
            self.sub_dealer_id = f"BBSDL{year}{count:07d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# ✅ Promotor (created by Sub Dealer)
class PromotorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='promotor_profile')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_promotors')

    assigned_sub_dealer = models.ForeignKey(
        'SubDealerProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_promotors'
    )

    # Personal Info
    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=10)
    gender = models.CharField(
    max_length=10,
    choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
    blank=True
    )
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(
    max_length=10,
    choices=[('single', 'Single'), ('married', 'Married'), ('other', 'Other')],
    default='single'
    )
    anniversary_date = models.DateField(null=True, blank=True)
    # Address
    door_no = models.CharField(max_length=25, blank=True, null=True)
    street_name = models.CharField(max_length=100, blank=True, null=True)
    town_name = models.CharField(max_length=100, blank=True, null=True)
    city_name = models.CharField(max_length=25, blank=True, null=True)
    district = models.CharField(max_length=25, blank=True, null=True)
    state = models.CharField(max_length=25, blank=True, null=True)

    # Identity
    aadhaar_no = models.CharField(max_length=12, blank=True, null=True)
    pan_no = models.CharField(max_length=10, blank=True, null=True)

    # Occupation
    occupation = models.CharField(max_length=20, choices=OCCUPATION_CHOICES, blank=True, null=True)
    occupation_detail = models.CharField(max_length=25, blank=True, null=True)
    annual_salary = models.CharField(max_length=10, blank=True, null=True)

    # Promotor Info
    promotor_name = models.CharField(max_length=50, blank=True)
    promotor_id = models.CharField(max_length=20, unique=True, blank=True)
    promotor_contact_no = models.CharField(max_length=10, blank=True)

    WHOLESALE_STATUS_CHOICES = [
        ('none', 'Not Eligible'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    wholesale_status = models.CharField(max_length=10, choices=WHOLESALE_STATUS_CHOICES, default='none')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.promotor_id:
            from django.utils import timezone
            year = timezone.now().year
            count = PromotorProfile.objects.count() + 1
            self.promotor_id = f"BBPRO{year}{count:07d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


# ✅ Customer (created by Promotor)
class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_customers')

    assigned_promotor = models.ForeignKey(
        'PromotorProfile',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_customers'
    )

    # Personal Info
    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=10)
    gender = models.CharField(
    max_length=10,
    choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
    blank=True
    )
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(
    max_length=10,
    choices=[('single', 'Single'), ('married', 'Married'), ('other', 'Other')],
    default='single'
    )
    anniversary_date = models.DateField(null=True, blank=True)
    # Address
    door_no = models.CharField(max_length=25, blank=True, null=True)
    street_name = models.CharField(max_length=100, blank=True, null=True)
    town_name = models.CharField(max_length=100, blank=True, null=True)
    city_name = models.CharField(max_length=25, blank=True, null=True)
    district = models.CharField(max_length=25, blank=True, null=True)
    state = models.CharField(max_length=25, blank=True, null=True)

    # Identity
    aadhaar_no = models.CharField(max_length=12, blank=True, null=True)
    pan_no = models.CharField(max_length=10, blank=True, null=True)

    # Occupation
    occupation = models.CharField(max_length=20, choices=OCCUPATION_CHOICES, blank=True, null=True)
    occupation_detail = models.CharField(max_length=25, blank=True, null=True)
    annual_salary = models.CharField(max_length=10, blank=True, null=True)

    # Customer Info
    customer_id = models.CharField(max_length=20, unique=True, blank=True)

    # ── NEW: Retailer promotion tracking ──
    RETAILER_STATUS_CHOICES = [
        ('none', 'Not Eligible'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    retailer_status = models.CharField(max_length=10, choices=RETAILER_STATUS_CHOICES, default='none')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.customer_id:
            from django.utils import timezone
            year = timezone.now().year
            count = CustomerProfile.objects.count() + 1
            self.customer_id = f"BBCUS{year}{count:07d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Announcement(models.Model):
    TARGET_ROLES = [
        ('admin', 'Admin'),
        ('dealer', 'Dealer'),
        ('sub_dealer', 'Sub Dealer'),
        ('promotor', 'Promotor'),
        ('customer', 'Customer'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    target_roles = models.JSONField(default=list)   # ["admin","dealer"] etc.
    target_user = models.ForeignKey(                # ← NEW: personal message-ku
        User, on_delete=models.CASCADE, null=True, blank=True,
        related_name='personal_announcements'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title        

class AnnouncementReply(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name='replies'
    )
    replied_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='announcement_replies'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['announcement', 'replied_by']  # one reply per user

    def __str__(self):
        return f"{self.replied_by.email} → {self.announcement.title}"
    

class ProfileUpdateRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='profile_update_requests')
    initial = models.CharField(max_length=5, blank=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    mobile_number = models.CharField(max_length=10, blank=True)

    gender = models.CharField(max_length=10, blank=True)
    dob = models.DateField(null=True, blank=True)
    married_status = models.CharField(max_length=10, blank=True)
    anniversary_date = models.DateField(null=True, blank=True)

    door_no = models.CharField(max_length=25, blank=True)
    street_name = models.CharField(max_length=100, blank=True)
    town_name = models.CharField(max_length=100, blank=True)
    city_name = models.CharField(max_length=25, blank=True)
    district = models.CharField(max_length=25, blank=True)
    state = models.CharField(max_length=25, blank=True)

    aadhaar_no = models.CharField(max_length=12, blank=True)
    pan_no = models.CharField(max_length=25, blank=True)

    occupation = models.CharField(max_length=20, blank=True)
    occupation_detail = models.CharField(max_length=25, blank=True)
    annual_salary = models.CharField(max_length=10, blank=True)

    message = models.TextField(blank=True)
    proof_document = models.FileField(upload_to='profile_update_proofs/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.status}"

class MetalRate(models.Model):
    date = models.DateField(unique=True)
    gold_22k = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gold_24k = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    silver_999 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    diamond_18k = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    diamond_22k = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    platinum_92 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date} | 22K={self.gold_22k} | 24K={self.gold_24k} | Ag={self.silver_999}"

class MetalOrder(models.Model):
    METAL_CHOICES = [
        ('gold_22k', 'Gold 22K'),
        ('gold_24k', 'Gold 24K'),
        ('silver_999', 'Silver 999'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='metal_orders')
    metal_type = models.CharField(max_length=20, choices=METAL_CHOICES)
    weight_label = models.CharField(max_length=20)       # "200 mg", "1 gm"
    weight_grams = models.DecimalField(max_digits=10, decimal_places=4)  # 0.2000
    count = models.IntegerField()
    rate_per_gram = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)    # rate × weight
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)  # unit_price × count
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.metal_type} - {self.weight_label} × {self.count}"  




# AFTER — ADD THIS NEW MODEL:
class JewelryProduct(models.Model):
    CATEGORY_CHOICES = [
        ('rings', 'Rings'),
        ('necklaces', 'Necklaces'),
        ('bangles', 'Bangles'),
        ('bracelets', 'Bracelets'),
        ('earrings', 'Earrings'),
        ('chains', 'Chains'),
        ('pendants', 'Pendants'),
        ('mangalsutra', 'Mangalsutra'),
        ('anklets', 'Anklets'),
        ('nosepin', 'Nose Pin'),
        ('toerings', 'Toe Rings'),
        ('cufflinks', 'Cufflinks'),
        ('brooches', 'Brooches'),
        ('tiepins', 'Tie Pins'),
        ('coins', 'Coins'),
    ]
    METAL_CHOICES = [
        ('gold', 'Gold'),
        ('silver', 'Silver'),
        ('diamond', 'Diamond'),
        ('platinum', 'Platinum'),
    ]
    GRADE_CHOICES = [
        ('22k', '22K'),
        ('24k', '24K'),
        ('999', '999'),
        ('18k', '18K'),
        ('92', '92'),
        ('', 'N/A'),
    ]
    TAG_CHOICES = [
        ('Bestseller', 'Bestseller'),
        ('Bridal', 'Bridal'),
        ('Premium', 'Premium'),
        ('Statement', 'Statement'),
        ('Stackable', 'Stackable'),
        ('New', 'New'),
        ('Limited', 'Limited'),
        ('', 'N/A'),
    ]
    OCCASION_CHOICES = [
        ('Wedding', 'Wedding'),
        ('Birthday', 'Birthday'),
        ('Anniversary', 'Anniversary'),
        ('Auspicious', 'Auspicious'),
        ('Office Wear', 'Office Wear'),
        ('Modern Wear', 'Modern Wear'),
        ('Casual Wear', 'Casual Wear'),
        ('Traditional Wear', 'Traditional Wear'),
        ('', 'N/A'),
    ]
    WEDDING_CATEGORY_CHOICES = [
        ('Wedding Ring', 'Wedding Ring'),
        ('Wedding Necklaces', 'Wedding Necklaces'),
        ('Wedding Chain', 'Wedding Chain'),
        ('Wedding Bangles', 'Wedding Bangles'),
        ('Wedding Earring', 'Wedding Earring'),
        ('', 'N/A'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    metal = models.CharField(max_length=10, choices=METAL_CHOICES)
    grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cross_weight = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    stone_weight = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, default=0)
    net_weight   = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    making_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    wastage_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    stone_value   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    tax_percent   = models.DecimalField(max_digits=5, decimal_places=2, default=3.00)
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    original_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tag = models.CharField(max_length=50, choices=TAG_CHOICES, blank=True)
    occasion = models.CharField(max_length=50, choices=OCCASION_CHOICES, blank=True)
    wedding_category = models.CharField(max_length=50, choices=WEDDING_CATEGORY_CHOICES, blank=True)
    gender = models.CharField(
    max_length=10,
    choices=[('men', 'Men'), ('women', 'Women'), ('kids', 'Kids'), ('all', 'All')],
    default='all',
    blank=True
)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category} - {self.metal})"


class JewelryProductImage(models.Model):
    product = models.ForeignKey(
        JewelryProduct, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='jewelry_products/')
    order = models.IntegerField(default=0)  # for sorting images

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.product.name}"        




class HomeBanner(models.Model):
    SLOT_CHOICES = [(i, f'Banner {i}') for i in range(1, 6)]
    slot = models.IntegerField(choices=SLOT_CHOICES, unique=True)
    image = models.ImageField(upload_to='home_banners/')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['slot']

    def __str__(self):
        return f"Banner {self.slot}"        


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(
        JewelryProduct, on_delete=models.CASCADE, related_name='cart_items'
    )
    qty = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']  # same product twice add பண்ண qty++ ஆகும்

    def __str__(self):
        return f"{self.user.email} - {self.product.name} x {self.qty}"     


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(JewelryProduct, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']

    def __str__(self):
        return f"{self.user.email} ❤ {self.product.name}"  


class JewelryOrder(models.Model):
    PAYMENT_CHOICES = [
        ('upi', 'UPI'),
        ('debit_card', 'Debit Card'),
        ('credit_card', 'Credit Card'),
        ('net_banking', 'Net Banking'),
        ('cash_on_delivery', 'Cash on Delivery'),
        ('emi', 'EMI'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jewelry_orders')
    product = models.ForeignKey(JewelryProduct, on_delete=models.SET_NULL, null=True, related_name='orders')

    # Product snapshot (store at time of order, even if product changes later)
    product_name = models.CharField(max_length=200)
    product_metal = models.CharField(max_length=20)
    product_grade = models.CharField(max_length=10, blank=True)
    product_category = models.CharField(max_length=20)
    product_image_url = models.TextField(blank=True)

    # Customer details
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=10)
    customer_alt_phone = models.CharField(max_length=10, blank=True)
    customer_dob = models.DateField(null=True, blank=True)
    customer_anniversary = models.DateField(null=True, blank=True)

    # Delivery address
    pincode = models.CharField(max_length=6)
    address_line1 = models.TextField()
    address_line2 = models.TextField(blank=True)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)

    # Order details
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=14, decimal_places=2)

    # Payment
    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES)
    payment_status = models.CharField(max_length=20, default='pending')
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)

    # Order status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    order_id = models.CharField(max_length=30, unique=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            from django.utils import timezone
            year = timezone.now().year
            count = JewelryOrder.objects.count() + 1
            new_id = f"BBORD{year}{count:06d}"
            # Duplicate irundha, next number try pannu — unique varaikkum
            while JewelryOrder.objects.filter(order_id=new_id).exists():
                count += 1
                new_id = f"BBORD{year}{count:06d}"
            self.order_id = new_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.product_name}"



# ── COIN REQUEST SYSTEM (Promotor <-> SubDealer coin flow) ──
class CoinRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('sent', 'Approved'), ('rejected', 'Rejected')]

    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_requests_made')
    requested_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_requests_received')

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reject_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Request #{self.id} — {self.requested_by} to {self.requested_to} ({self.status})"


class CoinRequestItem(models.Model):
    request = models.ForeignKey(CoinRequest, on_delete=models.CASCADE, related_name='items')
    metal_type = models.CharField(max_length=20)     # gold_22k / gold_24k / silver_999
    weight_label = models.CharField(max_length=20)   # '100 mg', '1 gm' etc
    weight_grams = models.DecimalField(max_digits=10, decimal_places=4)
    qty = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.metal_type} {self.weight_label} x {self.qty}"


class CoinStock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_stock')
    metal_type = models.CharField(max_length=20)
    weight_label = models.CharField(max_length=20)
    weight_grams = models.DecimalField(max_digits=10, decimal_places=4)
    qty = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'metal_type', 'weight_label')

    def __str__(self):
        return f"{self.user} — {self.metal_type} {self.weight_label}: {self.qty}"
        

# ── COIN REWARDS SYSTEM ──
class DailyLoginLog(models.Model):
    """Every day user login pannumbodhu, oru entry create aagum. Streak calculate panna idhu than base."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_logins')
    login_date = models.DateField()

    class Meta:
        unique_together = ('user', 'login_date')

    def __str__(self):
        return f"{self.user.email} - {self.login_date}"


class CoinRewardLog(models.Model):
    REWARD_TYPES = [
        ('first_login', 'First Login'),
        ('daily_login', 'Daily Login'),
        ('bonus_10', '10 Days Bonus'),
        ('bonus_20', '20 Days Bonus'),
        ('bonus_30', '30 Days Bonus'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_rewards')
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
    coins = models.PositiveIntegerField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.reward_type} - {self.coins} coins ({self.date})"        


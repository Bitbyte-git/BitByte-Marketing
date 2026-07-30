import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from accounts.models import User, AdminProfile, DealerProfile


FIRST_NAMES = [
    'Arun', 'Karthik', 'Vignesh', 'Prakash', 'Suresh', 'Ramesh', 'Vijay',
    'Senthil', 'Mani', 'Rajesh', 'Ganesh', 'Anand', 'Bala', 'Dinesh',
    'Elango', 'Gopal', 'Hari', 'Ilango', 'Jagan', 'Kannan', 'Loganathan',
    'Muthu', 'Naveen', 'Prasanna', 'Raja', 'Saravanan',
    'Tamil', 'Uday', 'Vasanth', 'Selvam', 'Dhanraj', 'Jai',
]

FATHER_NAMES = [
    'Ramesh', 'Rajasekar', 'Elangovan', 'Muthuraman', 'Chandrasekar',
    'Palaniappan', 'Govindaraj', 'Krishnamurthy', 'Sivakumar', 'Balasubramaniam',
    'Natarajan', 'Subramaniam', 'Manikandan', 'Selvaraj', 'Kaliyaperumal',
    'Duraisamy', 'Venkatesan', 'Perumal', 'Ganapathy', 'Rajendran',
]

CITIES = [
    ('Chennai', 'Chennai', 'Tamil Nadu'),
    ('Coimbatore', 'Coimbatore', 'Tamil Nadu'),
    ('Madurai', 'Madurai', 'Tamil Nadu'),
    ('Trichy', 'Tiruchirappalli', 'Tamil Nadu'),
    ('Salem', 'Salem', 'Tamil Nadu'),
    ('Erode', 'Erode', 'Tamil Nadu'),
    ('Vellore', 'Vellore', 'Tamil Nadu'),
    ('Tirunelveli', 'Tirunelveli', 'Tamil Nadu'),
    ('Namakkal', 'Namakkal', 'Tamil Nadu'),
    ('Karur', 'Karur', 'Tamil Nadu'),
]

INITIALS = ['S', 'K', 'M', 'A', 'R', 'V', 'P', 'G', 'D', 'T']

OCCUPATION_DETAILS = {
    'employee': ['Sales Executive', 'Store Manager', 'Field Officer'],
    'business': ['Textile Shop', 'Jewellery Trader', 'Wholesale Merchant', 'Retail Shop'],
    'others': ['Freelancer', 'Self Employed'],
}

DUMMY_PASSWORD = "Senthil@2026"


def random_dob():
    days_old = random.randint(24 * 365, 48 * 365)
    return date.today() - timedelta(days=days_old)


def random_anniversary(dob):
    days_after_marriage = random.randint(2 * 365, 12 * 365)
    return dob + timedelta(days=24 * 365 + days_after_marriage)


class Command(BaseCommand):
    help = 'Create dummy Dealer users, all assigned to a single specified Admin (via --admin_id)'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=40, help='Total number of dummy dealers to create')
        parser.add_argument('--admin_id', type=str, default='BBADM20261002',
                             help='admin_id of the Admin to assign all dummy dealers under')

    def handle(self, *args, **options):
        count = options['count']
        admin_id = options['admin_id']
        created = 0

        # ── Step 1: Fetch the ONE target admin (by admin_id) ──
        try:
            target_admin = AdminProfile.objects.get(admin_id=admin_id)
        except AdminProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Admin with admin_id={admin_id} not found!"))
            return

        self.stdout.write(self.style.SUCCESS(
            f"Creating {count} dealers, ALL assigned to Admin {target_admin.admin_id} ({target_admin.first_name})..."
        ))

        for i in range(1, count + 1):
            admin = target_admin

            first_name = random.choice(FIRST_NAMES)
            father_name = random.choice(FATHER_NAMES)
            initial = random.choice(INITIALS)
            city, district, state = random.choice(CITIES)

            mobile = f"9{random.randint(100000000, 999999999)}"
            aadhaar = str(random.randint(100000000000, 999999999999))
            pan = f"DL{i:04d}{random.randint(1000, 9999)}"

            occupation = random.choice(['employee', 'business', 'others'])
            occupation_detail = random.choice(OCCUPATION_DETAILS[occupation])

            dob = random_dob()
            married_status = random.choice(['single', 'married'])
            anniversary_date = random_anniversary(dob) if married_status == 'married' else None

            # ── CHANGED: temp-email trick (same as create_dummy_admins.py) ──
            # Step A: create the user with a throwaway temp email so Django
            # assigns it a real auto-increment id (user.id) first.
            temp_email = f"temp_dealer_{i}_{random.randint(1000,9999)}@bitbyte.test"
            user = User.objects.create_user(
                email=temp_email,
                password=DUMMY_PASSWORD,
                role='dealer',
            )

            # Step B: build the REAL email from that id.
            # zfill(2) -> "01", "02" ... "99" (matches your example ramesh01@gmail.com).
            # If ids ever go past 99, zfill(2) just shows more digits (e.g. "104") —
            # still unique, still safe.
            serial = str(user.id).zfill(2)
            email = f"{first_name.lower()}{serial}@gmail.com"

            # Step C: duplicate-safety check (extremely rare, but same pattern as admin script)
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                self.stdout.write(self.style.WARNING(f"Skip: {email} already exists, removing temp user"))
                user.delete()
                continue

            # Step D: set the real email
            user.email = email
            user.save(update_fields=['email'])

            DealerProfile.objects.create(
                user=user,
                created_by=admin.user,          # Admin created this dealer
                assigned_admin=admin,           # links dealer to admin for hierarchy
                initial=initial,
                first_name=first_name,
                last_name=father_name,
                mobile_number=mobile,
                gender=random.choice(['male', 'female']),
                dob=dob,
                married_status=married_status,
                anniversary_date=anniversary_date,
                door_no=f"{random.randint(1, 200)}",
                street_name="Main Street",
                town_name=city,
                city_name=city,
                district=district,
                state=state,
                aadhaar_no=aadhaar,
                pan_no=pan,
                occupation=occupation,
                occupation_detail=occupation_detail,
                annual_salary=str(random.randint(150000, 700000)),
            )

            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created: {email} / {DUMMY_PASSWORD} -> assigned to Admin {admin.admin_id} ({admin.first_name})"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} dummy dealers created under Admin {target_admin.admin_id}."))
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from accounts.models import User, AdminProfile, PromotorProfile, CustomerProfile


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
    'employee': ['Private Employee', 'Government Employee', 'Daily Wage Worker'],
    'business': ['Small Shop Owner', 'Local Trader', 'Vendor'],
    'others': ['Housewife', 'Student', 'Retired'],
}

DUMMY_PASSWORD = "Senthil@2026"


def random_dob():
    days_old = random.randint(18 * 365, 60 * 365)
    return date.today() - timedelta(days=days_old)


def random_anniversary(dob):
    days_after_marriage = random.randint(1 * 365, 20 * 365)
    return dob + timedelta(days=18 * 365 + days_after_marriage)


class Command(BaseCommand):
    help = 'Create dummy Customers — every promotor gets AT LEAST 1, remaining spread randomly (mixed counts)'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=600, help='Total number of dummy customers to create')
        parser.add_argument('--admin_id', type=str, default=None,
                             help='Only create customers for promotors under this admin_id (default: ALL promotors)')
        parser.add_argument('--promotor_id', type=str, default=None,
                             help='Assign ALL created customers to this ONE specific promotor_id (overrides --admin_id)')

    def handle(self, *args, **options):
        count = options['count']
        created = 0

        admin_id = options['admin_id']
        promotor_id = options['promotor_id']

        if promotor_id:
            try:
                target_promotor = PromotorProfile.objects.get(promotor_id=promotor_id)
            except PromotorProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Promotor with promotor_id={promotor_id} not found!"))
                return
            promotors = [target_promotor]
        elif admin_id:
            try:
                target_admin = AdminProfile.objects.get(admin_id=admin_id)
            except AdminProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Admin with admin_id={admin_id} not found!"))
                return
            promotors = list(PromotorProfile.objects.filter(
                assigned_sub_dealer__assigned_dealer__assigned_admin=target_admin
            ))
            if not promotors:
                self.stdout.write(self.style.ERROR(f"No promotors found under Admin {admin_id}!"))
                return
        else:
            promotors = list(PromotorProfile.objects.all())
            if not promotors:
                self.stdout.write(self.style.ERROR("No promotors found! Create promotors first."))
                return

        total_promotors = len(promotors)

        if count < total_promotors:
            self.stdout.write(self.style.ERROR(
                f"count={count} is less than total promotors={total_promotors}. "
                f"Need count >= number of promotors so every promotor can get at least 1."
            ))
            return

        # ── Guarantee every promotor gets >= 1, remaining slots random (mixed counts) ──
        assignment_plan = list(promotors)
        remaining = count - total_promotors
        for _ in range(remaining):
            assignment_plan.append(random.choice(promotors))
        random.shuffle(assignment_plan)

        self.stdout.write(self.style.SUCCESS(
            f"Found {total_promotors} promotors. Every promotor gets >= 1. "
            f"Creating {count} customers total (mixed distribution)..."
        ))

        promotor_tally = {p.id: 0 for p in promotors}

        for promotor in assignment_plan:
            # ── FIX: retry loop — duplicate email no longer skips this customer slot,
            # it just tries a new random name until it succeeds (keeps total exact) ──
            user = None
            email = None
            while user is None:
                first_name = random.choice(FIRST_NAMES)
                father_name = random.choice(FATHER_NAMES)
                initial = random.choice(INITIALS)
                city, district, state = random.choice(CITIES)

                mobile = f"9{random.randint(100000000, 999999999)}"
                aadhaar = str(random.randint(100000000000, 999999999999))
                pan = f"CU{random.randint(100000, 999999)}"

                occupation = random.choice(['employee', 'business', 'others'])
                occupation_detail = random.choice(OCCUPATION_DETAILS[occupation])

                dob = random_dob()
                married_status = random.choice(['single', 'married'])
                anniversary_date = random_anniversary(dob) if married_status == 'married' else None

                serial_num = CustomerProfile.objects.count() + 1
                serial = str(serial_num).zfill(2)

                temp_email = f"temp_customer_{serial_num}_{random.randint(1000,9999)}@bitbyte.test"
                candidate_user = User.objects.create_user(
                    email=temp_email,
                    password=DUMMY_PASSWORD,
                    role='customer',
                )
                candidate_email = f"{first_name.lower()}{serial}@gmail.com"

                if User.objects.filter(email=candidate_email).exclude(pk=candidate_user.pk).exists():
                    self.stdout.write(self.style.WARNING(f"Retry: {candidate_email} already exists, trying again"))
                    candidate_user.delete()
                    continue

                candidate_user.email = candidate_email
                candidate_user.save(update_fields=['email'])
                user = candidate_user
                email = candidate_email

            CustomerProfile.objects.create(
                user=user,
                created_by=promotor.user,
                assigned_promotor=promotor,
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
                annual_salary=str(random.randint(80000, 350000)),
            )

            promotor_tally[promotor.id] += 1
            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created: {email} / {DUMMY_PASSWORD} -> assigned to Promotor {promotor.promotor_id} ({promotor.first_name})"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} dummy customers created and linked to {total_promotors} promotors."))

        zero_promotors = [p for p in promotors if promotor_tally[p.id] == 0]
        self.stdout.write(self.style.SUCCESS("\n── Distribution summary (first 20) ──"))
        for p in promotors[:20]:
            self.stdout.write(f"  {p.promotor_id} ({p.first_name}) -> {promotor_tally[p.id]} customer(s)")
        if zero_promotors:
            self.stdout.write(self.style.ERROR(f"⚠️ {len(zero_promotors)} promotors got 0 (should not happen)"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ Every promotor has at least 1 customer."))
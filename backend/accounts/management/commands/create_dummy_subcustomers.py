import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from accounts.models import User, AdminProfile, CustomerProfile


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
    help = 'Create exactly 1 dummy sub-customer for EACH existing customer (customer -> customer chain)'

    def add_arguments(self, parser):
        parser.add_argument('--admin_id', type=str, default=None,
                             help='Only create sub-customers for customers under this admin_id (default: ALL customers)')
        parser.add_argument('--customer_id', type=str, default=None,
                             help='Create --count sub-customers under this ONE specific customer_id (overrides --admin_id)')
        parser.add_argument('--customer_ids', type=str, default=None,
                             help='Comma-separated customer_ids — --count TOTAL sub-customers spread across them (each gets >=1)')
        parser.add_argument('--count', type=int, default=1,
                             help='Number of sub-customers to create (per parent for --customer_id, or TOTAL for --customer_ids)')

    def handle(self, *args, **options):
        admin_id = options['admin_id']
        customer_id = options['customer_id']
        customer_ids_arg = options['customer_ids']
        count = options['count']
        created = 0

        # ── Step 1: Fetch parent customer(s) ──
        if customer_ids_arg:
            id_list = [cid.strip() for cid in customer_ids_arg.split(',') if cid.strip()]
            found = list(CustomerProfile.objects.filter(customer_id__in=id_list))
            found_ids = {c.customer_id for c in found}
            missing = [cid for cid in id_list if cid not in found_ids]
            if missing:
                self.stdout.write(self.style.ERROR(f"These customer_id(s) not found: {', '.join(missing)}"))
                return
            if count < len(found):
                self.stdout.write(self.style.ERROR(
                    f"--count={count} is less than number of parents={len(found)}. Need count >= parents so each gets >=1."
                ))
                return
            # every parent gets >= 1, remaining slots random (mixed)
            parent_customers = list(found)
            remaining = count - len(found)
            for _ in range(remaining):
                parent_customers.append(random.choice(found))
            random.shuffle(parent_customers)
            total_parents = count
            self.stdout.write(self.style.SUCCESS(
                f"Creating {count} sub-customers TOTAL, spread across {len(found)} parent customers (each >=1)..."
            ))
        elif customer_id:
            try:
                target_customer = CustomerProfile.objects.get(customer_id=customer_id)
            except CustomerProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Customer with customer_id={customer_id} not found!"))
                return
            # ── same parent repeated `count` times, so the loop below creates exactly `count` sub-customers ──
            parent_customers = [target_customer] * count
            total_parents = count
            self.stdout.write(self.style.SUCCESS(
                f"Creating exactly {count} sub-customers under Customer {target_customer.customer_id} ({target_customer.first_name})..."
            ))
        elif admin_id:
            try:
                target_admin = AdminProfile.objects.get(admin_id=admin_id)
            except AdminProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Admin with admin_id={admin_id} not found!"))
                return
            parent_customers = list(CustomerProfile.objects.filter(
                assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin=target_admin
            ))
            if not parent_customers:
                self.stdout.write(self.style.ERROR(f"No customers found under Admin {admin_id}!"))
                return
            total_parents = len(parent_customers)
            self.stdout.write(self.style.SUCCESS(
                f"Found {total_parents} customers. Creating exactly 1 sub-customer EACH ({total_parents} total)..."
            ))
        else:
            parent_customers = list(CustomerProfile.objects.all())
            if not parent_customers:
                self.stdout.write(self.style.ERROR("No customers found! Create customers first."))
                return
            total_parents = len(parent_customers)
            self.stdout.write(self.style.SUCCESS(
                f"Found {total_parents} customers. Creating exactly 1 sub-customer EACH ({total_parents} total)..."
            ))

        for parent in parent_customers:
            # ── Retry loop: duplicate email no longer skips this slot,
            # it just tries a new random name until it succeeds ──
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

                temp_email = f"temp_subcustomer_{serial_num}_{random.randint(1000,9999)}@bitbyte.test"
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
                created_by=parent.user,                          # ← parent customer created this sub-customer
                assigned_promotor=parent.assigned_promotor,       # ← inherit SAME promotor (keeps hierarchy intact)
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

            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created: {email} / {DUMMY_PASSWORD} -> sub-customer of {parent.customer_id} ({parent.first_name})"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} dummy sub-customers created and linked to {total_parents} parent customers."))
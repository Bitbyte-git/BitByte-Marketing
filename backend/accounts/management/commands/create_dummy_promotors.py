import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from accounts.models import User, AdminProfile, SubDealerProfile, PromotorProfile


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
    'employee': ['Field Agent', 'Local Promotor', 'Marketing Executive'],
    'business': ['Small Shop Owner', 'Local Trader'],
    'others': ['Freelancer', 'Self Employed'],
}

DUMMY_PASSWORD = "Senthil@2026"


def random_dob():
    days_old = random.randint(20 * 365, 44 * 365)
    return date.today() - timedelta(days=days_old)


def random_anniversary(dob):
    days_after_marriage = random.randint(1 * 365, 8 * 365)
    return dob + timedelta(days=20 * 365 + days_after_marriage)


class Command(BaseCommand):
    help = 'Create dummy Promotor users, evenly distributed across all Sub Dealers'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=250, help='Total number of dummy promotors to create')
        parser.add_argument('--admin_id', type=str, default=None,
                             help='Only create promotors for sub dealers under this admin_id (default: ALL sub dealers)')

    def handle(self, *args, **options):
        count = options['count']
        created = 0

        # ── Step 1: Fetch sub dealers (all, or filtered to one admin's downline) ──
        admin_id = options['admin_id']

        if admin_id:
            try:
                target_admin = AdminProfile.objects.get(admin_id=admin_id)
            except AdminProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Admin with admin_id={admin_id} not found!"))
                return
            sub_dealers = list(SubDealerProfile.objects.filter(assigned_dealer__assigned_admin=target_admin))
            if not sub_dealers:
                self.stdout.write(self.style.ERROR(f"No sub dealers found under Admin {admin_id}!"))
                return
        else:
            sub_dealers = list(SubDealerProfile.objects.all())
            if not sub_dealers:
                self.stdout.write(self.style.ERROR("No sub dealers found! Create sub dealers first."))
                return

        total_sd = len(sub_dealers)

        if count < total_sd:
            self.stdout.write(self.style.ERROR(
                f"count={count} is less than total sub dealers={total_sd}. "
                f"Need count >= number of sub dealers so every sub dealer can get at least 1."
            ))
            return

        # Guarantee every sub dealer gets >= 1, remaining slots random (mixed counts)
        assignment_plan = list(sub_dealers)
        remaining = count - total_sd
        for _ in range(remaining):
            assignment_plan.append(random.choice(sub_dealers))
        random.shuffle(assignment_plan)

        self.stdout.write(self.style.SUCCESS(
            f"Found {total_sd} sub dealers. Every sub dealer gets >= 1. Creating {count} promotors (mixed)..."
        ))

        sd_tally = {sd.id: 0 for sd in sub_dealers}

        for sub_dealer in assignment_plan:

            # ── FIX: retry loop — duplicate email no longer skips this promotor slot,
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
                pan = f"PR{random.randint(100000, 999999)}"

                occupation = random.choice(['employee', 'business', 'others'])
                occupation_detail = random.choice(OCCUPATION_DETAILS[occupation])

                dob = random_dob()
                married_status = random.choice(['single', 'married'])
                anniversary_date = random_anniversary(dob) if married_status == 'married' else None

                serial_num = PromotorProfile.objects.count() + 1
                serial = str(serial_num).zfill(2)

                temp_email = f"temp_promotor_{serial_num}_{random.randint(1000,9999)}@bitbyte.test"
                candidate_user = User.objects.create_user(
                    email=temp_email,
                    password=DUMMY_PASSWORD,
                    role='promotor',
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

            PromotorProfile.objects.create(
                user=user,
                created_by=sub_dealer.user,          # Sub Dealer created this promotor
                assigned_sub_dealer=sub_dealer,      # ✅ Links promotor to sub dealer for hierarchy
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
                annual_salary=str(random.randint(100000, 400000)),
            )

            sd_tally[sub_dealer.id] += 1
            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created: {email} / {DUMMY_PASSWORD} -> assigned to Sub Dealer {sub_dealer.sub_dealer_id} ({sub_dealer.first_name})"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} dummy promotors created and linked to {total_sd} sub dealers."))

        self.stdout.write(self.style.SUCCESS("\n── Distribution summary ──"))
        for sd in sub_dealers:
            self.stdout.write(f"  {sd.sub_dealer_id} ({sd.first_name}) -> {sd_tally[sd.id]} promotor(s)")
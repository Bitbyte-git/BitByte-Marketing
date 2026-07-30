import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from accounts.models import User, DealerProfile, SubDealerProfile


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
    'employee': ['Sales Executive', 'Field Officer', 'Area Coordinator'],
    'business': ['Small Shop Owner', 'Retail Trader', 'Local Merchant'],
    'others': ['Freelancer', 'Self Employed'],
}

DUMMY_PASSWORD = "Senthil@2026"


def random_dob():
    days_old = random.randint(22 * 365, 46 * 365)
    return date.today() - timedelta(days=days_old)


def random_anniversary(dob):
    days_after_marriage = random.randint(2 * 365, 10 * 365)
    return dob + timedelta(days=22 * 365 + days_after_marriage)


class Command(BaseCommand):
    help = 'Create dummy Sub Dealers — EACH dealer gets exactly --per_dealer sub dealers (default 2)'

    def add_arguments(self, parser):
        parser.add_argument('--per_dealer', type=int, default=2, help='Number of dummy sub dealers to create for EACH dealer')

    def handle(self, *args, **options):
        per_dealer = options['per_dealer']
        created = 0

        dealers = list(DealerProfile.objects.all())
        if not dealers:
            self.stdout.write(self.style.ERROR("No dealers found! Create dealers first."))
            return

        total_dealers = len(dealers)
        count = total_dealers * per_dealer

        # ── Build the assignment plan: EXACTLY per_dealer slots for each dealer ──
        assignment_plan = []
        for dealer in dealers:
            assignment_plan.extend([dealer] * per_dealer)

        random.shuffle(assignment_plan)  # just mixes creation order, not the distribution

        self.stdout.write(self.style.SUCCESS(
            f"Found {total_dealers} dealers. Creating exactly {per_dealer} sub dealers EACH "
            f"({count} sub dealers total)..."
        ))

        dealer_tally = {d.id: 0 for d in dealers}

        for dealer in assignment_plan:
            first_name = random.choice(FIRST_NAMES)
            father_name = random.choice(FATHER_NAMES)
            initial = random.choice(INITIALS)
            city, district, state = random.choice(CITIES)

            mobile = f"9{random.randint(100000000, 999999999)}"
            aadhaar = str(random.randint(100000000000, 999999999999))
            pan = f"SD{random.randint(100000, 999999)}"

            occupation = random.choice(['employee', 'business', 'others'])
            occupation_detail = random.choice(OCCUPATION_DETAILS[occupation])

            dob = random_dob()
            married_status = random.choice(['single', 'married'])
            anniversary_date = random_anniversary(dob) if married_status == 'married' else None

            # ── FIX (same pattern as dealers): email serial number comes from
            # SubDealerProfile.objects.count()+1 — the SAME counter that generates
            # sub_dealer_id (BBSDL{year}{count:07d}). This keeps email and ID
            # numbers consistent, AND naturally continues from the existing 1
            # sub dealer already in the DB (so this run starts at 002, not 001).
            serial_num = SubDealerProfile.objects.count() + 1
            serial = str(serial_num).zfill(2)

            temp_email = f"temp_subdealer_{serial_num}_{random.randint(1000,9999)}@bitbyte.test"
            user = User.objects.create_user(
                email=temp_email,
                password=DUMMY_PASSWORD,
                role='sub_dealer',
            )
            email = f"{first_name.lower()}{serial}@gmail.com"

            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                self.stdout.write(self.style.WARNING(f"Skip: {email} already exists, removing temp user"))
                user.delete()
                continue

            user.email = email
            user.save(update_fields=['email'])

            SubDealerProfile.objects.create(
                user=user,
                created_by=dealer.user,
                assigned_dealer=dealer,
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
                annual_salary=str(random.randint(120000, 500000)),
            )

            dealer_tally[dealer.id] += 1
            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created: {email} / {DUMMY_PASSWORD} -> assigned to Dealer {dealer.dealer_id} ({dealer.first_name})"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} dummy sub dealers created and linked to {total_dealers} dealers."))

        wrong_count_dealers = [d for d in dealers if dealer_tally[d.id] != per_dealer]
        self.stdout.write(self.style.SUCCESS("\n── Distribution summary ──"))
        for d in dealers:
            n = dealer_tally[d.id]
            self.stdout.write(f"  {d.dealer_id} ({d.first_name}) -> {n} sub dealer(s)")
        if wrong_count_dealers:
            self.stdout.write(self.style.ERROR(f"⚠️ {len(wrong_count_dealers)} dealers didn't get exactly {per_dealer} (check for skipped duplicates)"))
        else:
            self.stdout.write(self.style.SUCCESS(f"✅ Every dealer has exactly {per_dealer} sub dealers."))
            
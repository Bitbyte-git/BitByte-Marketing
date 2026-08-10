from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import CustomerProfile, AutoPayMandate


class Command(BaseCommand):
    help = 'Create a dummy autopay mandate that charges today'

    def handle(self, *args, **options):
        customer_id = 'BBCUS20260000741'

        try:
            profile = CustomerProfile.objects.get(customer_id=customer_id)
        except CustomerProfile.DoesNotExist:
            self.stdout.write(self.style.WARNING(f"NOT FOUND: {customer_id}"))
            return

        user = profile.user

        AutoPayMandate.objects.update_or_create(
            user=user,
            defaults={
                'amount': 1500,
                'frequency': 'monthly',
                'recharge_day': timezone.now().day,
                'razorpay_plan_id': 'plan_dummy_today741',
                'razorpay_subscription_id': 'sub_dummy_today741',
                'status': 'active',
                'is_active': True,
                'next_charge_date': timezone.now().date(),   # today
                'last_charge_status': None,
                'last_charge_date': None,
                'last_charge_error': None,
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Done: {customer_id} - {profile.first_name} - next_charge_date = today"))
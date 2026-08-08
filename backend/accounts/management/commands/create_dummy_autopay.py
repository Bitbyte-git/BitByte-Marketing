from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import CustomerProfile, AutoPayMandate


class Command(BaseCommand):
    help = 'Create dummy autopay mandates for testing'

    def handle(self, *args, **options):
        dummy_data = [
            {'customer_id': 'BBCUS20260000190', 'amount': 800, 'day': 3, 'freq': 'monthly', 'status': 'active', 'last_status': 'success', 'last_error': None},
            {'customer_id': 'BBCUS20260000212', 'amount': 1200, 'day': 12, 'freq': 'monthly', 'status': 'active', 'last_status': 'failed', 'last_error': 'Insufficient balance'},
            {'customer_id': 'BBCUS20260000355', 'amount': 2500, 'day': 18, 'freq': 'monthly', 'status': 'paused', 'last_status': 'failed', 'last_error': 'Card expired'},
        ]

        for d in dummy_data:
            try:
                profile = CustomerProfile.objects.get(customer_id=d['customer_id'])
            except CustomerProfile.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"NOT FOUND: {d['customer_id']}"))
                continue

            user = profile.user

            AutoPayMandate.objects.update_or_create(
                user=user,
                defaults={
                    'amount': d['amount'],
                    'frequency': d['freq'],
                    'recharge_day': d['day'],
                    'razorpay_plan_id': f'plan_dummy_{d["customer_id"][-4:]}',
                    'razorpay_subscription_id': f'sub_dummy_{d["customer_id"][-4:]}',
                    'status': d['status'],
                    'is_active': d['status'] == 'active',
                    'next_charge_date': timezone.now().date() + timedelta(days=10),
                    'last_charge_status': d['last_status'],
                    'last_charge_date': timezone.now().date() - timedelta(days=2) if d['last_status'] else None,
                    'last_charge_error': d['last_error'],
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Done: {d['customer_id']} - {profile.first_name}"))

        self.stdout.write(self.style.SUCCESS("Dummy autopay mandates created!"))
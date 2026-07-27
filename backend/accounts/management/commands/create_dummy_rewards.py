"""
File: BitByte-Marketing/backend/accounts/management/commands/create_dummy_rewards.py

Purpose : Admin, Dealer, Sub Dealer, Promotor, Customer ku RANDOM ah login streak
          create pannurathukku (DailyLoginLog + CoinRewardLog) — Rewards page
          testing ku dummy data. Super Admin touch pannaathu.

          Ellarukkum login kudukaathu — konjam per per bucket mattum:
          30-day streak, 20-day streak, 10-day streak, first-login-only.
          Meethi users touch pannaathu (login/reward onnume illa).

Args:
    --n30      Evlo users ku 30-day streak venumo (default: 2)
    --n20      Evlo users ku 20-day streak venumo (default: 2)
    --n10      Evlo users ku 10-day streak venumo (default: 3)
    --nfirst   Evlo users ku first-login-only venumo (default: 5)
    --role     Specific role mattum target pannanumna (admin/dealer/sub_dealer/promotor/customer/all)
    --reset    Existing DailyLoginLog + CoinRewardLog ah target users kum clear pannitu fresh create pannum

Run:
    python manage.py create_dummy_rewards
    python manage.py create_dummy_rewards --n30 3 --n20 3 --n10 5 --nfirst 8
    python manage.py create_dummy_rewards --role customer --reset
"""
import random
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import (
    AdminProfile, DealerProfile, SubDealerProfile, PromotorProfile, CustomerProfile,
    DailyLoginLog, CoinRewardLog,
)

ROLE_MODELS = {
    'admin': AdminProfile,
    'dealer': DealerProfile,
    'sub_dealer': SubDealerProfile,
    'promotor': PromotorProfile,
    'customer': CustomerProfile,
}

REWARD_COINS = {
    'first_login': 5,
    'daily_login': 1,
    'bonus_10': 3,
    'bonus_20': 6,
    'bonus_30': 10,
}

BONUS_MAP = {10: 'bonus_10', 20: 'bonus_20', 30: 'bonus_30'}


class Command(BaseCommand):
    help = 'Create dummy DailyLoginLog + CoinRewardLog streaks (30/20/10 days, first-login) for testing the Rewards page'

    def add_arguments(self, parser):
        parser.add_argument('--n30', type=int, default=2, help='Users with a 30-day login streak')
        parser.add_argument('--n20', type=int, default=2, help='Users with a 20-day login streak')
        parser.add_argument('--n10', type=int, default=3, help='Users with a 10-day login streak')
        parser.add_argument('--nfirst', type=int, default=5, help='Users with first-login-only')
        parser.add_argument('--role', type=str, default='all',
                             choices=['admin', 'dealer', 'sub_dealer', 'promotor', 'customer', 'all'],
                             help='Target a specific role, or all (default: all)')
        parser.add_argument('--reset', action='store_true',
                             help='Clear DailyLoginLog + CoinRewardLog for target users before creating fresh data')

    def create_streak(self, user, days):
        """days-oda streak create pannum, today-la irundhu backward-a.
        Real LoginView logic mari — 1st day = first_login, rest = daily_login,
        10/20/30th day-la bonus."""
        today = timezone.now().date()
        start = today - timezone.timedelta(days=days - 1)

        for i in range(days):
            day = start + timezone.timedelta(days=i)
            DailyLoginLog.objects.get_or_create(user=user, login_date=day)

            streak_so_far = i + 1
            if streak_so_far == 1:
                CoinRewardLog.objects.get_or_create(
                    user=user, reward_type='first_login', date=day,
                    defaults={'coins': REWARD_COINS['first_login']}
                )
            else:
                CoinRewardLog.objects.get_or_create(
                    user=user, reward_type='daily_login', date=day,
                    defaults={'coins': REWARD_COINS['daily_login']}
                )

            if streak_so_far in BONUS_MAP:
                rtype = BONUS_MAP[streak_so_far]
                CoinRewardLog.objects.get_or_create(
                    user=user, reward_type=rtype, date=day,
                    defaults={'coins': REWARD_COINS[rtype]}
                )

    def handle(self, *args, **options):
        role_arg = options['role']
        reset = options['reset']
        n30, n20, n10, nfirst = options['n30'], options['n20'], options['n10'], options['nfirst']

        target_models = ROLE_MODELS if role_arg == 'all' else {role_arg: ROLE_MODELS[role_arg]}

        all_users = []
        for role_name, Model in target_models.items():
            profiles = Model.objects.select_related('user').all()
            for p in profiles:
                all_users.append((role_name, p.user))

        if not all_users:
            self.stdout.write(self.style.ERROR("No users found for selected role(s)."))
            return

        if reset:
            user_objs = [u for _, u in all_users]
            DailyLoginLog.objects.filter(user__in=user_objs).delete()
            CoinRewardLog.objects.filter(user__in=user_objs).delete()
            self.stdout.write(self.style.WARNING(f"Cleared reward data for {len(user_objs)} users."))

        random.shuffle(all_users)

        needed = n30 + n20 + n10 + nfirst
        if needed > len(all_users):
            self.stdout.write(self.style.WARNING(
                f"Only {len(all_users)} users available, but {needed} requested — reducing counts."
            ))

        cursor = 0
        buckets = [
            (n30, 30, '30-day streak'),
            (n20, 20, '20-day streak'),
            (n10, 10, '10-day streak'),
            (nfirst, 1, 'first-login-only'),
        ]

        summary = {}
        for count, days, label in buckets:
            picked = all_users[cursor:cursor + count]
            cursor += count
            for role_name, user in picked:
                self.create_streak(user, days)
                summary.setdefault(label, 0)
                summary[label] += 1

        self.stdout.write(self.style.SUCCESS("\nDone! Dummy rewards created:"))
        for label, count in summary.items():
            self.stdout.write(self.style.SUCCESS(f"  {label}: {count} users"))
        skipped = len(all_users) - cursor
        if skipped > 0:
            self.stdout.write(f"  (untouched: {skipped} users — no login/reward data)")
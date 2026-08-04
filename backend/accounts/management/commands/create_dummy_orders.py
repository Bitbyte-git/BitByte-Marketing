"""
File: BitByte-Marketing/backend/accounts/management/commands/create_dummy_orders.py

Purpose : Ella dummy customer kum RANDOM order count (min-max range) create pannurathukku.
          Modes:
            1) Normal/force-add mode (existing) — min/max orders per customer
            2) Combined-target mode (--customer_ids + --combined-target) — spreads random
               orders ACROSS the listed customers until their COMBINED total crosses the
               given rupee amount (e.g. 1.5 Crore across 5 customers).

Run (normal):
    python manage.py create_dummy_orders --min-orders 1 --max-orders 1 --force-add

Run (combined target across specific customers):
    python manage.py create_dummy_orders --customer_ids "BBCUS20260000544,BBCUS20260000741,BBCUS20260000740,BBCUS20260000739,BBCUS20260000660" --combined-target 15000000
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import AdminProfile, CustomerProfile, JewelryProduct, JewelryOrder

GAP_OPTIONS_MINUTES = [10, 20, 30, 60, 120, 180, 240]

ADDRESS_LINES = [
    "12, Gandhi Street", "45, Anna Nagar Main Road", "8, Bharathi Colony",
    "23, Nehru Street", "67, Kamarajar Salai", "5, Periyar Nagar",
    "34, Sivan Kovil Street", "19, Market Road", "56, VOC Street", "3, Bazaar Street",
]

PAYMENT_METHODS = ['upi', 'debit_card', 'credit_card', 'net_banking', 'cash_on_delivery']
ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

BATCH_SIZE = 1000


class Command(BaseCommand):
    help = 'Create dummy JewelryOrders — normal per-customer mode OR combined-target mode across specific customers'

    def add_arguments(self, parser):
        parser.add_argument('--min-orders', type=int, default=2, help='Minimum NEW orders to add per customer')
        parser.add_argument('--max-orders', type=int, default=15, help='Maximum NEW orders to add per customer')
        parser.add_argument('--force-add', action='store_true',
                             help='Ignore existing order count, ADD this many new orders to EVERY customer regardless')
        parser.add_argument('--admin_id', type=str, default=None,
                             help='Only create orders for customers under this admin_id (default: ALL customers)')
        parser.add_argument('--promotor_id', type=str, default=None,
                             help='Only create orders for customers under this ONE promotor_id (overrides --admin_id)')
        parser.add_argument('--high-value-count', type=int, default=0,
                             help='Number of customers (from the filtered set) whose orders must total above --high-value-threshold')
        parser.add_argument('--high-value-threshold', type=float, default=500000,
                             help='Rupee total EACH high-value customer must cross (default: 5,00,000)')
        parser.add_argument('--customer_ids', type=str, default=None,
                             help='Comma-separated list of customer_id values (e.g. "BBCUS20260000544,BBCUS20260000741"). Switches to combined-target mode.')
        parser.add_argument('--combined-target', type=float, default=0,
                             help='Rupee total the LISTED customers must reach COMBINED (used with --customer_ids)')
        parser.add_argument('--orders-each', type=int, default=0,
                             help='Exact number of orders to create for EACH listed customer (used with --customer_ids, overrides --combined-target)')

    def handle(self, *args, **options):
        customer_ids_arg = options['customer_ids']
        combined_target = options['combined_target']

        products = list(JewelryProduct.objects.filter(is_active=True).prefetch_related('images'))
        if len(products) < 1:
            self.stdout.write(self.style.ERROR(
                "No active JewelryProduct rows found. Add products in Add Product page first."
            ))
            return

        product_image_urls = {}
        for p in products:
            first_img = p.images.first()
            product_image_urls[p.id] = first_img.image.url if first_img else ''

        year = timezone.now().year
        existing_ids = set(
            JewelryOrder.objects.filter(order_id__startswith=f"BBORD{year}")
            .values_list('order_id', flat=True)
        )
        seq_counter = JewelryOrder.objects.count() + 1

        def next_order_id():
            nonlocal seq_counter
            order_id = f"BBORD{year}{seq_counter:06d}"
            while order_id in existing_ids:
                seq_counter += 1
                order_id = f"BBORD{year}{seq_counter:06d}"
            existing_ids.add(order_id)
            seq_counter += 1
            return order_id

        # ══════════════════════════════════════════════════════════
        # MODE 1: --customer_ids + --combined-target
        # Spreads random orders ACROSS the listed customers, picking a
        # random customer each round, until their COMBINED total crosses target.
        # ══════════════════════════════════════════════════════════
        orders_each = options['orders_each']

        if customer_ids_arg:
            id_list = [cid.strip() for cid in customer_ids_arg.split(',') if cid.strip()]
            customers = list(CustomerProfile.objects.filter(customer_id__in=id_list).select_related('user'))

            found_ids = {c.customer_id for c in customers}
            missing = [cid for cid in id_list if cid not in found_ids]
            if missing:
                self.stdout.write(self.style.ERROR(f"These customer_id(s) not found: {', '.join(missing)}"))
                return

            if not customers:
                self.stdout.write(self.style.ERROR("No valid customers to process."))
                return

            # ── MODE 1a: --orders-each — exact fixed order count for EACH listed customer ──
            if orders_each > 0:
                self.stdout.write(self.style.SUCCESS(
                    f"Creating exactly {orders_each} orders EACH for {len(customers)} customers..."
                ))
                batch = []
                created = 0
                per_customer_total = {c.customer_id: 0.0 for c in customers}

                def flush_batch():
                    nonlocal batch, created
                    if batch:
                        with transaction.atomic():
                            JewelryOrder.objects.bulk_create(batch, batch_size=BATCH_SIZE)
                            for order_obj in batch:
                                JewelryOrder.objects.filter(order_id=order_obj.order_id).update(
                                    created_at=order_obj._staggered_time
                                )
                        created += len(batch)
                        batch = []

                for customer in customers:
                    for _ in range(orders_each):
                        product = random.choice(products)
                        qty = random.randint(1, 2)
                        unit_price = float(product.price or 0)
                        total_price = round(unit_price * qty, 2)
                        per_customer_total[customer.customer_id] += total_price

                        order_time = timezone.now() - timedelta(minutes=random.choice(GAP_OPTIONS_MINUTES))

                        order_obj = JewelryOrder(
                            order_id=next_order_id(),
                            user=customer.user,
                            product=product,
                            product_name=product.name,
                            product_metal=product.metal,
                            product_grade=product.grade or '',
                            product_category=product.category,
                            product_image_url=product_image_urls.get(product.id, ''),
                            customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                            customer_phone=customer.mobile_number,
                            customer_alt_phone='',
                            customer_dob=customer.dob,
                            customer_anniversary=customer.anniversary_date,
                            pincode=str(random.randint(600001, 643001)),
                            address_line1=random.choice(ADDRESS_LINES),
                            address_line2=customer.town_name or '',
                            city=customer.city_name,
                            state=customer.state,
                            quantity=qty,
                            unit_price=unit_price,
                            total_price=total_price,
                            payment_method=random.choice(PAYMENT_METHODS),
                            payment_status='paid',
                            status=random.choice(ORDER_STATUSES),
                        )
                        order_obj._staggered_time = order_time
                        batch.append(order_obj)

                        if len(batch) >= BATCH_SIZE:
                            flush_batch()

                flush_batch()

                self.stdout.write(self.style.SUCCESS(f"\nDone! {created} orders created ({orders_each} each)."))
                self.stdout.write(self.style.SUCCESS("\n── Per-customer breakdown ──"))
                for c in customers:
                    self.stdout.write(f"  {c.customer_id} ({c.first_name}) -> ₹{per_customer_total[c.customer_id]:,.2f}")
                return

            if combined_target <= 0:
                self.stdout.write(self.style.ERROR("Either --orders-each or --combined-target must be provided."))
                return

            self.stdout.write(self.style.SUCCESS(
                f"Combined-target mode: spreading orders across {len(customers)} customers "
                f"until total crosses ₹{combined_target:,.2f}..."
            ))

            batch = []
            created = 0
            combined_total = 0.0
            per_customer_total = {c.customer_id: 0.0 for c in customers}
            safety_limit = 2000
            loops = 0

            def flush_batch():
                nonlocal batch, created
                if batch:
                    with transaction.atomic():
                        JewelryOrder.objects.bulk_create(batch, batch_size=BATCH_SIZE)
                        for order_obj in batch:
                            JewelryOrder.objects.filter(order_id=order_obj.order_id).update(
                                created_at=order_obj._staggered_time
                            )
                    created += len(batch)
                    batch = []

            while combined_total < combined_target and loops < safety_limit:
                customer = random.choice(customers)
                product = random.choice(products)
                qty = random.randint(1, 2)
                unit_price = float(product.price or 0)
                total_price = round(unit_price * qty, 2)

                combined_total += total_price
                per_customer_total[customer.customer_id] += total_price
                loops += 1

                order_time = timezone.now() - timedelta(minutes=random.choice(GAP_OPTIONS_MINUTES))

                order_obj = JewelryOrder(
                    order_id=next_order_id(),
                    user=customer.user,
                    product=product,
                    product_name=product.name,
                    product_metal=product.metal,
                    product_grade=product.grade or '',
                    product_category=product.category,
                    product_image_url=product_image_urls.get(product.id, ''),
                    customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                    customer_phone=customer.mobile_number,
                    customer_alt_phone='',
                    customer_dob=customer.dob,
                    customer_anniversary=customer.anniversary_date,
                    pincode=str(random.randint(600001, 643001)),
                    address_line1=random.choice(ADDRESS_LINES),
                    address_line2=customer.town_name or '',
                    city=customer.city_name,
                    state=customer.state,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=total_price,
                    payment_method=random.choice(PAYMENT_METHODS),
                    payment_status='paid',
                    status=random.choice(ORDER_STATUSES),
                )
                order_obj._staggered_time = order_time
                batch.append(order_obj)

                if len(batch) >= BATCH_SIZE:
                    flush_batch()

            flush_batch()

            self.stdout.write(self.style.SUCCESS(f"\nDone! {created} orders created. Combined total: ₹{combined_total:,.2f}"))
            self.stdout.write(self.style.SUCCESS("\n── Per-customer breakdown ──"))
            for c in customers:
                self.stdout.write(f"  {c.customer_id} ({c.first_name}) -> ₹{per_customer_total[c.customer_id]:,.2f}")
            return

        min_orders = options['min_orders']
        max_orders = options['max_orders']
        force_add = options['force_add']
        admin_id = options['admin_id']
        promotor_id = options['promotor_id']
        high_value_count = options['high_value_count']
        high_value_threshold = options['high_value_threshold']

        if promotor_id:
            customers = list(
                CustomerProfile.objects.filter(assigned_promotor__promotor_id=promotor_id)
                .select_related('user')
                .order_by('id')
            )
            if not customers:
                self.stdout.write(self.style.ERROR(f"No customers found under Promotor {promotor_id}!"))
                return
        elif admin_id:
            try:
                target_admin = AdminProfile.objects.get(admin_id=admin_id)
            except AdminProfile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Admin with admin_id={admin_id} not found!"))
                return
            customers = list(
                CustomerProfile.objects.filter(
                    assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin=target_admin
                )
                .select_related('user')
                .order_by('id')
            )
            if not customers:
                self.stdout.write(self.style.ERROR(f"No customers found under Admin {admin_id}!"))
                return
        else:
            customers = list(
                CustomerProfile.objects.all()
                .select_related('user')
                .order_by('id')
            )
            if not customers:
                self.stdout.write(self.style.ERROR("No dummy customers found! Run create_dummy_customers first."))
                return

        existing_counts = {}
        for row in JewelryOrder.objects.filter(user__in=[c.user_id for c in customers]).values('user_id'):
            existing_counts[row['user_id']] = existing_counts.get(row['user_id'], 0) + 1

        high_value_ids = {c.user_id for c in customers[:high_value_count]} if high_value_count else set()

        if force_add:
            customer_targets = {
                c.user_id: existing_counts.get(c.user_id, 0) + random.randint(min_orders, max_orders)
                for c in customers
            }
        else:
            customer_targets = {c.user_id: random.randint(min_orders, max_orders) for c in customers}
            customers = [c for c in customers if existing_counts.get(c.user_id, 0) < customer_targets[c.user_id]]

        if not customers:
            self.stdout.write(self.style.SUCCESS("All dummy customers already have orders. Nothing to do."))
            return

        total_to_create = sum(
            customer_targets[c.user_id] - existing_counts.get(c.user_id, 0) for c in customers
        )

        self.stdout.write(self.style.SUCCESS(
            f"{len(customers)} customers getting new orders (random {min_orders}-{max_orders} each). "
            f"{len(products)} products available. Starting bulk insert..."
        ))

        batch = []
        created = 0

        def flush_batch():
            nonlocal batch, created
            if batch:
                with transaction.atomic():
                    JewelryOrder.objects.bulk_create(batch, batch_size=BATCH_SIZE)
                    for order_obj in batch:
                        JewelryOrder.objects.filter(order_id=order_obj.order_id).update(
                            created_at=order_obj._staggered_time
                        )
                created += len(batch)
                self.stdout.write(self.style.SUCCESS(f"  ...{created}/{total_to_create} orders inserted"))
                batch = []

        for customer in customers:
            need = customer_targets[customer.user_id] - existing_counts.get(customer.user_id, 0)

            if need <= len(products):
                chosen_products = random.sample(products, need)
            else:
                chosen_products = random.choices(products, k=need)

            customer_running_total = 0.0
            is_high_value = customer.user_id in high_value_ids

            for product in chosen_products:
                qty = random.randint(1, 2)
                unit_price = float(product.price or 0)
                total_price = round(unit_price * qty, 2)
                customer_running_total += total_price

                order_time = timezone.now() - timedelta(minutes=random.choice(GAP_OPTIONS_MINUTES))

                order_obj = JewelryOrder(
                    order_id=next_order_id(),
                    user=customer.user,
                    product=product,
                    product_name=product.name,
                    product_metal=product.metal,
                    product_grade=product.grade or '',
                    product_category=product.category,
                    product_image_url=product_image_urls.get(product.id, ''),
                    customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                    customer_phone=customer.mobile_number,
                    customer_alt_phone='',
                    customer_dob=customer.dob,
                    customer_anniversary=customer.anniversary_date,
                    pincode=str(random.randint(600001, 643001)),
                    address_line1=random.choice(ADDRESS_LINES),
                    address_line2=customer.town_name or '',
                    city=customer.city_name,
                    state=customer.state,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=total_price,
                    payment_method=random.choice(PAYMENT_METHODS),
                    payment_status='paid',
                    status=random.choice(ORDER_STATUSES),
                )
                order_obj._staggered_time = order_time
                batch.append(order_obj)

                if len(batch) >= BATCH_SIZE:
                    flush_batch()

            if is_high_value:
                safety_limit = 200
                loops = 0
                while customer_running_total < high_value_threshold and loops < safety_limit:
                    product = random.choice(products)
                    qty = random.randint(1, 2)
                    unit_price = float(product.price or 0)
                    total_price = round(unit_price * qty, 2)
                    customer_running_total += total_price
                    loops += 1

                    order_time = timezone.now() - timedelta(minutes=random.choice(GAP_OPTIONS_MINUTES))

                    order_obj = JewelryOrder(
                        order_id=next_order_id(),
                        user=customer.user,
                        product=product,
                        product_name=product.name,
                        product_metal=product.metal,
                        product_grade=product.grade or '',
                        product_category=product.category,
                        product_image_url=product_image_urls.get(product.id, ''),
                        customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                        customer_phone=customer.mobile_number,
                        customer_alt_phone='',
                        customer_dob=customer.dob,
                        customer_anniversary=customer.anniversary_date,
                        pincode=str(random.randint(600001, 643001)),
                        address_line1=random.choice(ADDRESS_LINES),
                        address_line2=customer.town_name or '',
                        city=customer.city_name,
                        state=customer.state,
                        quantity=qty,
                        unit_price=unit_price,
                        total_price=total_price,
                        payment_method=random.choice(PAYMENT_METHODS),
                        payment_status='paid',
                        status=random.choice(ORDER_STATUSES),
                    )
                    order_obj._staggered_time = order_time
                    batch.append(order_obj)

                    if len(batch) >= BATCH_SIZE:
                        flush_batch()

                self.stdout.write(self.style.SUCCESS(
                    f"  High-value: {customer.customer_id} ({customer.first_name}) reached ₹{customer_running_total:,.2f}"
                ))

        flush_batch()

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created} total JewelryOrder rows created."))
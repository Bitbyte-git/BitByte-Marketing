from django.db import migrations, models
from django.utils import timezone


def populate_product_codes(apps, schema_editor):
    JewelryProduct = apps.get_model('accounts', 'JewelryProduct')
    year = timezone.now().year
    count = 1
    for product in JewelryProduct.objects.filter(product_code='').order_by('id'):
        new_code = f"JWL{year}{count:05d}"
        while JewelryProduct.objects.filter(product_code=new_code).exists():
            count += 1
            new_code = f"JWL{year}{count:05d}"
        product.product_code = new_code
        product.save(update_fields=['product_code'])
        count += 1


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0048_alter_autopaymandate_razorpay_subscription_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='jewelryproduct',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name='jewelryproduct',
            name='stock_quantity',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='jewelryproduct',
            name='product_code',
            field=models.CharField(blank=True, max_length=20, default=''),
        ),
        migrations.RunPython(populate_product_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='jewelryproduct',
            name='product_code',
            field=models.CharField(blank=True, max_length=20, unique=True),
        ),
    ]
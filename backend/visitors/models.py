from django.db import models

class Visitor(models.Model):

    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Checked In', 'Checked In'),
        ('Checked Out', 'Checked Out'),
    ]

    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    mobile = models.CharField(max_length=15)

    company_name = models.CharField(max_length=100)

    purpose = models.TextField()

    plant = models.CharField(max_length=100)

    employee_name = models.CharField(max_length=100)

    visit_date = models.DateField()

    visit_time = models.TimeField()

    check_in = models.DateTimeField(null=True, blank=True)

    check_out = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Scheduled'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

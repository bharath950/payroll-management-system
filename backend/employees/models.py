from django.db import models

class Employee(models.Model):

    employee_code = models.CharField(max_length=50)

    full_name = models.CharField(max_length=100)

    email = models.EmailField()

    mobile = models.CharField(max_length=15)

    department = models.CharField(max_length=100)

    plant = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name
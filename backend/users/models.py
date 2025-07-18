from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Add any additional fields you might need for your users later, e.g.:
    # phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)
    # subscription_plan = models.CharField(max_length=20, default='free')
    # Add reverse relations if needed
    # For now, we'll stick to a minimal custom user model
    pass

    def __str__(self):
        return self.username
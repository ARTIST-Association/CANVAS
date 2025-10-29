from django.db import models
from django.utils import timezone

from project_management.models import Project


# Create your models here.
class Job(models.Model):
    """Model representing a job."""

    starting_time = models.DateTimeField(default=timezone.now)
    owner = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True)

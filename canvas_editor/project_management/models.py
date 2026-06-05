from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """Represents a project in the database, contains all the necessary fields to configure a project."""

    name = models.CharField(max_length=300)
    description = models.CharField(max_length=500, blank=True, default="")
    last_edited = models.DateTimeField(default=timezone.now)
    last_shared = models.DateTimeField(null=True, blank=True)
    favorite = models.BooleanField(default=False)
    preview = models.ImageField(
        upload_to="project_previews/",
    )
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")

    class Meta:
        """Specifies that the name and owner field must be unique together."""

        # Make each combination of owner and project name unique
        unique_together = [["name", "owner"]]

    def save(self, *args, **kwargs):
        """Create the settings object on save if not yet created."""
        super().save(*args, **kwargs)
        if not hasattr(self, "settings"):
            Settings.objects.create(project=self)

    def __str__(self) -> str:
        """Get the name of the project."""
        return self.name


class SceneObject(models.Model):
    """A single object placed in a project's scene (heliostat, receiver, ...).

    The concrete type is identified by ``type`` and validated against the
    object-type registry (:mod:`project_management.object_types`). All
    type-specific data lives in ``properties`` (JSON), so adding a new object
    type needs only a registry entry - no schema migration.
    """

    project = models.ForeignKey(Project, related_name="scene_objects", on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    name = models.CharField(max_length=200, blank=True, default="")
    properties = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        """Get the stringified version of the scene object."""
        return f"{self.project} {self.type} {self.pk}"


class Settings(models.Model):
    """Represents the settings in the database, contains all the necessary fields to configure the settings for a project."""

    project = models.OneToOneField(Project, related_name="settings", on_delete=models.CASCADE)

    # Graphic settings
    shadows = models.BooleanField(default=True)
    fog = models.BooleanField(default=True)

    def __str__(self) -> str:
        """Get the stringified version of the settings module."""
        return str(self.project) + " Settings"

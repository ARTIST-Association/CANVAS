from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone

from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_PROJECT_NAME_2,
    TEST_USERNAME,
)
from project_management import object_types
from project_management.models import Project, SceneObject, Settings


class ModelTests(TestCase):
    """Tests for the models in project_management/models.py."""

    def setUp(self):
        """Set up a test user and create a test project for use in all tests."""
        self.user = User.objects.create_user(username=TEST_USERNAME, password=SECURE_PASSWORD)
        self.project = Project.objects.create(
            name=TEST_PROJECT_NAME,
            description=TEST_PROJECT_DESCRIPTION,
            owner=self.user,
        )

    def test_project(self):
        """Test the Project model."""
        project2 = Project.objects.create(name=TEST_PROJECT_NAME_2, owner=self.user)

        self.assertTrue(isinstance(self.project, Project))
        self.assertEqual(str(self.project), TEST_PROJECT_NAME)
        self.assertEqual(self.project.description, TEST_PROJECT_DESCRIPTION)
        self.assertEqual(project2.description, "")
        self.assertEqual(self.project.owner, self.user)
        self.assertEqual(self.project.favorite, False)
        self.assertTrue((self.project.last_edited - timezone.now()).total_seconds() <= 3)
        self.assertEqual(self.project.last_shared, None)
        self.assertFalse(self.project.preview)
        try:
            Project.objects.create(name=TEST_PROJECT_NAME, owner=self.user)
        except IntegrityError as exc:
            duplicate_exception = exc
        self.assertEqual(
            str(duplicate_exception),
            "UNIQUE constraint failed: project_management_project.name, project_management_project.owner_id",
        )

    def test_scene_object(self):
        """A SceneObject stores its type, name and JSON properties."""
        obj = SceneObject.objects.create(
            project=self.project, type="heliostat", name="H", properties={"position": [1, 2, 3]}
        )
        self.assertEqual(obj.project, self.project)
        self.assertEqual(obj.type, "heliostat")
        self.assertEqual(obj.properties["position"], [1, 2, 3])
        self.assertEqual(str(obj), f"{self.project} heliostat {obj.pk}")
        self.assertEqual(list(self.project.scene_objects.all()), [obj])

    def test_registry_defaults_and_validation(self):
        """The object-type registry defaults and validates properties."""
        self.assertEqual(object_types.default_properties("heliostat"), {"position": [0.0, 0.0, 0.0]})
        # missing values are defaulted; unknown/invalid ones are rejected.
        self.assertEqual(object_types.validate_properties("receiver", {})["resolution_e"], 256)
        with self.assertRaises(object_types.SchemaError):
            object_types.validate_properties("heliostat", {"position": [1, 2]})
        with self.assertRaises(object_types.SchemaError):
            object_types.validate_properties("nope", {})

    def test_settings(self):
        """Test the Settings model."""
        settings = self.project.settings

        self.assertTrue(isinstance(settings, Settings))
        self.assertTrue(settings.shadows)
        self.assertTrue(settings.fog)
        self.assertEqual(str(settings), f"{settings.project} {settings.__class__.__name__}")

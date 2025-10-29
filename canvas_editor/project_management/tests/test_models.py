from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone

from canvas.test_constants import (
    HELIOSTAT_POSITION_X,
    HELIOSTAT_POSITION_Y,
    HELIOSTAT_POSITION_Z,
    LIGHT_SOURCE_COVARIANCE,
    LIGHT_SOURCE_DISTRIBUTION_TYPE,
    LIGHT_SOURCE_MEAN,
    LIGHT_SOURCE_NUMBER_OF_RAYS,
    LIGHT_SOURCE_TYPE,
    RECEIVER_CURVATURE_E,
    RECEIVER_CURVATURE_U,
    RECEIVER_NORMAL_X,
    RECEIVER_NORMAL_Y,
    RECEIVER_NORMAL_Z,
    RECEIVER_PLANE_E,
    RECEIVER_PLANE_U,
    RECEIVER_POSITION_X,
    RECEIVER_POSITION_Y,
    RECEIVER_POSITION_Z,
    RECEIVER_RESOLUTION_E,
    RECEIVER_RESOLUTION_U,
    RECEIVER_TYPE_PLANAR,
    SECURE_PASSWORD,
    TEST_HELIOSTAT_NAME,
    TEST_LIGHT_SOURCE_NAME,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_PROJECT_NAME_2,
    TEST_RECEIVER_NAME,
    TEST_USERNAME,
)
from project_management.models import (
    Heliostat,
    LightSource,
    Project,
    Receiver,
    Settings,
)


class ModelTests(TestCase):
    """Tests for the models in project_management/models.py."""

    def setUp(self):
        """Set up a test user and create a test project for use in all tests."""
        self.user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
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
        self.assertTrue(
            (self.project.last_edited - timezone.now()).total_seconds() <= 3
        )
        self.assertEqual(self.project.last_shared, None)
        self.assertFalse(self.project.preview)
        try:
            Project.objects.create(
                name=TEST_PROJECT_NAME,
                description=TEST_PROJECT_DESCRIPTION,
                owner=self.user,
            )
        except IntegrityError as e:
            duplicate_exception = e
        self.assertEqual(
            str(duplicate_exception),
            "UNIQUE constraint failed: project_management_project.name, project_management_project.owner_id",
        )

    def test_heliostat(self):
        """Test the Heliostat model."""
        heliostat = Heliostat.objects.create(project=self.project)

        self.assertTrue(isinstance(heliostat, Heliostat))
        self.assertEqual(heliostat.project, self.project)
        self.assertEqual(heliostat.name, TEST_HELIOSTAT_NAME)
        self.assertEqual(heliostat.position_x, HELIOSTAT_POSITION_X)
        self.assertEqual(heliostat.position_y, HELIOSTAT_POSITION_Y)
        self.assertEqual(heliostat.position_z, HELIOSTAT_POSITION_Z)
        self.assertEqual(
            str(heliostat),
            f"{heliostat.project} {heliostat.__class__.__name__} {heliostat.pk}",
        )

    def test_receiver(self):
        """Test the Receiver model."""
        receiver = Receiver.objects.create(project=self.project)

        self.assertTrue(isinstance(receiver, Receiver))
        self.assertEqual(receiver.name, TEST_RECEIVER_NAME)
        self.assertEqual(receiver.position_x, RECEIVER_POSITION_X)
        self.assertEqual(receiver.position_y, RECEIVER_POSITION_Y)
        self.assertEqual(receiver.position_z, RECEIVER_POSITION_Z)
        self.assertEqual(receiver.normal_x, RECEIVER_NORMAL_X)
        self.assertEqual(receiver.normal_y, RECEIVER_NORMAL_Y)
        self.assertEqual(receiver.normal_z, RECEIVER_NORMAL_Z)
        self.assertEqual(receiver.receiver_type, RECEIVER_TYPE_PLANAR)
        self.assertEqual(receiver.curvature_e, RECEIVER_CURVATURE_E)
        self.assertEqual(receiver.curvature_u, RECEIVER_CURVATURE_U)
        self.assertEqual(receiver.plane_e, RECEIVER_PLANE_E)
        self.assertEqual(receiver.plane_u, RECEIVER_PLANE_U)
        self.assertEqual(receiver.resolution_e, RECEIVER_RESOLUTION_E)
        self.assertEqual(receiver.resolution_u, RECEIVER_RESOLUTION_U)
        self.assertEqual(
            str(receiver),
            f"{receiver.project} {receiver.__class__.__name__} {receiver.pk}",
        )

    def test_light_source(self):
        """Test the LightSource model."""
        light_source = LightSource.objects.create(project=self.project)

        self.assertTrue(isinstance(light_source, LightSource))
        self.assertEqual(light_source.name, TEST_LIGHT_SOURCE_NAME)
        self.assertEqual(light_source.number_of_rays, LIGHT_SOURCE_NUMBER_OF_RAYS)
        self.assertEqual(light_source.light_source_type, LIGHT_SOURCE_TYPE)
        self.assertEqual(light_source.distribution_type, LIGHT_SOURCE_DISTRIBUTION_TYPE)
        self.assertEqual(light_source.mean, LIGHT_SOURCE_MEAN)
        self.assertEqual(light_source.covariance, LIGHT_SOURCE_COVARIANCE)
        self.assertEqual(
            str(light_source),
            f"{light_source.project} {light_source.__class__.__name__} {light_source.pk}",
        )

    def test_settings(self):
        """Test the Settings model."""
        settings = self.project.settings

        self.assertTrue(isinstance(settings, Settings))
        self.assertTrue(settings.shadows)
        self.assertTrue(settings.fog)
        self.assertEqual(
            str(settings),
            f"{settings.project} {settings.__class__.__name__}",
        )

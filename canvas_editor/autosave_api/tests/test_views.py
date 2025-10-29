from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from parameterized import parameterized
from rest_framework import status
from rest_framework.test import APIClient

from autosave_api.serializers import (
    HeliostatSerializer,
    LightSourceSerializer,
    ReceiverSerializer,
)
from canvas.test_constants import (
    HELIOSTAT_LIST_NAME,
    HELIOSTAT_NAME,
    LIGHT_SOURCE_LIST_NAME,
    LIGHT_SOURCE_NAME,
    NEW_HELIOSTAT_NAME,
    NEW_LIGHT_SOURCE_NAME,
    NEW_PROJECT_NAME,
    NEW_RECEIVER_NAME,
    POSITION_COORDINATE,
    RECEIVER_LIST_NAME,
    RECEIVER_NAME,
    RECEIVER_TYPE,
    SECURE_PASSWORD,
    TEST_FLOAT_NUMBER,
    TEST_NUMBER,
    TEST_PROJECT_NAME,
    TEST_TYPE,
    TEST_USERNAME,
)
from canvas.view_name_dict import (
    autosave_heliostat_detail_view,
    autosave_light_source_detail_view,
    autosave_project_detail_view,
    autosave_project_list_view,
    autosave_receiver_detail_view,
    autosave_settings_detail_view,
)
from project_management.models import (
    Heliostat,
    LightSource,
    Project,
    Receiver,
    Settings,
)


class APITestCase(TestCase):
    """Contains test cases for the autosave api for all valid end points and methods."""

    def setUp(self):
        """Set up a test user, log in, and create a test project for use in all tests."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)
        self.project = Project.objects.create(name=TEST_PROJECT_NAME, owner=self.user)

    def test_create_project(self):
        """Test creating a new project via the API."""
        url = reverse(autosave_project_list_view)
        data = {"name": NEW_PROJECT_NAME}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.get(id=response.data["id"]).owner, self.user)

    def test_get_projects(self):
        """Test retrieving the list of projects for the logged-in user."""
        url = reverse(autosave_project_list_view)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], self.project.name)

    def test_get_project_detail(self):
        """Test retrieving the details of a specific project."""
        url = reverse(autosave_project_detail_view, kwargs={"pk": self.project.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.project.name)

    def test_get_heliostat_detail(self):
        """Test retrieving the details of a specific heliostat."""
        heliostat = Heliostat.objects.create(name=HELIOSTAT_NAME, project=self.project)
        heliostat.position_x = POSITION_COORDINATE
        heliostat.position_y = POSITION_COORDINATE
        heliostat.position_z = POSITION_COORDINATE
        heliostat.aimpoint_x = POSITION_COORDINATE
        heliostat.aimpoint_y = POSITION_COORDINATE
        heliostat.aimpoint_z = POSITION_COORDINATE
        heliostat.number_of_facets = TEST_NUMBER
        heliostat.kinematic_type = TEST_TYPE
        heliostat.save()
        url = reverse(
            autosave_heliostat_detail_view,
            kwargs={"project_id": self.project.id, "pk": heliostat.id},
        )
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, HeliostatSerializer(heliostat).data)

    def test_get_receiver_detail(self):
        """Test retrieving the details of a specific receiver."""
        receiver = Receiver.objects.create(name=RECEIVER_NAME, project=self.project)
        receiver.position_x = POSITION_COORDINATE
        receiver.position_y = POSITION_COORDINATE
        receiver.position_z = POSITION_COORDINATE
        receiver.normal_x = POSITION_COORDINATE
        receiver.normal_y = POSITION_COORDINATE
        receiver.normal_z = POSITION_COORDINATE
        receiver.rotation_y = POSITION_COORDINATE
        receiver.receiver_type = RECEIVER_TYPE
        receiver.curvature_e = POSITION_COORDINATE
        receiver.curvature_u = POSITION_COORDINATE
        receiver.plane_e = POSITION_COORDINATE
        receiver.plane_u = POSITION_COORDINATE
        receiver.resolution_e = POSITION_COORDINATE
        receiver.resolution_u = POSITION_COORDINATE
        receiver.save()
        url = reverse(
            autosave_receiver_detail_view,
            kwargs={"project_id": self.project.id, "pk": receiver.id},
        )
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, ReceiverSerializer(receiver).data)

    def test_get_lightsource_detail(self):
        """Test retrieving the details of a specific light source."""
        light_source = LightSource.objects.create(
            name=LIGHT_SOURCE_NAME, project=self.project
        )
        light_source.number_of_rays = TEST_NUMBER
        light_source.light_source_type = TEST_TYPE
        light_source.distribution_type = TEST_TYPE
        light_source.mean = TEST_FLOAT_NUMBER
        light_source.covariance = TEST_FLOAT_NUMBER
        light_source.save()

        url = reverse(
            autosave_light_source_detail_view,
            kwargs={"project_id": self.project.id, "pk": light_source.id},
        )
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, LightSourceSerializer(light_source).data)

    def test_update_settings(self):
        """Test updating the settings for a project."""
        settings = Settings.objects.get(project=self.project)
        url = reverse(
            autosave_settings_detail_view, kwargs={"project_id": self.project.id}
        )
        data = {"shadows": False, "fog": False}
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.shadows, False)
        self.assertEqual(settings.fog, False)

    def create_object(self, url_list_name, data_name, model_class):
        """Create an object (heliostat, receiver, or light source) for a project."""
        url = reverse(url_list_name, kwargs={"project_id": self.project.id})
        data = {"name": data_name}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(model_class.objects.count(), 1)
        self.assertEqual(
            model_class.objects.get(id=response.data["id"]).project, self.project
        )

    @parameterized.expand(
        [
            (HELIOSTAT_LIST_NAME, NEW_HELIOSTAT_NAME, Heliostat),
            (RECEIVER_LIST_NAME, NEW_RECEIVER_NAME, Receiver),
            (LIGHT_SOURCE_LIST_NAME, NEW_LIGHT_SOURCE_NAME, LightSource),
        ]
    )
    def test_create_object(self, url_list_name, data_name, model_class):
        """Parameterized test for creating heliostat, receiver, or light source objects."""
        self.create_object(url_list_name, data_name, model_class)

    def get_objects(self, model_class, model_name, url_list_name):
        """Retrieve a list of objects (heliostats, receivers, or light sources) for a project."""
        model_class.objects.create(name=model_name, project=self.project)
        url = reverse(url_list_name, kwargs={"project_id": self.project.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], model_name)

    @parameterized.expand(
        [
            (Heliostat, HELIOSTAT_NAME, HELIOSTAT_LIST_NAME),
            (Receiver, RECEIVER_NAME, RECEIVER_LIST_NAME),
            (LightSource, LIGHT_SOURCE_NAME, LIGHT_SOURCE_LIST_NAME),
        ]
    )
    def test_get_objects(self, model_class, model_name, url_list_name):
        """Parameterized test for retrieving lists of heliostats, receivers, or light sources."""
        self.get_objects(model_class, model_name, url_list_name)

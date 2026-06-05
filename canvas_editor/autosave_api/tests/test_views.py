from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from project_management.models import Project, SceneObject, Settings

USERNAME = "testuser"
PASSWORD = "SecurePass123!"


class AutosaveApiTests(TestCase):
    """Tests for the generic, registry-driven autosave API."""

    def setUp(self):
        """Create and log in a user with one project."""
        self.client = APIClient()
        self.user = User.objects.create_user(username=USERNAME, password=PASSWORD)
        self.client.login(username=USERNAME, password=PASSWORD)
        self.project = Project.objects.create(name="Test project", owner=self.user)

    def _objects_url(self):
        return reverse("autosave_scene_object_list_view", kwargs={"project_id": self.project.id})

    def _object_url(self, pk):
        return reverse("autosave_scene_object_detail_view", kwargs={"project_id": self.project.id, "pk": pk})

    def test_object_types_endpoint(self):
        """The registry endpoint lists every known type with its schema."""
        response = self.client.get(reverse("autosave_object_type_list_view"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = {entry["type"] for entry in response.data}
        self.assertEqual(types, {"heliostat", "receiver", "light_source", "target_point"})
        heliostat = next(entry for entry in response.data if entry["type"] == "heliostat")
        self.assertEqual(heliostat["fields"][0]["name"], "position")

    def test_create_project(self):
        """A project can be created via the API and is owned by the requester."""
        response = self.client.post(reverse("autosave_project_list_view"), {"name": "New"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.get(id=response.data["id"]).owner, self.user)

    def test_project_detail_has_objects_and_settings(self):
        """The detail payload bundles the project's objects and settings."""
        SceneObject.objects.create(project=self.project, type="heliostat", name="H", properties={"position": [1, 2, 3]})
        url = reverse("autosave_project_detail_list_view", kwargs={"pk": self.project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["objects"]), 1)
        self.assertIn("settings", response.data)

    def test_create_object_fills_defaults(self):
        """Missing properties are defaulted from the registry on create."""
        response = self.client.post(
            self._objects_url(), {"type": "heliostat", "name": "H", "properties": {}}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = SceneObject.objects.get(id=response.data["id"])
        self.assertEqual(created.project, self.project)
        self.assertEqual(created.properties["position"], [0.0, 0.0, 0.0])

    def test_create_object_rejects_unknown_type(self):
        """An unknown type is rejected with 400."""
        response = self.client.post(self._objects_url(), {"type": "nope", "properties": {}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_object_rejects_invalid_property(self):
        """A malformed property value is rejected with 400."""
        response = self.client.post(
            self._objects_url(), {"type": "heliostat", "properties": {"position": [1, 2]}}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_object_rejects_unknown_property(self):
        """An unknown property key is rejected with 400."""
        response = self.client.post(
            self._objects_url(), {"type": "heliostat", "properties": {"bogus": 1}}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_objects(self):
        """The list endpoint returns the project's objects."""
        SceneObject.objects.create(project=self.project, type="receiver", properties={})
        response = self.client.get(self._objects_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_object(self):
        """An object's name and properties can be updated."""
        obj = SceneObject.objects.create(
            project=self.project, type="heliostat", name="H", properties={"position": [0, 0, 0]}
        )
        response = self.client.put(
            self._object_url(obj.id),
            {"type": "heliostat", "name": "H2", "properties": {"position": [5, 6, 7]}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj.refresh_from_db()
        self.assertEqual(obj.name, "H2")
        self.assertEqual(obj.properties["position"], [5, 6, 7])

    def test_delete_object(self):
        """An object can be deleted."""
        obj = SceneObject.objects.create(project=self.project, type="heliostat", properties={})
        response = self.client.delete(self._object_url(obj.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SceneObject.objects.count(), 0)

    def test_update_settings(self):
        """Project settings can be updated."""
        url = reverse("autosave_settings_detail_view", kwargs={"project_id": self.project.id})
        response = self.client.put(url, {"shadows": False, "fog": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings = Settings.objects.get(project=self.project)
        self.assertFalse(settings.shadows)
        self.assertFalse(settings.fog)

    def test_requires_authentication(self):
        """Anonymous requests are rejected."""
        self.client.logout()
        response = self.client.get(self._objects_url())
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

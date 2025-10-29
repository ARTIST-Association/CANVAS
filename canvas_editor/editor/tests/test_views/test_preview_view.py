import os

from django.conf import settings
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from canvas.path_dict import empty_editor_image
from canvas.test_constants import (
    PREVIEW_FIELD,
    PROJECT_NAME_FIELD,
    SECURE_PASSWORD,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_USERNAME,
)
from canvas.view_name_dict import editor_upload_view
from project_management.models import Project


class PreviewViewTest(TestCase):
    """Tests for the preview view."""

    def setUp(self):
        """Set up a test user, log in, and create a test project for use in all tests."""
        self.upload = reverse(
            editor_upload_view, kwargs={PROJECT_NAME_FIELD: TEST_PROJECT_NAME}
        )
        user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.client = Client()
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

        project = Project()
        project.name = TEST_PROJECT_NAME
        project.description = TEST_PROJECT_DESCRIPTION
        project.owner = user
        project.save()

    def test_upload(self):
        """Test uploading a preview image for a project."""
        test_file_path = os.path.join(settings.BASE_DIR, empty_editor_image)
        with open(test_file_path, "rb") as hdf5_file:
            data = {
                PREVIEW_FIELD: hdf5_file,
            }
            self.client.post(self.upload, data=data)
        project = Project.objects.get(name=TEST_PROJECT_NAME)
        # As the project has no file attribute assiciated with it when created, checking if it now exits tests the upload functionality
        self.assertIsNotNone(project.preview.file)

    def test_wrong_method(self):
        """Test that uploading a file with a GET request returns a 405 error."""
        response = self.client.get(self.upload)
        self.assertEqual(response.status_code, 405)

    def test_upload_logged_out(self):
        """Test that uploading a file while logged out redirects to login page."""
        self.client.logout()
        response = self.client.get(self.upload)
        self.assertEqual(response.status_code, 302)

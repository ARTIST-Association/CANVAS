from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from canvas.test_constants import (
    PROJECT_NAME_FIELD,
    SECURE_PASSWORD,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_USERNAME,
)
from canvas.view_name_dict import editor_view
from project_management.models import Project


class EditorViewTest(TestCase):
    """Test suite for the EditorView.

    This test suite includes tests for both GET and POST methods of the editor view.
    It ensures that the editor view behaves correctly when accessed and when form data is submitted.

    Methods
    -------
    setUp(self):
        Set up the test environment by creating a user and a project.
    test_get_method(self):
        Test the GET method of the editor view to ensure it returns the correct status code and context data.
    """

    def setUp(self):
        """Set up a test user and a test project for use in all tests."""
        # create new user
        user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.client = Client()
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

        # create new project
        project = Project()
        project.name = TEST_PROJECT_NAME
        project.description = TEST_PROJECT_DESCRIPTION
        project.owner = user
        project.save()

    def test_get_method(self):
        """Test the GET method of the editor view."""
        self.editor = reverse(
            editor_view, kwargs={PROJECT_NAME_FIELD: TEST_PROJECT_NAME}
        )
        response = self.client.get(self.editor)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context[PROJECT_NAME_FIELD], TEST_PROJECT_NAME)

    def test_get_method_logged_out(self):
        """Test that accessing the editor view when logged out redirects to login page."""
        self.client.logout()
        self.editor = reverse(
            editor_view, kwargs={PROJECT_NAME_FIELD: TEST_PROJECT_NAME}
        )
        response = self.client.get(self.editor)
        self.assertEqual(response.status_code, 302)

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import path_dict, view_name_dict
from canvas.test_constants import (
    EMAIL_FIELD,
    MISMATCHED_BUT_CORRECT_PASSWORD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
)


class LoginTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the login view.

    This test case covers the following scenarios:
    - Accessing the login page via GET request.
    - Logging in with valid credentials.
    - Attempting to log in with invalid credentials.
    """

    def setUp(self):
        """
        Set up the test client, user, and login URL for each test.

        Creates a test user for login tests.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.login_url = reverse(view_name_dict.account_login_view)

    def test_get(self):
        """
        Test that the login page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(self.login_url, path_dict.login_template)

    def test_post_valid(self):
        """
        Test that a valid POST request logs in the user and redirects to the projects page.

        Asserts that the response is a redirect to the projects page.
        """
        response = self.client.post(
            self.login_url,
            {EMAIL_FIELD: TEST_EMAIL, PASSWORD_FIELD: SECURE_PASSWORD},
        )

        self.assertRedirects(response, reverse(view_name_dict.account_projects_view))

    def test_post_invalid(self):
        """
        Test that an invalid POST request does not log in the user and returns the login page.

        Asserts that the response status code is 200 and the login template is used.
        """
        response = self.client.post(
            self.login_url,
            {EMAIL_FIELD: TEST_EMAIL, PASSWORD_FIELD: MISMATCHED_BUT_CORRECT_PASSWORD},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, path_dict.login_template)

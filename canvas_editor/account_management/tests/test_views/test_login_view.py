from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import message_dict, path_dict, view_name_dict
from canvas.test_constants import (
    EMAIL_FIELD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    WRONG_EMAIL,
)


class LoginViewTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the login view.

    This test case covers the following scenarios:
    - Accessing the login page via GET request.
    - Redirecting authenticated users from the login page to the projects page.
    - Logging in with valid credentials.
    - Attempting to log in with invalid credentials.
    """

    def setUp(self):
        """
        Set up the test client, user, login URL, and projects URL for each test.

        Creates a test user for login tests.
        """
        self.client = Client()
        self.login_url = reverse(view_name_dict.account_login_view)
        self.projects_url = reverse(view_name_dict.account_projects_view)
        self.user = User.objects.create_user(
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            username=TEST_EMAIL,
        )

    def test_get(self):
        """
        Test that the login page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(self.login_url, path_dict.login_template)

    def test_get_authenticated(self):
        """
        Test that an authenticated user is redirected to the projects page when accessing the login page.

        Asserts that the redirection occurs for authenticated users.
        """
        self.get_authenticated(self.login_url)

    def test_post_valid_data(self):
        """
        Test that a valid user can successfully log in and is redirected to the projects page.

        Asserts that the response is a redirect and the user is authenticated.
        """
        response = self.client.post(
            self.login_url,
            {
                EMAIL_FIELD: TEST_EMAIL,
                PASSWORD_FIELD: SECURE_PASSWORD,
            },
        )

        user = User.objects.get(email=TEST_EMAIL)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.projects_url)
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

    def test_post_invalid_data(self):
        """
        Test that an invalid login attempt (wrong email) results in an error message.

        Asserts that the response status code is 200, the login template is used, and an error message is shown.
        """
        response = self.client.post(
            self.login_url,
            {
                EMAIL_FIELD: WRONG_EMAIL,
                PASSWORD_FIELD: SECURE_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, path_dict.login_template)
        self.assertTrue(response.context["form"].errors)
        self.assertContains(response, message_dict.email_not_registered_text)

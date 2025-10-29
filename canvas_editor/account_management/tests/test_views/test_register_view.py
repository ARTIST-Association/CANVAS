from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import message_dict, path_dict, view_name_dict
from canvas.test_constants import (
    EMAIL_FIELD,
    FIRST_NAME_FIELD,
    LAST_NAME_FIELD,
    MISMATCHED_BUT_CORRECT_PASSWORD,
    PASSWORD_CONFIRMATION_FIELD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    WRONG_EMAIL,
)


class RegisterViewTests(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the register view.

    This test case covers the following scenarios:
    - Accessing the register page via GET request.
    - Redirecting authenticated users from the register page to the projects page.
    - Registering a new user with valid data.
    - Handling invalid registration data (mismatched passwords).
    """

    def setUp(self):
        """
        Set up the test client, user, register URL, projects URL, and valid user data for each test.

        Creates a test user and prepares valid registration data.
        """
        self.client = Client()
        self.register_url = reverse(view_name_dict.account_register_view)
        self.projects_url = reverse(view_name_dict.account_projects_view)
        self.user = User.objects.create_user(
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            username=TEST_EMAIL,
        )
        self.valid_user_data = {
            FIRST_NAME_FIELD: TEST_FIRST_NAME,
            LAST_NAME_FIELD: TEST_LAST_NAME,
            EMAIL_FIELD: WRONG_EMAIL,
            PASSWORD_FIELD: SECURE_PASSWORD,
            PASSWORD_CONFIRMATION_FIELD: SECURE_PASSWORD,
        }

    def test_get(self):
        """
        Test that the register page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(self.register_url, path_dict.register_template)

    def test_get_authenticated(self):
        """
        Test that an authenticated user is redirected to the projects page when accessing the register page.

        Asserts that the redirection occurs for authenticated users.
        """
        self.get_authenticated(self.register_url)

    def test_post_valid_data(self):
        """
        Test that a new user can successfully register and is redirected to the projects page.

        Asserts that the user is created, logged in, and redirected.
        """
        response = self.client.post(
            self.register_url,
            self.valid_user_data,
        )
        user = User.objects.get(email=WRONG_EMAIL)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.projects_url)
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

    def test_post_invalid_data(self):
        """
        Test that invalid registration data (mismatched passwords) results in an error message.

        Asserts that the response status code is 200, the register template is used, and an error message is shown.
        """
        response = self.client.post(
            self.register_url,
            {
                FIRST_NAME_FIELD: TEST_FIRST_NAME,
                LAST_NAME_FIELD: TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                PASSWORD_FIELD: SECURE_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: MISMATCHED_BUT_CORRECT_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, path_dict.register_template)
        self.assertContains(response, message_dict.password_match_criterion_text)
        self.assertTrue(response.context["form"].errors)

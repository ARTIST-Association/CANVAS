from django.contrib.auth.models import User
from django.core import mail
from django.test import Client, TestCase
from django.urls import reverse

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import path_dict, view_name_dict
from canvas.test_constants import (
    EMAIL_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
    WRONG_EMAIL,
)


class PasswordForgottenViewTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the password forgotten view.

    This test case covers the following scenarios:
    - Accessing the password forgotten page via GET request.
    - Submitting a valid email for password reset and verifying redirection.
    - Submitting an invalid email and verifying error handling.
    """

    def setUp(self):
        """
        Set up the test client, user, and password forgotten URL for each test.

        Creates a test user for password reset tests.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.password_forgotten_url = reverse(
            view_name_dict.account_password_forgotten_view
        )

    def test_get(self):
        """
        Test that the password forgotten page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(
            self.password_forgotten_url,
            path_dict.password_forgotten_template,
        )

    def test_post_valid_data(self):
        """
        Test that submitting a valid email for password reset redirects to the login page.

        Asserts that the response is a redirect to the login page.
        """
        response = self.client.post(
            self.password_forgotten_url,
            {EMAIL_FIELD: TEST_EMAIL},
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(view_name_dict.account_login_view))

    def test_post_invalid_data(self):
        """
        Test that submitting an unregistered email returns an error message and does not send email.

        Asserts that the response status code is 200 and no email is sent.
        """
        response = self.client.post(
            self.password_forgotten_url,
            {EMAIL_FIELD: WRONG_EMAIL},
        )

        self.assertEqual(response.status_code, 200)
        assert len(mail.outbox) == 0

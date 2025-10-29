from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from canvas import view_name_dict
from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
)


class LogoutViewTest(TestCase):
    """
    Tests for the logout view.

    This test case covers the following scenarios:
    - Sending a GET request to the logout endpoint (should not be allowed).
    - Logging out via POST request and verifying redirection and session clearance.
    """

    def setUp(self):
        """
        Set up the test client, user, logout URL, and login URL for each test.

        Creates a test user and logs them in for logout tests.
        """
        self.client = Client()
        self.logout_url = reverse(view_name_dict.account_logout_view)
        self.login_url = reverse(view_name_dict.account_login_view)
        self.user = User.objects.create_user(
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            username=TEST_USERNAME,
        )
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

    def test_get(self):
        """
        Test that a GET request to the logout endpoint returns a 405 status code.

        Asserts that only POST requests are allowed for logout.
        """
        response = self.client.get(self.logout_url)
        self.assertEqual(response.status_code, 405)

    def test_post(self):
        """
        Test that a POST request logs out the user and redirects to the login page.

        Asserts that the response is a redirect and the session is cleared.
        """
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.login_url)
        self.assertNotIn("_auth_user_id", self.client.session)

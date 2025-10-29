from django.contrib.auth.models import User
from django.contrib.messages import get_messages
from django.test import Client, TestCase
from django.urls import reverse

from canvas import message_dict, view_name_dict
from canvas.test_constants import (
    NO_SPECIAL_CHAR_PASSWORD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
)


class DeleteAccountTest(TestCase):
    """
    Tests for the delete account view.

    This test case covers the following scenarios:
    - Sending a GET request to the delete account endpoint.
    - Deleting an account with valid credentials.
    - Attempting to delete an account with invalid credentials.
    - Attempting to delete an account when not authenticated.
    """

    def setUp(self):
        """
        Set up the test client, user, and delete account URL for each test.

        Creates a test user for account deletion tests.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.delete_account_url = reverse(view_name_dict.account_delete_account_view)

    def test_get(self):
        """
        Test that a GET request to the delete account endpoint returns a 405 status code.

        Asserts that only POST requests are allowed for account deletion.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)
        response = self.client.get(self.delete_account_url)

        self.assertEqual(response.status_code, 405)

    def test_post_valid_data(self):
        """
        Test that a valid POST request deletes the user and redirects to the login page.

        Asserts that the user is deleted, session is cleared, and redirection occurs.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)
        response = self.client.post(
            self.delete_account_url,
            {PASSWORD_FIELD: SECURE_PASSWORD},
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(view_name_dict.account_login_view))
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())

    def test_post_invalid_data(self):
        """
        Test that an incorrect password prevents account deletion.

        Asserts that an error message is shown and the user is not deleted.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)
        response = self.client.post(
            self.delete_account_url,
            {PASSWORD_FIELD: NO_SPECIAL_CHAR_PASSWORD},
        )

        self.assertEqual(response.status_code, 302)
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(
            any(message_dict.incorrect_password_text in str(msg) for msg in messages)
        )
        self.assertTrue(User.objects.filter(id=self.user.id).exists())

    def test_post_not_authenticated(self):
        """
        Test that an unauthenticated user is redirected to the login page when attempting account deletion.

        Asserts that redirection to the login page occurs.
        """
        response = self.client.post(
            self.delete_account_url,
            {PASSWORD_FIELD: SECURE_PASSWORD},
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, "/?next=/delete_account/")

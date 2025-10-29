import json

from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from canvas import view_name_dict
from canvas.test_constants import (
    IS_OPENID_USER,
    OPENID_PROVIDER_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_USERNAME,
)


class GetUserInfoTest(TestCase):
    """
    Tests for the get_user_info view.

    This test case covers the following scenarios:
    - Unauthenticated users are redirected to the login page.
    - Authenticated users without a SocialAccount receive is_openid_user: False.
    - Authenticated users with a SocialAccount receive is_openid_user: True.
    """

    def setUp(self):
        """
        Set up the test client, user, and get_user_info URL for each test.

        Creates a test user for user info retrieval tests.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME, email=TEST_EMAIL, password=SECURE_PASSWORD
        )
        self.get_user_info_url = reverse(view_name_dict.account_get_user_info_view)

    def test_get_user_info_not_authenticated(self):
        """
        Test that unauthenticated users are redirected to the login page.

        Asserts that the response status code is 302 and the URL starts with '/'.
        """
        response = self.client.get(self.get_user_info_url)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/"))

    def test_get_user_info_authenticated_without_socialaccount(self):
        """
        Test that authenticated users without a SocialAccount receive is_openid_user: False.

        Asserts that the response status code is 200 and is_openid_user is False.
        """
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)
        response = self.client.get(self.get_user_info_url)

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertFalse(response_data[IS_OPENID_USER])

    def test_get_user_info_authenticated_with_socialaccount(self):
        """
        Test that authenticated users with a SocialAccount receive is_openid_user: True.

        Asserts that the response status code is 200 and is_openid_user is True.
        """
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)
        SocialAccount.objects.create(user=self.user, provider=OPENID_PROVIDER_FIELD)

        response = self.client.get(self.get_user_info_url)

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(response_data[IS_OPENID_USER])

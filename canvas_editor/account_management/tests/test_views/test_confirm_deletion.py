from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.test import Client, TestCase
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import path_dict, view_name_dict
from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
)


class ConfirmDeletionTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the confirm deletion view.

    This test case covers the following scenarios:
    - Accessing the confirm deletion page via GET request.
    - Deleting a user via a valid POST request.
    - Handling invalid token and UID cases.
    """

    def setUp(self):
        """
        Set up the test client, user, and confirm deletion URL for each test.

        Creates a test user and generates the corresponding UID and token.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.uid = urlsafe_base64_encode(str(self.user.id).encode())
        self.token = default_token_generator.make_token(self.user)
        self.confirm_deletion_url = reverse(
            view_name_dict.account_confirm_deletion_view, args=[self.uid, self.token]
        )

    def test_get(self):
        """
        Test that the confirm deletion page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(
            self.confirm_deletion_url, path_dict.confirm_deletion_template
        )

    def test_post(self):
        """
        Test that a valid POST request deletes the user and redirects to the login page.

        Asserts that the user is deleted and the response is a redirect.
        """
        response = self.client.post(self.confirm_deletion_url)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(view_name_dict.account_login_view))
        self.assertFalse(User.objects.filter(id=self.user.id).exists())

    def test_post_invalid_token(self):
        """
        Test that an invalid token results in a redirect to the invalid link page.

        Asserts that the response is a redirect to the invalid link page.
        """
        response = self.client.post(
            reverse(
                view_name_dict.account_confirm_deletion_view,
                args=[self.uid, view_name_dict.account_invalid_token_view],
            )
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(
            response, reverse(view_name_dict.account_invalid_link_view)
        )

    def test_post_invalid_uid(self):
        """
        Test that an invalid UID results in a redirect to the invalid link page.

        Asserts that the response is a redirect to the invalid link page.
        """
        response = self.client.post(
            reverse(
                view_name_dict.account_confirm_deletion_view,
                args=[view_name_dict.account_invalid_uid_view, self.token],
            )
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(
            response, reverse(view_name_dict.account_invalid_link_view)
        )

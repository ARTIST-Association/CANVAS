from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.test import Client, TestCase
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import message_dict, path_dict, view_name_dict
from canvas.test_constants import (
    MISMATCHED_BUT_CORRECT_PASSWORD,
    NEW_PASSWORD_FIELD,
    PASSWORD_CONFIRMATION_FIELD,
    RESET_PASSWORD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
)


class PasswordResetViewTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the password reset view.

    This test case covers the following scenarios:
    - Accessing the password reset page via GET request.
    - Successfully resetting the password with valid data.
    - Handling mismatched passwords during reset.
    - Handling invalid token and UID cases.
    """

    def setUp(self):
        """
        Set up the test client, user, and password reset URL for each test.

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
        self.password_reset_url = reverse(
            view_name_dict.account_password_reset_view, args=[self.uid, self.token]
        )

    def test_get(self):
        """
        Test that the password reset page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(self.password_reset_url, path_dict.password_reset_template)

    def test_post_valid_data(self):
        """
        Test that a valid password reset request updates the password and logs the user out.

        Asserts that the password is changed, user is logged out, and redirection occurs.
        """
        response = self.client.post(
            self.password_reset_url,
            {
                NEW_PASSWORD_FIELD: RESET_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: RESET_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(view_name_dict.account_login_view))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(RESET_PASSWORD))
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_post_invalid_data(self):
        """
        Test that submitting mismatched passwords returns an error message.

        Asserts that the response status code is 200, the correct template is used, and an error message is shown.
        """
        response = self.client.post(
            self.password_reset_url,
            {
                NEW_PASSWORD_FIELD: RESET_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: MISMATCHED_BUT_CORRECT_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, path_dict.password_reset_template)
        self.assertTrue(response.context["form"].errors)
        self.assertContains(response, message_dict.password_match_criterion_text)

    def test_post_invalid_token(self):
        """
        Test that an invalid token results in a redirect to the invalid link page.

        Asserts that the response is a redirect to the invalid link page.
        """
        response = self.client.post(
            reverse(
                view_name_dict.account_password_reset_view,
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
                view_name_dict.account_password_reset_view,
                args=[view_name_dict.account_invalid_uid_view, self.token],
            )
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(
            response, reverse(view_name_dict.account_invalid_link_view)
        )

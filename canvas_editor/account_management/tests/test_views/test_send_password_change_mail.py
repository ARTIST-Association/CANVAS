from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase
from django.test.client import RequestFactory
from django.utils.http import urlsafe_base64_encode

from account_management.views.update_account_view import UpdateAccountView
from canvas import message_dict
from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TEST_USERNAME,
)


class SendPasswordChangeMailTest(TestCase):
    """
    Tests for the send_password_change_email method in UpdateAccountView.

    This test case covers the following scenario:
    - Sending a password change email and verifying its contents.
    """

    def test_send_password_change_email(self):
        """
        Test that a password change email is sent correctly.

        Asserts that:
        - One email is sent.
        - The email subject and recipient are correct.
        - The confirmation URL containing the UID and token is present in the email body.
        """
        user = User.objects.create_user(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )

        factory = RequestFactory()
        request = factory.get("/")

        UpdateAccountView._send_password_change_email(user, request)

        assert len(mail.outbox) == 1  # Check if one email was sent
        email = mail.outbox[0]

        assert (
            email.subject == message_dict.password_change_confirmation_subject
        )  # Verify email subject
        assert email.to == [TEST_EMAIL]  # Verify recipient

        uid = urlsafe_base64_encode(str(user.id).encode())
        token = default_token_generator.make_token(user)
        expected_url_part = f"password_reset/{uid}/{token}/"

        assert (
            expected_url_part in email.body
        )  # Ensure the confirmation URL is in the email body

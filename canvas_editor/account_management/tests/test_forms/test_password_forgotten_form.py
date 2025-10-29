from django.test import TestCase

from account_management.forms.password_forgotten_form import PasswordForgottenForm
from account_management.models import User
from canvas.message_dict import email_not_registered_text
from canvas.test_constants import (
    EMAIL_FIELD,
    EMPTY_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    WRONG_EMAIL,
)

from .form_test_mixin import FormTestMixin


class PasswordForgottenFormTest(FormTestMixin, TestCase):
    """Test cases for the PasswordForgottenForm."""

    form_class = PasswordForgottenForm
    default_data = {
        EMAIL_FIELD: TEST_EMAIL,
    }

    def setUp(self):
        """Set up a user for testing."""
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )

    def test_password_forgotten_form_valid_data(self):
        """Test case for valid data submission in PasswordForgottenForm."""
        form = self.create_form()
        self.assertTrue(form.is_valid())

    def test_password_forgotten_form_no_data(self):
        """Test case for PasswordForgottenForm with no data."""
        form = self.create_form(**{EMAIL_FIELD: EMPTY_FIELD})
        self.assertFalse(form.is_valid())

    def test_password_forgotten_form_wrong_email(self):
        """Test case for PasswordForgottenForm with not existing email."""
        form = self.create_form(**{EMAIL_FIELD: WRONG_EMAIL})
        self.assert_form_error_message(form, EMAIL_FIELD, email_not_registered_text)

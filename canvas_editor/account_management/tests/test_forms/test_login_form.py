from django.test import TestCase

from account_management.forms.login_form import LoginForm
from account_management.models import User
from canvas.message_dict import email_not_registered_text, incorrect_password_text
from canvas.test_constants import (
    EMAIL_FIELD,
    EMPTY_FIELD,
    NO_SPECIAL_CHAR_PASSWORD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    WRONG_EMAIL,
)

from .form_test_mixin import FormTestMixin


class LoginFormTest(FormTestMixin, TestCase):
    """Test cases for the LoginForm."""

    form_class = LoginForm
    default_data = {
        EMAIL_FIELD: TEST_EMAIL,
        PASSWORD_FIELD: SECURE_PASSWORD,
    }

    def setUp(self):
        """Set up a test user for the tests."""
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )

    def test_login_form_valid_data(self):
        """Test case for valid data submission in LoginForm."""
        form = self.create_form()
        self.assertTrue(form.is_valid())
        self.assertEqual(form.get_user(), self.user)

    def test_login_form_no_data(self):
        """Test case for LoginForm with no data."""
        form = self.create_form(
            **{
                EMAIL_FIELD: EMPTY_FIELD,
                PASSWORD_FIELD: EMPTY_FIELD,
            }
        )
        self.assertFalse(form.is_valid())

    def test_login_form_wrong_email(self):
        """Test case for LoginForm with not existing email."""
        form = self.create_form(
            **{
                EMAIL_FIELD: WRONG_EMAIL,
            }
        )
        self.assert_form_error_message(form, EMAIL_FIELD, email_not_registered_text)

    def test_login_form_wrong_password(self):
        """Test case for LoginForm with wrong password."""
        form = self.create_form(**{PASSWORD_FIELD: NO_SPECIAL_CHAR_PASSWORD})
        self.assert_form_error_message(form, PASSWORD_FIELD, incorrect_password_text)

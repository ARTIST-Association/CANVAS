from django.test import TestCase

from account_management.forms.delete_account_form import DeleteAccountForm
from account_management.models import User
from canvas.message_dict import incorrect_password_text
from canvas.test_constants import (
    EMPTY_FIELD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    WRONG_LOGIN_PASSWORD,
)

from .form_test_mixin import FormTestMixin


class DeleteAccountFormTest(FormTestMixin, TestCase):
    """Test cases for the DeleteAccountForm."""

    form_class = DeleteAccountForm
    default_data = {
        PASSWORD_FIELD: SECURE_PASSWORD,
    }

    def setUp(self):
        """Set up a user instance for testing."""
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )

    def test_delete_account_form_valid_data(self):
        """Test case for valid data submission in DeleteAccountForm."""
        form = self.create_form_with_user()
        self.assertTrue(form.is_valid())

    def test_delete_account_form_no_data(self):
        """Test case for DeleteAccountForm with no data."""
        form = self.create_form_with_user(**{PASSWORD_FIELD: EMPTY_FIELD})
        self.assertFalse(form.is_valid())

    def test_delete_account_form_wrong_password(self):
        """Test case for DeleteAccountForm with wrong password."""
        form = self.create_form_with_user(
            **{
                PASSWORD_FIELD: WRONG_LOGIN_PASSWORD,
            }
        )
        self.assert_form_error_message(form, PASSWORD_FIELD, incorrect_password_text)

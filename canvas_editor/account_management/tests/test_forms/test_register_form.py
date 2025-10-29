from django.test import TestCase

from account_management.forms.register_form import RegisterForm
from account_management.models import User
from canvas.message_dict import (
    email_already_in_use_text,
    password_digit_criterion_text,
    password_length_criterion_text,
    password_lowercase_criterion_text,
    password_match_criterion_text,
    password_special_char_criterion_text,
    password_uppercase_criterion_text,
)
from canvas.test_constants import (
    EMAIL_FIELD,
    EMPTY_FIELD,
    FIRST_NAME_FIELD,
    LAST_NAME_FIELD,
    MISMATCHED_BUT_CORRECT_PASSWORD,
    NO_LOWERCASE_PASSWORD,
    NO_NUMERIC_PASSWORD,
    NO_SPECIAL_CHAR_PASSWORD,
    NO_UPPERCASE_PASSWORD,
    PASSWORD_CONFIRMATION_FIELD,
    PASSWORD_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TOO_SHORT_PASSWORD,
)

from .form_test_mixin import FormTestMixin


class RegisterFormTest(FormTestMixin, TestCase):
    """Test cases for the RegisterForm."""

    form_class = RegisterForm
    default_data = {
        FIRST_NAME_FIELD: TEST_FIRST_NAME,
        LAST_NAME_FIELD: TEST_LAST_NAME,
        EMAIL_FIELD: TEST_EMAIL,
        PASSWORD_FIELD: SECURE_PASSWORD,
        PASSWORD_CONFIRMATION_FIELD: SECURE_PASSWORD,
    }

    def test_register_form_valid_data(self):
        """Test case for valid data submission in RegisterForm."""
        form = self.create_form()
        self.assertTrue(form.is_valid())

    def test_register_form_no_data(self):
        """Test case for RegisterForm with no data."""
        form = self.create_form(
            **{
                FIRST_NAME_FIELD: EMPTY_FIELD,
                LAST_NAME_FIELD: EMPTY_FIELD,
                EMAIL_FIELD: EMPTY_FIELD,
                PASSWORD_FIELD: EMPTY_FIELD,
                PASSWORD_CONFIRMATION_FIELD: EMPTY_FIELD,
            }
        )
        self.assertFalse(form.is_valid())

    def test_register_form_existing_mail(self):
        """Test case for RegisterForm with an already existing email."""
        User.objects.create_user(
            username=TEST_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )
        form = self.create_form()
        self.assert_form_error_message(form, EMAIL_FIELD, email_already_in_use_text)

    def test_register_form_passwords_not_matching(self):
        """Test case for RegisterForm where passwords do not match."""
        form = self.create_form(
            **{PASSWORD_CONFIRMATION_FIELD: MISMATCHED_BUT_CORRECT_PASSWORD}
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_match_criterion_text
        )

    def test_register_form_password_too_short(self):
        """Test case for RegisterForm where password is too short."""
        form = self.create_form(
            **{
                PASSWORD_FIELD: TOO_SHORT_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: TOO_SHORT_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_length_criterion_text
        )

    def test_register_form_password_no_uppercase(self):
        """Test case for RegisterForm where password has no uppercase letter."""
        form = self.create_form(
            **{
                PASSWORD_FIELD: NO_UPPERCASE_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_UPPERCASE_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_uppercase_criterion_text
        )

    def test_register_form_password_no_lowercase(self):
        """Test case for RegisterForm where password has no lowercase letter."""
        form = self.create_form(
            **{
                PASSWORD_FIELD: NO_LOWERCASE_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_LOWERCASE_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_lowercase_criterion_text
        )

    def test_register_form_password_no_number(self):
        """Test case for RegisterForm where password has no number."""
        form = self.create_form(
            **{
                PASSWORD_FIELD: NO_NUMERIC_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_NUMERIC_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_digit_criterion_text
        )

    def test_register_form_password_no_special_character(self):
        """Test case for RegisterForm where password has no special character."""
        form = self.create_form(
            **{
                PASSWORD_FIELD: NO_SPECIAL_CHAR_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_SPECIAL_CHAR_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, PASSWORD_FIELD, password_special_char_criterion_text
        )

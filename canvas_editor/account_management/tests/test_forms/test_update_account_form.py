from allauth.socialaccount.models import SocialAccount
from django.test import TestCase

from account_management.forms.update_account_form import UpdateAccountForm
from account_management.models import User
from canvas.message_dict import (
    current_password_prompt,
    email_already_in_use_text,
    incorrect_password_text,
    new_password_prompt,
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
    NEW_PASSWORD_FIELD,
    NEW_TEST_FIRST_NAME,
    NEW_TEST_LAST_NAME,
    NO_LOWERCASE_PASSWORD,
    NO_NUMERIC_PASSWORD,
    NO_SPECIAL_CHAR_PASSWORD,
    NO_UPPERCASE_PASSWORD,
    OLD_PASSWORD_FIELD,
    OPENID_PROVIDER_FIELD,
    PASSWORD_CONFIRMATION_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    TOO_SHORT_PASSWORD,
    UPDATED_PASSWORD,
    WRONG_EMAIL,
    WRONG_LOGIN_PASSWORD,
)

from .form_test_mixin import FormTestMixin


class UpdateAccountFormTest(FormTestMixin, TestCase):
    """Test cases for the UpdateAccountForm."""

    form_class = UpdateAccountForm
    default_data = {
        FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
        LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
        EMAIL_FIELD: TEST_EMAIL,
        OLD_PASSWORD_FIELD: SECURE_PASSWORD,
        NEW_PASSWORD_FIELD: UPDATED_PASSWORD,
        PASSWORD_CONFIRMATION_FIELD: UPDATED_PASSWORD,
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
        self.instance = self.user

    def test_update_account_form_valid_data(self):
        """Test case for valid data submission in UpdateAccountForm."""
        form = self.create_form_with_instance()
        self.assertTrue(form.is_valid())

    def test_update_account_form_no_password(self):
        """Test case for UpdateAccountForm with no password."""
        form = self.create_form_with_instance(
            **{
                NEW_PASSWORD_FIELD: EMPTY_FIELD,
                OLD_PASSWORD_FIELD: EMPTY_FIELD,
                PASSWORD_CONFIRMATION_FIELD: EMPTY_FIELD,
            }
        )
        self.assertTrue(form.is_valid())

    def test_update_account_form_existing_mail(self):
        """Test case for UpdateAccountForm with an already existing email."""
        User.objects.create_user(
            username=WRONG_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=WRONG_EMAIL,
            password=SECURE_PASSWORD,
        )
        form = self.create_form_with_instance(**{EMAIL_FIELD: WRONG_EMAIL})
        self.assert_form_error_message(form, EMAIL_FIELD, email_already_in_use_text)

    def test_update_account_form_openid_account(self):
        """Test case for UpdateAccountForm with OpenID account."""
        self.social_account = SocialAccount.objects.create(
            user=self.user, provider=OPENID_PROVIDER_FIELD
        )
        form = self.create_form_with_instance()
        self.assertTrue(form.is_valid())
        self.assertEqual(form.clean_email(), self.user.email)

    def test_update_account_form_passwords_not_matching(self):
        """Test case for UpdateAccountForm where passwords do not match."""
        form = self.create_form_with_instance(
            **{
                EMAIL_FIELD: TEST_EMAIL,
                PASSWORD_CONFIRMATION_FIELD: MISMATCHED_BUT_CORRECT_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form,
            PASSWORD_CONFIRMATION_FIELD,
            password_match_criterion_text,
        )

    def test_update_account_form_password_too_short(self):
        """Test case for UpdateAccountForm where password is too short."""
        form = self.create_form_with_instance(
            **{
                FIRST_NAME_FIELD: TEST_FIRST_NAME,
                LAST_NAME_FIELD: TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: TOO_SHORT_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: TOO_SHORT_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, NEW_PASSWORD_FIELD, password_length_criterion_text
        )

    def test_update_account_form_password_no_uppercase(self):
        """Test case for UpdateAccountForm where password has no uppercase letter."""
        form = self.create_form_with_instance(
            **{
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: NO_UPPERCASE_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_UPPERCASE_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, NEW_PASSWORD_FIELD, password_uppercase_criterion_text
        )

    def test_update_account_form_password_no_lowercase(self):
        """Test case for UpdateAccountForm where password has no lowercase letter."""
        form = self.create_form_with_instance(
            **{
                FIRST_NAME_FIELD: TEST_FIRST_NAME,
                LAST_NAME_FIELD: TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: NO_LOWERCASE_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_LOWERCASE_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, NEW_PASSWORD_FIELD, password_lowercase_criterion_text
        )

    def test_update_account_form_password_no_number(self):
        """Test case for UpdateAccountForm where password has no number."""
        form = self.create_form_with_instance(
            **{
                FIRST_NAME_FIELD: TEST_FIRST_NAME,
                LAST_NAME_FIELD: TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: NO_NUMERIC_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_NUMERIC_PASSWORD,
            }
        )
        self.assert_form_error_message(
            form, NEW_PASSWORD_FIELD, password_digit_criterion_text
        )

    def test_update_account_form_password_no_special_character(self):
        """Test case for UpdateAccountForm where password has no special character."""
        form = self.create_form_with_instance(
            **{
                FIRST_NAME_FIELD: TEST_FIRST_NAME,
                LAST_NAME_FIELD: TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: NO_SPECIAL_CHAR_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: NO_SPECIAL_CHAR_PASSWORD,
            },
        )
        self.assert_form_error_message(
            form, NEW_PASSWORD_FIELD, password_special_char_criterion_text
        )

    def test_update_account_form_wrong_password(self):
        """Test case for UpdateAccountForm with wrong password."""
        form = self.create_form_with_instance(
            **{
                EMAIL_FIELD: TEST_EMAIL,
                OLD_PASSWORD_FIELD: WRONG_LOGIN_PASSWORD,
                NEW_PASSWORD_FIELD: UPDATED_PASSWORD,
            },
        )
        self.assert_form_error_message(
            form, OLD_PASSWORD_FIELD, incorrect_password_text
        )

    def test_update_account_form_no_old_password(self):
        """Test case for UpdateAccountForm with no old password."""
        form = self.create_form_with_instance(
            **{
                OLD_PASSWORD_FIELD: EMPTY_FIELD,
                EMAIL_FIELD: TEST_EMAIL,
            },
        )
        self.assert_form_error_message(
            form, OLD_PASSWORD_FIELD, current_password_prompt
        )

    def test_update_account_form_no_new_password(self):
        """Test case for UpdateAccountForm with no new password."""
        form = self.create_form_with_instance(
            **{
                EMAIL_FIELD: TEST_EMAIL,
                NEW_PASSWORD_FIELD: EMPTY_FIELD,
            },
        )
        self.assert_form_error_message(form, NEW_PASSWORD_FIELD, new_password_prompt)

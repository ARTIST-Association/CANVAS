from django.test import SimpleTestCase
from django.urls import resolve, reverse

from account_management.views.confirm_deletion_view import ConfirmDeletionView
from account_management.views.delete_account_view import DeleteAccountView
from account_management.views.invalid_link_view import InvalidLinkView
from account_management.views.login_view import LoginView
from account_management.views.logout_view import LogoutView
from account_management.views.password_forgotten_view import PasswordForgottenView
from account_management.views.password_reset_view import PasswordResetView
from account_management.views.registration_view import RegistrationView
from account_management.views.update_account_view import UpdateAccountView
from canvas import view_name_dict

URLS_TO_VIEWS = [
    (view_name_dict.account_login_view, (), LoginView),
    (view_name_dict.account_register_view, (), RegistrationView),
    (view_name_dict.account_logout_view, (), LogoutView),
    (view_name_dict.account_update_account_view, (), UpdateAccountView),
    (view_name_dict.account_delete_account_view, (), DeleteAccountView),
    (
        view_name_dict.account_password_reset_view,
        ("uidb64", "token"),
        PasswordResetView,
    ),
    (view_name_dict.account_invalid_link_view, (), InvalidLinkView),
    (
        view_name_dict.account_confirm_deletion_view,
        ("uidb64", "token"),
        ConfirmDeletionView,
    ),
    (view_name_dict.account_password_forgotten_view, (), PasswordForgottenView),
]


class TestUrls(SimpleTestCase):
    """Test if the urls return the correct view."""

    def test_urls_resolve_to_correct_views(self):
        """Test that the given view names resolve to the correct views."""
        for name, args, view in URLS_TO_VIEWS:
            url = reverse(name, args=args)
            self.assertEqual(resolve(url).func.view_class, view)

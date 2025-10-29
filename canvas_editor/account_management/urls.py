from django.urls import path

from account_management.views.confirm_deletion_view import ConfirmDeletionView
from account_management.views.delete_account_view import DeleteAccountView
from account_management.views.get_user_info_view import GetUserInfoView
from account_management.views.invalid_link_view import InvalidLinkView
from account_management.views.login_view import LoginView
from account_management.views.logout_view import LogoutView
from account_management.views.password_forgotten_view import PasswordForgottenView
from account_management.views.password_reset_view import PasswordResetView
from account_management.views.registration_view import RegistrationView
from account_management.views.update_account_view import UpdateAccountView
from canvas import view_name_dict

urlpatterns = [
    path("", LoginView.as_view(), name=view_name_dict.account_login_view),
    path(
        "register/",
        RegistrationView.as_view(),
        name=view_name_dict.account_register_view,
    ),
    path("logout/", LogoutView.as_view(), name=view_name_dict.account_logout_view),
    path(
        "update_account/",
        UpdateAccountView.as_view(),
        name=view_name_dict.account_update_account_view,
    ),
    path(
        "delete_account/",
        DeleteAccountView.as_view(),
        name=view_name_dict.account_delete_account_view,
    ),
    path(
        "password_reset/<uidb64>/<token>/",
        PasswordResetView.as_view(),
        name=view_name_dict.account_password_reset_view,
    ),
    path(
        "invalid_link/",
        InvalidLinkView.as_view(),
        name=view_name_dict.account_invalid_link_view,
    ),
    path(
        "confirm_deletion/<uidb64>/<token>/",
        ConfirmDeletionView.as_view(),
        name=view_name_dict.account_confirm_deletion_view,
    ),
    path(
        "password_forgotten_view/",
        PasswordForgottenView.as_view(),
        name=view_name_dict.account_password_forgotten_view,
    ),
    path(
        "get_user_info/",
        GetUserInfoView.as_view(),
        name=view_name_dict.account_get_user_info_view,
    ),
]

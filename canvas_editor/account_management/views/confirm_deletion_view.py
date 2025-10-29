from django.contrib.auth import get_user_model, logout
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.utils.http import urlsafe_base64_decode
from django.views import View

from canvas import view_name_dict


class ConfirmDeletionView(View):
    """View to confirm the deletion of an account via the email that gets send on registration."""

    def dispatch(self, request, uidb64, token):
        """Deside where to dispatch this request to.

        Also checks if the user exists and the link is valid. Renders invalid link view if so.
        """
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            self.user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return redirect(view_name_dict.account_invalid_link_view)
        if not default_token_generator.check_token(self.user, token):
            return redirect(view_name_dict.account_invalid_link_view)

        return super().dispatch(request)

    def get(self, request) -> HttpResponse:
        """Render the confirm deletion view."""
        return render(request, "account_management/confirm_deletion.html")

    def post(self, request) -> HttpResponse:
        """Delete and logout the user."""
        logout(request)
        self.user.delete()
        return redirect(view_name_dict.account_login_view)

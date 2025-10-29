from django.contrib.auth import get_user_model, logout
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.http import urlsafe_base64_decode
from django.views.generic.edit import FormView

from account_management.forms.password_reset_form import PasswordResetForm
from canvas import view_name_dict


class PasswordResetView(FormView):
    """View that handles the password reseting via the link send to the email address."""

    template_name = "account_management/password_reset.html"
    form_class = PasswordResetForm

    def get_success_url(self):
        """Get the url where the user gets redirected at runtime."""
        return reverse(view_name_dict.account_login_view)

    def dispatch(self, request, uidb64, token):
        """Decide where to dispatch this request to.

        If the user does not exist or link is invalid, a according error view is rendered.
        """
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            self.user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return redirect(view_name_dict.account_invalid_link_view)

        if not default_token_generator.check_token(self.user, token):
            return redirect(view_name_dict.account_invalid_link_view)

        return super().dispatch(request)

    def form_invalid(self, form):
        """Handle invalid password reset form."""
        return render(self.request, self.template_name, {"form": form})

    def form_valid(self, form):
        """Handle valid password reset form."""
        self.user.set_password(form.cleaned_data["new_password"])
        self.user.save()

        # Logout from all sessions
        logout(self.request)

        return super().form_valid(form)

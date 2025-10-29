from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse
from django.views.generic.edit import FormView

from account_management.forms.delete_account_form import DeleteAccountForm
from canvas import view_name_dict


class DeleteAccountView(LoginRequiredMixin, FormView):
    """Handle account deletion."""

    template_name = "project_management/projects.html"
    form_class = DeleteAccountForm
    http_method_names = ["post"]

    def get_success_url(self):
        """Get the url of the login page at runtime."""
        return reverse(view_name_dict.account_login_view)

    def get_form_kwargs(self):
        """Pass the user to the form."""
        kwargs = super().get_form_kwargs()
        kwargs["user"] = self.request.user
        return kwargs

    def form_invalid(self, form):
        """Handle invalid delete account form."""
        for field in form:
            for error in field.errors:
                messages.error(self.request, f"Error in {field.label}: {error}")

        return redirect(
            self.request.META.get("HTTP_REFERER", view_name_dict.account_projects_view)
        )

    def form_valid(self, form):
        """Handle valid delete account form."""
        self.request.user.delete()
        logout(self.request)
        return super().form_valid(form)

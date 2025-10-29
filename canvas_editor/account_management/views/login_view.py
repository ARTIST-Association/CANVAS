from django.contrib.auth import login
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic.edit import FormView

from account_management.forms.login_form import LoginForm
from canvas import view_name_dict


class LoginView(FormView):
    """View that handles the login functionality."""

    template_name = "account_management/login.html"
    form_class = LoginForm

    def dispatch(self, request, *args, **kwargs):
        """Decide where to dispatch this request to.

        Redirects the user to the projects overview page if logged in.
        """
        if request.user.is_authenticated:
            return redirect(view_name_dict.account_projects_view)
        return super().dispatch(request, *args, **kwargs)

    def get_success_url(self):
        """Get the projects url at runtime."""
        return reverse(view_name_dict.account_projects_view)

    def form_invalid(self, form):
        """Handle invalid login form."""
        return render(self.request, self.template_name, {"form": form})

    def form_valid(self, form):
        """Handle valid login form."""
        user = form.get_user()
        user.backend = "django.contrib.auth.backends.ModelBackend"
        login(self.request, user)
        return super().form_valid(form)

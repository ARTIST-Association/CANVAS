from django.contrib.auth import logout
from django.shortcuts import redirect
from django.views import View

from canvas import view_name_dict


class LogoutView(View):
    """Handle logout of the user."""

    def post(self, request):
        """Log out the current user and redirect to the login page."""
        logout(request)
        return redirect(view_name_dict.account_login_view)

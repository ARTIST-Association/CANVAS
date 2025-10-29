from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import render
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.views.generic.edit import FormView

from account_management.forms.password_forgotten_form import PasswordForgottenForm
from canvas import settings, view_name_dict


class PasswordForgottenView(FormView):
    """View if a user doesn't remember its password and wants to reset it."""

    template_name = "account_management/password_forgotten.html"
    form_class = PasswordForgottenForm

    def get_success_url(self):
        """Get the login view url at runtime."""
        return reverse(view_name_dict.account_login_view)

    @staticmethod
    def send_password_forgotten_email(user, request):
        """Send an email to the user to reset their password."""
        subject = "Password Reset"

        # Create the token for the user
        uid = urlsafe_base64_encode(str(user.id).encode())
        token = default_token_generator.make_token(user)

        base_url = request.build_absolute_uri("/")
        # Create the URL for the password change page
        password_reset_url = f"{base_url}password_reset/{uid}/{token}/"

        html_message = render_to_string(
            "account_management/accounts/password_forgotten_email.html",
            {
                "user": user,
                "password_reset_url": password_reset_url,
            },
        )
        text_message = strip_tags(html_message)

        to_email = user.email
        email = EmailMultiAlternatives(
            subject, text_message, settings.EMAIL_FROM, [to_email]
        )
        email.attach_alternative(html_message, "text/html")
        email.send()

    def form_invalid(self, form):
        """Handle invalid password reset form."""
        return render(self.request, self.template_name, {"form": form})

    def form_valid(self, form):
        """Handle valid password reset form."""
        email = form.cleaned_data["email"]
        user = User.objects.get(email=email)
        self.send_password_forgotten_email(user, self.request)

        return super().form_valid(form)

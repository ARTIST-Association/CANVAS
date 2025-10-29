from django.contrib.auth import login
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.views.generic.edit import FormView

from account_management.forms.register_form import RegisterForm
from canvas import settings, view_name_dict


class RegistrationView(FormView):
    """Register a new user and redirect to the login page upon success.

    If the user is already logged in, redirect to the projects page.
    """

    template_name = "account_management/register.html"
    form_class = RegisterForm

    def get_success_url(self):
        """Get the url that the user gets redirected to on success."""
        return reverse(view_name_dict.account_projects_view)

    @staticmethod
    def send_register_email(user, request) -> None:
        """Send an email to the user to confirm that their account has been created."""
        subject = "CANVAS: Registration Confirmation"

        # Create the token for the user
        uid = urlsafe_base64_encode(str(user.id).encode())
        token = default_token_generator.make_token(user)

        base_url = request.build_absolute_uri("/")
        # Create the URL for the password change page
        delete_account_url = f"{base_url}confirm_deletion/{uid}/{token}/"

        html_message = render_to_string(
            "account_management/accounts/account_creation_confirmation_email.html",
            {
                "user": user,
                "delete_account_url": delete_account_url,
            },
        )
        text_message = strip_tags(html_message)

        to_email = user.email
        email = EmailMultiAlternatives(
            subject, text_message, settings.EMAIL_FROM, [to_email]
        )
        email.attach_alternative(html_message, "text/html")
        email.send()

    def dispatch(self, request, *args, **kwargs):
        """Deside where to dispatch this request to or to redirect to the projects overview."""
        if request.user.is_authenticated:
            return redirect(view_name_dict.account_projects_view)
        return super().dispatch(request, *args, **kwargs)

    def form_invalid(self, form) -> HttpResponse:
        """Handle invalid form."""
        return render(self.request, self.template_name, {"form": form})

    def form_valid(self, form) -> HttpResponseRedirect:
        """Handle valid form."""
        first_name = form.cleaned_data.get("first_name")
        last_name = form.cleaned_data.get("last_name")
        email = form.cleaned_data.get("email")
        password = form.cleaned_data.get("password")
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=email,
        )
        user.set_password(password)
        user.save()
        user.backend = "django.contrib.auth.backends.ModelBackend"
        login(self.request, user)
        self.send_register_email(user, self.request)
        return super().form_valid(form)

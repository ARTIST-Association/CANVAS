from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.views import View

from account_management.forms.update_account_form import UpdateAccountForm
from account_management.models import UserProfile
from canvas import message_dict, path_dict, settings, view_name_dict


class UpdateAccountView(LoginRequiredMixin, View):
    """Handle changes to the users account."""

    @staticmethod
    def _update_profile_picture(
        user: User, delete_picture: bool, new_profile_picture
    ) -> None:
        """Update the user's profile picture or delete it if requested."""
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if delete_picture and profile.profile_picture:
            profile.profile_picture.delete()
            profile.profile_picture = path_dict.default_profile_pic
        elif new_profile_picture:
            profile.profile_picture.delete()
            profile.profile_picture = new_profile_picture

        user.save()
        profile.save()

    @staticmethod
    def _send_password_change_email(user, request) -> None:
        """Send an email to the user to confirm that their password has been changed."""
        subject = "Password Change Confirmation"

        # Create the token for the user
        uid = urlsafe_base64_encode(str(user.id).encode())
        token = default_token_generator.make_token(user)

        base_url = request.build_absolute_uri("/")
        # Create the URL for the password change page
        password_reset_url = f"{base_url}password_reset/{uid}/{token}/"

        html_message = render_to_string(
            "account_management/accounts/password_change_confirmation_email.html",
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

    def post(self, request):
        """Update the user's account information."""
        user = request.user

        form = UpdateAccountForm(instance=user, data=request.POST, files=request.FILES)

        if form.is_valid():
            user.first_name = form.cleaned_data["first_name"]
            user.last_name = form.cleaned_data["last_name"]
            user.email = form.cleaned_data["email"]
            # Set the username to the email for consistency
            user.username = user.email

            old_password = form.cleaned_data["old_password"]
            new_password = form.cleaned_data["new_password"]

            if old_password and new_password:
                user.set_password(new_password)
                update_session_auth_hash(request, user)
                self._send_password_change_email(user, request)

            self._update_profile_picture(
                user=user,
                delete_picture=request.POST.get("delete_picture") == "1",
                new_profile_picture=form.cleaned_data["profile_picture"],
            )

            messages.success(request, message_dict.account_created_text)
        else:
            for field in form:
                for error in field.errors:
                    messages.error(request, f"Error in {field.label}: {error}")
        return redirect(
            request.META.get("HTTP_REFERER", view_name_dict.account_projects_view)
        )

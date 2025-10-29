from typing import Any

from django import forms
from django.contrib.auth.models import User

from canvas import message_dict


class LoginForm(forms.Form):
    """A form for logging in an existing user.

    It includes fields for email and password. It also validates that the email exists and that the password is correct.
    """

    email = forms.EmailField(label="Email")
    password = forms.CharField(label="Password", widget=forms.PasswordInput)

    def clean(self) -> dict[Any, Any]:
        """Validate that the email exists and that the password is correct. If the email does not exist or the password is incorrect, a validation error is raised."""
        email = self.cleaned_data.get("email")
        password = self.cleaned_data.get("password")
        user = User.objects.filter(email=email).first()

        # Check if the user with this email exists and the password is correct.
        if not user:
            self.add_error("email", message_dict.email_not_registered_text)
        elif not user.check_password(password):
            self.add_error("password", message_dict.incorrect_password_text)
        else:
            self.user = user

        return self.cleaned_data

    def get_user(self) -> User:
        """Return the user object if the form is valid."""
        return self.user

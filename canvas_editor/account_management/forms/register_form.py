from typing import Any

from django import forms
from django.contrib.auth.models import User

from canvas import message_dict


class RegisterForm(forms.Form):
    """A form for registering a new user.

    It includes fields for email, password, and password_confirmation. It also validates that the two passwords match.
    """

    first_name = forms.CharField(label="First name")
    last_name = forms.CharField(label="Last name")
    email = forms.EmailField(label="Email")
    password = forms.CharField(label="password", widget=forms.PasswordInput)
    password_confirmation = forms.CharField(
        label="Confirm password", widget=forms.PasswordInput
    )

    def clean_email(self) -> str:
        """Check if the email already exists."""
        email = self.cleaned_data.get("email")
        if User.objects.filter(email=email).exists():
            self.add_error(
                "email",
                message_dict.email_already_in_use_text,
            )
        return str(email)

    def clean_password(self) -> str:
        """Validate the password based on security criteria."""
        password = str(self.cleaned_data.get("password"))

        if len(password) < 8:
            self.add_error("password", message_dict.password_length_criterion_text)
        if not any(char.isdigit() for char in password):
            self.add_error("password", message_dict.password_digit_criterion_text)
        if not any(char.isupper() for char in password):
            self.add_error("password", message_dict.password_uppercase_criterion_text)
        if not any(char.islower() for char in password):
            self.add_error("password", message_dict.password_lowercase_criterion_text)
        if not any(
            char in message_dict.password_special_characters for char in password
        ):
            self.add_error(
                "password",
                message_dict.password_special_char_criterion_text,
            )
        return password

    def clean(self) -> dict[Any, Any]:
        """Validate that the two passwords match.

        If they do not, a validation error is raised.
        """
        cleaned_data = super().clean()
        password = self.cleaned_data.get("password")
        password_confirmation = self.cleaned_data.get("password_confirmation")

        if password != password_confirmation:
            self.add_error("password", message_dict.password_match_criterion_text)

        return cleaned_data

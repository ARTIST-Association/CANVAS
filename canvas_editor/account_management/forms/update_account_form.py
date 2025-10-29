from typing import Any

from allauth.socialaccount.models import SocialAccount
from django import forms
from django.contrib.auth.models import User

from canvas import message_dict


class UpdateAccountForm(forms.ModelForm):
    """A form for updating the user's account information.

    It includes fields for
    first_name, last_name, and email. It also includes fields for the old password,
    new password, and password_confirmation. It validates that the old password is
    correct, that the new password passes the security criteria, and that the two
    new passwords match.
    """

    first_name = forms.CharField(label="First name", required=False)
    last_name = forms.CharField(label="Last name", required=False)
    email = forms.EmailField(label="Email", required=False)

    old_password = forms.CharField(
        widget=forms.PasswordInput, required=False, label="old_password"
    )
    new_password = forms.CharField(
        widget=forms.PasswordInput, required=False, label="new_password"
    )
    password_confirmation = forms.CharField(
        widget=forms.PasswordInput, required=False, label="password_confirmation"
    )

    profile_picture = forms.ImageField(required=False, label="profile_picture")

    class Meta:
        """Contains meta information for the update account form."""

        model = User
        fields = ["first_name", "last_name", "email", "profile_picture"]

    def clean_email(self) -> str:
        """Validate the email address."""
        email = self.cleaned_data.get("email")
        if SocialAccount.objects.filter(user=self.instance).exists():
            return self.instance.email
        if User.objects.filter(email=email).exclude(id=self.instance.id).exists():
            self.add_error("email", message_dict.email_already_in_use_text)
        return str(email)

    def clean_old_password(self) -> str:
        """Validate the old password."""
        old_password = self.cleaned_data.get("old_password")
        if old_password and not self.instance.check_password(old_password):
            self.add_error("old_password", message_dict.incorrect_password_text)
        return str(old_password)

    def clean_new_password(self) -> str:
        """Validate that the new password passes the security measurements."""
        new_password = str(self.cleaned_data.get("new_password"))

        if new_password:
            if len(new_password) < 8:
                self.add_error(
                    "new_password", message_dict.password_length_criterion_text
                )
            if not any(char.isdigit() for char in new_password):
                self.add_error(
                    "new_password", message_dict.password_digit_criterion_text
                )
            if not any(char.isupper() for char in new_password):
                self.add_error(
                    "new_password",
                    message_dict.password_uppercase_criterion_text,
                )
            if not any(char.islower() for char in new_password):
                self.add_error(
                    "new_password",
                    message_dict.password_lowercase_criterion_text,
                )
            if not any(
                char in message_dict.password_special_characters
                for char in new_password
            ):
                self.add_error(
                    "new_password",
                    message_dict.password_special_char_criterion_text,
                )
        return new_password

    def clean_password_confirmation(self) -> str:
        """Validate that the two new passwords match.

        If they do not, a validation error is raised.
        """
        new_password = str(self.cleaned_data.get("new_password"))
        password_confirmation = str(self.cleaned_data.get("password_confirmation"))

        if new_password and new_password != password_confirmation:
            self.add_error(
                "password_confirmation",
                message_dict.password_match_criterion_text,
            )

        return password_confirmation

    def clean(self) -> dict[Any, Any]:
        """Validate that the old password is entered when a new password is entered."""
        old_password = self.cleaned_data.get("old_password")
        new_password = self.cleaned_data.get("new_password")

        if old_password and not new_password:
            self.add_error("new_password", message_dict.enter_new_password_text)
        if new_password and not old_password:
            self.add_error("old_password", message_dict.enter_current_password_text)

        return self.cleaned_data

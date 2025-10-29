from typing import Any

from django import forms

from canvas import message_dict


class PasswordResetForm(forms.Form):
    """A form for resetting the password.

    It includes fields for the new password and the password confirmation. It validates that the two passwords match.
    """

    new_password = forms.CharField(label="New password", widget=forms.PasswordInput)
    password_confirmation = forms.CharField(
        label="Confirm new password", widget=forms.PasswordInput
    )

    def clean_new_password(self) -> str:
        """Validate that the new password passes the security criteria."""
        new_password = str(self.cleaned_data.get("new_password"))

        if len(new_password) < 8:
            self.add_error("new_password", message_dict.password_length_criterion_text)
        if not any(char.isdigit() for char in new_password):
            self.add_error("new_password", message_dict.password_digit_criterion_text)
        if not any(char.isupper() for char in new_password):
            self.add_error(
                "new_password", message_dict.password_uppercase_criterion_text
            )
        if not any(char.islower() for char in new_password):
            self.add_error(
                "new_password", message_dict.password_lowercase_criterion_text
            )
        if not any(
            char in message_dict.password_special_characters for char in new_password
        ):
            self.add_error(
                "new_password",
                message_dict.password_special_char_criterion_text,
            )
        return new_password

    def clean(self) -> dict[Any, Any]:
        """Validate that the two passwords match.

        If they do not, a validation error is raised.
        """
        cleaned_data = super().clean()
        new_password = self.cleaned_data.get("new_password")
        password_confirmation = self.cleaned_data.get("password_confirmation")

        if new_password != password_confirmation:
            self.add_error(
                "password_confirmation",
                message_dict.password_match_criterion_text,
            )

        return cleaned_data

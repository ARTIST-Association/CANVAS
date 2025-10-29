from django import forms
from django.contrib.auth.models import User

from canvas import message_dict


class PasswordForgottenForm(forms.Form):
    """A form for resetting the password when the user has forgotten it.

    It includes a field for the email address.
    """

    email = forms.EmailField(label="Email")

    def clean_email(self) -> str:
        """Check if the email exists."""
        email = str(self.cleaned_data.get("email"))
        if not User.objects.filter(email=email).exists():
            self.add_error("email", message_dict.email_not_registered_text)
        return email

from django import forms
from django.contrib.auth.models import User
from django.forms import Form

from canvas import message_dict


class ChangeUsernameForm(Form):
    """Form for the username change."""

    new_username = forms.CharField(min_length=1)

    def clean_new_username(self):
        """Check if the new username is unique."""
        username = self.cleaned_data["new_username"]

        if User.objects.filter(username=username).exists():
            raise forms.ValidationError(message_dict.invalid_new_username_text)

        return username

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["new_username"].widget.attrs.update(
            {
                "class": "form-control",
            }
        )

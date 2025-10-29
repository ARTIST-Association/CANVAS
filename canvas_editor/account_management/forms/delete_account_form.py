from django import forms

from canvas import message_dict


class DeleteAccountForm(forms.Form):
    """A form for deleting an account.

    It includes a field for the password.
    """

    password = forms.CharField(label="Password", widget=forms.PasswordInput)

    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_password(self) -> str:
        """Validate the password."""
        password = str(self.cleaned_data.get("password"))
        if not self.user.check_password(password):
            self.add_error("password", message_dict.incorrect_password_text)
        return password

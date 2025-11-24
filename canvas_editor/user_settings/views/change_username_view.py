from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.views.generic import FormView

from canvas import message_dict, view_name_dict
from user_settings.forms.change_username_form import ChangeUsernameForm


class ChangeUsernameView(LoginRequiredMixin, FormView):
    """View to change the current username."""

    template_name = "user_settings/change_username.html"
    form_class = ChangeUsernameForm

    def get_success_url(self):
        """Get the url of the projects view at runtime."""
        return reverse(view_name_dict.change_username)

    def form_valid(self, form: ChangeUsernameForm):
        """Is executed when the form is valid.

        Changes the username and displays an according message.
        """
        self.request.user.username = form.cleaned_data["new_username"]
        self.request.user.save()

        messages.success(self.request, message_dict.changed_username_text)

        return super().form_valid(form)

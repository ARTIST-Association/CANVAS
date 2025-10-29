from django import forms
from django.forms import ModelForm

from project_management.forms.utils import validate_symbols
from project_management.models import Project


class UpdateProjectForm(ModelForm):
    """Form to update a project's name and description."""

    class Meta:
        """Meta class for UpdateProjectForm."""

        model = Project
        fields = ["name", "description"]

    name = forms.CharField(
        max_length=100,
        validators=[validate_symbols],
    )

    description = forms.CharField(
        max_length=500, required=False, widget=forms.TextInput()
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name"].widget.attrs.update(
            {"class": "form-control", "id": "createProjectNameInput"}
        )
        self.fields["description"].widget.attrs.update(
            {"class": "form-control", "id": "createProjectDescriptionInput"}
        )

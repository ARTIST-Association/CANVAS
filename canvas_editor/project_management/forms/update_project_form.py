from re import sub

from django.forms import ModelForm, ValidationError

from canvas import message_dict
from project_management.forms.utils import validate_symbols
from project_management.models import Project
from project_management.views.utils import is_name_unique


class UpdateProjectForm(ModelForm):
    """Form to update a project's name and description."""

    class Meta:
        """Meta class for UpdateProjectForm."""

        model = Project
        fields = ["name", "description"]

    def clean_name(self):
        """Validate the given project name.

        Because white space and special characters break the CSS selectors, special characters are prohibited and all white space is replaced with _.
        """
        # Replace any white space with '_'
        project_name = sub(r"\s", "_", str(self.cleaned_data.get("name")).strip())

        if (project_name != self.instance.name) and not is_name_unique(self.instance.owner, project_name):
            raise ValidationError(message_dict.project_name_must_be_unique)

        return validate_symbols(project_name)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name"].widget.attrs.update({"class": "form-control", "id": "createProjectNameInput"})
        self.fields["description"].widget.attrs.update({"class": "form-control", "id": "createProjectDescriptionInput"})

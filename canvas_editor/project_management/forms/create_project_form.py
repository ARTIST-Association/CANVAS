from re import sub

from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

from canvas import message_dict
from project_management.forms.utils import validate_symbols
from project_management.models import Project
from project_management.views.utils import is_name_unique

# Message shown when an HDF5 scenario upload is attempted while disabled.
ARTIST_IMPORT_DISABLED_MESSAGE = (
    "Importing ARTIST HDF5 scenarios is temporarily disabled while the ARTIST integration is rebuilt."
)


class CreateProjectForm(forms.ModelForm):
    """Form to create or edit a project."""

    file = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(attrs={"class": "form-control", "accept": ".h5"}),
    )

    class Meta:
        """Meta information for this model form."""

        model = Project
        fields = ["name", "description"]

    def clean_name(self):
        """Validate the given project name.

        Because white space and special characters break the CSS selectors, special characters are prohibited and all white space is replaced with _.
        """
        # Replace any white space with '_'
        project_name = sub(r"\s", "_", str(self.cleaned_data.get("name")).strip())

        if not is_name_unique(self.user, project_name):
            raise ValidationError(message_dict.project_name_must_be_unique)

        return validate_symbols(project_name)

    def clean_file(self):
        """Validate the uploaded file."""
        # Check if a file is uploaded
        file = self.cleaned_data.get("file")
        if not file:
            return file

        # ARTIST HDF5 import is currently disabled (see settings.ARTIST_SCENARIO_ENABLED).
        if not settings.ARTIST_SCENARIO_ENABLED:
            raise ValidationError(ARTIST_IMPORT_DISABLED_MESSAGE)

        # Check file extension (only allow .h5 files)
        if not file.name.endswith(".h5"):
            raise ValidationError("Only HDF5 (.h5) files are allowed.")

        # Check file size
        max_size = 1024 * 1024 * 1024  # 1GB
        if file.size > max_size:
            raise ValidationError("File size should not exceed 1GB.")

        return file

    def save(self, commit=True):
        """Expand the default save method.

        Adds missing owner and last edited field values.
        Imports the data if a file is given.
        """
        new_project = super().save(commit=False)
        new_project.last_edited = timezone.now()
        new_project.owner = self.user

        if commit:
            new_project.save()

        file = self.cleaned_data.get("file")
        if file is not None and settings.ARTIST_SCENARIO_ENABLED:
            # Imported lazily so the app still boots when the (currently broken)
            # ARTIST dependency cannot be imported.
            from hdf5_management.hdf5_manager import HDF5Manager

            hdf5_manager = HDF5Manager()
            hdf5_manager.create_project_from_hdf5_file(file, new_project)

        return new_project

    def __init__(
        self,
        user: User,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.user = user
        self.fields["name"].widget.attrs.update({"class": "form-control"})
        self.fields["description"].widget.attrs.update({"class": "form-control"})
        self.fields["file"].widget.attrs.update({"class": "form-control"})

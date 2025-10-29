from django import forms
from django.core.exceptions import ValidationError

from project_management.forms.utils import validate_symbols


class ProjectForm(forms.Form):
    """Form to create or edit a project."""

    name = forms.CharField(
        max_length=100,
        validators=[validate_symbols],
    )
    description = forms.CharField(
        max_length=500, required=False, widget=forms.TextInput()
    )

    def clean_file(self):
        """Validate the uploaded file."""
        # Check if a file is uploaded
        file = self.cleaned_data.get("file")
        if not file:
            return file

        # Check file extension (only allow .h5 files)
        if not file.name.endswith(".h5"):
            raise ValidationError("Only HDF5 (.h5) files are allowed.")

        # Check file size
        max_size = 1024 * 1024 * 1024  # 1GB
        if file.size > max_size:
            raise ValidationError("File size should not exceed 1GB.")

        return file

    file = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(
            attrs={"class": "form-control", "accept": ".h5"}
        ),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name"].widget.attrs.update({"class": "form-control"})
        self.fields["description"].widget.attrs.update({"class": "form-control"})
        self.fields["file"].widget.attrs.update({"class": "form-control"})

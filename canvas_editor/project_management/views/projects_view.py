from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.views.generic import ListView

from canvas import message_dict
from hdf5_management.hdf5_manager import HDF5Manager
from project_management.forms.project_form import ProjectForm
from project_management.models import Project
from project_management.views.utils import is_name_unique


class ProjectsView(LoginRequiredMixin, ListView):
    """Manages the displaying and creating of projects."""

    model = Project
    template_name = "project_management/projects.html"
    context_object_name = "projects"

    @staticmethod
    def _generate_uid(request):
        return urlsafe_base64_encode(str(request.user.id).encode())

    @staticmethod
    def _generate_token(project_name):
        return urlsafe_base64_encode(str(project_name).encode())

    @staticmethod
    def _create_project(
        user: User, project_name: str, project_description: str, project_file
    ):
        new_project = Project(
            name=project_name,
            description=project_description,
            owner=user,
            last_edited=timezone.now(),
        )
        new_project.save()

        if project_file is not None:
            HDF5Manager.create_project_from_hdf5_file(project_file, new_project)

    def get_queryset(self):
        """Get a list of all projects of this user.

        Sorts them by date, and adds the necessary attributes for sharing.
        """
        queryset = Project.objects.filter(owner=self.request.user).order_by(
            "-last_edited"
        )
        for project in queryset:
            project.uid = self._generate_uid(self.request)
            project.token = self._generate_token(project.name)
        return queryset

    def get_context_data(self, **kwargs):
        """Add the ProjectForm to the context."""
        context = super().get_context_data(**kwargs)
        context["create_new_project_form"] = ProjectForm()
        return context

    def post(self, request):
        """Create a new project if the form is valid and the name is unique."""
        # Initialize the form with POST and FILE data
        form = ProjectForm(request.POST, request.FILES)

        # Check if form is valid before proceeding
        if form.is_valid() and is_name_unique(
            request.user, form.cleaned_data["name"].strip().replace(" ", "_")
        ):
            project_name = form.cleaned_data["name"].strip().replace(" ", "_")
            project_file = request.FILES.get("file")
            project_description = form.cleaned_data.get("description", "").strip()

            self._create_project(
                request.user, project_name, project_description, project_file
            )

            return redirect("editor", project_name=project_name)

        else:
            messages.error(request, message_dict.project_name_must_be_unique)
            for field in form:
                for error in field.errors:
                    messages.error(request, f"Error in {field.label}: {error}")

            context = self.get_context_data(object_list=self.get_queryset())
            context["create_new_project_form"] = form
            return render(request, "project_management/projects.html", context)

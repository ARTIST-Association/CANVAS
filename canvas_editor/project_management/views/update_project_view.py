from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import UpdateView

from canvas import view_name_dict
from project_management.forms.update_project_form import UpdateProjectForm
from project_management.models import Project


class UpdateProjectView(LoginRequiredMixin, UpdateView):
    """Handle updating of a project."""

    model = Project
    form_class = UpdateProjectForm
    http_method_names = ["post"]
    success_url = reverse_lazy(view_name_dict.project_projects_view)

    def get_object(self, queryset=None):
        """Get the project you should update."""
        project_name = self.kwargs.get("project_name")
        project = get_object_or_404(Project, name=project_name)
        return project

    def form_invalid(self, form):
        """Show errors when form is invalid."""
        for field in form:
            for error in field.errors:
                messages.error(self.request, f"Error in {field.label}: {error}")

        return redirect(view_name_dict.project_projects_view)

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404, redirect
from django.views import View

from canvas import view_name_dict
from project_management.models import Project


class ToggleFavorProject(LoginRequiredMixin, View):
    """Toggle the favorite attribute of the project."""

    def post(self, request, project_name):
        """Toggle the favorite attribute of the project."""
        project = get_object_or_404(Project, owner=request.user, name=project_name)
        project.favorite = False if project.favorite else True
        project.save(update_fields=["favorite"])
        return redirect(view_name_dict.project_projects_view)

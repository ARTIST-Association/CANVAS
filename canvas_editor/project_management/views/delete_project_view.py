from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.views import View

from canvas import view_name_dict
from project_management.models import Project


class DeleteProjectView(LoginRequiredMixin, View):
    """Deleting a projects."""

    def post(self, request, project_name):
        """Delete the project specified by the url."""
        project = Project.objects.get(owner=request.user, name=project_name)
        if project.owner == request.user:
            project.delete()
            return redirect(view_name_dict.project_projects_view)

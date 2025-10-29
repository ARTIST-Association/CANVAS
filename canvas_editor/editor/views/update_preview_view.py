from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.views import View

from project_management.models import Project


class UploadPreviewView(LoginRequiredMixin, View):
    """Updates the preview of the project.

    Is used by the previewHandler in the editor page to update the auto-generated preview of the project.
    """

    def post(self, request, project_name):
        """Upload the preview for this project."""
        project = get_object_or_404(Project, name=project_name, owner=request.user)
        file = request.FILES["preview"]

        project.preview.delete()
        project.preview = file
        project.save()

        return HttpResponse(status=200)

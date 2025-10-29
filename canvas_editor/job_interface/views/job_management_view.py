from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View

from job_interface.models import Job
from project_management.models import Project


class JobManagementView(LoginRequiredMixin, View):
    """View to manage jobs for a specific project."""

    def get(self, request, project_id):
        """Get all job IDs for the specified project."""
        project = get_object_or_404(Project, owner=request.user, pk=project_id)
        jobs = Job.objects.filter(owner=request.user, project=project).order_by(
            "starting_time"
        )
        job_ids = [job.pk for job in jobs]
        return JsonResponse({"jobIDs": job_ids})

    def post(self, request, project_id):
        """Create a new job for the specified project."""
        project = get_object_or_404(Project, owner=request.user, pk=project_id)
        new_job = Job.objects.create(owner=request.user, project=project)
        return JsonResponse({"jobID": new_job.pk})

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views import View

from job_interface.models import Job
from project_management.models import Project


# INFO: This is currently mocked, so that the frontend works correctly.
class JobStatusView(LoginRequiredMixin, View):
    """View to get the status of a specific job."""

    def get(self, request, job_id, project_id):
        """Get the status of the specified job."""
        project = get_object_or_404(Project, owner=request.user, pk=project_id)
        job = get_object_or_404(Job, pk=job_id, owner=request.user, project=project)

        starting_time = job.starting_time

        time_diff = (timezone.now() - starting_time).total_seconds() / 60

        result = None
        if time_diff > 3:
            progress = 1
        else:
            progress = round(time_diff / 3, 2)

        if time_diff > 3:
            status = "Finished"
            result = "/static/img/render/example_0.pdf"
        elif time_diff > 2:
            status = "Aligning Heliostats"
        else:
            status = "Creating HDF5 file"

        return JsonResponse(
            {
                "jobID": job.pk,
                "status": status,
                "progress": progress,
                "result": result,
            }
        )

    def delete(self, request, job_id, project_id):
        """Delete the specified job."""
        project = get_object_or_404(Project, owner=request.user, pk=project_id)
        job = get_object_or_404(Job, pk=job_id, owner=request.user, project=project)
        job.delete()

        return HttpResponse(status=200)

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.views import View

from hdf5_management.hdf5_manager import HDF5Manager
from project_management.models import Project


class DownloadView(LoginRequiredMixin, View):
    """Converts the specified project into an hdf5 file and downloads it."""

    def get(self, request, project_name):
        """Create and download the hdf5 file."""
        project = get_object_or_404(Project, name=project_name, owner=request.user)

        path = HDF5Manager.create_hdf5_file(request.user, project)

        f = open(path, "rb")
        response = FileResponse(f, as_attachment=True, filename=project_name + ".h5")

        original_close = response.close

        def close_and_cleanup(*args, **kwargs):
            try:
                try:
                    if not f.closed:
                        f.close()
                finally:
                    # Delete the temporary file after sending it
                    try:
                        path.unlink()
                    except FileNotFoundError:
                        pass
            finally:
                original_close(*args, **kwargs)

        response.close = close_and_cleanup
        return response

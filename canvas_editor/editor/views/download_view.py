from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.views import View

from project_management.models import Project

# Message shown when the ARTIST HDF5 export is requested while disabled.
ARTIST_EXPORT_DISABLED_MESSAGE = "HDF5 scenario export is temporarily disabled while the ARTIST integration is rebuilt."


class DownloadView(LoginRequiredMixin, View):
    """Converts the specified project into an hdf5 file and downloads it."""

    def get(self, request, project_name):
        """Create and download the hdf5 file."""
        project = get_object_or_404(Project, name=project_name, owner=request.user)

        if not settings.ARTIST_SCENARIO_ENABLED:
            return HttpResponse(ARTIST_EXPORT_DISABLED_MESSAGE, status=503, content_type="text/plain")

        # Imported lazily so the app still boots when the (currently broken)
        # ARTIST dependency cannot be imported.
        from hdf5_management.hdf5_manager import HDF5Manager

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

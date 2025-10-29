from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import HeliostatSerializer
from project_management.models import Heliostat, Project


class HeliostatList(generics.ListCreateAPIView):
    """Creates a view to list all heliostats and create new ones."""

    serializer_class = HeliostatSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # Overwrite the default function to use the project defined by the project_id in the url for saving the heliostat
    def perform_create(self, serializer):
        """Save the new heliostat with the project defined by the project_id in the url."""
        # kwargs = keyword arguments
        project_id = self.kwargs["project_id"]
        project = generics.get_object_or_404(
            Project, id=project_id, owner=self.request.user
        )
        serializer.save(project=project)

    def get_queryset(self):
        """Get the heliostats that belong to the user making the request and the project defined by the project_id in the url."""
        project_id = self.kwargs["project_id"]
        return Heliostat.objects.filter(
            project__id=project_id, project__owner=self.request.user
        )

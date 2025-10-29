from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import ReceiverSerializer
from project_management.models import Project, Receiver


class ReceiverList(generics.ListCreateAPIView):
    """Creates a view to list all receivers or to create a new one."""

    serializer_class = ReceiverSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # Overwrite the default function to use the project defined by the project_id in the url for saving the heliostat
    def perform_create(self, serializer):
        """Save the new receiver with the project defined by the project_id in the url."""
        project_id = self.kwargs["project_id"]
        project = generics.get_object_or_404(
            Project, id=project_id, owner=self.request.user
        )
        serializer.save(project=project)

    def get_queryset(self):
        """Get the receivers that belong to the user making the request and the project defined by the project_id in the url."""
        project_id = self.kwargs["project_id"]
        return Receiver.objects.filter(
            project__id=project_id, project__owner=self.request.user
        )

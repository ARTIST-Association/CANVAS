from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import ProjectSerializer
from project_management.models import Project


class ProjectList(generics.ListCreateAPIView):
    """Creates a view to list all of the projects of the user who's currently logged in, you can also create a new projectadd."""

    serializer_class = ProjectSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # Overwrite the default function to use the request user as the owner of the project and also create a new settings object
    def perform_create(self, serializer):
        """Save the new project with the user making the request as the owner."""
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        """Get the projects that belong to the user making the request."""
        # Select only the projects the user owns
        return Project.objects.filter(owner=self.request.user)

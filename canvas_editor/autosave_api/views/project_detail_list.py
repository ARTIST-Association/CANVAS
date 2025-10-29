from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import ProjectDetailSerializer
from project_management.models import Project


class ProjectDetailList(generics.RetrieveUpdateDestroyAPIView):
    """Creates a view to list a specific project, specified by the given pk in the url, where you can also delete the project."""

    serializer_class = ProjectDetailSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get the projects that belong to the user making the request."""
        # Select only the projects the user owns
        return Project.objects.filter(owner=self.request.user)

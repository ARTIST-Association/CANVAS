from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import SceneObjectSerializer
from project_management.models import Project, SceneObject


class SceneObjectList(generics.ListCreateAPIView):
    """List all scene objects of a project and create new ones."""

    serializer_class = SceneObjectSerializer
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Attach the new object to the project named by the project_id in the url."""
        project_id = self.kwargs["project_id"]
        project = generics.get_object_or_404(Project, id=project_id, owner=self.request.user)
        serializer.save(project=project)

    def get_queryset(self):
        """Get the scene objects belonging to the requesting user's project."""
        project_id = self.kwargs["project_id"]
        return SceneObject.objects.filter(project__id=project_id, project__owner=self.request.user)


class SceneObjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a single scene object, identified by pk."""

    serializer_class = SceneObjectSerializer
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get the scene objects that belong to the requesting user."""
        return SceneObject.objects.filter(project__owner=self.request.user)

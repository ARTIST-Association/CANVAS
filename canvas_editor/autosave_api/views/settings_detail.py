from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import SettingsSerializer
from project_management.models import Settings


class SettingsDetail(generics.RetrieveUpdateAPIView):
    """Creates a view to list and update all settings."""

    serializer_class = SettingsSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # Overwrite the default get_object function to not use the primary key, but select the settings object by the corresponding project
    def get_object(self):
        """Return the settings for the project of the user."""
        project_id = self.kwargs["project_id"]
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset, project__id=project_id)
        return obj

    def get_queryset(self):
        """Return the settings for the project of the user."""
        return Settings.objects.filter(project__owner=self.request.user)

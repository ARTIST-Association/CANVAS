from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import LightSourceSerializer
from project_management.models import LightSource


class LightSourceDetail(generics.RetrieveUpdateDestroyAPIView):
    """Creates a view to retrieve, update or delete a specific lightsource, defined by the given pk."""

    serializer_class = LightSourceSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get the lightsources that belong to the user making the request."""
        return LightSource.objects.filter(project__owner=self.request.user)

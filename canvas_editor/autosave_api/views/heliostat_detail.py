from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import HeliostatSerializer
from project_management.models import Heliostat


class HeliostatDetail(generics.RetrieveUpdateDestroyAPIView):
    """Creates a view to retrieve, edit or delete a specific heliostat, defined by the pk in the url."""

    serializer_class = HeliostatSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get the heliostats that belong to the user making the request."""
        return Heliostat.objects.filter(project__owner=self.request.user)

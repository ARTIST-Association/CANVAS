from rest_framework import generics
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from autosave_api.serializers import ReceiverSerializer
from project_management.models import Receiver


class ReceiverDetail(generics.RetrieveUpdateDestroyAPIView):
    """Creates a view of a specific receiver to retrieve, edit or delete it."""

    serializer_class = ReceiverSerializer

    # Accepted authentication classes and the needed permissions to access the API
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get the receivers that belong to the user making the request."""
        return Receiver.objects.filter(project__owner=self.request.user)

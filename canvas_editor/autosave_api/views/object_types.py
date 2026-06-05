from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from project_management import object_types


class ObjectTypeList(APIView):
    """Expose the object-type registry so the frontend can render generically."""

    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the full object-type registry (schema + presentation)."""
        return Response(object_types.registry_as_dict())

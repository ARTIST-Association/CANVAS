from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View


class GetUserInfoView(LoginRequiredMixin, View):
    """Allow to check if the user is an open id user."""

    def get(self, request):
        """Check if the user is logged in via OpenID and return the information as JSON."""
        user = request.user
        is_openid_user = SocialAccount.objects.filter(user=user).exists()
        return JsonResponse({"is_openid_user": is_openid_user})

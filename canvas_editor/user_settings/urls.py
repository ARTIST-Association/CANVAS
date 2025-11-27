from django.urls import path

from canvas import view_name_dict
from user_settings.views.appearance_view import AppearanceView
from user_settings.views.change_username_view import ChangeUsernameView

urlpatterns = [
    path(
        "change_username",
        ChangeUsernameView.as_view(),
        name=view_name_dict.change_username,
    ),
    path("appearance", AppearanceView.as_view(), name=view_name_dict.appearance),
]

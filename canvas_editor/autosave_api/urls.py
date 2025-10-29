from django.urls import path

from autosave_api.views.heliostat_detail import HeliostatDetail
from autosave_api.views.heliostat_list import HeliostatList
from autosave_api.views.light_source_detail import LightSourceDetail
from autosave_api.views.light_source_list import LightSourceList
from autosave_api.views.project_detail_list import ProjectDetailList
from autosave_api.views.project_list import ProjectList
from autosave_api.views.receiver_detail import ReceiverDetail
from autosave_api.views.receiver_list import ReceiverList
from autosave_api.views.settings_detail import SettingsDetail
from canvas.view_name_dict import (
    autosave_heliostat_detail_view,
    autosave_heliostat_list_view,
    autosave_light_source_detail_view,
    autosave_light_source_list_view,
    autosave_project_detail_list_view,
    autosave_project_list_view,
    autosave_receiver_detail_view,
    autosave_receiver_list_view,
    autosave_settings_detail_view,
)

urlpatterns = [
    path("projects/", ProjectList.as_view(), name=autosave_project_list_view),
    path(
        "projects/<int:pk>/",
        ProjectDetailList.as_view(),
        name=autosave_project_detail_list_view,
    ),
    path(
        "projects/<int:project_id>/heliostats/",
        HeliostatList.as_view(),
        name=autosave_heliostat_list_view,
    ),
    path(
        "projects/<int:project_id>/heliostats/<int:pk>/",
        HeliostatDetail.as_view(),
        name=autosave_heliostat_detail_view,
    ),
    path(
        "projects/<int:project_id>/receivers/",
        ReceiverList.as_view(),
        name=autosave_receiver_list_view,
    ),
    path(
        "projects/<int:project_id>/receivers/<int:pk>/",
        ReceiverDetail.as_view(),
        name=autosave_receiver_detail_view,
    ),
    path(
        "projects/<int:project_id>/light_sources/",
        LightSourceList.as_view(),
        name=autosave_light_source_list_view,
    ),
    path(
        "projects/<int:project_id>/light_sources/<int:pk>/",
        LightSourceDetail.as_view(),
        name=autosave_light_source_detail_view,
    ),
    path(
        "projects/<int:project_id>/settings/",
        SettingsDetail.as_view(),
        name=autosave_settings_detail_view,
    ),
]

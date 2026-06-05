from django.urls import path

from autosave_api.views.object_types import ObjectTypeList
from autosave_api.views.project_detail_list import ProjectDetailList
from autosave_api.views.project_list import ProjectList
from autosave_api.views.scene_object import SceneObjectDetail, SceneObjectList
from autosave_api.views.settings_detail import SettingsDetail

urlpatterns = [
    path("object-types/", ObjectTypeList.as_view(), name="autosave_object_type_list_view"),
    path("projects/", ProjectList.as_view(), name="autosave_project_list_view"),
    path("projects/<int:pk>/", ProjectDetailList.as_view(), name="autosave_project_detail_list_view"),
    path(
        "projects/<int:project_id>/objects/",
        SceneObjectList.as_view(),
        name="autosave_scene_object_list_view",
    ),
    path(
        "projects/<int:project_id>/objects/<int:pk>/",
        SceneObjectDetail.as_view(),
        name="autosave_scene_object_detail_view",
    ),
    path(
        "projects/<int:project_id>/settings/",
        SettingsDetail.as_view(),
        name="autosave_settings_detail_view",
    ),
]

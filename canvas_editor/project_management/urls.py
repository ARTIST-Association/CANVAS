from django.urls import path

from canvas import view_name_dict
from project_management.views.delete_project_view import DeleteProjectView
from project_management.views.duplicate_project_view import DuplicateProjectView
from project_management.views.projects_view import ProjectsView
from project_management.views.share_project_view import ShareProjectView
from project_management.views.shared_projects_view import SharedProjectView
from project_management.views.toggle_favor_project_view import ToggleFavorProject
from project_management.views.update_project_view import UpdateProjectView

urlpatterns = [
    path("", ProjectsView.as_view(), name=view_name_dict.project_projects_view),
    path(
        "updateProject/<str:project_name>",
        UpdateProjectView.as_view(),
        name=view_name_dict.project_update_project_view,
    ),
    path(
        "deleteProject/<str:project_name>",
        DeleteProjectView.as_view(),
        name=view_name_dict.project_delete_project_view,
    ),
    path(
        "toggle_favor/<str:project_name>",
        ToggleFavorProject.as_view(),
        name=view_name_dict.project_toggle_favor_project_view,
    ),
    path(
        "duplicateProject/<str:project_name>",
        DuplicateProjectView.as_view(),
        name=view_name_dict.project_duplicate_project_view,
    ),
    path(
        "shareProject/<str:project_name>",
        ShareProjectView.as_view(),
        name=view_name_dict.project_share_project_view,
    ),
    path(
        "sharedProjects/<str:uid>/<str:token>",
        SharedProjectView.as_view(),
        name=view_name_dict.project_shared_projects_view,
    ),
]

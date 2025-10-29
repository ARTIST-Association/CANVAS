from django.urls import path

from canvas import view_name_dict
from job_interface.views.job_management_view import JobManagementView
from job_interface.views.job_status_view import JobStatusView

urlpatterns = [
    path(
        "<str:project_id>/",
        JobManagementView.as_view(),
        name=view_name_dict.job_create_new_job_view,
    ),
    path(
        "<str:project_id>/<int:job_id>/",
        JobStatusView.as_view(),
        name=view_name_dict.job_status_view,
    ),
]

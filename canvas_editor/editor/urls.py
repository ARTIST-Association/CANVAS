from django.urls import path

from canvas import view_name_dict
from editor.views.download_view import DownloadView
from editor.views.editor_view import EditorView
from editor.views.update_preview_view import UploadPreviewView

urlpatterns = [
    path("<str:project_name>", EditorView.as_view(), name=view_name_dict.editor_view),
    path(
        "<str:project_name>/download",
        DownloadView.as_view(),
        name=view_name_dict.editor_download_view,
    ),
    path(
        "<str:project_name>/upload",
        UploadPreviewView.as_view(),
        name=view_name_dict.editor_preview_upload_view,
    ),
]

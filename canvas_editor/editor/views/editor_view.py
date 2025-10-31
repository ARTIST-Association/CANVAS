from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.generic import TemplateView

from project_management.forms.create_project_form import CreateProjectForm
from project_management.models import Project


class EditorView(LoginRequiredMixin, TemplateView):
    """Render the editor view."""

    template_name = "editor/editor.html"

    def get_context_data(self, **kwargs):
        """Get the context of the editor page."""
        context = super().get_context_data(**kwargs)
        project_name = self.kwargs.get("project_name")
        request = self.request
        project = get_object_or_404(Project, owner=request.user, name=project_name)

        project.last_edited = timezone.now()
        project.save()

        create_new_project_form = CreateProjectForm(user=self.request.user)
        all_projects = Project.objects.filter(owner=request.user).order_by(
            "-last_edited"
        )

        context.update(
            {
                "project_id": project.pk,
                "project_name": project.name,
                "create_new_project_form": create_new_project_form,
                "projects": all_projects,
            }
        )
        return context

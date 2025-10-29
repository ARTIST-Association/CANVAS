from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from django.views.generic import FormView

from canvas import message_dict, view_name_dict
from project_management.forms.update_project_form import UpdateProjectForm
from project_management.models import Project
from project_management.views.utils import is_name_unique


class UpdateProjectView(LoginRequiredMixin, FormView):
    """Hanlde updating of a project."""

    template_name = view_name_dict.project_projects_view
    form_class = UpdateProjectForm
    http_method_names = ["post"]

    def get_success_url(self):
        """Get the url of the projects view at runtime."""
        return reverse(view_name_dict.project_projects_view)

    def get_form_kwargs(self):
        """Add the instance to the forms key word arguments."""
        kwargs = super().get_form_kwargs()
        kwargs["instance"] = Project.objects.get(
            owner=self.request.user, name=self.kwargs["project_name"]
        )
        return super().get_form_kwargs()

    def form_invalid(self, form):
        """Handle invalid update project form."""
        for field in form:
            for error in field.errors:
                messages.error(self.request, f"Error in {field.label}: {error}")

        return super().form_invalid(form)

    def form_valid(self, form):
        """Handle valid update project form."""
        project = Project.objects.get(
            owner=self.request.user, name=self.kwargs["project_name"]
        )
        form_name = form.cleaned_data["name"].strip().replace(" ", "_")
        form_description = form.cleaned_data.get("description", "")
        if is_name_unique(self.request.user, form_name) or form_name == project.name:
            project.last_edited = timezone.now()
            project.name = form_name
            project.description = form_description if form_description else ""
            project.save()
            return HttpResponseRedirect(reverse(view_name_dict.project_projects_view))
        else:
            messages.error(self.request, message_dict.project_name_must_be_unique)

        return super().form_valid(form)

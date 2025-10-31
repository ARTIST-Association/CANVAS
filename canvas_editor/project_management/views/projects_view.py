from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, render
from django.utils.http import urlsafe_base64_encode
from django.views.generic import ListView

from project_management.forms.create_project_form import CreateProjectForm
from project_management.forms.update_project_form import UpdateProjectForm
from project_management.models import Project


class ProjectsView(LoginRequiredMixin, ListView):
    """Manages the displaying and creating of projects."""

    model = Project
    template_name = "project_management/projects.html"
    context_object_name = "projects"

    @staticmethod
    def _generate_uid(request):
        """Generate an url safe encoding of the user id."""
        return urlsafe_base64_encode(str(request.user.id).encode())

    @staticmethod
    def _generate_token(project_name):
        """Generate an url safe encoding of the project name."""
        return urlsafe_base64_encode(str(project_name).encode())

    def get_queryset(self):
        """Get a list of all projects of this user.

        Sorts them by date, and adds the necessary attributes for sharing.
        """
        queryset = Project.objects.filter(owner=self.request.user).order_by(
            "-last_edited"
        )
        for project in queryset:
            project.uid = self._generate_uid(self.request)
            project.token = self._generate_token(project.name)
            project.update_form = UpdateProjectForm(instance=project)
        return queryset

    def get_context_data(self, **kwargs):
        """Add the ProjectForm to the context."""
        context = super().get_context_data(**kwargs)
        context["create_new_project_form"] = CreateProjectForm(user=self.request.user)
        return context

    def post(self, request):
        """Create a new project if the form is valid and the name is unique."""
        # Initialize the form with POST and FILE data
        form = CreateProjectForm(request.user, request.POST, request.FILES)

        # Check if form is valid before proceeding
        if form.is_valid():
            project = form.save()
            return redirect("editor", project_name=project.name)

        else:
            context = self.get_context_data(object_list=self.get_queryset())
            context["create_new_project_form"] = form
            return render(request, "project_management/projects.html", context)

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.views import View

from project_management.models import Project


class DuplicateProjectView(LoginRequiredMixin, View):
    """Duplicating a project."""

    def post(self, request, project_name):
        """Duplicates the project specified by the url."""
        project = Project.objects.get(owner=request.user, name=project_name)
        if project.owner == request.user:
            fks_to_copy = (
                list(project.heliostats.all())
                + list(project.receivers.all())
                + list(project.light_sources.all())
            )
            settings = project.settings
            project.pk = None
            project.favorite = False

            # Finding a new project name unique to user
            new_name_found = False
            while not new_name_found:
                try:
                    Project.objects.get(name=project_name, owner=request.user)
                    project_name = project_name + "_copy"
                except Project.DoesNotExist:
                    project.name = project_name
                    project.save()
                    new_name_found = True

            # Copy all objects associated to the project via foreign keys
            for assoc_object in fks_to_copy:
                assoc_object.pk = None
                assoc_object.project = project
                assoc_object.save()

            # Copy settings
            settings.pk = None
            settings.project = project
            settings.save()

            return redirect("projects")

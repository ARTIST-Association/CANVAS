from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode
from django.views import View

from canvas import view_name_dict
from project_management.models import Project


class SharedProjectView(LoginRequiredMixin, View):
    """Manages copying a shared project to the user."""

    def get(self, request, uid, token):
        """Get the page where a user can add a shared project to their own."""
        # get the shared project
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = get_user_model().objects.get(pk=user_id)
            project_name = urlsafe_base64_decode(token).decode()
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise Http404

        project = get_object_or_404(Project, owner=user, name=project_name)

        if (
            project.last_shared is None
            or (timezone.now() - project.last_shared).days > 3
        ):
            raise Http404

        return render(
            request,
            "project_management/sharedProject.html",
            context={"project": project},
        )

    def post(self, request, uid, token):
        """Add the project to the users projects."""
        # get the shared project
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = get_user_model().objects.get(pk=user_id)
            project_name = urlsafe_base64_decode(token).decode()
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise Http404

        project = get_object_or_404(Project, owner=user, name=project_name)

        if (
            project.last_shared is None
            or (timezone.now() - project.last_shared).days > 3
        ):
            raise Http404

        # copy the associated project to the user
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
                project.name = project.name + "_shared"
                Project.objects.get(name=project.name, owner=request.user)
            except Project.DoesNotExist:
                project.owner = request.user
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

        return redirect(view_name_dict.project_projects_view)

import pathlib

from django.conf import settings
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode

from canvas.path_dict import (
    hdf5_management_test_scenario_template,
    project_management_projects_template,
)
from canvas.test_constants import (
    COPY_SUFFIX,
    DESCRIPTION_FIELD,
    FILE_FIELD,
    NAME_FIELD,
    OWNER_FIELD,
    PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
    PROJECT_DESCRIPTION_PROJECT_PAGE_TEST_2,
    PROJECT_DESCRIPTION_WITH_WHITESPACE,
    PROJECT_NAME_DUPLICATE_NAME,
    PROJECT_NAME_PROJECT_PAGE_TEST,
    PROJECT_NAME_PROJECT_PAGE_TEST_2,
    PROJECT_NAME_WITH_WHITESPACE,
    SECURE_PASSWORD,
    SHARED_SUFFIX,
    TEST_PROJECT_DESCRIPTION_2,
    TEST_PROJECT_NAME_2,
    TEST_USERNAME,
    UPDATED_DESCRIPTION,
    UPDATED_PROJECT_NAME,
)
from canvas.view_name_dict import (
    project_delete_project_view,
    project_duplicate_project_view,
    project_projects_view,
    project_share_project_view,
    project_shared_projects_view,
    project_toggle_favor_project_view,
    project_update_project_view,
)
from project_management.models import Heliostat, LightSource, Project, Receiver


class ProjectPageTest(TestCase):
    """Tests for the project management views."""

    def setUp(self):
        """Set up a test user, log in, and create a test project for use in all tests."""
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.project = Project.objects.create(
            name=PROJECT_NAME_PROJECT_PAGE_TEST,
            description=PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
            owner=self.user,
        )
        Heliostat.objects.create(project=self.project)
        Receiver.objects.create(project=self.project)
        LightSource.objects.create(project=self.project)
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

        # urls
        self.projects_url = reverse(project_projects_view)
        self.update_project_url = reverse(
            project_update_project_view, args=[self.project.name]
        )
        self.toogle_favor_project_url = reverse(
            project_toggle_favor_project_view, args=[self.project.name]
        )
        self.delete_project_url = reverse(
            project_delete_project_view, args=[self.project.name]
        )
        self.duplicate_project_url = reverse(
            project_duplicate_project_view, args=[self.project.name]
        )
        self.share_project_url = reverse(
            project_share_project_view, args=[self.project.name]
        )
        self.shared_projects_url = reverse(
            project_shared_projects_view,
            args=[
                urlsafe_base64_encode(str(self.user.pk).encode()),
                urlsafe_base64_encode(str(self.project.name).encode()),
            ],
        )

    def test_project_get(self):
        """Test that the projects view loads correctly for a logged-in user."""
        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, project_management_projects_template)

    def test_projects_get_logged_out(self):
        """Test that the projects view redirects to the login page for a logged-out user."""
        self.client.logout()

        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, 302)

    def test_projects_post_no_file(self):
        """Test creating a new project via POST request without a file."""
        response = self.client.post(
            self.projects_url,
            {
                NAME_FIELD: TEST_PROJECT_NAME_2,
                DESCRIPTION_FIELD: TEST_PROJECT_DESCRIPTION_2,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(Project.objects.last().name, TEST_PROJECT_NAME_2)
        self.assertEqual(Project.objects.last().description, TEST_PROJECT_DESCRIPTION_2)
        self.assertEqual(Project.objects.last().owner, self.user)

    def test_projects_post_no_file_name_duplicate(self):
        """Test creating a new project via POST request without a file and a duplicate name."""
        response = self.client.post(
            self.projects_url,
            {
                NAME_FIELD: PROJECT_NAME_PROJECT_PAGE_TEST,
                DESCRIPTION_FIELD: PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(Project.objects.last().name, PROJECT_NAME_PROJECT_PAGE_TEST)
        self.assertEqual(
            Project.objects.last().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST
        )
        self.assertEqual(Project.objects.last().owner, self.user)

    def test_projects_post_with_file(self):
        """Test creating a new project via POST request with a file."""
        file_path = (
            pathlib.Path(settings.BASE_DIR) / hdf5_management_test_scenario_template
        )
        with open(file_path, "rb") as file:
            response = self.client.post(
                self.projects_url,
                {
                    NAME_FIELD: PROJECT_NAME_PROJECT_PAGE_TEST_2,
                    DESCRIPTION_FIELD: PROJECT_DESCRIPTION_PROJECT_PAGE_TEST_2,
                    OWNER_FIELD: self.user.id,
                    FILE_FIELD: file,
                },
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(Project.objects.last().name, PROJECT_NAME_PROJECT_PAGE_TEST_2)
        self.assertEqual(
            Project.objects.last().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST_2
        )
        self.assertEqual(Project.objects.last().owner, self.user)

    def test_projects_post_with_file_name_duplicate(self):
        """Test creating a new project via POST request with a file and a duplicate name."""
        file_path = (
            pathlib.Path(settings.BASE_DIR) / hdf5_management_test_scenario_template
        )
        with open(file_path, "rb") as file:
            response = self.client.post(
                self.projects_url,
                {
                    NAME_FIELD: PROJECT_NAME_PROJECT_PAGE_TEST,
                    DESCRIPTION_FIELD: PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
                    OWNER_FIELD: self.user.id,
                    FILE_FIELD: file,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.count(), 1)
        self.assertTemplateUsed(response, "project_management/projects.html")

    def test_projects_post_with_file_space_in_name(self):
        """Test creating a new project via POST request with a file and spaces in the name."""
        file_path = (
            pathlib.Path(settings.BASE_DIR) / hdf5_management_test_scenario_template
        )
        with open(file_path, "rb") as file:
            response = self.client.post(
                self.projects_url,
                {
                    NAME_FIELD: PROJECT_NAME_WITH_WHITESPACE,
                    DESCRIPTION_FIELD: PROJECT_DESCRIPTION_WITH_WHITESPACE,
                    OWNER_FIELD: self.user.id,
                    FILE_FIELD: file,
                },
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(Project.objects.last().name, PROJECT_NAME_PROJECT_PAGE_TEST_2)
        self.assertEqual(
            Project.objects.last().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST
        )
        self.assertEqual(Project.objects.last().owner, self.user)
        self.assertEqual(
            Project.objects.last().heliostats.count(), 3
        )  # Number of heliostats in the testScenario.h5 file
        self.assertEqual(
            Project.objects.last().heliostats.all()[0].position_x, -3
        )  # Position x of heliostat 0 in the testScenario.h5 file
        self.assertEqual(
            Project.objects.last().receivers.count(), 1
        )  # Number of receivers in the testScenario.h5 file
        self.assertEqual(
            Project.objects.last().receivers.all()[0].position_y, 50
        )  # Position y of receiver 0 in the testScenario.h5 file
        self.assertEqual(
            Project.objects.last().light_sources.count(), 1
        )  # Number of receivers in the testScenario.h5 file

    def test_projects_post_no_data(self):
        """Test creating a new project via POST request without any data."""
        response = self.client.post(self.projects_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.count(), 1)

    def test_update_project_post_name_description_changed(self):
        """Test updating a project via POST request with changed name and description."""
        response = self.client.post(
            self.update_project_url,
            {
                NAME_FIELD: UPDATED_PROJECT_NAME,
                DESCRIPTION_FIELD: UPDATED_DESCRIPTION,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.first().name, UPDATED_PROJECT_NAME)
        self.assertEqual(Project.objects.first().description, UPDATED_DESCRIPTION)
        self.assertEqual(Project.objects.count(), 1)

    def test_update_project_post_name_description_changed_description_is_empty(self):
        """Test updating a project via POST request with changed name and no updated description."""
        response = self.client.post(
            self.update_project_url,
            {
                NAME_FIELD: UPDATED_PROJECT_NAME,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.first().name, UPDATED_PROJECT_NAME)
        self.assertEqual(
            Project.objects.first().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST
        )
        self.assertEqual(Project.objects.count(), 1)

    def test_update_project_post_name_not_changed(self):
        """Test updating a project via POST request with unchanged name."""
        response = self.client.post(
            self.update_project_url,
            {
                NAME_FIELD: PROJECT_NAME_PROJECT_PAGE_TEST,
                DESCRIPTION_FIELD: UPDATED_DESCRIPTION,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.first().name, PROJECT_NAME_PROJECT_PAGE_TEST)
        self.assertEqual(Project.objects.first().description, UPDATED_DESCRIPTION)
        self.assertEqual(Project.objects.count(), 1)

    def test_update_project_post_description_not_changed(self):
        """Test updating a project via POST request with unchanged description."""
        response = self.client.post(
            self.update_project_url,
            {
                NAME_FIELD: UPDATED_PROJECT_NAME,
                DESCRIPTION_FIELD: PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.first().name, UPDATED_PROJECT_NAME)
        self.assertEqual(
            Project.objects.first().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST
        )
        self.assertEqual(Project.objects.count(), 1)

    def test_update_project_post_name_duplicate(self):
        """Test updating a project via POST request with a duplicate name."""
        Project.objects.create(
            name=PROJECT_NAME_PROJECT_PAGE_TEST_2,
            description=PROJECT_DESCRIPTION_PROJECT_PAGE_TEST,
            owner=self.user,
        )

        response = self.client.post(
            self.update_project_url,
            {
                NAME_FIELD: PROJECT_NAME_DUPLICATE_NAME,
                OWNER_FIELD: self.user.id,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.last().name, PROJECT_NAME_PROJECT_PAGE_TEST_2)
        self.assertEqual(
            Project.objects.first().description, PROJECT_DESCRIPTION_PROJECT_PAGE_TEST
        )
        self.assertEqual(Project.objects.count(), 2)

    def test_update_project_get(self):
        """Test that a GET request to the update project view is not allowed."""
        response = self.client.get(self.update_project_url)

        self.assertEqual(response.status_code, 405)

    def test_delete_project_post(self):
        """Test deleting a project."""
        response = self.client.post(self.delete_project_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 0)

    def test_toggle_favorite_project_post(self):
        """Test toggling the favorite status of a project."""
        response = self.client.post(self.toogle_favor_project_url)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.last().favorite, True)

        response = self.client.post(self.toogle_favor_project_url)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.last().favorite, False)

    def test_duplicate_project_post(self):
        """Test duplicating a project."""
        response = self.client.post(self.duplicate_project_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(Project.objects.last().name, self.project.name + COPY_SUFFIX)
        self.assertEqual(Project.objects.last().description, self.project.description)
        self.assertNotEqual(Project.objects.last().pk, self.project.pk)
        self.assertEqual(
            Project.objects.last().heliostats.count(), self.project.heliostats.count()
        )
        self.assertEqual(
            Project.objects.last().heliostats.all()[0].project, Project.objects.last()
        )
        self.assertEqual(
            Project.objects.last().heliostats.all()[0].position_x,
            self.project.heliostats.all()[0].position_x,
        )
        self.assertEqual(
            Project.objects.last().receivers.count(), self.project.receivers.count()
        )
        self.assertEqual(
            Project.objects.last().receivers.all()[0].project, Project.objects.last()
        )
        self.assertEqual(
            Project.objects.last().light_sources.count(),
            self.project.light_sources.count(),
        )
        self.assertEqual(
            Project.objects.last().light_sources.all()[0].project,
            Project.objects.last(),
        )

    def test_share_project_post(self):
        """Test sharing a project."""
        response = self.client.post(self.share_project_url)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            (
                Project.objects.get(owner=self.user, name=self.project.name).last_shared
                - timezone.now()
            ).total_seconds()
            <= 3
        )

    def test_shared_projects_get(self):
        """Test accessing the shared projects view after sharing a project."""
        self.client.post(self.share_project_url)
        response = self.client.get(self.shared_projects_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "project_management/sharedProject.html")

    def test_shared_projects_wrong_values(self):
        """Test accessing the shared projects view with wrong uidb64 and/or project name."""
        response = self.client.get(
            reverse(
                "sharedProjects",
                args=["2", NAME_FIELD],
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_shared_projects_not_shared(self):
        """Test accessing the shared projects view without sharing a project first."""
        response = self.client.get(self.shared_projects_url)

        self.assertEqual(response.status_code, 404)

    def test_shared_projects_post(self):
        """Test the sharing of a project and creating a duplicate for the accessing user."""
        self.client.post(self.share_project_url)
        response = self.client.post(self.shared_projects_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(Project.objects.last().name, self.project.name + SHARED_SUFFIX)
        self.assertEqual(Project.objects.last().description, self.project.description)
        self.assertNotEqual(Project.objects.last().pk, self.project.pk)
        self.assertEqual(
            Project.objects.last().heliostats.count(), self.project.heliostats.count()
        )
        self.assertEqual(
            Project.objects.last().heliostats.all()[0].project, Project.objects.last()
        )
        self.assertEqual(
            Project.objects.last().heliostats.all()[0].position_x,
            self.project.heliostats.all()[0].position_x,
        )
        self.assertEqual(
            Project.objects.last().receivers.count(), self.project.receivers.count()
        )
        self.assertEqual(
            Project.objects.last().receivers.all()[0].project, Project.objects.last()
        )
        self.assertEqual(
            Project.objects.last().light_sources.count(),
            self.project.light_sources.count(),
        )
        self.assertEqual(
            Project.objects.last().light_sources.all()[0].project,
            Project.objects.last(),
        )

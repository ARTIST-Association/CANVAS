from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from canvas.test_constants import (
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
)
from job_interface.models import Job
from project_management.models import Project


class ModelTests(TestCase):
    """Tests for the models in job_interface models.py."""

    def setUp(self):
        """Set up a test user for use in all tests."""
        self.user = User.objects.create_user(
            username="testuser", password="testpassword"
        )

    def _assert_job_created(self, job, owner, project=None):
        """Assert that a job was created correctly."""
        self.assertIsInstance(job, Job)
        self.assertTrue((job.starting_time - timezone.now()).total_seconds() < 2)
        self.assertEqual(job.owner, owner)
        if project is None:
            self.assertIsNone(job.project)
        else:
            self.assertEqual(job.project, project)

    def test_job_owner_given(self):
        """Test creating a job with only the owner given."""
        job = Job.objects.create(owner=self.user)
        self._assert_job_created(job, owner=self.user)

    def test_job_owner_and_project_given(self):
        """Test creating a job with both the owner and project given."""
        project = Project.objects.create(
            name=TEST_PROJECT_NAME,
            description=TEST_PROJECT_DESCRIPTION,
            owner=self.user,
        )
        job = Job.objects.create(owner=self.user, project=project)
        self._assert_job_created(job, owner=self.user, project=project)

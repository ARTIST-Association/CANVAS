from datetime import timedelta

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from canvas.test_constants import (
    JOB_ID_FIELD,
    JOB_IDS_FIELD,
    PROGRESS,
    RESULT,
    SECURE_PASSWORD,
    STATUS,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_USERNAME,
)
from canvas.view_name_dict import job_create_new_job_view, job_status_view
from job_interface.models import Job
from project_management.models import Heliostat, LightSource, Project, Receiver


class JobInterfaceViewTest(TestCase):
    """Tests for the job interface views."""

    # Note: These tests rely on a mocked job interface. Progress and status updates are simulated
    # based on elapsed time rather than actual backend computations.

    def setUp(self):
        """Set up a test user, log in, and create a test project and job for use in all tests."""
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.project = Project.objects.create(
            name=TEST_PROJECT_NAME,
            description=TEST_PROJECT_DESCRIPTION,
            owner=self.user,
        )
        Heliostat.objects.create(project=self.project)
        Receiver.objects.create(project=self.project)
        LightSource.objects.create(project=self.project)
        self.job = Job.objects.create(owner=self.user, project=self.project)
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

        # urls
        self.createNewJob_url = reverse(job_create_new_job_view, args=[self.project.pk])
        self.getJobStatus_url = reverse(
            job_status_view, args=[self.project.pk, self.job.pk]
        )

    def _assert_job_status(self, delta_minutes, expected_status, expect_result):
        """Assert that the job status is as expected after a certain time has passed."""
        self.job.starting_time = timezone.now() - timedelta(minutes=delta_minutes)
        self.job.save()

        response = self.client.get(self.getJobStatus_url)
        data = response.json()

        self.assertEqual(data[JOB_ID_FIELD], self.job.pk)
        self.assertEqual(data[STATUS], expected_status)
        self.assertEqual(
            data[PROGRESS],
            round(
                ((timezone.now() - self.job.starting_time).total_seconds() / 60) / 3, 2
            ),
        )
        if expect_result:
            self.assertIsNotNone(data[RESULT])
        else:
            self.assertIsNone(data[RESULT])

    def test_create_new_job_post(self):
        """Test creating a new job via POST request."""
        response = self.client.post(self.createNewJob_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Job.objects.count(), 2)
        self.assertEqual(response.json()[JOB_ID_FIELD], Job.objects.last().pk)
        self.assertTrue(
            (Job.objects.last().starting_time - timezone.now()).total_seconds() < 2
        )
        self.assertEqual(Job.objects.last().owner, self.user)
        self.assertEqual(Job.objects.last().project, self.project)

    def test_create_new_job_post_logged_out(self):
        """Test that creating a new job via POST request when logged out redirects to login page."""
        self.client.logout()

        response = self.client.post(self.createNewJob_url)

        self.assertEqual(response.status_code, 302)

    def test_create_new_job_get(self):
        """Test retrieving all job IDs via GET request."""
        response = self.client.get(self.createNewJob_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()[JOB_IDS_FIELD]), Job.objects.count())
        self.assertEqual(response.json()[JOB_IDS_FIELD][0], Job.objects.first().pk)

    def test_create_new_job_get_logged_out(self):
        """Test that retrieving all job IDs via GET request when logged out redirects to login page."""
        self.client.logout()

        response = self.client.get(self.createNewJob_url)

        self.assertEqual(response.status_code, 302)

    def test_get_job_status_get_creating_hdf5(self):
        """Test retrieving job status via GET request."""
        self._assert_job_status(
            delta_minutes=0, expected_status="Creating HDF5 file", expect_result=False
        )

    def test_get_job_status_get_aligning_heliostats(self):
        """Test retrieving job status via GET request."""
        self._assert_job_status(
            delta_minutes=2.5,
            expected_status="Aligning Heliostats",
            expect_result=False,
        )

    def test_get_job_status_get_finished(self):
        """Test retrieving job status via GET request."""
        self._assert_job_status(
            delta_minutes=3, expected_status="Finished", expect_result=True
        )

    def test_get_job_status_get_logged_out(self):
        """Test that retrieving job status via GET request when logged out redirects to login page."""
        self.client.logout()

        response = self.client.get(self.getJobStatus_url)

        self.assertEqual(response.status_code, 302)

    def test_get_job_status_delete(self):
        """Test deleting a job via DELETE request."""
        response = self.client.delete(self.getJobStatus_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Job.objects.count(), 0)

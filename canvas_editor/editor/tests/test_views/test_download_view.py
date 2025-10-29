import io

import h5py
from artist.util import config_dictionary
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from canvas.test_constants import (
    PROJECT_NAME_FIELD,
    SECURE_PASSWORD,
    TEST_PROJECT_DESCRIPTION,
    TEST_PROJECT_NAME,
    TEST_USERNAME,
)
from canvas.view_name_dict import editor_download_view
from project_management.models import Heliostat, LightSource, Project, Receiver


class DownloadViewTest(TestCase):
    """Tests for the download view."""

    def setUp(self):
        """Set up a test user, log in, and create a test project with components for use in all tests."""
        self.download = reverse(
            editor_download_view,
            kwargs={PROJECT_NAME_FIELD: TEST_PROJECT_NAME},
        )
        user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.client = Client()
        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

        project = Project()
        project.name = TEST_PROJECT_NAME
        project.description = TEST_PROJECT_DESCRIPTION
        project.owner = user
        project.save()

        # Add a heliostat to the project
        heliostat = Heliostat()
        heliostat.name = "testHeliostat"
        heliostat.project = project
        heliostat.position_x = 42
        heliostat.save()

        # Add a receiver to the project
        receiver = Receiver()
        receiver.name = "testReceiver"
        receiver.project = project
        receiver.normal_x = 42
        receiver.save()

        # Add a light source to the project
        light_source = LightSource()
        light_source.name = "testLightSource"
        light_source.project = project
        light_source.number_of_rays = 42
        light_source.save()

    def test_download(self):
        """Test downloading the project as an hdf5 file."""
        response = self.client.get(self.download)

        # assert that response is a file response containing a hdf5 file
        self.assertTrue(response.has_header("Content-Disposition"))
        self.assertIn(
            f'attachment; filename="{TEST_PROJECT_NAME}.h5"',
            response["Content-Disposition"],
        )

        downloaded_hdf5_bytes = b"".join(response.streaming_content)
        downloaded_file_buffer = io.BytesIO(downloaded_hdf5_bytes)

        with h5py.File(downloaded_file_buffer, "r") as hdf5_file:
            # Check if the datasets contain the expected data
            heliostats = hdf5_file.get(config_dictionary.heliostat_key)
            receivers = hdf5_file.get(config_dictionary.target_area_key)
            light_sources = hdf5_file.get(config_dictionary.light_source_key)

            self.assertIsNotNone(heliostats)
            self.assertIsNotNone(receivers)
            self.assertIsNotNone(light_sources)

            for heliostat in heliostats:
                self.assertEqual(
                    42, heliostats[heliostat][config_dictionary.heliostat_position][0]
                )

            for receiver in receivers:
                self.assertEqual(42, receivers[receiver]["normal_vector"][0])

            for light_source in light_sources:
                self.assertEqual(42, light_sources[light_source]["number_of_rays"][()])

    def test_download_logged_out(self):
        """Test that downloading the project when logged out redirects to login page."""
        self.client.logout()
        response = self.client.get(self.download)
        self.assertEqual(response.status_code, 302)

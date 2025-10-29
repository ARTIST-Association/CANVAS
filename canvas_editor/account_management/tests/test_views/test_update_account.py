import io
import os

from django.contrib.auth.models import User
from django.contrib.messages import get_messages
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse
from PIL import Image

from account_management.models import UserProfile
from canvas import message_dict, path_dict, view_name_dict
from canvas.test_constants import (
    DELETE_PIC_FIELD,
    EMAIL_FIELD,
    FIRST_NAME_FIELD,
    LAST_NAME_FIELD,
    NEW_PASSWORD_FIELD,
    NEW_TEST_FIRST_NAME,
    NEW_TEST_LAST_NAME,
    OLD_PASSWORD_FIELD,
    PASSWORD_CONFIRMATION_FIELD,
    PROFILE_PIC_FIELD,
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
    UPDATED_PASSWORD,
    WRONG_EMAIL,
)
from project_management.models import Project


class UpdateAccountTest(TestCase):
    """
    Tests for the update account view.

    This test case covers the following scenarios:
    - Attempting to update an account without authentication.
    - Sending a GET request to the update account endpoint.
    - Updating account information with valid data.
    - Attempting to update with an email that is already in use.
    - Redirecting after update from different pages.
    - Uploading and replacing profile pictures.
    - Deleting profile pictures and verifying file deletion.
    """

    def setUp(self):
        """
        Set up the test client, user, profile, and update account URL for each test.

        Creates a test user and associated profile for account update tests.
        """
        self.client = Client()
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.update_account_url = reverse(view_name_dict.account_update_account_view)

    def test_post_not_authenticated(self):
        """
        Test that attempting to update an account without authentication redirects to the login page.

        Asserts that the response is a redirect to the login page.
        """
        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: WRONG_EMAIL,
                OLD_PASSWORD_FIELD: SECURE_PASSWORD,
                NEW_PASSWORD_FIELD: UPDATED_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: UPDATED_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, "/?next=/update_account/")

    def test_get(self):
        """
        Test that a GET request to the update account endpoint returns a 405 status code.

        Asserts that only POST requests are allowed for account updates.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)
        response = self.client.get(self.update_account_url)

        self.assertEqual(response.status_code, 405)

    def test_post_valid_data_without_profile(self):
        """
        Test that a user can successfully update their account information.

        Asserts that the user's information is updated and the response is a redirect.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: WRONG_EMAIL,
                OLD_PASSWORD_FIELD: SECURE_PASSWORD,
                NEW_PASSWORD_FIELD: UPDATED_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: UPDATED_PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, NEW_TEST_FIRST_NAME)
        self.assertEqual(self.user.last_name, NEW_TEST_LAST_NAME)
        self.assertTrue(self.user.check_password(UPDATED_PASSWORD))
        self.assertEqual(self.user.email, WRONG_EMAIL)
        self.assertEqual(self.user.username, WRONG_EMAIL)

    def test_post_invalid_data(self):
        """
        Test that attempting to update with an email that is already in use fails.

        Asserts that the user's information is not updated and an error message is shown.
        """
        User.objects.create_user(
            username=WRONG_EMAIL,
            email=WRONG_EMAIL,
            password=SECURE_PASSWORD,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
        )
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: WRONG_EMAIL,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, TEST_FIRST_NAME)
        self.assertEqual(self.user.last_name, TEST_LAST_NAME)
        self.assertEqual(self.user.email, TEST_EMAIL)
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(
            any(message_dict.email_already_in_use_text in str(msg) for msg in messages)
        )

    def test_post_from_projects_page(self):
        """
        Test that the user is redirected back to the projects page after updating their account.

        Asserts that the user's information is updated and redirection occurs.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
            },
            HTTP_REFERER="/projects/",
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(view_name_dict.account_projects_view))
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, NEW_TEST_FIRST_NAME)
        self.assertEqual(self.user.last_name, NEW_TEST_LAST_NAME)
        self.assertEqual(self.user.email, TEST_EMAIL)
        self.assertTrue(self.user.check_password(SECURE_PASSWORD))

    def test_post_from_editor_page(self):
        """
        Test that the user is redirected back to the editor page after updating their account.

        Asserts that the user's information is updated and redirection occurs.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        project = Project.objects.create(
            name=view_name_dict.account_test_project_view,
            owner=self.user,
        )
        editor_url = reverse(view_name_dict.editor_view, args=[project.name])

        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
            },
            HTTP_REFERER=editor_url,
        )

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, editor_url)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, NEW_TEST_FIRST_NAME)
        self.assertEqual(self.user.last_name, NEW_TEST_LAST_NAME)
        self.assertEqual(self.user.email, TEST_EMAIL)

    def test_post_upload_profile_picture(self):
        """
        Test uploading a profile picture and verifying that it is saved correctly.

        Asserts that the profile picture is saved and the file path is correct.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        # create example picture
        image = Image.new("RGB", (100, 100), color="blue")
        image_file = io.BytesIO()
        image.save(image_file, format="JPEG")
        image_file.seek(0)
        profile_picture = SimpleUploadedFile(
            path_dict.profile_picture_jpg,
            image_file.read(),
            content_type=path_dict.profile_picture_content_type,
        )

        response = self.client.post(
            self.update_account_url,
            {
                FIRST_NAME_FIELD: NEW_TEST_FIRST_NAME,
                LAST_NAME_FIELD: NEW_TEST_LAST_NAME,
                EMAIL_FIELD: TEST_EMAIL,
                OLD_PASSWORD_FIELD: SECURE_PASSWORD,
                NEW_PASSWORD_FIELD: UPDATED_PASSWORD,
                PASSWORD_CONFIRMATION_FIELD: UPDATED_PASSWORD,
                PROFILE_PIC_FIELD: profile_picture,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.user.refresh_from_db()

        self.profile.refresh_from_db()
        self.assertTrue(self.profile.profile_picture)
        expected_path = f"users/{self.user.id}/profile_picture"
        self.assertTrue(self.profile.profile_picture.name.startswith(expected_path))

    def test_update_profile_picture_replaces_old_one(self):
        """
        Test that the old profile picture is deleted when a new one is uploaded.

        Asserts that the new image is saved and the old image is deleted.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        # First profile picture upload
        image1 = Image.new("RGB", (100, 100), color="blue")
        image_file1 = io.BytesIO()
        image1.save(image_file1, format="JPEG")
        image_file1.seek(0)
        profile_picture1 = SimpleUploadedFile(
            path_dict.old_profile_picture_jpg,
            image_file1.read(),
            content_type=path_dict.profile_picture_content_type,
        )

        self.profile.profile_picture = profile_picture1
        self.profile.save()

        first_picture_path = f"users/{self.user.id}/old_profile_picture"
        self.assertTrue(
            self.profile.profile_picture.name.startswith(first_picture_path)
        )

        # Second profile picture upload
        image2 = Image.new("RGB", (100, 100), color="red")
        image_file2 = io.BytesIO()
        image2.save(image_file2, format="JPEG")
        image_file2.seek(0)
        new_profile_picture = SimpleUploadedFile(
            path_dict.new_profile_picture_jpg,
            image_file2.read(),
            content_type=path_dict.profile_picture_content_type,
        )

        response2 = self.client.post(
            self.update_account_url,
            {
                PROFILE_PIC_FIELD: new_profile_picture,
            },
        )

        self.assertEqual(response2.status_code, 302)
        self.profile.refresh_from_db()

        # Verify the new image was saved
        first_picture_path = f"users/{self.user.id}/new_profile_picture"
        self.assertTrue(
            self.profile.profile_picture.name.startswith(first_picture_path)
        )
        # Verify the old image was deleted
        self.assertFalse(os.path.exists(first_picture_path))

    def test_post_delete_profile_picture(self):
        """
        Test that a user can delete their profile picture.

        Asserts that the profile picture is set to the default and the old image is deleted.
        """
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)

        image = Image.new("RGB", (100, 100), color="blue")
        image_file = io.BytesIO()
        image.save(image_file, format="JPEG")
        image_file.seek(0)
        profile_picture = SimpleUploadedFile(
            path_dict.profile_picture_jpg,
            image_file.read(),
            content_type=path_dict.profile_picture_content_type,
        )

        self.profile.profile_picture = profile_picture
        self.profile.save()

        expected_path = f"users/{self.user.id}/profile_picture"
        self.assertTrue(self.profile.profile_picture.name.startswith(expected_path))

        response = self.client.post(
            self.update_account_url,
            {
                DELETE_PIC_FIELD: "1",  # Set profile picture to default
            },
        )

        self.assertEqual(response.status_code, 302)
        self.profile.refresh_from_db()

        # Verify profile picture is default picture
        self.assertEqual(
            self.profile.profile_picture.name, path_dict.default_profile_pic
        )

        # Verify the old image was deleted
        self.assertFalse(os.path.exists(expected_path))

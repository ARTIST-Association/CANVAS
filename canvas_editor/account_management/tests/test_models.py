from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.templatetags.static import static
from django.test import TestCase

from account_management.models import UserProfile
from canvas.path_dict import default_profile_pic
from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_USERNAME,
)


class UserProfileModelTest(TestCase):
    """Contains tests for the user profile model."""

    def setUp(self):
        """Configure the testing environment."""
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )
        self.profile = UserProfile.objects.get(user=self.user)

    def test_user_profile_creation(self):
        """Test the fields of the automatically generated user profile on user creation."""
        self.assertEqual(self.profile.user, self.user)
        self.assertFalse(bool(self.profile.profile_picture))
        self.assertEqual(self.profile.image_url, static(default_profile_pic))

    def test_user_profile_str(self):
        """Test the __str__ method of the user profile."""
        self.assertEqual(str(self.profile), self.user.email)

    def test_user_profile_picture_upload_path(self):
        """Test that the upload of profile pictures works."""
        file = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )
        self.profile.profile_picture = file
        self.profile.save()
        expected_prefix = f"users/{self.user.id}/test"

        self.assertTrue(self.profile.profile_picture.name.startswith(expected_prefix))

from django.contrib.auth.models import User
from django.test import TestCase

from account_management.models import UserProfile
from canvas.path_dict import user_1_profile_picture
from canvas.test_constants import (
    SECURE_PASSWORD,
    TEST_EMAIL,
    TEST_FIRST_NAME,
    TEST_LAST_NAME,
)


class TestSignals(TestCase):
    """Contains test for the signals of the user profile model."""

    def setUp(self) -> None:
        """Configure the testing environment for the tests."""
        self.user = User.objects.create_user(
            username=TEST_EMAIL,
            first_name=TEST_FIRST_NAME,
            last_name=TEST_LAST_NAME,
            email=TEST_EMAIL,
            password=SECURE_PASSWORD,
        )

    def test_create_user_profile(self):
        """Test the automatic generation of the user profile."""
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())
        user_profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(user_profile.user, self.user)

    def test_save_user_profile(self):
        """Test the automatic saving of the profile when saving the user."""
        user_profile = self.user.userprofile
        user_profile.profile_picture = user_1_profile_picture
        self.user.save()
        updated_profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(updated_profile.profile_picture, user_1_profile_picture)

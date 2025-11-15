from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from canvas import message_dict, view_name_dict
from canvas.test_constants import SECURE_PASSWORD, TEST_USERNAME
from user_settings.forms.change_username_form import ChangeUsernameForm


class TestChangeUsernameView(TestCase):
    """Test class to test the change username view."""

    def setUp(self) -> None:
        """Create a new user and log the new user in."""
        super().setUp()
        self.url = reverse(view_name_dict.change_username)
        self.user = User.objects.create_user(
            username=TEST_USERNAME, password=SECURE_PASSWORD
        )
        self.valid_form_data = {"new_username": TEST_USERNAME + "1"}
        self.invalid_form_data = {"new_username": TEST_USERNAME}

        self.client.login(username=TEST_USERNAME, password=SECURE_PASSWORD)

    def test_valid_form(self):
        """Test with valid form data."""
        form = ChangeUsernameForm(self.valid_form_data)
        self.assertTrue(form.is_valid())

    def test_invalid_form(self):
        """Test with invalid form data."""
        form = ChangeUsernameForm(self.invalid_form_data)
        self.assertFalse(form.is_valid())
        self.assertTrue(form.errors)
        if form.errors:
            self.assertEqual(
                message_dict.invalid_new_username_text, form.errors["new_username"][0]
            )

    def test_valid_post(self):
        """Test with a valid form attached."""
        self.client.post(self.url, data=self.valid_form_data, follow=True)
        self.user.refresh_from_db()
        self.assertEqual(self.valid_form_data["new_username"], self.user.username)

    def test_not_reachable_when_logged_out(self):
        """Test that the projects view redirects to the login page for a logged-out user."""
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)

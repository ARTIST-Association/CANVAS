from canvas.test_constants import SECURE_PASSWORD, TEST_EMAIL


class ParameterizedViewTestMixin:
    """
    Mixin class to provide parameterized testing capabilities for Django views.

    This class provides helper methods for asserting view responses and
    testing authentication-related redirects in view tests.
    """

    def assert_view_get(self, url_name, template, expected_status=200):
        """Assert that a GET request to the given URL returns the expected status code and uses the specified template."""
        response = self.client.get(url_name)
        self.assertEqual(response.status_code, expected_status)
        self.assertTemplateUsed(response, template)

    def get_authenticated(self, url_name):
        """Test that an authenticated user is redirected to the projects page when accessing the register/login page."""
        self.client.login(username=TEST_EMAIL, password=SECURE_PASSWORD)
        response = self.client.get(url_name)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.projects_url)

from django.test import Client, TestCase
from django.urls import reverse

from account_management.tests.test_views.parameterized_view_test_mixin import (
    ParameterizedViewTestMixin,
)
from canvas import path_dict, view_name_dict


class InvalidLinkTest(ParameterizedViewTestMixin, TestCase):
    """
    Tests for the invalid link view.

    This test case covers the following scenarios:
    - Accessing the invalid link page via GET request.
    - Ensuring POST requests to the invalid link page are not allowed.
    """

    def setUp(self):
        """Set up the test client and invalid link URL for each test."""
        self.client = Client()
        self.invalid_link_url = reverse(view_name_dict.account_invalid_link_view)

    def test_get(self):
        """
        Test that the invalid link page is accessible via GET request.

        Asserts that the correct template is used for the response.
        """
        self.assert_view_get(self.invalid_link_url, path_dict.invalid_link_template)

    def test_post(self):
        """
        Test that a POST request to the invalid link page is not allowed.

        Asserts that the response status code is 405 (Method Not Allowed).
        """
        response = self.client.post(self.invalid_link_url)
        self.assertEqual(response.status_code, 405)

from typing import Any


class FormTestMixin:
    """A mixin class for form tests."""

    default_data: dict[str, Any] = {}

    def create_form(self, **overrides):
        """Create a form instance with the given overrides."""
        data = self.default_data.copy()
        data.update(overrides)
        return self.form_class(data=data)

    def create_form_with_instance(self, **overrides):
        """Create a form instance with the given overrides while using the specified instance."""
        data = self.default_data.copy()
        data.update(overrides)
        return self.form_class(instance=self.instance, data=data)

    def create_form_with_user(self, **overrides):
        """Create a form instance with the given overrides while using the specified user."""
        data = self.default_data.copy()
        data.update(overrides)
        return self.form_class(user=self.user, data=data)

    def assert_form_error_message(self, form, field, expected_message):
        """Assert that the form contains the expected error message for the given field."""
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors[field], [expected_message])

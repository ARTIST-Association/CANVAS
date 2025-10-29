import re

from django.core.exceptions import ValidationError


def validate_symbols(name):
    """Validate that the name contains only allowed characters."""
    if not re.match(r"^[a-zA-Z0-9_\säöüÄÖÜ-]+$", name):
        raise ValidationError("No special characters allowed.")

    return name

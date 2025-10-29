# In your app's templatetags/custom_filters.py
from django import template

register = template.Library()


@register.filter(name="truncate_with_end")
def truncate_with_end(value, length):
    """Truncate the string to the given length and add the last 3 characters after '...'."""
    if len(value) > length:
        truncated = value[: length - 4]  # Subtract 3 for the ellipsis
        end = value[-4:]  # Get the last 3 characters
        return f"{truncated}...{end}"
    return value  # Return the original value if it's shorter than the limit

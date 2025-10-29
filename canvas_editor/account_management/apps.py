from django.apps import AppConfig


class AccountManagementConfig(AppConfig):
    """Django app for everything account management registered."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "account_management"

    def ready(self):
        """Start the account management app and also imports the signals used for this app."""
        # Import signals to ensure they are registered
        import account_management.signals  # noqa: F401

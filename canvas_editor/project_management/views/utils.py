from django.contrib.auth.models import User


def is_name_unique(user: User, project_name: str) -> bool:
    """Check whether a projects name is unique for the given user."""
    for project in user.projects.all():
        if project.name == project_name:
            return False
    return True

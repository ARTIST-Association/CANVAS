from django.contrib import admin

from project_management.models import Project, SceneObject, Settings

# Registering all models
admin.site.register(Project)
admin.site.register(SceneObject)
admin.site.register(Settings)

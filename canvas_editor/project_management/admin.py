from django.contrib import admin

from project_management.models import (
    Heliostat,
    LightSource,
    Project,
    Receiver,
    Settings,
)

# Registering all models
admin.site.register(Project)
admin.site.register(Heliostat)
admin.site.register(Receiver)
admin.site.register(LightSource)
admin.site.register(Settings)

from django.views.generic import TemplateView


class AppearanceView(TemplateView):
    """View to change the appearance settings of canvas.

    E.g. dark mode, light mode and adapt to system theme.
    """

    template_name = "user_settings/appearance.html"

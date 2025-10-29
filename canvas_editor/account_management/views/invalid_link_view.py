from django.views.generic import TemplateView


class InvalidLinkView(TemplateView):
    """Render a page indicating that the link is invalid."""

    template_name = "account_management/invalid_link.html"

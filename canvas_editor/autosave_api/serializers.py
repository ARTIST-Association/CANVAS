"""Serializers for the autosave API.

Scene objects are stored generically (type + JSON properties) and validated
against the object-type registry, so there is a single serializer for every
object type instead of one per type.
"""

from rest_framework import serializers

from project_management import object_types
from project_management.models import Project, SceneObject, Settings


class SceneObjectSerializer(serializers.ModelSerializer):
    """Serialize any scene object, validating ``properties`` against its type."""

    class Meta:
        """Meta class for SceneObjectSerializer."""

        model = SceneObject
        fields = ["id", "type", "name", "properties"]

    def validate(self, attrs):
        """Validate the type and coerce/default properties against the registry."""
        # type is required on create; on partial update fall back to the instance.
        type_ = attrs.get("type") or getattr(self.instance, "type", None)
        if type_ not in object_types.REGISTRY:
            raise serializers.ValidationError({"type": f"Unknown object type '{type_}'."})

        raw = attrs.get("properties")
        if raw is None:
            raw = self.instance.properties if self.instance is not None else {}

        try:
            attrs["properties"] = object_types.validate_properties(type_, raw)
        except object_types.SchemaError as exc:
            raise serializers.ValidationError({"properties": str(exc)})
        return attrs


class SettingsSerializer(serializers.ModelSerializer):
    """Serializer to convert a settings object into JSON or to convert JSON into a settings object."""

    class Meta:
        """Meta class for SettingsSerializer."""

        model = Settings
        exclude = ["project", "id"]


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer to convert a project into JSON only containing name and id."""

    class Meta:
        """Meta class for ProjectSerializer."""

        model = Project
        fields = ["id", "name"]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full project payload: all scene objects plus the project settings."""

    objects = SceneObjectSerializer(source="scene_objects", many=True, read_only=True)
    settings = SettingsSerializer(read_only=True)

    class Meta:
        """Meta class for ProjectDetailSerializer."""

        model = Project
        fields = ["name", "objects", "settings"]

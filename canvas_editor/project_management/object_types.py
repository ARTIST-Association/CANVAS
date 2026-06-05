"""Object-type registry: the single source of truth for scene object types.

Each object type declares its display info, how it is represented in the 3D
scene (``mesh``), and a list of typed fields. The same registry is used to:

* validate and default a :class:`~project_management.models.SceneObject`'s
  ``properties`` JSON on write, and
* feed the ``/api/object-types/`` endpoint so the frontend can render the
  inspector, overview and placement controls generically.

Adding a new object type is a single entry here - no model, migration,
serializer, view, or per-type frontend code required.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

# Field "kind"s understood by both the backend validator and the frontend
# schema->control mapping.
NUMBER = "number"
INTEGER = "integer"
SLIDER = "slider"
TEXT = "text"
SELECT = "select"
VECTOR3 = "vector3"


class SchemaError(ValueError):
    """Raised when a SceneObject's properties do not match its type schema."""


@dataclass(frozen=True)
class FieldSpec:
    """A single typed field of an object type."""

    name: str
    label: str
    kind: str
    default: Any
    min: float | None = None
    max: float | None = None
    step: float | None = None
    options: tuple[dict[str, str], ...] | None = None


@dataclass(frozen=True)
class ObjectTypeSpec:
    """The full schema + presentation for one object type."""

    type: str
    label: str
    icon: str
    mesh: dict[str, Any]
    fields: tuple[FieldSpec, ...]


def _n(name: str, label: str, default: float, **kw: Any) -> FieldSpec:
    return FieldSpec(name=name, label=label, kind=NUMBER, default=default, **kw)


def _vec(name: str, label: str, default: list[float]) -> FieldSpec:
    return FieldSpec(name=name, label=label, kind=VECTOR3, default=default)


# Defaults mirror the ARTIST tutorial values used by the original typed models.
REGISTRY: dict[str, ObjectTypeSpec] = {
    "heliostat": ObjectTypeSpec(
        type="heliostat",
        label="Heliostat",
        icon="bi-grid-3x3-gap",
        mesh={"kind": "glb", "url": "/static/models/heliostat.glb", "castShadow": True},
        fields=(_vec("position", "Position", [0.0, 0.0, 0.0]),),
    ),
    "receiver": ObjectTypeSpec(
        type="receiver",
        label="Receiver",
        icon="bi-broadcast-pin",
        mesh={"kind": "glb", "url": "/static/models/tower.glb", "castShadow": True},
        fields=(
            _vec("position", "Position", [0.0, 50.0, 0.0]),
            _vec("normal", "Normal", [0.0, 1.0, 0.0]),
            FieldSpec(
                name="receiver_type",
                label="Type",
                kind=SELECT,
                default="planar",
                options=({"value": "planar", "label": "Planar"}, {"value": "round", "label": "Round"}),
            ),
            _n("plane_e", "Plane E", 8.629666667),
            _n("plane_u", "Plane U", 7.0),
            FieldSpec(name="resolution_e", label="Resolution E", kind=INTEGER, default=256, min=1),
            FieldSpec(name="resolution_u", label="Resolution U", kind=INTEGER, default=256, min=1),
            _n("curvature_e", "Curvature E", 0.0),
            _n("curvature_u", "Curvature U", 0.0),
        ),
    ),
    "light_source": ObjectTypeSpec(
        type="light_source",
        label="Light source",
        icon="bi-brightness-high",
        mesh={"kind": "primitive", "shape": "sphere", "size": 3, "color": "#ffdd55"},
        fields=(
            FieldSpec(name="number_of_rays", label="Number of rays", kind=INTEGER, default=100, min=1),
            FieldSpec(
                name="light_source_type",
                label="Light source type",
                kind=SELECT,
                default="sun",
                options=({"value": "sun", "label": "Sun"},),
            ),
            FieldSpec(
                name="distribution_type",
                label="Distribution",
                kind=SELECT,
                default="normal",
                options=({"value": "normal", "label": "Normal"},),
            ),
            _n("mean", "Mean", 0.0),
            _n("covariance", "Covariance", 4.3681e-06),
        ),
    ),
    # Proof that a brand-new type needs only a registry entry: no model,
    # migration, serializer, view, command, or bespoke mesh asset.
    "target_point": ObjectTypeSpec(
        type="target_point",
        label="Target point",
        icon="bi-bullseye",
        mesh={"kind": "primitive", "shape": "octahedron", "size": 2, "color": "#ff4477"},
        fields=(
            _vec("position", "Position", [0.0, 10.0, 0.0]),
            FieldSpec(name="power", label="Power", kind=SLIDER, default=1.0, min=0.0, max=10.0, step=0.1),
        ),
    ),
}


def _as_float(field_spec: FieldSpec, value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise SchemaError(f"'{field_spec.name}' must be a number") from exc


def _check_range(field_spec: FieldSpec, value: float) -> None:
    if field_spec.min is not None and value < field_spec.min:
        raise SchemaError(f"'{field_spec.name}' must be >= {field_spec.min}")
    if field_spec.max is not None and value > field_spec.max:
        raise SchemaError(f"'{field_spec.name}' must be <= {field_spec.max}")


def _coerce(field_spec: FieldSpec, value: Any) -> Any:
    if field_spec.kind in (NUMBER, SLIDER):
        result = _as_float(field_spec, value)
        _check_range(field_spec, result)
        return result
    if field_spec.kind == INTEGER:
        result = int(_as_float(field_spec, value))
        _check_range(field_spec, result)
        return result
    if field_spec.kind == TEXT:
        if not isinstance(value, str):
            raise SchemaError(f"'{field_spec.name}' must be a string")
        return value
    if field_spec.kind == SELECT:
        allowed = {option["value"] for option in (field_spec.options or ())}
        if value not in allowed:
            raise SchemaError(f"'{field_spec.name}' must be one of {sorted(allowed)}")
        return value
    if field_spec.kind == VECTOR3:
        if not isinstance(value, (list, tuple)) or len(value) != 3:
            raise SchemaError(f"'{field_spec.name}' must be a 3-element vector")
        return [_as_float(field_spec, component) for component in value]
    raise SchemaError(f"unknown field kind '{field_spec.kind}'")


def default_properties(type_: str) -> dict[str, Any]:
    """Return a fresh properties dict with every field at its default value."""
    spec = REGISTRY[type_]
    return {field_spec.name: field_spec.default for field_spec in spec.fields}


def validate_properties(type_: str, raw: Any) -> dict[str, Any]:
    """Validate ``raw`` properties against ``type_``'s schema, filling defaults.

    Unknown keys are rejected; missing keys fall back to their default.
    """
    if type_ not in REGISTRY:
        raise SchemaError(f"unknown object type '{type_}'")
    if not isinstance(raw, dict):
        raise SchemaError("properties must be an object")

    spec = REGISTRY[type_]
    allowed = {field_spec.name for field_spec in spec.fields}
    unknown = set(raw) - allowed
    if unknown:
        raise SchemaError(f"unknown properties: {sorted(unknown)}")

    return {
        field_spec.name: _coerce(field_spec, raw.get(field_spec.name, field_spec.default)) for field_spec in spec.fields
    }


def registry_as_dict() -> list[dict[str, Any]]:
    """Serialize the whole registry for the /api/object-types/ endpoint."""
    return [asdict(spec) for spec in REGISTRY.values()]

// Shared types mirroring the backend object-type registry (/api/object-types/)
// and the project payload (/api/projects/<id>/).

export type FieldKind = "number" | "integer" | "slider" | "text" | "select" | "vector3";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  default: PropertyValue;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  options?: SelectOption[] | null;
}

export type MeshDescriptor =
  | { kind: "glb"; url: string; castShadow?: boolean }
  | { kind: "primitive"; shape: PrimitiveShape; size: number; color: string };

export type PrimitiveShape = "sphere" | "box" | "octahedron" | "cone";

export interface ObjectTypeSpec {
  type: string;
  label: string;
  icon: string;
  mesh: MeshDescriptor;
  fields: FieldSpec[];
}

export type Vector3Tuple = [number, number, number];
export type PropertyValue = number | string | Vector3Tuple;
export type Properties = Record<string, PropertyValue>;

export interface SceneObjectData {
  id: number;
  type: string;
  name: string;
  properties: Properties;
}

export interface ProjectSettings {
  shadows: boolean;
  fog: boolean;
}

export interface ProjectData {
  name: string;
  objects: SceneObjectData[];
  settings: ProjectSettings;
}

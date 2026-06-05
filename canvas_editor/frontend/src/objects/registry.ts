import type { FieldSpec, ObjectTypeSpec, Properties } from "@/core/types";

/**
 * Lookup over the object-type registry fetched from /api/object-types/.
 * Every type's schema + presentation lives here, so the UI, scene and commands
 * are entirely generic.
 */
export class ObjectTypeRegistry {
  readonly #byType = new Map<string, ObjectTypeSpec>();

  constructor(specs: ObjectTypeSpec[]) {
    for (const spec of specs) {
      this.#byType.set(spec.type, spec);
    }
  }

  get(type: string): ObjectTypeSpec {
    const spec = this.#byType.get(type);
    if (!spec) {
      throw new Error(`Unknown object type: ${type}`);
    }
    return spec;
  }

  has(type: string): boolean {
    return this.#byType.has(type);
  }

  all(): ObjectTypeSpec[] {
    return [...this.#byType.values()];
  }

  /** Fresh properties for a type, each field at its declared default. */
  defaultProperties(type: string): Properties {
    const properties: Properties = {};
    for (const field of this.get(type).fields) {
      properties[field.name] = cloneDefault(field);
    }
    return properties;
  }
}

function cloneDefault(field: FieldSpec): FieldSpec["default"] {
  return Array.isArray(field.default) ? ([...field.default] as FieldSpec["default"]) : field.default;
}

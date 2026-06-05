import type { Properties, SceneObjectData } from "@/core/types";
import type { ObjectTypeRegistry } from "@/objects/registry";
import { SceneObject, type SceneObjectHooks } from "@/objects/SceneObject";

/** Creates generic SceneObjects from the registry (new, from API data, or by cloning). */
export class ObjectFactory {
  readonly #registry: ObjectTypeRegistry;
  readonly #hooks: SceneObjectHooks;

  constructor(registry: ObjectTypeRegistry, hooks: SceneObjectHooks) {
    this.#registry = registry;
    this.#hooks = hooks;
  }

  /** A new object of `type` with default properties (used by placement). */
  create(type: string, overrides: { name?: string; properties?: Properties } = {}): SceneObject {
    const spec = this.#registry.get(type);
    return new SceneObject(
      spec,
      { name: overrides.name, properties: overrides.properties ?? this.#registry.defaultProperties(type) },
      this.#hooks,
    );
  }

  /** Reconstruct an object from a persisted API record. */
  fromData(data: SceneObjectData): SceneObject {
    const spec = this.#registry.get(data.type);
    return new SceneObject(spec, { id: data.id, name: data.name, properties: data.properties }, this.#hooks);
  }

  /** A detached copy of `source` (no id; not yet persisted). */
  duplicate(source: SceneObject): SceneObject {
    return new SceneObject(source.spec, { name: source.name.value, properties: source.snapshot() }, this.#hooks);
  }
}

import * as THREE from "three";
import { effect, signal, type Signal } from "@preact/signals-core";
import type { ObjectTypeSpec, Properties, PropertyValue, Vector3Tuple } from "@/core/types";
import { buildMesh } from "@/rendering/meshFactory";

export interface SceneObjectHooks {
  /** Request an on-demand render (e.g. after a property or mesh change). */
  requestRender: () => void;
}

export interface SceneObjectInit {
  id?: number | null;
  name?: string;
  properties?: Properties;
}

/**
 * A single, generic scene object. There are no per-type subclasses: the type's
 * schema (from the registry) drives its fields, mesh and behaviour. Field
 * values are reactive signals so the inspector/overview can bind to them and
 * update in place.
 */
export class SceneObject {
  readonly object3d = new THREE.Group();
  readonly spec: ObjectTypeSpec;
  readonly name: Signal<string>;
  readonly properties: Map<string, Signal<PropertyValue>>;
  apiId: number | null;

  readonly #disposers: Array<() => void> = [];

  constructor(spec: ObjectTypeSpec, init: SceneObjectInit, hooks: SceneObjectHooks) {
    this.spec = spec;
    this.apiId = init.id ?? null;
    this.name = signal(init.name && init.name.length > 0 ? init.name : spec.label);
    this.properties = new Map();
    for (const field of spec.fields) {
      this.properties.set(field.name, signal(init.properties?.[field.name] ?? field.default));
    }

    this.object3d.name = spec.type;
    this.object3d.userData.sceneObject = this;
    this.object3d.add(buildMesh(spec.mesh, hooks.requestRender));

    // Keep the mesh transform in sync with the reactive `position` field.
    const position = this.properties.get("position");
    if (position) {
      this.#disposers.push(
        effect(() => {
          const [x, y, z] = position.value as Vector3Tuple;
          this.object3d.position.set(x, y, z);
          hooks.requestRender();
        }),
      );
    }
  }

  get(fieldName: string): PropertyValue {
    const value = this.properties.get(fieldName);
    if (!value) {
      throw new Error(`${this.spec.type} has no field '${fieldName}'`);
    }
    return value.value;
  }

  set(fieldName: string, value: PropertyValue): void {
    const target = this.properties.get(fieldName);
    if (!target) {
      throw new Error(`${this.spec.type} has no field '${fieldName}'`);
    }
    target.value = value;
  }

  /** Current property values as a plain object (for serialization/cloning). */
  snapshot(): Properties {
    const properties: Properties = {};
    for (const [name, value] of this.properties) {
      properties[name] = value.value;
    }
    return properties;
  }

  toData() {
    return {
      id: this.apiId ?? 0,
      type: this.spec.type,
      name: this.name.value,
      properties: this.snapshot(),
    };
  }

  dispose(): void {
    for (const dispose of this.#disposers) {
      dispose();
    }
    this.#disposers.length = 0;
  }
}

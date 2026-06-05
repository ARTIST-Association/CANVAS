import { signal, type Signal } from "@preact/signals-core";
import type { ApiClient } from "@/api/ApiClient";
import type { Renderer } from "@/rendering/Renderer";
import type { SceneObject } from "@/objects/SceneObject";

/**
 * The project's collection of scene objects. Keeps the Three.js scene and the
 * backend in sync, and exposes a reactive `objects` signal the overview binds to.
 */
export class ObjectStore {
  readonly objects: Signal<SceneObject[]> = signal([]);

  readonly #renderer: Renderer;
  readonly #api: ApiClient;

  constructor(renderer: Renderer, api: ApiClient) {
    this.#renderer = renderer;
    this.#api = api;
  }

  /** Add to the scene; persist via the API if it isn't already saved. */
  async add(object: SceneObject): Promise<void> {
    this.#renderer.add(object.object3d);
    this.objects.value = [...this.objects.value, object];
    if (object.apiId === null) {
      const data = await this.#api.createObject(object.toData());
      object.apiId = data.id;
    }
  }

  /** Remove from the scene and delete from the backend. */
  remove(object: SceneObject): void {
    this.#renderer.remove(object.object3d);
    this.objects.value = this.objects.value.filter((candidate) => candidate !== object);
    if (object.apiId !== null) {
      void this.#api.deleteObject(object.apiId);
      // Reset so a subsequent undo re-creates it server-side.
      object.apiId = null;
    }
  }

  /** Persist the current state of an object (debounced in the API client). */
  save(object: SceneObject): void {
    if (object.apiId !== null) {
      this.#api.updateObject(object.toData());
    }
  }
}

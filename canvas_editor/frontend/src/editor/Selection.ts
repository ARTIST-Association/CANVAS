import * as THREE from "three";
import { signal, type Signal } from "@preact/signals-core";
import type { Renderer } from "@/rendering/Renderer";
import type { SceneObject } from "@/objects/SceneObject";

const CLICK_DRAG_THRESHOLD_PX = 5;

/** Resolve the owning SceneObject for a picked Three.js object, if any. */
function ownerOf(object: THREE.Object3D | null): SceneObject | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const owner = current.userData.sceneObject as SceneObject | undefined;
    if (owner) {
      return owner;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Tracks the currently selected object and drives the transform gizmo +
 * selection box. Clicking the canvas picks an object; clicking empty space
 * clears the selection. Drag-orbits are distinguished from clicks by movement.
 */
export class Selection {
  readonly selected: Signal<SceneObject | null> = signal(null);

  readonly #renderer: Renderer;
  readonly #raycaster = new THREE.Raycaster();
  readonly #pointerDown = new THREE.Vector2();

  constructor(renderer: Renderer) {
    this.#renderer = renderer;
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", (event) => this.#pointerDown.set(event.clientX, event.clientY));
    canvas.addEventListener("pointerup", (event) => this.#onPointerUp(event));
  }

  select(object: SceneObject | null): void {
    this.selected.value = object;
    if (object) {
      this.#renderer.transformControls.attach(object.object3d);
    } else {
      this.#renderer.transformControls.detach();
    }
    this.#renderer.setSelection(object ? object.object3d : null);
  }

  #onPointerUp(event: PointerEvent): void {
    const moved = Math.hypot(event.clientX - this.#pointerDown.x, event.clientY - this.#pointerDown.y);
    if (moved > CLICK_DRAG_THRESHOLD_PX || this.#renderer.transformControls.dragging) {
      return; // an orbit/gizmo drag, not a selection click
    }

    const rect = this.#renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.#raycaster.setFromCamera(pointer, this.#renderer.camera);
    const hits = this.#raycaster.intersectObjects(this.#renderer.selectableGroup.children, true);
    this.select(hits.length > 0 ? ownerOf(hits[0].object) : null);
  }
}

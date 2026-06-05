import { effect } from "@preact/signals-core";
import type { ObjectStore } from "@/objects/ObjectStore";
import type { SceneObject } from "@/objects/SceneObject";
import type { Selection } from "@/editor/Selection";

/**
 * Reactive list of every object in the scene. The list is rebuilt only when the
 * set of objects changes (add/remove); each row's label tracks the object's
 * name signal in place, and the active row follows the selection.
 */
export class Overview {
  readonly #container: HTMLElement;
  readonly #store: ObjectStore;
  readonly #selection: Selection;
  readonly #rows = new Map<SceneObject, HTMLElement>();
  #rowDisposers: Array<() => void> = [];

  constructor(container: HTMLElement, store: ObjectStore, selection: Selection) {
    this.#container = container;
    this.#store = store;
    this.#selection = selection;
    effect(() => this.#renderList(this.#store.objects.value));
    effect(() => this.#highlight(this.#selection.selected.value));
  }

  #renderList(objects: readonly SceneObject[]): void {
    this.#rowDisposers.forEach((dispose) => dispose());
    this.#rowDisposers = [];
    this.#rows.clear();
    this.#container.innerHTML = "";

    for (const object of objects) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";
      row.innerHTML = `<i class="bi ${object.spec.icon}"></i><span></span>`;
      const label = row.querySelector("span") as HTMLSpanElement;
      row.addEventListener("click", () => this.#selection.select(object));
      this.#rowDisposers.push(
        effect(() => {
          label.textContent = object.name.value;
        }),
      );
      this.#rows.set(object, row);
      this.#container.appendChild(row);
    }
    this.#highlight(this.#selection.selected.value);
  }

  #highlight(selected: SceneObject | null): void {
    for (const [object, row] of this.#rows) {
      row.classList.toggle("active", object === selected);
    }
  }
}

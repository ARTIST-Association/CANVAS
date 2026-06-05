import { effect } from "@preact/signals-core";
import {
  DeleteObjectCommand,
  DuplicateObjectCommand,
  RenameObjectCommand,
  UndoRedoService,
  UpdatePropertyCommand,
} from "@/commands/commands";
import type { ObjectFactory } from "@/objects/ObjectFactory";
import type { ObjectStore } from "@/objects/ObjectStore";
import type { SceneObject } from "@/objects/SceneObject";
import type { Selection } from "@/editor/Selection";
import { createFieldControl } from "@/ui/fieldControls";

/**
 * Reactive inspector for the selected object. It re-renders only when the
 * *selection* changes; while editing a selected object the field controls
 * update in place via signals, so focus and caret position are preserved
 * (unlike the old innerHTML-on-every-event approach).
 */
export class Inspector {
  readonly #container: HTMLElement;
  readonly #selection: Selection;
  readonly #undoRedo: UndoRedoService;
  readonly #store: ObjectStore;
  readonly #factory: ObjectFactory;
  #disposers: Array<() => void> = [];

  constructor(
    container: HTMLElement,
    selection: Selection,
    undoRedo: UndoRedoService,
    store: ObjectStore,
    factory: ObjectFactory,
  ) {
    this.#container = container;
    this.#selection = selection;
    this.#undoRedo = undoRedo;
    this.#store = store;
    this.#factory = factory;
    effect(() => this.#render(this.#selection.selected.value));
  }

  #render(object: SceneObject | null): void {
    this.#disposers.forEach((dispose) => dispose());
    this.#disposers = [];
    this.#container.innerHTML = "";

    if (!object) {
      const empty = document.createElement("div");
      empty.className = "text-secondary d-flex justify-content-center p-3";
      empty.textContent = "Select an object by clicking on it";
      this.#container.appendChild(empty);
      return;
    }

    this.#container.appendChild(this.#renderHeader(object));
    for (const field of object.spec.fields) {
      const control = createFieldControl(field, object, (name, value) =>
        this.#undoRedo.execute(new UpdatePropertyCommand(this.#store, object, name, value)),
      );
      this.#disposers.push(control.dispose);
      this.#container.appendChild(control.element);
    }
  }

  #renderHeader(object: SceneObject): HTMLElement {
    const header = document.createElement("div");
    header.className = "d-flex align-items-center gap-2 mb-2";

    const name = document.createElement("input");
    name.className = "form-control fw-bold";
    name.title = "Object name";
    name.addEventListener("change", () => {
      if (name.value !== object.name.value) {
        this.#undoRedo.execute(new RenameObjectCommand(this.#store, object, name.value));
      }
    });
    this.#disposers.push(
      effect(() => {
        if (document.activeElement !== name) {
          name.value = object.name.value;
        }
      }),
    );
    header.appendChild(name);

    header.appendChild(
      this.#iconButton("bi-copy", "Duplicate", () => {
        const command = new DuplicateObjectCommand(this.#store, this.#factory, object);
        this.#undoRedo.execute(command);
        this.#selection.select(command.clone);
      }),
    );
    header.appendChild(
      this.#iconButton("bi-trash", "Delete", () => {
        this.#undoRedo.execute(new DeleteObjectCommand(this.#store, object));
        this.#selection.select(null);
      }),
    );
    return header;
  }

  #iconButton(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-outline-secondary";
    button.title = title;
    button.innerHTML = `<i class="bi ${icon}"></i>`;
    button.addEventListener("click", onClick);
    return button;
  }
}

import { CreateObjectCommand, UndoRedoService } from "@/commands/commands";
import type { ObjectFactory } from "@/objects/ObjectFactory";
import type { ObjectStore } from "@/objects/ObjectStore";
import type { ObjectTypeRegistry } from "@/objects/registry";
import type { Selection } from "@/editor/Selection";

/**
 * Renders one "add" button per registered object type. Adding a new type to the
 * backend registry makes a button appear here automatically - no UI changes.
 */
export class Placement {
  constructor(
    container: HTMLElement,
    registry: ObjectTypeRegistry,
    factory: ObjectFactory,
    store: ObjectStore,
    undoRedo: UndoRedoService,
    selection: Selection,
  ) {
    for (const spec of registry.all()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-outline-light d-flex align-items-center gap-2";
      button.title = `Add ${spec.label}`;
      button.innerHTML = `<i class="bi ${spec.icon}"></i><span>${spec.label}</span>`;
      button.addEventListener("click", () => {
        const object = factory.create(spec.type);
        undoRedo.execute(new CreateObjectCommand(store, object));
        selection.select(object);
      });
      container.appendChild(button);
    }
  }
}

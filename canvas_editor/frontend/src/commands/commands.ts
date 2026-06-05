import { signal, type Signal } from "@preact/signals-core";
import type { PropertyValue } from "@/core/types";
import type { ObjectFactory } from "@/objects/ObjectFactory";
import type { ObjectStore } from "@/objects/ObjectStore";
import type { SceneObject } from "@/objects/SceneObject";

/** A reversible editor action. */
export interface Command {
  execute(): void;
  undo(): void;
}

/** Executes commands and maintains the undo/redo stacks. */
export class UndoRedoService {
  readonly canUndo: Signal<boolean> = signal(false);
  readonly canRedo: Signal<boolean> = signal(false);

  readonly #undoStack: Command[] = [];
  readonly #redoStack: Command[] = [];

  execute(command: Command): void {
    command.execute();
    this.#undoStack.push(command);
    this.#redoStack.length = 0;
    this.#sync();
  }

  undo(): void {
    const command = this.#undoStack.pop();
    if (command) {
      command.undo();
      this.#redoStack.push(command);
      this.#sync();
    }
  }

  redo(): void {
    const command = this.#redoStack.pop();
    if (command) {
      command.execute();
      this.#undoStack.push(command);
      this.#sync();
    }
  }

  #sync(): void {
    this.canUndo.value = this.#undoStack.length > 0;
    this.canRedo.value = this.#redoStack.length > 0;
  }
}

/** Add a (new, unsaved) object to the scene. */
export class CreateObjectCommand implements Command {
  readonly #store: ObjectStore;
  readonly #object: SceneObject;

  constructor(store: ObjectStore, object: SceneObject) {
    this.#store = store;
    this.#object = object;
  }

  execute(): void {
    void this.#store.add(this.#object);
  }

  undo(): void {
    this.#store.remove(this.#object);
  }
}

/** Remove an object from the scene. */
export class DeleteObjectCommand implements Command {
  readonly #store: ObjectStore;
  readonly #object: SceneObject;

  constructor(store: ObjectStore, object: SceneObject) {
    this.#store = store;
    this.#object = object;
  }

  execute(): void {
    this.#store.remove(this.#object);
  }

  undo(): void {
    void this.#store.add(this.#object);
  }
}

/** Duplicate an object; the clone is what gets added/removed. */
export class DuplicateObjectCommand implements Command {
  readonly #store: ObjectStore;
  readonly clone: SceneObject;

  constructor(store: ObjectStore, factory: ObjectFactory, source: SceneObject) {
    this.#store = store;
    this.clone = factory.duplicate(source);
  }

  execute(): void {
    void this.#store.add(this.clone);
  }

  undo(): void {
    this.#store.remove(this.clone);
  }
}

/** Change a single typed property of an object. */
export class UpdatePropertyCommand implements Command {
  readonly #store: ObjectStore;
  readonly #object: SceneObject;
  readonly #field: string;
  readonly #newValue: PropertyValue;
  readonly #oldValue: PropertyValue;

  constructor(store: ObjectStore, object: SceneObject, field: string, newValue: PropertyValue) {
    this.#store = store;
    this.#object = object;
    this.#field = field;
    this.#newValue = newValue;
    this.#oldValue = object.get(field);
  }

  execute(): void {
    this.#object.set(this.#field, this.#newValue);
    this.#store.save(this.#object);
  }

  undo(): void {
    this.#object.set(this.#field, this.#oldValue);
    this.#store.save(this.#object);
  }
}

/** Rename an object. */
export class RenameObjectCommand implements Command {
  readonly #store: ObjectStore;
  readonly #object: SceneObject;
  readonly #newName: string;
  readonly #oldName: string;

  constructor(store: ObjectStore, object: SceneObject, newName: string) {
    this.#store = store;
    this.#object = object;
    this.#newName = newName;
    this.#oldName = object.name.value;
  }

  execute(): void {
    this.#object.name.value = this.#newName;
    this.#store.save(this.#object);
  }

  undo(): void {
    this.#object.name.value = this.#oldName;
    this.#store.save(this.#object);
  }
}

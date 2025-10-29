import { Editor } from "editor";
import { SingleObjectCommand } from "singleObjectCommands";
import { ItemCreatedEvent } from "createCommands";
import { CanvasObject } from "canvasObject";
import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { Receiver } from "receiver";

/**
 * This event is dispatched when an item is deleted from the scene.
 */
export class ItemDeletedEvent extends CustomEvent {
  /**
   * Creates a new item deleted event
   * @param {CanvasObject} item the item that was deleted
   */
  constructor(item) {
    super("itemDeleted", { detail: { item: item } });
  }
}

/**
 * Command to handle the deletion of a heliostat.
 */
export class DeleteHeliostatCommand extends SingleObjectCommand {
  #editor = Editor.getInstance();
  #heliostat;

  /**
   * Creates an new delete command
   * @param {Heliostat} heliostat the heliostat you want to delete
   */
  constructor(heliostat) {
    super();
    this.#heliostat = heliostat;
  }

  /**
   * Deletes the heliostat from the scene and dispatches an ItemDeletedEvent.
   */
  execute() {
    this.#editor.deleteHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#heliostat));
  }

  /**
   * Reverts the deletion by adding the heliostat back to the scene and dispatching an ItemCreatedEvent.
   */
  undo() {
    this.#editor.addHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#heliostat));
  }
}

/**
 * Command to handle the deletion of a receiver.
 */
export class DeleteReceiverCommand extends SingleObjectCommand {
  #editor = Editor.getInstance();
  #receiver;

  /**
   * Creates an new delete command
   * @param {Receiver} receiver the receiver you want to delete
   */
  constructor(receiver) {
    super();
    this.#receiver = receiver;
  }

  /**
   * Deletes the receiver from the scene and dispatches an ItemDeletedEvent.
   */
  execute() {
    this.#editor.deleteReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#receiver));
  }

  /**
   * Reverts the deletion by adding the receiver back to the scene and dispatching an ItemCreatedEvent.
   */
  undo() {
    this.#editor.addReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#receiver));
  }
}

/**
 * Command to handle the deletion of a lightsource.
 */
export class DeleteLightSourceCommand extends SingleObjectCommand {
  #editor = Editor.getInstance();
  #lightsource;

  /**
   * Creates an new delete command
   * @param {LightSource} lightsource the lightsource you want to delete
   */
  constructor(lightsource) {
    super();
    this.#lightsource = lightsource;
  }

  /**
   * Deletes the lightsource from the scene and dispatches an ItemDeletedEvent.
   */
  execute() {
    this.#editor.deleteLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#lightsource));
  }

  /**
   * Reverts the deletion by adding the lightsource back to the scene and dispatching an ItemCreatedEvent.
   */
  undo() {
    this.#editor.addLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#lightsource));
  }
}

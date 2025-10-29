import { SingleObjectCommand } from "singleObjectCommands";
import { Editor } from "editor";
import { ItemDeletedEvent } from "deleteCommands";
import { CanvasObject } from "canvasObject";
import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { Receiver } from "receiver";

/**
 * Event that tells that an canvas object has been created
 */
export class ItemCreatedEvent extends CustomEvent {
  /**
   * Creates a new item create event.
   * @param {CanvasObject} item - the item that was added.
   */
  constructor(item) {
    super("itemCreated", { detail: { item: item } });
  }
}

/**
 * This commands handles the creation of a heliostat.
 */
export class CreateHeliostatCommand extends SingleObjectCommand {
  #heliostat;
  #editor = Editor.getInstance();

  /**
   * Initializes a new CreateHeliostatCommand with the specified heliostat to create.
   * @param {Heliostat} heliostat - the heliostat to be created.
   */
  constructor(heliostat) {
    super();
    this.#heliostat = heliostat;
  }

  /**
   * The heliostat is added to the scene
   */
  async execute() {
    await this.#editor.addHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#heliostat));
  }

  /**
   * The heliostat is removed from the scene.
   */
  async undo() {
    await this.#editor.deleteHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#heliostat));
  }
}

/**
 * This command handles the creation of a receiver.
 */
export class CreateReceiverCommand extends SingleObjectCommand {
  #receiver;
  #editor = Editor.getInstance();

  /**
   * Initializes a new CreateReceiverCommand with the specified receiver to create.
   * @param {Receiver} receiver - the receiver to be created
   */
  constructor(receiver) {
    super();
    this.#receiver = receiver;
  }

  /**
   * The receiver is added to the scene.
   */
  async execute() {
    await this.#editor.addReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#receiver));
  }

  /**
   * The receiver is removed from the scene.
   */
  async undo() {
    await this.#editor.deleteReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#receiver));
  }
}

/**
 * This command handles the creation of a lightsource
 */
export class CreateLightSourceCommand extends SingleObjectCommand {
  #lightsource;
  #editor = Editor.getInstance();

  /**
   * Initializes a new CreateLightSourceCommand with the specified light source to create.
   * @param {LightSource} lightsource - the lightsource to be created
   */
  constructor(lightsource) {
    super();
    this.#lightsource = lightsource;
  }

  /**
   * The light source is added to the scene.
   */
  async execute() {
    await this.#editor.addLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemCreatedEvent(this.#lightsource));
  }

  /**
   * The light source is removed from the scene.
   */
  async undo() {
    await this.#editor.deleteLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemDeletedEvent(this.#lightsource));
  }
}

import { SingleObjectCommand } from "singleObjectCommands";
import { SaveAndLoadHandler } from "saveAndLoadHandler";
import * as THREE from "three";
import { CanvasObject } from "canvasObject";
import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { Receiver } from "receiver";

/**
 * Event that signals that an item got updated
 */
export class ItemUpdatedEvent extends CustomEvent {
  /**
   * Creates a new item updated event
   * @param {CanvasObject} item the item that got updated
   */
  constructor(item) {
    super("itemUpdated", { detail: { item: item } });
  }
}

/**
 * This class  is responsible for updating a specific attribute of a ’Heliostat’ object.
 */
export class UpdateHeliostatCommand extends SingleObjectCommand {
  /**
   * The heliostat object to update.
   * @type {Heliostat}
   */
  #heliostat;
  /**
   * The attribute to update.
   */
  #attribute;
  /**
   * The old value for the attribute.
   */
  #oldParameter;
  /**
   * The new value of the attribute.
   */
  #newParameter;
  /**
   * The SaveAndLoadHandler instance, that saves the changes.
   */
  #saveAndLoadHandler;
  /**
   *The allowed attributes to set
   */
  #allowedAttributes = ["objectName", "position"];

  /**
   * Initializes a new UpdateHeliostatCommand with the specified 'Heliostat' instance, attribute, and new parameter.
   * @param {Heliostat} heliostat - the 'Heliostat' instance to be updated.
   * @param {"objectName" | "position"} attribute - The name of the attribute to modify.
   * @param {*} newParameter - the new value to assign to the attribute.
   */
  constructor(heliostat, attribute, newParameter) {
    super();
    this.#heliostat = heliostat;
    if (this.#allowedAttributes.includes(attribute)) {
      this.#attribute = attribute;
    } else {
      throw new TypeError(`${attribute} doesn't exist on ${Heliostat}`);
    }
    this.#newParameter = newParameter;

    this.#oldParameter =
      this.#attribute == "position"
        ? this.#heliostat.lastPosition
        : this.#heliostat[this.#attribute];
    this.#saveAndLoadHandler = SaveAndLoadHandler.getInstance();
  }

  /**
   * Updates the attribute of the heliostat object.
   */
  async execute() {
    if (this.#attribute == "position") {
      this.#heliostat.updatePosition(this.#newParameter);
    } else {
      this.#heliostat[this.#attribute] = this.#newParameter;
    }
    await this.#saveAndLoadHandler.updateHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#heliostat));
  }

  /**
   * Reverts the attribute of the heliostat object to its previous state.
   */
  async undo() {
    if (this.#attribute == "position") {
      this.#heliostat.updatePosition(this.#oldParameter);
    } else {
      this.#heliostat[this.#attribute] = this.#oldParameter;
    }
    await this.#saveAndLoadHandler.updateHeliostat(this.#heliostat);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#heliostat));
  }
}

/**
 * This class is responsible for updating a specific attribute of a 'Receiver' object.
 */
export class UpdateReceiverCommand extends SingleObjectCommand {
  /**
   * The receiver object to update.
   * @type {Receiver}
   */
  #receiver;
  /**
   * The attribute to update.
   */
  #attribute;
  /**
   * The old value for the attribute.
   */
  #oldParameter;
  /**
   * The new value of the attribute.
   */
  #newParameter;
  /**
   * The SaveAndLoadHandler instance, that saves the changes.
   */
  #saveAndLoadHandler;
  /**
   * Allowed attributes
   */
  #allowedAttributes = [
    "objectName",
    "towerType",
    "normalVector",
    "planeE",
    "planeU",
    "resolutionE",
    "resolutionU",
    "curvatureE",
    "curvatureU",
    "position",
  ];

  /**
   * Initializes a new UpdateReceiverCommand with the specified 'Receiver' instance, attribute, and new parameter.
   * @param {Receiver} receiver - This is the receiver object whose attribute will be updated.
   * @param {"objectName" | "towerType" | "normalVector" | "planeE" | "planeU" | "resolutionE" | "resolutionU" | "curvatureE" | "curvatureU" | "position" } attribute - The name of the attribute to modify.
   * @param {*} newParameter - The new value to assign to the attribute. This can be of any type depending on the attribute being updated.
   */
  constructor(receiver, attribute, newParameter) {
    super();
    this.#receiver = receiver;
    if (this.#allowedAttributes.includes(attribute)) {
      this.#attribute = attribute;
    } else {
      throw new TypeError(`${attribute} doesn't exist on ${Receiver}`);
    }
    this.#newParameter = newParameter;
    this.#oldParameter =
      this.#attribute == "position"
        ? this.#receiver.lastPosition
        : this.#receiver[this.#attribute];
    this.#saveAndLoadHandler = SaveAndLoadHandler.getInstance();
  }

  /**
   * Updates the attribute of the receiver object.
   */
  execute() {
    if (this.#attribute == "position") {
      this.#receiver.updatePosition(
        new THREE.Vector3(
          parseFloat(this.#newParameter.x),
          parseFloat(this.#newParameter.y),
          parseFloat(this.#newParameter.z),
        ),
      );
    } else {
      this.#receiver[this.#attribute] = this.#newParameter;
    }

    this.#saveAndLoadHandler.updateReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#receiver));
  }

  /**
   * Reverts the attribute of the receiver object to its previous state.
   */
  undo() {
    if (this.#attribute == "position") {
      this.#receiver.updatePosition(
        new THREE.Vector3(
          parseFloat(this.#oldParameter.x),
          parseFloat(this.#oldParameter.y),
          parseFloat(this.#oldParameter.z),
        ),
      );
    } else {
      this.#receiver[this.#attribute] = this.#oldParameter;
    }

    this.#saveAndLoadHandler.updateReceiver(this.#receiver);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#receiver));
  }
}

/**
 * This class is responsible for updating a specific attribute of a 'LightSource' object.
 */
export class UpdateLightsourceCommand extends SingleObjectCommand {
  /**
   * The lightsource object to update.
   */
  #lightsource;
  /**
   * The attribute to update.
   */
  #attribute;
  /**
   * The old value for the attribute.
   */
  #oldParameter;
  /**
   * The new value of the attribute.
   */
  #newParameter;
  /**
   * The SaveAndLoadHandler instance, that saves the changes.
   */
  #saveAndLoadHandler;
  /**
   * Allowed attributes
   */
  #allowedAttributes = [
    "objectName",
    "numberOfRays",
    "lightSourceType",
    "distributionType",
    "distributionMean",
    "distributionCovariance",
  ];

  /**
   * Initializes a new UpdateLightSourceCommand with the specified 'LightSource' instance, attribute, and new parameter.
   * @param {LightSource} lightSource - This is the lightsource object whose attribute will be updated.
   * @param { "objectName" | "numberOfRays" | "lightSourceType" | "distributionType" | "distributionMean" | "distributionCovariance"} attribute - The name of the attribute to modify.
   * @param {*} newParameter - The new value to assign to the attribute.
   */
  constructor(lightSource, attribute, newParameter) {
    super();
    this.#lightsource = lightSource;
    if (this.#allowedAttributes.includes(attribute)) {
      this.#attribute = attribute;
    } else {
      throw new TypeError(`${attribute} doesn't exist on ${LightSource}`);
    }
    this.#newParameter = newParameter;
    this.#oldParameter = this.#lightsource[this.#attribute];
    this.#saveAndLoadHandler = SaveAndLoadHandler.getInstance();
  }

  /**
   * Updates the attribute of the light source object.
   */
  execute() {
    this.#lightsource[this.#attribute] = this.#newParameter;

    this.#saveAndLoadHandler.updateLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#lightsource));
  }

  /**
   * Reverts the attribute of the light source object to its previous state.
   */
  undo() {
    this.#lightsource[this.#attribute] = this.#oldParameter;

    this.#saveAndLoadHandler.updateLightsource(this.#lightsource);

    document
      .getElementById("canvas")
      .dispatchEvent(new ItemUpdatedEvent(this.#lightsource));
  }
}

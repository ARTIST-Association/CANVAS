import { CanvasObject, loadGltf } from "canvasObject";
import { DeleteHeliostatCommand } from "deleteCommands";
import { DuplicateHeliostatCommand } from "duplicateCommands";
import {
  HeaderInspectorComponent,
  SingleFieldInspectorComponent,
  MultiFieldInspectorComponent,
  InspectorComponent,
} from "inspectorComponents";
import { Vector3 } from "three";
import { UndoRedoHandler } from "undoRedoHandler";
import { UpdateHeliostatCommand } from "updateCommands";
import * as THREE from "three";
import { Command } from "command";

/**
 * Class that represents the Heliostat object
 */
export class Heliostat extends CanvasObject {
  /**
   * The api id used for this heliostat.
   * @type {number}
   */
  apiID;
  #headerComponent;
  #positionComponent;
  #undoRedoHandler = UndoRedoHandler.getInstance();
  /**
   * @type { string[] }
   */
  #lastPosition;

  /**
   * Creates a Heliostat object
   * @param {string} heliostatName the name of the heliostat
   * @param {THREE.Vector3} position The position of the heliostat.
   * @param {number} [apiID] The id for api usage
   */
  constructor(heliostatName, position, apiID = null) {
    super(heliostatName, UndoRedoHandler.getInstance(), null, true, true);
    loadGltf("/static/models/heliostat.glb", this, true);
    this.position.copy(position);
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
    this.apiID = apiID;

    // create components for inspector
    this.#headerComponent = new HeaderInspectorComponent(
      () =>
        this.objectName !== "" && this.objectName
          ? this.objectName
          : "Heliostat",
      (name) => this.updateAndSaveObjectName(name),
      this,
    );

    const nCoordinate = new SingleFieldInspectorComponent(
      "N",
      "number",
      () => this.position.x,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateHeliostatCommand(
            this,
            "position",
            new Vector3(newValue, this.position.y, this.position.z),
          ),
        );
      },
      -Infinity,
    );

    const uCoordinate = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.position.y,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateHeliostatCommand(
            this,
            "position",
            new Vector3(this.position.x, newValue, this.position.z),
          ),
        );
      },
      0,
    );

    const eCoordinate = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.position.z,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateHeliostatCommand(
            this,
            "position",
            new Vector3(this.position.x, this.position.y, newValue),
          ),
        );
      },
      -Infinity,
    );

    this.#positionComponent = new MultiFieldInspectorComponent("Position", [
      nCoordinate,
      uCoordinate,
      eCoordinate,
    ]);
  }

  /**
   * Updates the position of the heliostat
   * @param {THREE.Vector3} position the new position
   */
  updatePosition(position) {
    this.position.copy(position);
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
  }

  /**
   * Returns the command class used to update the name of the object
   * @returns {new (...args: any[]) => Command} the command class used to update the name
   */
  get updatePropertyCommand() {
    return UpdateHeliostatCommand;
  }

  /**
   * Returns the command class used to duplicate the object
   * @returns {new (...args: any[]) => Command} the command class used to duplicate the object
   */
  get duplicateCommand() {
    return DuplicateHeliostatCommand;
  }

  /**
   * Returns the command class used to delete the object
   * @returns {new (...args: any[]) => Command} the command class used to delete the object
   */
  get deleteCommand() {
    return DeleteHeliostatCommand;
  }

  /**
   * Updates the position of the heliostat
   * @param {Vector3} position - the new position of the heliostat
   */
  updateAndSaveObjectPosition(position) {
    this.#undoRedoHandler.executeCommand(
      new UpdateHeliostatCommand(this, "position", position),
    );
  }

  /**
   * Get an array of all inspectorComponents for this object
   * @returns {InspectorComponent[]} array of inspectorComponents
   */
  get inspectorComponents() {
    return [this.#headerComponent, this.#positionComponent];
  }

  /**
   * Get the current position of the object
   * @returns {THREE.Vector3} the position of the object
   */
  get lastPosition() {
    return this.#lastPosition;
  }
}

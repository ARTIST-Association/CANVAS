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
  #isMovable = true;
  /**
   * @type { string[] }
   */
  #rotatableAxis = null;
  #lastPosition;

  /**
   * Creates a Heliostat object
   * @param {string} heliostatName the name of the heliostat
   * @param {THREE.Vector3} position The position of the heliostat.
   * @param {number} [apiID] The id for api usage
   */
  constructor(heliostatName, position, apiID = null) {
    super(heliostatName);
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
   * Update and save the name of the object
   * @param {string} name the new name for the object
   */
  updateAndSaveObjectName(name) {
    this.#undoRedoHandler.executeCommand(
      new UpdateHeliostatCommand(this, "objectName", name),
    );
  }

  /**
   * Duplicate the object
   */
  duplicate() {
    this.#undoRedoHandler.executeCommand(new DuplicateHeliostatCommand(this));
  }

  /**
   * Delete the object
   */
  delete() {
    this.#undoRedoHandler.executeCommand(new DeleteHeliostatCommand(this));
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
   * Get an array containing all rotatable axis
   * @returns {string[]} containing all rotatable axis
   */
  get rotatableAxis() {
    return this.#rotatableAxis;
  }

  /**
   * Get whether the object is selectable
   * @returns {boolean} whether the object is selectable
   */
  get isSelectable() {
    return true;
  }

  /**
   * Get whether the object is movable
   * @returns {boolean} whether the object is movable
   */
  get isMovable() {
    return this.#isMovable;
  }

  /**
   * Get the current position of the object
   * @returns {THREE.Vector3} the position of the object
   */
  get lastPosition() {
    return this.#lastPosition;
  }
}

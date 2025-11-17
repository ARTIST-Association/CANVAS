import { CanvasObject } from "canvasObject";
import { InspectorComponent, MultiFieldInspectorComponent, SingleFieldInspectorComponent } from "inspectorComponents";
import { Vector3 } from "three";

/**
 * Class that represents movable canvas objects
 * For now this includes Heliostats and Receivers
 * @augments {CanvasObject}
 */
export class movableCanvasObject extends CanvasObject {
  #positionComponent;
  #lastPosition;

  /**
   * Creates a new movable object
   * @param {string} movableObjectName the name of the movable object
   * @param {import("undoRedoHandler").UndoRedoHandler} undoRedoHandler the undo redo handler
   * @param {Vector3} position the position of the movable object
   * @param {string} defaultLabel the default label when no name is given
   */
  constructor(movableObjectName, undoRedoHandler, position, defaultLabel) {
    super(movableObjectName, undoRedoHandler, defaultLabel, true, true);

    this.#lastPosition = new Vector3(position.x, position.y, position.z);

    const nCoordinate = new SingleFieldInspectorComponent(
      "N",
      "number",
      () => this.position.x,
      (newValue) => {
        this.undoRedoHandler.executeCommand(
          new this.updatePropertyCommand(this, "position", new Vector3(newValue, this.position.y, this.position.z)),
        );
      },
      -Infinity,
    );

    const uCoordinate = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.position.y,
      (newValue) => {
        this.undoRedoHandler.executeCommand(
          new this.updatePropertyCommand(this, "position", new Vector3(this.position.x, newValue, this.position.z)),
        );
      },
      0,
    );

    const eCoordinate = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.position.z,
      (newValue) => {
        this.undoRedoHandler.executeCommand(
          new this.updatePropertyCommand(this, "position", new Vector3(this.position.x, this.position.y, newValue)),
        );
      },
      -Infinity,
    );

    this.#positionComponent = new MultiFieldInspectorComponent("Position", [nCoordinate, uCoordinate, eCoordinate]);
  }

  /**
   * Updates the position of the heliostat
   * @param {Vector3} position the new position
   */
  updatePosition(position) {
    this.position.copy(position);
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
  }

  /**
   * Updates the position of the heliostat
   * @param {Vector3} position - the new position of the heliostat
   */
  updateAndSaveObjectPosition(position) {
    this.undoRedoHandler.executeCommand(new this.updatePropertyCommand(this, "position", position));
  }
  /**
   * Get the current position of the object
   * @returns {Vector3} the position of the object
   */
  get lastPosition() {
    return this.#lastPosition;
  }

  /**
   * Get an array of all inspectorComponents used for this object
   * @returns {InspectorComponent[]} array of all inspectorComponents
   */
  get inspectorComponents() {
    return [...super.inspectorComponents, this.#positionComponent];
  }
}

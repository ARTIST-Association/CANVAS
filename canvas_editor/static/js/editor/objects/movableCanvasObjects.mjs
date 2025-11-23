import { CanvasObject } from "canvasObject";
import { Command } from "command";
import { InspectorComponent, MultiFieldInspectorComponent, SingleFieldInspectorComponent } from "inspectorComponents";
import { Vector3 } from "three";

/**
 * Class that represents movable canvas objects
 * For now this includes Heliostats and Receivers
 */
export class MovableCanvasObject {
  #target;
  #positionComponent;
  #lastPosition;
  /**
   * @type {new (...args: any[]) => Command}
   */
  #updatePropertyCommand;

  /**
   * The constructor of the movable canvas object
   * @param {CanvasObject} target the target object
   * @param {Vector3} position the initial position
   * @param {new (...args: any[]) => Command} updatePropertyCommand the command class used to update the position
   */
  constructor(target, position, updatePropertyCommand) {
    this.#target = target;
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
    this.#updatePropertyCommand = updatePropertyCommand;

    const nCoordinate = new SingleFieldInspectorComponent(
      "N",
      "number",
      () => this.#target.position.x,
      (newValue) => {
        this.#target.undoRedoHandler.executeCommand(
          new this.#updatePropertyCommand(
            this.#target,
            "position",
            new Vector3(newValue, this.#target.position.y, this.#target.position.z),
          ),
        );
      },
      -Infinity,
    );

    const uCoordinate = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.#target.position.y,
      (newValue) => {
        this.#target.undoRedoHandler.executeCommand(
          new this.#updatePropertyCommand(
            this.#target,
            "position",
            new Vector3(this.#target.position.x, newValue, this.#target.position.z),
          ),
        );
      },
      0,
    );

    const eCoordinate = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.#target.position.z,
      (newValue) => {
        this.#target.undoRedoHandler.executeCommand(
          new this.#updatePropertyCommand(
            this.#target,
            "position",
            new Vector3(this.#target.position.x, this.#target.position.y, newValue),
          ),
        );
      },
      -Infinity,
    );

    this.#positionComponent = new MultiFieldInspectorComponent("Position", [nCoordinate, uCoordinate, eCoordinate]);
  }

  /**
   * Updates the position of the object
   *
   * Should only be used for internal updates (like inside commands)
   * @param {Vector3} position the new position
   */
  updatePosition(position) {
    this.#target.position.copy(position);
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
  }

  /**
   * Updates the position of the object
   * and saves the change using the undoRedoHandler
   *
   * Use this method whenever the user intentionally changes a value and the change
   * should be undoable, saved, and reflected in the UI.
   * @param {Vector3} position - the new position of the object
   */
  updateAndSaveObjectPosition(position) {
    this.#target.undoRedoHandler.executeCommand(new this.#updatePropertyCommand(this.#target, "position", position));
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
    return [this.#positionComponent];
  }
}

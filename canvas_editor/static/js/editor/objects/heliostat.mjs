import { CanvasObject, loadGltf } from "canvasObject";
import { DeleteHeliostatCommand } from "deleteCommands";
import { DuplicateHeliostatCommand } from "duplicateCommands";
import { InspectorComponent } from "inspectorComponents";
import { UpdateHeliostatCommand } from "updateCommands";
import * as THREE from "three";
import { Command } from "command";
import { MovableCanvasObject } from "movableCanvasObjects";

/**
 * Class that represents the Heliostat object
 */
export class Heliostat extends CanvasObject {
  /**
   * The api id used for this heliostat.
   * @type {number}
   */
  apiID;

  /**
   * @type {MovableCanvasObject}
   */
  #movement;

  /**
   * Creates a Heliostat object
   * @param {string} heliostatName the name of the heliostat
   * @param {THREE.Vector3} position The position of the heliostat.
   * @param {number} [apiID] The id for api usage
   */
  constructor(heliostatName, position, apiID = null) {
    super(heliostatName, "Heliostat", true, true, null);
    loadGltf("/static/models/heliostat.glb", this, true);
    this.position.copy(position);
    this.apiID = apiID;

    /**
     * @type {MovableCanvasObject}
     */
    this.#movement = new MovableCanvasObject(this, position, UpdateHeliostatCommand);
    this.updatePosition(position);
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
   * Call the movableCanvasObject to update the position
   * @param {THREE.Vector3} position the new position of the heliostat
   */
  updatePosition(position) {
    this.#movement.updatePosition(position);
  }
  /**
   * Call the movableCanvasObject to update and save the position
   * @param {THREE.Vector3} position the new position of the heliostat
   */
  updateAndSaveObjectPosition(position) {
    this.#movement.updateAndSaveObjectPosition(position);
  }

  /**
   * Get the last positon of the object from the movableCanvasObject
   * @returns {THREE.Vector3} the last position of the object
   */
  get lastPosition() {
    return this.#movement.lastPosition;
  }
  /**
   * Get the inspectorComponents used for this object
   * The inspector components are included by the canvas objects
   * The position inspector components are included by the movableCanvasObject
   * @returns {InspectorComponent[]} array of inspectorComponents
   */
  get inspectorComponents() {
    return [...super.inspectorComponents, ...this.#movement.inspectorComponents];
  }
}

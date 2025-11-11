import { loadGltf } from "canvasObject";
import { DeleteHeliostatCommand } from "deleteCommands";
import { DuplicateHeliostatCommand } from "duplicateCommands";
import {
  HeaderInspectorComponent,
  InspectorComponent,
} from "inspectorComponents";
import { Vector3 } from "three";
import { UndoRedoHandler } from "undoRedoHandler";
import { UpdateHeliostatCommand } from "updateCommands";
import * as THREE from "three";
import { Command } from "command";
import { movableCanvasObject } from "movableCanvasObjects";

/**
 * Class that represents the Heliostat object
 */
export class Heliostat extends movableCanvasObject {
  /**
   * The api id used for this heliostat.
   * @type {number}
   */
  apiID;
  #headerComponent;
  /**
   * @type { string[] }
   */

  /**
   * Creates a Heliostat object
   * @param {string} heliostatName the name of the heliostat
   * @param {THREE.Vector3} position The position of the heliostat.
   * @param {number} [apiID] The id for api usage
   */
  constructor(heliostatName, position, apiID = null) {
    super(heliostatName, UndoRedoHandler.getInstance(), position);
    loadGltf("/static/models/heliostat.glb", this, true);
    this.position.copy(position);
    this.apiID = apiID;

    // create components for inspector
    this.#headerComponent = new HeaderInspectorComponent(
      () =>
        this.objectName !== "" && this.objectName
          ? this.objectName
          : "Heliostat",
      (name) => this.updateAndSaveObjectName(name),
      this
    );
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
   * Get an array of all inspectorComponents for this object
   * @returns {InspectorComponent[]} array of inspectorComponents
   */
  get inspectorComponents() {
    return [this.#headerComponent, super.positionComponent];
  }
}

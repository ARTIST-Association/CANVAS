import { Picker } from "picker";
import { UndoRedoHandler } from "undoRedoHandler";
import { Vector3 } from "three";
import {
  CreateReceiverCommand,
  CreateHeliostatCommand,
  CreateLightSourceCommand,
} from "createCommands";
import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { Receiver } from "receiver";

/**
 * Class to manage the objects in the scene
 * Handles the creation of heliostats, receivers, and light sources
 * Also manages keyboard shortcuts for deleting and duplicating objects
 */

/**
 * Class to manage the objects in the scene
 */
export class ObjectManager {
  #picker;
  #undoRedoHandler;
  #objectList;

  /**
   * Constructor for the object manager
   * Event listener for keyboard shortcuts
   * @param {Picker} picker - The picker instance to manage object selection
   * @param {UndoRedoHandler} undoRedoHandler - The undo/redo handler to manage commands
   */
  constructor(picker, undoRedoHandler) {
    this.#picker = picker;
    this.#undoRedoHandler = undoRedoHandler;

    this.#addEventListener();
  }

  /**
   * Method to create a heliostat
   */
  createHeliostat() {
    const heliostat = new Heliostat("Heliostat", new Vector3(15, 0, -15));
    this.#undoRedoHandler.executeCommand(new CreateHeliostatCommand(heliostat));
    this.#picker.setSelection([heliostat]);
  }

  /**
   * Method to create a receiver
   */
  createReceiver() {
    const receiver = new Receiver(
      "Receiver",
      new Vector3(0, 50, 0),
      new Vector3(0, 0, 0),
      "round",
      0,
      0,
      0,
      0,
      0,
      0,
    );
    this.#undoRedoHandler.executeCommand(new CreateReceiverCommand(receiver));

    this.#picker.setSelection([receiver]);
  }

  /**
   * Method to create a light source
   */
  createLightSource() {
    const lightSource = new LightSource(
      "Lightsource",
      1,
      "sun",
      "normal",
      1,
      1,
    );
    this.#undoRedoHandler.executeCommand(
      new CreateLightSourceCommand(lightSource),
    );
    this.#picker.setSelection([lightSource]);
  }

  /**
   * Add event listener for keyboard shortcuts
   * Delete: Delete selected object
   * Duplicate: Duplicate selected object
   */
  #addEventListener() {
    window.addEventListener("keydown", (event) => {
      this.#objectList = this.#picker.getSelectedObjects();
      if (this.#objectList.length === 0) {
        return;
      }

      // Delete object
      if (event.key === "Delete") {
        if (this.#objectList.length === 1) {
          this.#objectList[0].delete();
        }
      }

      // Duplicate object
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.#objectList[0].duplicate();
      }
    });
  }
}

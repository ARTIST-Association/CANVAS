import {
  HeaderInspectorComponent,
  InspectorComponent,
} from "inspectorComponents";
import { Object3D, Vector3 } from "three";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { methodMustBeImplementedError } from "message_dict";
import { Command } from "command";

/**
 * Represents a Object in CANVAS
 */
export class CanvasObject extends Object3D {
  objectName;
  #undoRedoHandler;
  #rotatableAxis;
  #isMovable;
  #isSelectable;
  #headerComponent;

  /**
   * Creates a new selectable object
   * @param {string} name the name of the object
   * @param {import("undoRedoHandler").UndoRedoHandler} undoRedoHandler the undo redo handler
   * @param {string} defaultLabel the default label when no name is given
   * @param {boolean} isMovable whether the object is movable
   * @param {boolean} isSelectable whether the object is selectable
   * @param {string[]} rotatableAxis containing all rotatable axis
   */
  constructor(
    name,
    undoRedoHandler,
    defaultLabel,
    isMovable,
    isSelectable,
    rotatableAxis = []
  ) {
    super();
    this.objectName = name;
    this.#undoRedoHandler = undoRedoHandler;
    this.#rotatableAxis = rotatableAxis;
    this.#isMovable = isMovable;
    this.#isSelectable = isSelectable;

    this.#headerComponent = new HeaderInspectorComponent(
      () =>
        this.objectName !== "" && this.objectName
          ? this.objectName
          : defaultLabel,
      (newValue) => this.updateAndSaveObjectName(newValue),
      this
    );
  }

  /**
   * Get the inspectorComponents used for this object
   * The child classes should extend this method to add their own components
   * @returns {InspectorComponent[]} array of the inspectorComponents used
   */
  get inspectorComponents() {
    return [this.#headerComponent];
  }

  /**
   * Update and save the name of the object
   * @param {string} name the new name
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updateAndSaveObjectName(name) {
    const UpdatePropertyCommand = this.updatePropertyCommand;
    if (!UpdatePropertyCommand) {
      throw new Error("updateNameCommand not implemented");
    }

    this.#undoRedoHandler.executeCommand(
      new UpdatePropertyCommand(this, "objectName", name)
    );
  }

  /**
   * Returns the command class used to update the name of the object
   * @abstract
   * @throws {Error}  Throws an error if the method is not implemented in subclasses.
   * @returns {new (...args: any[]) => Command}
   */
  get updatePropertyCommand() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Updates and saves the new position through a command
   * @param {Vector3} position - the new position you want to save and update
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updateAndSaveObjectPosition(position) {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Updates and saves the new rotation through a command
   * @param {THREE.Quaternion} rotation - the new rotation you want to save and update
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updateAndSaveObjectRotation(rotation) {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Updates the position of the object
   * @param {THREE.Vector3} position - the new position of the object
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updatePosition(position) {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Updates the rotation of the object
   * @param {THREE.Quaternion} rotation - the new rotation of the object
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updateRotation(rotation) {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Duplicate the object
   * @returns {void}
   */
  duplicate() {
    const DuplicateCommand = this.duplicateCommand;
    if (!DuplicateCommand) {
      throw new Error("duplicateCommand not implemented");
    }

    this.#undoRedoHandler.executeCommand(new DuplicateCommand(this));
  }

  /**
   * Returns the command class used to duplicate the object
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {new (...args: any[]) => Command}
   */
  get duplicateCommand() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Deletes the object
   */
  delete() {
    const DeleteCommand = this.deleteCommand;
    if (!DeleteCommand) {
      throw new Error("deleteCommand not implemented");
    }

    this.#undoRedoHandler.executeCommand(new DeleteCommand(this));
  }

  /**
   * Returns the command class used to delete the object
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {new (...args: any[]) => Command}
   */
  get deleteCommand() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns the rotatable axis of the object
   * @returns {string[]} containing all rotatable axis
   */
  get rotatableAxis() {
    return this.#rotatableAxis;
  }

  /**
   * Returns whether an object is movable or not
   * @returns {boolean} whether the object is movable
   */
  get isMovable() {
    return this.#isMovable;
  }

  /**
   * Returns whether an object is selectable or not
   * @returns {boolean} whether the object is selectable
   */
  get isSelectable() {
    return this.#isSelectable;
  }

  /**
   * Returns the position of the object executed by the last command
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {THREE.Vector3} the old position of the object
   */
  get lastPosition() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns the rotation of the object executed by the last command
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {THREE.Vector3} the old rotation of the object
   */
  get lastRotation() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns the undoRedoHandler used for this object
   * @returns {import("undoRedoHandler").UndoRedoHandler} the undoRedoHandler
   */
  get undoRedoHandler() {
    return this.#undoRedoHandler;
  }
}

/**
 * Load a mesh from a gltf file.
 * @param {string} path the path of the file.
 * @param {THREE.Object3D} object the object you want to add the mesh to.
 * @param {boolean} castShadows whether the mesh should cast shadows or not.
 */
export function loadGltf(path, object, castShadows) {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const mesh = gltf.scene;
    if (castShadows) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
    }
    object.add(mesh);
  });
}

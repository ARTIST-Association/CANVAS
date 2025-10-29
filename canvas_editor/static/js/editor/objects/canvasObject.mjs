import { InspectorComponent } from "inspectorComponents";
import { Object3D, Vector3 } from "three";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { methodMustBeImplementedError } from "message_dict";

/**
 * Represents a Object in CANVAS
 */
export class CanvasObject extends Object3D {
  objectName;

  /**
   * Creates a new selectable object
   * @param {string} name the name of the object
   */
  constructor(name) {
    super();
    this.objectName = name;
  }

  /**
   * Get a list of inspector components used for this object
   * @abstract
   * @throws {Error}  Throws an error if the method is not implemented in subclasses.
   * @returns {InspectorComponent[]} must be implemented in all subclasses
   */
  get inspectorComponents() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Updates and saves the new name through a command
   * @param {string} name the new name you want to save and update
   */
  // eslint-disable-next-line no-unused-vars -- required for interface compatibility
  updateAndSaveObjectName(name) {
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
   * Duplicates the object
   */
  duplicate() {
    throw new Error(methodMustBeImplementedError);
  }
  /**
   * Deletes the object
   */
  delete() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns the axis on which the object is rotatable
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {string[]} array containing all rotatable axis.
   */
  get rotatableAxis() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns whether the object is movable or not
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {boolean} whether the object is movable
   */
  get isMovable() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Returns whether an object is selectable or not
   * @abstract
   * @throws {Error} - Throws an error if the method is not implemented in subclasses.
   * @returns {boolean} whether the object is selectable
   */
  get isSelectable() {
    throw new Error(methodMustBeImplementedError);
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

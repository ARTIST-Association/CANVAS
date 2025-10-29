import { CanvasObject, loadGltf } from "canvasObject";
import { DeleteReceiverCommand } from "deleteCommands";
import { DuplicateReceiverCommand } from "duplicateCommands";
import {
  HeaderInspectorComponent,
  SingleFieldInspectorComponent,
  MultiFieldInspectorComponent,
  SelectFieldInspectorComponent,
  InspectorComponent,
} from "inspectorComponents";
import { Object3D, Vector3 } from "three";
import { UndoRedoHandler } from "undoRedoHandler";
import { UpdateReceiverCommand } from "updateCommands";
import * as THREE from "three";
import { towerBasePath, towerTopPath } from "path_dict";

/**
 * Class that represents the receiver object
 */
export class Receiver extends CanvasObject {
  /**
   * The apiID used for this receiver
   */
  apiID;
  /**
   * The type of the target remains
   */
  towerType;
  /**
   * The normal vector of the target remains
   */
  normalVector;
  /**
   * The size of the target area in east direction.
   */
  planeE;
  /**
   * The size of the target area in up direction.
   */
  planeU;
  /**
   * The resolution of the target area in east direction.
   */
  resolutionE;
  /**
   * The resolution of the target area in up direction.
   */
  resolutionU;
  /**
   * The curvature of the target area in the east direction.
   */
  curvatureE;
  /**
   * The curvature of the target area in the up direction.
   */
  curvatureU;
  #undoRedoHandler = UndoRedoHandler.getInstance();

  #top;
  #base;

  #headerComponent;
  #positionComponent;
  #normalVectorComponent;
  #towerTypeComponent;
  #curvatureComponent;
  #planeComponent;
  #resolutionComponent;
  #isMovable = true;
  #rotatableAxis = null;
  #lastPosition;

  /**
   * Creates a Receiver object
   * @param {string} receiverName the name of the receiver
   * @param {THREE.Vector3} position Is the position of the receiver
   * @param {THREE.Vector3} normalVector the normal vector of the receiver
   * @param {string} towerType the type of the tower
   * @param {number} planeE the plane E of the receiver
   * @param {number} planeU the plane U of the receiver
   * @param {number} resolutionE the resolution E of the receiver
   * @param {number} resolutionU the resolution U of the receiver
   * @param {number} curvatureE the curvature E of the receiver
   * @param {number} curvatureU the curvature U of the receiver
   * @param {number} [apiID] The id for api usage
   */
  constructor(
    receiverName,
    position,
    normalVector,
    towerType,
    planeE,
    planeU,
    resolutionE,
    resolutionU,
    curvatureE,
    curvatureU,
    apiID = null,
  ) {
    super(receiverName);
    // place the 3D object
    this.#base = new ReceiverBase();
    this.add(this.#base);

    this.#top = new ReceiverTop();
    this.add(this.#top);

    this.updatePosition(position);

    this.apiID = apiID;
    this.towerType = towerType;
    this.normalVector = normalVector;
    this.planeE = planeE;
    this.planeU = planeU;
    this.resolutionE = resolutionE;
    this.resolutionU = resolutionU;
    this.curvatureE = curvatureE;
    this.curvatureU = curvatureU;
    this.#lastPosition = new Vector3(position.x, position.y, position.z);

    // create components for the inspector
    this.#headerComponent = new HeaderInspectorComponent(
      () =>
        this.objectName !== "" && this.objectName
          ? this.objectName
          : "Receiver",
      (name) => this.updateAndSaveObjectName(name),
      this,
    );

    const nCoordinate = new SingleFieldInspectorComponent(
      "N",
      "number",
      () => this.lastPosition.x,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
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
      () => this.lastPosition.y,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
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
      () => this.lastPosition.z,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
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

    const nNormalVector = new SingleFieldInspectorComponent(
      "N",
      "number",
      () => this.normalVector.x,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
            this,
            "normalVector",
            new Vector3(newValue, this.normalVector.y, this.normalVector.z),
          ),
        );
      },
      -Infinity,
    );

    const uNormalVector = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.normalVector.y,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
            this,
            "normalVector",
            new Vector3(this.normalVector.x, newValue, this.normalVector.z),
          ),
        );
      },
      -Infinity,
    );

    const eNormalVector = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.normalVector.z,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(
            this,
            "normalVector",
            new Vector3(this.normalVector.x, this.normalVector.y, newValue),
          ),
        );
      },
      -Infinity,
    );

    this.#normalVectorComponent = new MultiFieldInspectorComponent(
      "Normal Vector",
      [nNormalVector, uNormalVector, eNormalVector],
    );

    this.#towerTypeComponent = new SelectFieldInspectorComponent(
      "Type",
      [{ label: "planar", value: "planar" }],
      () => this.towerType,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "towerType", newValue),
        );
      },
    );

    const eCurvature = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.curvatureE,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "curvatureE", newValue),
        );
      },
      -Infinity,
    );

    const uCurvature = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.curvatureU,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "curvatureU", newValue),
        );
      },
      -Infinity,
    );

    this.#curvatureComponent = new MultiFieldInspectorComponent("Curvature", [
      eCurvature,
      uCurvature,
    ]);

    const ePlane = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.planeE,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "planeE", newValue),
        );
      },
      -Infinity,
    );

    const uPlane = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.planeU,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "planeU", newValue),
        );
      },
      -Infinity,
    );

    this.#planeComponent = new MultiFieldInspectorComponent("Plane", [
      ePlane,
      uPlane,
    ]);

    const eResolution = new SingleFieldInspectorComponent(
      "E",
      "number",
      () => this.resolutionE,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "resolutionE", newValue),
        );
      },
      -Infinity,
    );

    const uResolution = new SingleFieldInspectorComponent(
      "U",
      "number",
      () => this.resolutionU,
      (newValue) => {
        this.#undoRedoHandler.executeCommand(
          new UpdateReceiverCommand(this, "resolutionU", newValue),
        );
      },
      -Infinity,
    );

    this.#resolutionComponent = new MultiFieldInspectorComponent("Resolution", [
      eResolution,
      uResolution,
    ]);
  }

  /**
   * Set the position of the base to the desired height
   * @param {number} y the desired height
   */
  setBaseHeight(y) {
    this.#base.position.y = y;
  }

  /**
   * Updates the position of the receiver
   * @param {Vector3} position - the new position of the receiver
   */
  updateAndSaveObjectPosition(position) {
    this.#undoRedoHandler.executeCommand(
      new UpdateReceiverCommand(this, "position", position),
    );
  }

  /**
   * Updates the receiver’s position by adjusting both the base and the top, ensuring that the base remains on the ground.
   * @param {THREE.Vector3} position the new position of the receiver
   */
  updatePosition(position) {
    this.position.copy(position);
    this.#lastPosition = new Vector3(position.x, position.y, position.z);
    this.#base.position.y = -position.y;
  }

  /**
   * Update and save the name of the object
   * @param {string} name the new name
   */
  updateAndSaveObjectName(name) {
    this.#undoRedoHandler.executeCommand(
      new UpdateReceiverCommand(this, "objectName", name),
    );
  }

  /**
   * Deletes the receiver
   */
  delete() {
    this.#undoRedoHandler.executeCommand(new DeleteReceiverCommand(this));
  }

  /**
   * Duplicates the receiver
   */
  duplicate() {
    this.#undoRedoHandler.executeCommand(new DuplicateReceiverCommand(this));
  }

  /**
   * Get all rotatable axis
   * @returns {string[]} containing all rotatable axis
   */
  get rotatableAxis() {
    return this.#rotatableAxis;
  }

  /**
   * Get whether the object is movable or not
   * @returns {boolean} whether the object is movable
   */
  get isMovable() {
    return this.#isMovable;
  }

  /**
   * Get whether the object is selectable
   * @returns {boolean} whether the object is selectable
   */
  get isSelectable() {
    return true;
  }

  /**
   * Get the current position of the object
   * @returns {THREE.Vector3} the current position
   */
  get lastPosition() {
    return this.#lastPosition;
  }

  /**
   * Get the inspectorComponents used for this object
   * @returns {InspectorComponent[]} array of the inspectorComponents used
   */
  get inspectorComponents() {
    return [
      this.#headerComponent,
      this.#positionComponent,
      this.#normalVectorComponent,
      this.#towerTypeComponent,
      this.#curvatureComponent,
      this.#planeComponent,
      this.#resolutionComponent,
    ];
  }
}

/**
 * Class that builds the base of the receiver
 */
export class ReceiverBase extends Object3D {
  /**
   * Create the receiver base
   */
  constructor() {
    super();
    loadGltf(towerBasePath, this, true);
  }
}
/**
 * Class that builds the top of the receiver
 */
export class ReceiverTop extends Object3D {
  /**
   * Create the top of the receiver
   */
  constructor() {
    super();
    loadGltf(towerTopPath, this, true);
  }
}

import * as THREE from "three";
import { ItemDeletedEvent } from "deleteCommands";
import { ItemCreatedEvent } from "createCommands";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { CanvasObject } from "canvasObject";
import { Receiver } from "receiver";

export const Mode = Object.freeze({
  NONE: "none",
  MOVE: "move",
  ROTATE: "rotate",
});

/**
 * Handles all picking functionality in the canvas
 */
export class Picker {
  #camera;
  #transformControls;
  #selectionBox;
  #selectableGroup;
  #selectedObjects;
  #raycaster;
  /**
   * @type {  "none" | "move" | "rotate" }
   */
  #mode;

  // Additional fields
  #canvas;
  #mouse;
  #mouseDownPos;
  #isDragging;
  #selectedObject;

  /**
   * Creates a new Picker object
   * @param {THREE.Camera} camera The camera to be used for raycasting
   * @param {TransformControls} transformControls The transform controls to be used for selected objects
   * @param {THREE.Box3Helper} selectionBox The selection box to be used for selected objects
   * @param {THREE.Group} selectableGroup The group of objects to be selected
   */
  constructor(camera, transformControls, selectionBox, selectableGroup) {
    this.#camera = camera;
    this.#transformControls = transformControls;
    this.#selectionBox = selectionBox;
    this.#selectableGroup = selectableGroup;
    this.#selectedObjects = [];
    this.#raycaster = new THREE.Raycaster();
    this.#mode = Mode.NONE;

    this.#canvas = document.getElementById("canvas");
    this.#mouse = new THREE.Vector2();
    this.#mouseDownPos = { x: 0, y: 0 };
    this.#isDragging = false;
    this.#selectedObject = null;

    // Set up event listeners for mouse events
    this.#setUpMouseEvents();
    // Set up event listeners for keyboard events
    this.#setUpKeyboardEvents();
    // Add event listeners for custom events
    this.#addEventListenerCustomEvent();
  }

  /**
   * Set up all the event listeners needed for picking
   */
  #setUpMouseEvents() {
    const canvasChild = this.#canvas.children[this.#canvas.children.length - 1];

    /** @type {[string, Function][]} */
    const mouseEventMapping = [
      [
        "mousedown",
        (event) => {
          this.#onMouseDown(event);
        },
      ],
      [
        "mousemove",
        (event) => {
          this.#onMouseMove(event);
        },
      ],
      [
        "mouseup",
        (event) => {
          this.#onMouseUp(event);
        },
      ],
    ];

    mouseEventMapping.forEach(([eventName, handler]) => {
      // @ts-ignore
      canvasChild.addEventListener(eventName, handler);
    });
  }

  /**
   * Set up keyboard events needed for user input
   */
  #setUpKeyboardEvents() {
    /** @type {[string, Function][]} */
    const keyboardEventMapping = [
      [
        "keydown",
        (event) => {
          this.#onKeyDown(event);
        },
      ],
      [
        "keyup",
        (event) => {
          this.#onKeyUp(event);
        },
      ],
    ];

    keyboardEventMapping.forEach(([eventName, handler]) => {
      // @ts-ignore
      window.addEventListener(eventName, handler);
    });
  }

  /**
   * Adds event listeners for custom events objectCreated and objectDeleted
   */
  #addEventListenerCustomEvent() {
    this.#canvas.addEventListener(
      "itemDeleted",
      (
        /**
         * @type {ItemDeletedEvent}
         */
        event,
      ) => {
        if (event.detail.item == this.#selectedObjects[0]) {
          this.#deselectAll();
          this.#itemSelectedEvent();
        }
      },
    );

    this.#canvas.addEventListener(
      "itemCreated",
      (
        /**
         * @type {ItemCreatedEvent}
         */
        event,
      ) => {
        const createdItem = event.detail.item;
        this.setSelection([createdItem]);
      },
    );
  }

  /**
   * Sets the mode for the picker.
   * @param {"none" | "move" | "rotate"} mode - The mode to set.
   */
  setMode(mode) {
    this.#mode = mode;

    switch (mode) {
      case Mode.NONE:
        this.#transformControls.detach();
        break;
      case Mode.MOVE:
        this.#transformControls.setMode("translate");
        break;
      case Mode.ROTATE:
        this.#transformControls.setMode("rotate");
        break;
      default:
        console.warn("Picker has no valid mode set:", mode);
        break;
    }
    // update the available input methods, depending on the mode
    this.#updateTransformControls();
    this.#updateSelectionBox();
  }

  /**
   * Inform the canvas that an item has been selected
   */
  #itemSelectedEvent() {
    const event = new ItemSelectedEvent(this.#selectedObjects);
    document.getElementById("canvas").dispatchEvent(event);
  }

  /**
   * Returns the list of selected objects
   * @returns {Array<THREE.Object3D>} List of selected objects
   */
  getSelectedObjects() {
    return this.#selectedObjects;
  }

  /**
   * Sets the list of selected objects
   * @param {Array<THREE.Object3D>} objectList - The list of objects to select
   */
  setSelection(objectList) {
    this.#deselectAll();
    this.#selectedObjects = objectList;
    if (objectList) {
      this.#selectedObject = objectList[0];
      this.#updateTransformControls();
      this.#updateSelectionBox();
    }

    this.#itemSelectedEvent();
  }

  /**
   * Handle what happens if the users clicks inside of the canvas
   * @param {MouseEvent} event - The mouse down event
   */
  #onMouseDown(event) {
    this.#isDragging = false;
    this.#mouseDownPos.x = event.clientX;
    this.#mouseDownPos.y = event.clientY;
  }

  /**
   * Handles what happens of the user moves the mouse
   * @param {MouseEvent} event - The mouse move event
   */
  #onMouseMove(event) {
    if (event.buttons !== 0) {
      const x = event.clientX - this.#mouseDownPos.x;
      const y = event.clientY - this.#mouseDownPos.y;
      if (Math.sqrt(x * x + y * y) > 5) {
        this.#isDragging = true;
      }
    }
  }

  /**
   * Handles what happens if the user releases the mouse
   * @param {MouseEvent} event - The mouse up event
   */
  #onMouseUp(event) {
    // Only calls onClick if it was a real click  and not a drag
    if (!this.#isDragging) {
      this.#onClick(event);
    } else if (this.#transformControls.object) {
      // also checks if the object was moved or if the camera was adjusted
      if (
        this.#transformControls.mode === "translate" &&
        this.#selectedObject.isMovable &&
        !this.#transformControls.object.position.equals(
          this.#selectedObject.lastPosition,
        )
      ) {
        this.#selectedObject.updateAndSaveObjectPosition(
          this.#transformControls.object.position.clone(),
        );
        this.#itemSelectedEvent();
      } else if (
        this.#transformControls.mode === "rotate" &&
        this.#selectedObject.rotatableAxis
      ) {
        if (
          !this.#transformControls.object.quaternion.equals(
            this.#selectedObject.lastRotation,
          )
        ) {
          this.#selectedObject.updateAndSaveObjectRotation(
            this.#transformControls.object.quaternion.clone(),
          );
          this.#itemSelectedEvent();
        }
      }
    }
  }

  /**
   * Handles the click event on the canvas
   * @param {MouseEvent} event - The mouse click event
   */
  #onClick(event) {
    // Get normalized mouse position
    this.#mouse = this.#mouseposition(
      new THREE.Vector2(event.clientX, event.clientY),
    );

    // Raycast to find the clicked object
    this.#selectedObject = this.#select(this.#mouse, this.#camera);

    // Update selection (handles ctrl-key and multi-selection)
    this.#updateSelection(event.ctrlKey);

    this.#itemSelectedEvent();
  }

  /**
   * Selects an object based on the mouse position and camera
   * @param {THREE.Vector2} mouse - The normalized mouse position
   * @param {THREE.Camera} camera - The camera used for raycasting
   * @returns {CanvasObject|null} The selected object or null if no object was selected
   */
  #select(mouse, camera) {
    // Raycast from the camera through the mouse position
    this.#raycaster.setFromCamera(mouse, camera);
    const intersects = this.#raycaster.intersectObjects(
      this.#selectableGroup.children,
      true,
    );

    // Finds whole SelectableObject from the intersected objects
    if (intersects.length > 0) {
      for (const hit of intersects) {
        if (hit.object.type === "Mesh") {
          // Move up the hierarchy until we find a SelectableObject
          while (
            hit.object.parent &&
            !(hit.object.parent instanceof CanvasObject)
          ) {
            hit.object = hit.object.parent;
          }

          const topParent = hit.object.parent;
          return topParent;
        }
      }
    }
    return null;
  }

  /**
   * Deselects all objects, removes transformControls, and un-highlights them.
   */
  #deselectAll() {
    // Detach transformControls
    this.#transformControls.detach();
    this.#setTransformControlAxes(true, true, true);
    this.#selectionBox.visible = false;
    this.#selectedObjects = [];
  }

  /**
   * Handles the updating of the selection when the user uses the ctrl key and clicks
   * @param {boolean} ctrlKey if the ctrl key is pressed
   */
  #updateSelection(ctrlKey) {
    // No object was clicked
    if (!this.#selectedObject) {
      if (!ctrlKey) {
        this.#deselectAll();
      }
      return;
    }
    // Object was clicked
    if (ctrlKey) {
      // If object is already in the selection, just attach transformControls
      if (this.#selectedObjects.includes(this.#selectedObject)) {
        this.#finalizeSelection();
      } else {
        // Add it to the selection
        this.#selectedObjects.push(this.#selectedObject);
        this.#finalizeSelection();
      }
    } else {
      // deselect everything, then select the clicked object
      this.#deselectAll();
      this.#selectedObjects.push(this.#selectedObject);
      this.#finalizeSelection();
    }
  }

  /**
   * Finalizes the selection by updating the transform controls and selection box.
   */
  #finalizeSelection() {
    this.#updateTransformControls();
    this.#updateSelectionBox();
  }

  /**
   * Decides whether to attach transformControls to a single object
   * or a multiSelectionGroup that contains all currently selected objects.
   */
  #updateTransformControls() {
    if (this.#mode !== Mode.NONE) {
      // reset previous available axis
      this.#setTransformControlAxes(true, true, true);

      if (this.#selectedObjects.length === 0) {
        this.#deselectAll();
      } else if (this.#selectedObjects.length === 1) {
        this.#attachSingleTransformControl();
      } else {
        // Implement multi-selection
        // hide every control as they will not work properly
        this.#transformControls.detach();
        this.#updateSelectionBox();
      }
    }
  }

  /**
   * Attaches the transform controls to a single object
   */
  #attachSingleTransformControl() {
    switch (this.#transformControls.mode) {
      case "rotate":
        this.#transformControls.attach(this.#selectedObjects[0]);
        this.#setTransformControlAxes(false, false, false);
        if (this.#selectedObject.rotatableAxis) {
          this.#selectedObject.rotatableAxis.forEach((axis) => {
            let showX = false;
            let showY = false;
            let showZ = false;
            if (axis === "X") {
              showX = true;
            }
            if (axis === "Y") {
              showY = true;
            }
            if (axis === "Z") {
              showZ = true;
            }
            this.#setTransformControlAxes(showX, showY, showZ);
          });
        }
        break;
      case "translate":
        if (this.#selectedObject.isMovable) {
          this.#transformControls.attach(this.#selectedObjects[0]);
        }
        this.#enforceGroundLevel();
        break;
    }
  }

  /**
   * Enforces that the selected object cannot be dragged below ground level.
   */
  #enforceGroundLevel() {
    // Prevents an object from being dragged below ground level
    this.#transformControls.addEventListener("objectChange", () => {
      const groundLevel = 0;
      if (this.#selectedObject.position.y < groundLevel) {
        this.#selectedObject.position.y = groundLevel;
      }
      // If the object is a receiver set the base position to the ground
      if (this.#transformControls.object instanceof Receiver) {
        this.#transformControls.object.setBaseHeight(
          groundLevel - this.#transformControls.object.position.y,
        );
      }
    });
  }

  /**
   * Adds or removes axes from the transform controls based on the provided parameters.
   * @param {boolean} showX - Whether to show the X axis.
   * @param {boolean} showY - Whether to show the Y axis.
   * @param {boolean} showZ - Whether to show the Z axis.
   */
  #setTransformControlAxes(showX, showY, showZ) {
    this.#transformControls.showX = showX;
    this.#transformControls.showY = showY;
    this.#transformControls.showZ = showZ;
  }

  /**
   * Updates the selection box based on the currently selected objects.
   * If only one object is selected, it will set the selection box to that object.
   * As multi selection is not implemented yet, it will hide the selection box in any other case.
   */
  #updateSelectionBox() {
    if (this.#selectedObjects.length == 1) {
      if (this.#selectedObjects[0].isSelectable) {
        //@ts-ignore
        this.#selectionBox.setFromObject(this.#selectedObjects[0]);
        this.#selectionBox.visible = true;
      } else {
        this.#selectionBox.visible = false;
      }
    } else {
      this.#selectionBox.visible = false;
    }
  }

  /**
   * Calculates the normalized mouse position based on the canvas
   * @param {THREE.Vector2} position of the mouse
   * @returns {THREE.Vector2} normalized mouse position
   */
  #mouseposition(position) {
    const rect = this.#canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((position.x - rect.left) / rect.width) * 2 - 1,
      -((position.y - rect.top) / rect.height) * 2 + 1,
    );
  }

  /**
   * Enables grid snapping when the Shift key is pressed.
   * @param {KeyboardEvent} event - The keyboard event
   */
  #onKeyDown(event) {
    if (event.key === "Shift") {
      // Enable snapping depending on the transform mode
      if (this.#transformControls.mode === "translate") {
        this.#transformControls.translationSnap = 1; // Snap to grid size of 1 unit
      } else if (this.#transformControls.mode === "rotate") {
        this.#transformControls.rotationSnap = THREE.MathUtils.degToRad(15); // Snap rotation to 15° increments
      }
    }
  }

  /**
   * Disables grid snapping when the Shift key is released.
   * @param {KeyboardEvent} event - The keyboard event
   */
  #onKeyUp(event) {
    if (event.key === "Shift") {
      // Disable snapping
      this.#transformControls.translationSnap = null;
      this.#transformControls.rotationSnap = null;
    }
  }
}

/**
 * Custom event for when an item is selected
 */
class ItemSelectedEvent extends CustomEvent {
  /**
   * Creates a new ItemSelectedEvent
   * @param {Array<THREE.Object3D>} selectedObjects The objects that were selected
   */
  constructor(selectedObjects) {
    super("itemSelected", {
      detail: { object: selectedObjects },
    });
  }
}

import { Picker } from "picker";
import { ItemDeletedEvent } from "deleteCommands";
import { ItemUpdatedEvent } from "updateCommands";
import { CanvasObject } from "canvasObject";

/**
 * Represents the inspector panel in the editor.
 * @class Inspector
 */
export class Inspector {
  #picker;
  /**
   * @type {CanvasObject[]}
   */
  #objectList;
  #inspectorElem;

  /**
   * Creates a new inspector
   * @param {Picker} picker the picker in use for this scene
   */
  constructor(picker) {
    this.#picker = picker;
    this.#inspectorElem = document.getElementById("inspector");

    const canvas = document.getElementById("canvas");
    canvas.addEventListener("itemSelected", () => {
      this.#render();
    });

    canvas.addEventListener(
      "itemDeleted",
      (/** @type {ItemDeletedEvent}*/ event) => {
        if (
          this.#objectList.length == 1 &&
          event.detail.item == this.#objectList[0]
        ) {
          this.#render();
        }
      },
    );

    canvas.addEventListener(
      "itemUpdated",
      (/** @type {ItemUpdatedEvent} */ event) => {
        if (
          this.#objectList.length == 1 &&
          event.detail.item == this.#objectList[0]
        )
          this.#render();
      },
    );

    this.#render();
  }

  /**
   * Renders the inspector panel.
   */
  #render() {
    this.#objectList = this.#picker.getSelectedObjects();
    this.#inspectorElem.innerHTML = "";

    // No selection
    if (this.#objectList.length == 0) {
      const wrapper = document.createElement("div");
      wrapper.classList.add(
        "text-secondary",
        "d-flex",
        "justify-content-center",
      );
      wrapper.innerHTML = "Select an object by clicking on it";
      this.#inspectorElem.appendChild(wrapper);
    }
    // Single selection
    else if (this.#objectList.length == 1) {
      this.#inspectorElem.innerHTML = "";
      this.#objectList[0].inspectorComponents.forEach((component) => {
        this.#inspectorElem.appendChild(component.render());
      });
    }
    // Multi selection
    else {
      const wrapper = document.createElement("div");
      wrapper.classList.add(
        "text-secondary",
        "d-flex",
        "justify-content-center",
      );
      wrapper.innerHTML = "Multi selection is not yet supported :(";
      this.#inspectorElem.appendChild(wrapper);
    }
  }
}

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

    canvas.addEventListener("itemDeleted", (/** @type {ItemDeletedEvent}*/ event) => {
      this.#renderIfRelevant(event.detail.item);
    });

    canvas.addEventListener("itemUpdated", (/** @type {ItemUpdatedEvent} */ event) => {
      this.#renderIfRelevant(event.detail.item);
    });

    this.#render();
  }

  /**
   * Render only if exactly one object is selected and
   * the updated/deleted item is that selected one.
   * @param {CanvasObject} item the item that was updated/deleted
   */
  #renderIfRelevant(item) {
    if (this.#objectList.length === 1 && this.#objectList[0] === item) {
      this.#render();
    }
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
      wrapper.classList.add("text-secondary", "d-flex", "justify-content-center");
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
      wrapper.classList.add("text-secondary", "d-flex", "justify-content-center");
      wrapper.innerHTML = "Multi selection is not yet supported :(";
      this.#inspectorElem.appendChild(wrapper);
    }
  }
}

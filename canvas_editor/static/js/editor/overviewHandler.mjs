import { CanvasObject } from "canvasObject";
import { Editor } from "editor";
import { Picker } from "picker";
import { Object3D } from "three";

/**
 * Class to manage the overview panel in the editor.
 */
export class OverviewHandler {
  #editor;
  #picker;
  #overviewButton;
  /**
   * @type {CanvasObject[]}
   */
  #selectedObjects = [];
  #heliostatList;
  #receiverList;
  #lightsourceList;
  #htmlToObject = new Map();
  #objectToHtml = new Map();

  #objectType = Object.freeze({
    HELIOSTAT: "heliostat",
    RECEIVER: "receiver",
    LIGHTSOURCE: "light source",
  });

  /**
   * Creates a new overview handler.
   * @param {Picker} picker the picker currently in use.
   */
  constructor(picker) {
    this.#picker = picker;
    this.#editor = Editor.getInstance();
    this.#overviewButton = document.getElementById("overview-tab");
    this.#heliostatList = document.getElementById("heliostatList");
    this.#receiverList = document.getElementById("receiverList");
    this.#lightsourceList = document.getElementById("lightsourceList");

    // render when overview tab is selected
    this.#overviewButton.addEventListener("click", () => {
      this.#render();
    });

    ["itemSelected", "itemCreated", "itemDeleted", "itemUpdated"].forEach((evt) => {
      document.getElementById("canvas").addEventListener(evt, () => {
        if (this.#overviewButton.classList.contains("active")) this.#render();
      });
    });

    // handle F2 to rename
    document.addEventListener("keyup", (event) => {
      if (event.key == "F2" && this.#overviewButton.classList.contains("active")) {
        if (this.#selectedObjects.length !== 1) {
          alert("Exactly one object must selected to rename it");
        } else {
          const object = this.#selectedObjects[0];
          const type = this.#objectToHtml.get(object).dataset.type;
          this.#openEditInput(this.#selectedObjects[0], type);
        }
      }
    });
    this.#handleUserInput();
  }

  /**
   * Renders the overview panel.
   */
  #render() {
    const objects = this.#editor.objects;
    const selectedObjects = this.#picker.getSelectedObjects();

    this.#renderList(
      this.#heliostatList,
      objects.heliostatList,
      selectedObjects,
      (heliostat, selected) => this.#createHeliostatEntry(heliostat, selected),
      "heliostats",
    );

    this.#renderList(
      this.#receiverList,
      objects.receiverList,
      selectedObjects,
      (receiver, selected) => this.#createReceiverEntry(receiver, selected),
      "receivers",
    );

    this.#renderList(
      this.#lightsourceList,
      objects.lightsourceList,
      selectedObjects,
      (lightsource, selected) => this.#createLightsourceEntry(lightsource, selected),
      "light sources",
    );
  }

  /**
   * Renders a list of objects in the given list element.
   * @param {HTMLElement} listElement the html element to render the list in
   * @param {CanvasObject[]} objects the objects to render in the list
   * @param {Object3D[]} selectedObjects the objects that are currently selected
   * @param {Function} createEntryFn function to create an entry for an object
   * @param {string} objectTypePlural the plural name of the object type (for empty list message)
   */
  #renderList(listElement, objects, selectedObjects, createEntryFn, objectTypePlural) {
    listElement.innerText = "";

    objects.forEach((obj) => {
      const selected = selectedObjects.includes(obj);
      listElement.appendChild(createEntryFn(obj, selected));
    });

    if (listElement.children.length === 0) {
      const text = document.createElement("i");
      text.classList.add("text-secondary");
      text.innerText = `No ${objectTypePlural} in this scene`;
      listElement.appendChild(text);
    }
  }

  /**
   * Creates a heliostat overview entry
   * @param {CanvasObject} object The heliostat object
   * @param {boolean} selected determines if the object is selected or not
   * @returns {HTMLElement} the created overview entry element
   */
  #createHeliostatEntry(object, selected) {
    return this.#createOverviewEntry(object, selected, {
      iconClasses: ["bi", "bi-arrow-up-right-square"],
      defaultLabel: "Heliostat",
      type: this.#objectType.HELIOSTAT,
    });
  }

  /**
   *  Creates a receiver overview entry
   * @param {CanvasObject} object The receiver object
   * @param {boolean} selected determines if the object is selected or not
   * @returns {HTMLElement} the created overview entry element
   */
  #createReceiverEntry(object, selected) {
    return this.#createOverviewEntry(object, selected, {
      iconClasses: ["bi", "bi-align-bottom"],
      defaultLabel: "Receiver",
      type: this.#objectType.RECEIVER,
    });
  }

  /**
   * Creates a light source overview entry
   * @param {CanvasObject} object The light source object
   * @param {boolean} selected determines if the object is selected or not
   * @returns {HTMLElement} the created overview entry element
   */
  #createLightsourceEntry(object, selected) {
    return this.#createOverviewEntry(object, selected, {
      iconClasses: ["bi", "bi-lightbulb"],
      defaultLabel: "Light source",
      type: this.#objectType.LIGHTSOURCE,
    });
  }

  /**
   * Creates a generic overview entry
   * @param {CanvasObject} object the object you want to create an overview entry for
   * @param {boolean} selected determines if the object is selected or not
   * @param {object} config configuration object containing icon classes, default label, and type
   * @returns {HTMLElement} the created overview entry element
   */
  #createOverviewEntry(object, selected, config) {
    const entry = document.createElement("div");
    entry.role = "button";
    entry.classList.add(
      "d-flex",
      "gap-2",
      "p-2",
      "rounded-2",
      "overviewElem",
      selected ? "bg-primary-subtle" : "bg-body-secondary",
    );

    const icon = document.createElement("i");
    icon.classList.add(...config.iconClasses, "d-flex", "align-items-center");
    entry.appendChild(icon);

    const text = document.createElement("div");
    text.classList.add("w-100", "d-flex", "align-items-center");
    text.style.whiteSpace = "normal";
    text.style.wordBreak = "break-word";
    text.innerText = object.objectName ? object.objectName : config.defaultLabel;
    entry.appendChild(text);

    const button = document.createElement("button");
    button.classList.add("btn", "btn-primary", "custom-btn");
    button.style.height = "38px";
    button.style.flexShrink = "0";
    button.style.alignSelf = "center";
    const buttonIcon = document.createElement("i");
    buttonIcon.classList.add("bi", "bi-pencil-square");
    button.appendChild(buttonIcon);
    entry.appendChild(button);

    this.#addEditFunctionality(button, object, config.type);

    entry.dataset.apiId = object.apiID.toString();
    entry.dataset.type = config.type;

    this.#htmlToObject.set(entry, object);
    this.#objectToHtml.set(object, entry);

    return entry;
  }

  /**
   * Handles user input in the overview panel.
   */
  #handleUserInput() {
    document.getElementById("accordionOverview").addEventListener("click", (event) => {
      const target = event.target.closest(".overviewElem");
      const object = this.#htmlToObject.get(target);

      if (target && object) {
        if (event.ctrlKey) {
          if (this.#selectedObjects.includes(object)) {
            this.#selectedObjects.splice(this.#selectedObjects.indexOf(object), 1);
          } else {
            this.#selectedObjects.push(object);
          }
        } else {
          this.#selectedObjects = [object];
        }

        this.#picker.setSelection(this.#selectedObjects);
      }
    });
  }

  /**
   * Adds edit functionality to the given button.
   * @param {HTMLButtonElement} button the button to open the edit field.
   * @param {CanvasObject} object the object you want to edit.
   * @param {"heliostat" | "receiver" | "light source"} type the type of object you want to edit the name of.
   */
  #addEditFunctionality(button, object, type) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.#openEditInput(object, type);
    });
  }

  /**
   * Opens a new edit field for the given object
   * @param {CanvasObject} object the object you want rename.
   * @param {"heliostat" | "receiver" | "light source"} type the type of object you want to edit the name of.
   */
  #openEditInput(object, type) {
    const entry = this.#objectToHtml.get(object);
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.classList.add("form-control", "rounded-1");
    inputField.value =
      object.objectName != "" && object.objectName
        ? object.objectName
        : type.charAt(0).toUpperCase() + type.slice(1, type.length);
    entry.innerText = "";
    entry.appendChild(inputField);
    inputField.focus();
    inputField.select();

    inputField.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    inputField.addEventListener("keyup", (event) => {
      if (event.key == "Escape") {
        inputField.value = object.objectName;
        this.#render();
      } else if (event.key == "Enter") {
        this.#render();
      }
    });

    inputField.addEventListener("change", () => {
      if (inputField.value !== object.objectName && inputField.value.length < 200) {
        object.updateAndSaveObjectName(inputField.value);
      }
    });

    inputField.addEventListener("blur", () => {
      this.#render();
    });
  }
}

import { CanvasObject } from "canvasObject";
import { Editor } from "editor";
import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { Picker } from "picker";
import { Receiver } from "receiver";

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

    // re-render when a new item is selected
    document.getElementById("canvas").addEventListener("itemSelected", () => {
      if (this.#overviewButton.classList.contains("active")) {
        this.#render();
      }
    });

    // re-render when object is created
    document.getElementById("canvas").addEventListener("itemCreated", () => {
      if (this.#overviewButton.classList.contains("active")) {
        this.#render();
      }
    });

    // re-render when object is deleted
    document.getElementById("canvas").addEventListener("itemDeleted", () => {
      if (this.#overviewButton.classList.contains("active")) {
        this.#render();
      }
    });

    // re-render when object is updated
    document.getElementById("canvas").addEventListener("itemUpdated", () => {
      if (this.#overviewButton.classList.contains("active")) {
        this.#render();
      }
    });

    // handle F2 to rename
    document.addEventListener("keyup", (event) => {
      if (
        event.key == "F2" &&
        this.#overviewButton.classList.contains("active")
      ) {
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
    // clear the list
    this.#heliostatList.innerText = "";
    this.#receiverList.innerText = "";
    this.#lightsourceList.innerText = "";

    const objects = this.#editor.objects;
    const selectedObjects = this.#picker.getSelectedObjects();

    // render the objects
    objects.heliostatList.forEach((heliostat) => {
      const selected = selectedObjects.includes(heliostat);
      this.#heliostatList.appendChild(
        this.#createHeliostatEntry(heliostat, selected),
      );
    });

    objects.receiverList.forEach((receiver) => {
      const selected = selectedObjects.includes(receiver);
      this.#receiverList.appendChild(
        this.#createReceiverEntry(receiver, selected),
      );
    });

    objects.lightsourceList.forEach((lightsource) => {
      const selected = selectedObjects.includes(lightsource);
      this.#lightsourceList.appendChild(
        this.#createLightsourceEntry(lightsource, selected),
      );
    });

    if (this.#heliostatList.children.length == 0) {
      const text = document.createElement("i");
      text.classList.add("text-secondary");
      text.innerText = "No heliostats in this scene";
      this.#heliostatList.appendChild(text);
    }

    if (this.#receiverList.children.length == 0) {
      const text = document.createElement("i");
      text.classList.add("text-secondary");
      text.innerText = "No receivers in this scene";
      this.#receiverList.appendChild(text);
    }

    if (this.#lightsourceList.children.length == 0) {
      const text = document.createElement("i");
      text.classList.add("text-secondary");
      text.innerText = "No light sources in this scene";
      this.#lightsourceList.appendChild(text);
    }
  }

  /**
   * Creates an entry for the given heliostat
   * @param {Heliostat} object the heliostat you want to create an entry for
   * @param {boolean} selected if the object is selected or not
   * @returns {HTMLElement} heliostatEntry - the html element for the heliostat
   */
  #createHeliostatEntry(object, selected) {
    // create the html element to render
    const heliostatEntry = document.createElement("div");
    heliostatEntry.role = "button";
    heliostatEntry.classList.add(
      "d-flex",
      "gap-2",
      "p-2",
      "rounded-2",
      "overviewElem",
      selected ? "bg-primary-subtle" : "bg-body-secondary",
    );

    const icon = document.createElement("i");
    icon.classList.add(
      "bi-arrow-up-right-square",
      "d-flex",
      "align-items-center",
    );
    heliostatEntry.appendChild(icon);

    const text = document.createElement("div");
    text.classList.add("w-100", "d-flex", "align-items-center");
    text.style.whiteSpace = "normal";
    text.style.wordBreak = "break-word";
    text.innerText = object.objectName !== "" ? object.objectName : "Heliostat";
    heliostatEntry.appendChild(text);

    const button = document.createElement("button");
    button.classList.add("btn", "btn-primary", "custom-btn");
    button.style.height = "38px";
    button.style.flexShrink = "0";
    button.style.alignSelf = "center";
    const buttonIcon = document.createElement("i");
    buttonIcon.classList.add("bi", "bi-pencil-square");
    button.appendChild(buttonIcon);
    heliostatEntry.appendChild(button);

    this.#addEditFunctionality(button, object, this.#objectType.HELIOSTAT);

    heliostatEntry.dataset.apiId = object.apiID.toString();
    heliostatEntry.dataset.type = this.#objectType.HELIOSTAT;

    this.#htmlToObject.set(heliostatEntry, object);
    this.#objectToHtml.set(object, heliostatEntry);
    return heliostatEntry;
  }

  /**
   * Creates an entry for the given receiver
   * @param {Receiver} object the receiver you want to create an entry for
   * @param {boolean} selected determines if the object is selected or not
   * @returns {HTMLElement} receiverEntry - the html element for the receiver
   */
  #createReceiverEntry(object, selected) {
    // create the html element to render
    const receiverEntry = document.createElement("div");
    receiverEntry.role = "button";
    receiverEntry.classList.add(
      "d-flex",
      "gap-2",
      "p-2",
      "rounded-2",
      "overviewElem",
      selected ? "bg-primary-subtle" : "bg-body-secondary",
    );

    const icon = document.createElement("i");
    icon.classList.add("bi", "bi-align-bottom", "d-flex", "align-items-center");
    receiverEntry.appendChild(icon);

    const text = document.createElement("div");
    text.classList.add("w-100", "d-flex", "align-items-center");
    text.style.whiteSpace = "normal";
    text.style.wordBreak = "break-word";
    text.innerText =
      object.objectName !== "" && object.objectName
        ? object.objectName
        : "Receiver";
    receiverEntry.appendChild(text);

    const button = document.createElement("button");
    button.classList.add("btn", "btn-primary", "custom-btn");
    button.style.height = "38px";
    button.style.flexShrink = "0";
    button.style.alignSelf = "center";
    const buttonIcon = document.createElement("i");
    buttonIcon.classList.add("bi", "bi-pencil-square");
    button.appendChild(buttonIcon);
    receiverEntry.appendChild(button);

    this.#addEditFunctionality(button, object, this.#objectType.RECEIVER);

    receiverEntry.dataset.apiId = object.apiID.toString();
    receiverEntry.dataset.type = this.#objectType.RECEIVER;

    this.#htmlToObject.set(receiverEntry, object);
    this.#objectToHtml.set(object, receiverEntry);
    return receiverEntry;
  }

  /**
   * Creates an entry for the given light source
   * @param {LightSource} object the light source you want to create an entry for
   * @param {boolean} selected determines if the object is selected or not
   * @returns {HTMLElement} lightSourceEntry - the html element for the light source
   */
  #createLightsourceEntry(object, selected) {
    // create the html element to render
    const lightsourceEntry = document.createElement("div");
    lightsourceEntry.role = "button";
    lightsourceEntry.classList.add(
      "d-flex",
      "gap-2",
      "p-2",
      "rounded-2",
      "overviewElem",
      selected ? "bg-primary-subtle" : "bg-body-secondary",
    );

    const icon = document.createElement("i");
    icon.classList.add("bi", "bi-lightbulb", "d-flex", "align-items-center");
    lightsourceEntry.appendChild(icon);

    const text = document.createElement("div");
    text.classList.add("w-100", "d-flex", "align-items-center");
    text.style.whiteSpace = "normal";
    text.style.wordBreak = "break-word";
    text.innerText =
      object.objectName !== "" && object.objectName
        ? object.objectName
        : "Light source";
    lightsourceEntry.appendChild(text);

    const button = document.createElement("button");
    button.classList.add("btn", "btn-primary", "custom-btn");
    button.style.height = "38px";
    button.style.flexShrink = "0";
    button.style.alignSelf = "center";
    const buttonIcon = document.createElement("i");
    buttonIcon.classList.add("bi", "bi-pencil-square");
    button.appendChild(buttonIcon);
    lightsourceEntry.appendChild(button);

    this.#addEditFunctionality(button, object, this.#objectType.LIGHTSOURCE);

    lightsourceEntry.dataset.apiId = object.apiID.toString();
    lightsourceEntry.dataset.type = this.#objectType.LIGHTSOURCE;

    this.#htmlToObject.set(lightsourceEntry, object);
    this.#objectToHtml.set(object, lightsourceEntry);
    return lightsourceEntry;
  }

  /**
   * Handles user input in the overview panel.
   */
  #handleUserInput() {
    document
      .getElementById("accordionOverview")
      .addEventListener("click", (event) => {
        const target = event.target.closest(".overviewElem");
        const object = this.#htmlToObject.get(target);

        if (target && object) {
          if (event.ctrlKey) {
            if (this.#selectedObjects.includes(object)) {
              this.#selectedObjects.splice(
                this.#selectedObjects.indexOf(object),
                1,
              );
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
      if (
        inputField.value !== object.objectName &&
        inputField.value.length < 200
      ) {
        object.updateAndSaveObjectName(inputField.value);
      }
    });

    inputField.addEventListener("blur", () => {
      this.#render();
    });
  }
}

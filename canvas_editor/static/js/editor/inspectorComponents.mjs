import { CanvasObject } from "canvasObject";
import { abstractClassError, methodMustBeImplementedError } from "message_dict";

/**
 * Represents a single component of the inspector
 */
export class InspectorComponent {
  /**
   * Creates a new inspector component.
   * @throws {Error} if trying to instantiate this abstract class directly
   */
  constructor() {
    if (new.target == InspectorComponent) {
      throw new Error(abstractClassError(InspectorComponent));
    }
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @throws {Error} if this method is not implemented in a subclass
   */
  render() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Disables the border around the component
   * @throws {Error} if this method is not implemented in a subclass
   */
  disableBorder() {
    throw new Error(methodMustBeImplementedError);
  }
}

/**
 * A single field component consists out of a name and the corresponding input field
 */
export class SingleFieldInspectorComponent extends InspectorComponent {
  #fieldName;
  #fieldType;
  #getFieldValueFunc;
  #saveFunc;
  #hasBorder;
  #InputLimitBottom;

  /**
   * Creates a new single field component.
   * @param {string} fieldName the name of the field this components going to change
   * @param {"text" | "number"} fieldType is the type of the input field
   * @param {Function} getFieldValueFunc is the function to get the field value
   * @param {Function} saveFunc is the function to update the field value
   * @param {number} InputLimitBottom is the limit of the input field
   */
  constructor(
    fieldName,
    fieldType,
    getFieldValueFunc,
    saveFunc,
    InputLimitBottom,
  ) {
    super();
    this.#fieldName = fieldName;
    this.#fieldType = fieldType;
    this.#getFieldValueFunc = getFieldValueFunc;
    this.#saveFunc = saveFunc;
    this.#hasBorder = true;
    this.#InputLimitBottom = InputLimitBottom;
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @returns {HTMLElement} the rendered component
   */
  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("d-flex", "p-2", "bg-body", "rounded-2", "gap-2");
    if (this.#hasBorder) {
      wrapper.classList.add("border");
    }

    const fieldName = document.createElement("div");
    fieldName.classList.add("d-flex", "align-items-center", "text-nowrap");
    fieldName.innerText = this.#fieldName + ":";
    wrapper.appendChild(fieldName);

    const input = document.createElement("input");
    input.classList.add("form-control", "rounded-1");
    input.type = this.#fieldType;
    input.value = this.#getFieldValueFunc();
    wrapper.appendChild(input);

    // save changes on blur and re-render
    input.addEventListener("change", () => {
      if (input.value !== this.#getFieldValueFunc().toString()) {
        // prevents objects from going under the preset limit
        if (parseFloat(input.value) < this.#InputLimitBottom) {
          input.value = this.#InputLimitBottom.toString();
        }

        this.#saveFunc(input.value);
      }
    });

    // handle keybindings
    input.addEventListener("keyup", (event) => {
      if (event.key == "Escape") {
        input.value = this.#getFieldValueFunc();
        input.blur();
      } else if (event.key == "Enter") {
        input.blur();
      }
    });

    return wrapper;
  }

  /**
   * Disables the border around the component
   */
  disableBorder() {
    this.#hasBorder = false;
  }
}

/**
 * A multi field component bundles a set of single field components
 */
export class MultiFieldInspectorComponent extends InspectorComponent {
  #componentList;
  #title;
  #isOpen = true;

  /**
   * Creates a new multi field component.
   * @param {string} title is the title of the field.
   * @param {InspectorComponent[]} componentList contains all the single field that should be bundled in the multi field component.
   */
  constructor(title, componentList) {
    super();
    this.#componentList = componentList;
    this.#title = title;
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @returns {HTMLElement} the rendered component
   */
  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("accordion");
    wrapper.id = this.#title;

    const accordionItem = document.createElement("div");
    accordionItem.classList.add("accordion-item");
    wrapper.append(accordionItem);

    const header = document.createElement("h1");
    header.classList.add("accordion-header");
    accordionItem.appendChild(header);

    const headerButton = document.createElement("button");
    headerButton.classList.add("accordion-button", "fw-bold");
    headerButton.type = "button";
    headerButton.dataset.bsTarget =
      "#" + this.#title.replace(" ", "") + "Collapse";
    headerButton.dataset.bsToggle = "collapse";
    headerButton.innerText = this.#title;
    header.appendChild(headerButton);

    headerButton.addEventListener("click", () => {
      this.#isOpen = !this.#isOpen;
    });

    const bodyWrapper = document.createElement("div");
    bodyWrapper.id = this.#title.replace(" ", "") + "Collapse";
    bodyWrapper.classList.add("accordion-collapse");
    if (this.#isOpen) {
      bodyWrapper.classList.add("collapse", "show");
    } else {
      bodyWrapper.classList.add("collapse");
      headerButton.classList.add("collapsed");
    }
    bodyWrapper.dataset.bsParent = this.#title;
    accordionItem.appendChild(bodyWrapper);

    const body = document.createElement("div");
    body.classList.add(
      "d-flex",
      "flex-column",
      "bg-body",
      "rounded-3",
      "gap-2",
      "accordion-body",
    );
    bodyWrapper.appendChild(body);

    this.#componentList.forEach((component) => {
      component.disableBorder();
      body.appendChild(component.render());
    });

    return wrapper;
  }
}

/**
 * A select field component is a drop-down-menu were the user can choose out of a number of predefined values.
 */
export class SelectFieldInspectorComponent extends InspectorComponent {
  #fieldName;
  #options;
  #getFieldValueFunc;
  #saveFunc;
  #hasBorder;

  /**
   * Creates a new single field component
   * @param {string} fieldName the name of the field
   * @param {{label: string, value: any}[]} options an array of options the user can choose from
   * @param {Function} getFieldValueFunc the function to get the value of the field
   * @param {Function} saveFunc the function to save the value
   */
  constructor(fieldName, options, getFieldValueFunc, saveFunc) {
    super();
    this.#fieldName = fieldName;
    this.#options = options;
    this.#getFieldValueFunc = getFieldValueFunc;
    this.#saveFunc = saveFunc;
    this.#hasBorder = true;
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @returns {HTMLElement} the rendered component
   */
  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("d-flex", "p-2", "bg-body", "rounded-3", "gap-2");
    if (this.#hasBorder) {
      wrapper.classList.add("border");
    }

    const fieldName = document.createElement("div");
    fieldName.classList.add("d-flex", "align-items-center", "text-nowrap");
    fieldName.innerText = this.#fieldName + ":";
    wrapper.appendChild(fieldName);

    const select = document.createElement("select");
    select.classList.add("form-select", "rounded-1");

    // Populate the drop-down-menu with options
    this.#options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.label = option.label;
      select.appendChild(optionElement);
    });

    wrapper.appendChild(select);

    // save changes on blur and re-render
    select.addEventListener("change", () => {
      if (select.value !== this.#getFieldValueFunc().toString()) {
        this.#saveFunc(select.value);
      }
      select.value = this.#getFieldValueFunc();
    });

    return wrapper;
  }

  /**
   * Disables the border around the component
   */
  disableBorder() {
    this.#hasBorder = false;
  }
}

/**
 * A slider field component consists out of a number input and a slider.
 */
export class SliderFieldInspectorComponent extends InspectorComponent {
  #fieldName;
  #step;
  #min;
  #max;
  #getFieldValueFunc;
  #saveFunc;
  #hasBorder;

  /**
   * Creates a new slider component
   * @param {string} fieldName the name of the field
   * @param {number} min the min value of the field
   * @param {number} max the max value of the field
   * @param {Function} getFieldValueFunc the function to get the value of the field
   * @param {Function} saveFunc the function to save the value
   * @param {number} [step] the step the slider uses
   */
  constructor(
    fieldName,
    min,
    max,
    getFieldValueFunc,
    saveFunc,
    step = undefined,
  ) {
    super();
    this.#fieldName = fieldName;
    this.#min = min;
    this.#max = max;
    this.#step = step;
    this.#getFieldValueFunc = getFieldValueFunc;
    this.#saveFunc = saveFunc;
    this.#hasBorder = true;
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @returns {HTMLElement} the rendered component
   */
  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add(
      "d-flex",
      "flex-column",
      "p-2",
      "bg-body",
      "rounded-3",
      "gap-2",
    );
    if (this.#hasBorder) {
      wrapper.classList.add("border");
    }

    const header = document.createElement("div");
    header.classList.add("d-flex", "gap-2");
    wrapper.appendChild(header);

    const fieldName = document.createElement("div");
    fieldName.classList.add("d-flex", "align-items-center", "text-nowrap");
    fieldName.innerText = this.#fieldName + ":";
    header.appendChild(fieldName);

    const input = document.createElement("input");
    input.classList.add("form-control", "rounded-1");
    input.type = "number";
    input.value = this.#getFieldValueFunc();
    header.appendChild(input);

    const slider = document.createElement("input");
    slider.classList.add("form-range", "rounded-1");
    slider.type = "range";
    slider.min = this.#min.toString();
    slider.max = this.#max.toString();
    if (this.#step) {
      slider.step = this.#step.toString();
    }
    slider.value = this.#getFieldValueFunc();
    wrapper.appendChild(slider);

    // save the slider changes
    slider.addEventListener("change", () => {
      this.#saveFunc(slider.value);
      input.value = this.#getFieldValueFunc();
    });

    // save the input changes
    input.addEventListener("blur", () => {
      if (
        input.value !== this.#getFieldValueFunc().toString() &&
        parseFloat(input.value) >= this.#min &&
        parseFloat(input.value) <= this.#max
      ) {
        this.#saveFunc(input.value);
      }
      input.value = this.#getFieldValueFunc();
      slider.value = this.#getFieldValueFunc();
    });

    // handle keybindings
    input.addEventListener("keyup", (event) => {
      if (event.key == "Escape") {
        input.value = this.#getFieldValueFunc();
        input.blur();
      } else if (event.key == "Enter") {
        input.blur();
      }
    });

    return wrapper;
  }

  /**
   * Disables the border around the component
   */
  disableBorder() {
    this.#hasBorder = false;
  }
}

/**
 * The header inspector component consist out of the title and an edit button
 */
export class HeaderInspectorComponent extends InspectorComponent {
  #getFieldValueFunc;
  #saveFunc;
  #selectedObject;

  /**
   * Creates a new header component.
   * @param {Function} getFieldValueFunc the function to get the title
   * @param {Function} saveFunc the function to update the title
   * @param {CanvasObject} selectedObject - the currently selected object in the inspector
   */
  constructor(getFieldValueFunc, saveFunc, selectedObject) {
    super();
    this.#getFieldValueFunc = getFieldValueFunc;
    this.#saveFunc = saveFunc;
    this.#selectedObject = selectedObject;
  }

  /**
   * Renders the component and also adds the necessary logic to updating and saving.
   * @returns {HTMLElement} the rendered component
   */
  render() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("d-flex", "px-1", "gap-1");

    const title = document.createElement("div");
    title.classList.add("fw-bolder", "fs-4");
    title.innerText = this.#getFieldValueFunc();
    title.style.whiteSpace = "normal";
    title.style.wordBreak = "break-word";
    title.title = "Edit Name";
    title.style.width = "70%";
    wrapper.appendChild(title);

    const buttonWrapper = document.createElement("div");
    const buttonBackground = document.createElement("div");
    buttonBackground.classList.add(
      "rounded-4",
      "d-flex",
      "gap-1",
      "bg-body",
      "px-2",
    );
    buttonWrapper.appendChild(buttonBackground);
    wrapper.appendChild(buttonWrapper);

    const editButton = document.createElement("button");
    editButton.classList.add("btn", "p-1");
    const buttonIcon = document.createElement("i");
    buttonIcon.title = "Edit Name";
    buttonIcon.classList.add("bi", "bi-pencil-square");
    buttonIcon.style.height = "40px";
    editButton.appendChild(buttonIcon);

    buttonBackground.appendChild(editButton);

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.classList.add("form-control", "rounded-1");

    // Event listeners for clicking the title
    title.addEventListener("click", () => {
      title.innerText = "";
      inputField.value = this.#getFieldValueFunc();
      title.appendChild(inputField);
      inputField.focus();
      inputField.select();
    });

    // Event listeners for clicking the edit button
    editButton.addEventListener("click", () => {
      title.innerText = "";
      inputField.value = this.#getFieldValueFunc();
      title.appendChild(inputField);
      inputField.focus();
      inputField.select();
    });

    // duplicate button
    const duplicateButton = document.createElement("button");
    duplicateButton.classList.add("btn", "p-1");
    duplicateButton.style.height = "40px";
    const duplicateIcon = document.createElement("i");
    duplicateIcon.classList.add("bi", "bi-copy");
    duplicateButton.title = "Duplicate";
    duplicateButton.appendChild(duplicateIcon);

    buttonBackground.appendChild(duplicateButton);

    duplicateButton.addEventListener("click", () => {
      this.#selectedObject.duplicate();
    });

    // delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "p-1");
    deleteButton.style.height = "40px";
    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("bi", "bi-trash");
    deleteButton.title = "Delete";
    deleteButton.appendChild(deleteIcon);

    buttonBackground.appendChild(deleteButton);

    deleteButton.addEventListener("click", () => {
      this.#selectedObject.delete();
    });

    inputField.addEventListener("change", () => {
      if (
        inputField.value !== this.#getFieldValueFunc() &&
        inputField.value.length < 200
      ) {
        this.#saveFunc(inputField.value);
      }
      inputField.blur();
    });

    inputField.addEventListener("keyup", (event) => {
      if (event.key == "Escape" || event.key == "Enter") {
        inputField.value = this.#getFieldValueFunc();
        inputField.blur();
      }
    });

    inputField.addEventListener("blur", () => {
      title.innerText = this.#getFieldValueFunc();
    });

    return wrapper;
  }
}

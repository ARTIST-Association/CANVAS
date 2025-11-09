import { CanvasObject } from "canvasObject";
import { Editor } from "editor";
import { html, LitElement } from "lit";
import { Picker } from "picker";

/**
 * Represents a single entry of the object overview.
 * The user can use this entry to select or rename the object.
 */
export class OverviewEntry extends LitElement {
  static properties = {
    _editing: { type: Boolean },
    _selected: { type: Boolean },
  };
  #object;
  #icon;
  #category;
  #onClick;

  /**
   * Creates a new entry element
   * @param {string} category the category of this overview entry
   * @param {CanvasObject} object the object this entry represents
   * @param {string} icon the bootstrap icon name for this entry
   * @param {(e: MouseEvent) => void} onClick callback that gets executed when clicking the entry
   */
  constructor(category, object, icon, onClick) {
    super();
    this.#object = object;
    this.#icon = icon;
    this.#category = category;
    this.#onClick = onClick;
    this._editing = false;
    this._selected = false;
  }

  /**
   * @inheritdoc
   */
  createRenderRoot() {
    return this; // Renders directly into the Light DOM
  }

  /**
   * @inheritdoc
   * @param {Map<string, any>} changedProperties Map containing all the changes properties and the old values
   */
  updated(changedProperties) {
    if (changedProperties.has("_editing") && this._editing) {
      // Find the input element and focus it when _editing becomes true
      const input = document.getElementById(
        `${this.#category + "-" + this.#object.id}-overview-input`,
      );
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    }
  }

  /**
   * @inheritdoc
   */
  render() {
    return this._editing
      ? html`<div
          class="p-2 rounded-2 ${this._selected
            ? "bg-primary-subtle"
            : "bg-body-secondary"}"
        >
          <input
            class="form-control rounded-1"
            id="${this.#category}-${this.#object.id}-overview-input"
            value="${this.#object.objectName}"
            @blur="${(e) => {
              this._editing = false;
              if (e.target.value != this.#object.objectName) {
                this.#object.updateAndSaveObjectName(e.target.value);
              }
            }}"
            @keyup="${(event) => {
              if (event.key == "Escape") {
                this._editing = false;
              } else if (event.key == "Enter") {
                this.#object.updateAndSaveObjectName(event.target.value);
                this._editing = false;
              }
            }}"
          />
        </div>`
      : html`<div
          @click="${this.#onClick}"
          class="d-flex gap-2 p-2 rounded-2 align-items-center ${this._selected
            ? "bg-primary-subtle"
            : "bg-body-secondary"}"
        >
          <i class="bi ${this.#icon}"></i>
          <p class="mb-0 text-truncate flex-grow-1">
            ${this.#object.objectName}
          </p>
          <button
            class="btn btn-sm btn-outline-secondary custom-btn"
            @click="${(/** @type {MouseEvent} */ e) => {
              this._editing = true;
              e.stopPropagation();
            }}"
          >
            <i class="bi bi-pencil-square"></i>
          </button>
        </div>`;
  }
}
customElements.define("overview-entry", OverviewEntry);

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 */

/**
 * @implements {ReactiveController}
 * Controller for the actual overview
 */
export class OverviewController {
  #overview;
  #overviewButton = document.getElementById("overview-tab");
  #canvas = document.getElementById("canvas");
  static #events = [
    "itemSelected",
    "itemCreated",
    "itemDeleted",
    "itemUpdated",
  ];

  /**
   * Controller to automatically update the overview.
   * @param {Overview} overview the overview view element this controller should control.
   */
  constructor(overview) {
    this.#overview = overview;
    this.#overview.addController(this);
    this.updateOverview = this.updateOverview.bind(this);
  }

  /**
   * @inheritdoc
   */
  updateOverview = () => {
    if (this.#overviewButton.classList.contains("active")) {
      this.#overview.requestUpdate();
    }
  };

  /**
   * @inheritdoc
   */
  hostConnected() {
    this.#overviewButton.addEventListener("click", this.updateOverview);
    for (const event of OverviewController.#events) {
      this.#canvas.addEventListener(event, this.updateOverview);
    }
  }

  /**
   * @inheritdoc
   */
  hostDisconnected() {
    this.#overviewButton.removeEventListener("click", this.updateOverview);
    for (const event of OverviewController.#events) {
      this.#canvas.removeEventListener(event, this.updateOverview);
    }
  }
}

/**
 * Overview sidebar component for displaying and managing
 * heliostats, receivers, and light sources in an accordion UI.
 */
export class Overview extends LitElement {
  static properties = {
    _selectedElements: { type: OverviewEntry },
  };
  #editor = Editor.getInstance();
  #picker;

  /**
   * Creates a new Overview element.
   * @param {Picker} picker the picker currently in use.
   */
  constructor(picker) {
    super();
    this.#picker = picker;
  }

  /**
   * @inheritdoc
   */
  createRenderRoot() {
    return this; // Renders directly into the Light DOM
  }

  /**
   * Creates a bootstrap accordion item
   * @param {string} name the name of the accordion item.
   * @param {OverviewEntry[]} items the items placed inside the accordion item
   * @returns {import("lit").TemplateResult} the accordion item
   */
  #createAccordionItem(name, items) {
    return html`
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${name}"
            aria-expanded="false"
            aria-controls="${name}"
          >
            ${name}
          </button>
        </h2>
        <div id="${name}" class="accordion-collapse collapse">
          <div class="accordion-body d-flex flex-column gap-2">${items}</div>
        </div>
      </div>
    `;
  }

  /**
   * Updates the currently selected objects
   * @param {CanvasObject} item the item you want to select or add to the selection
   * @param {MouseEvent} event determines whether to add the item to selection or to select it
   */
  #updateSelection(item, event) {
    if (event.ctrlKey) {
      this.#picker.setSelection([...this.#picker.getSelectedObjects(), item]);
    } else {
      this.#picker.setSelection([item]);
    }
  }

  /**
   * @inheritdoc
   */
  render() {
    return html`
      <div class="accordion w-100" id="accordionOverview">
        ${this.#createAccordionItem(
          "Heliostats",
          this.#editor.objects.heliostatList.map((heliostat) => {
            const tmp = new OverviewEntry(
              "heliostat",
              heliostat,
              "bi-pencil-square",
              (e) => this.#updateSelection(heliostat, e),
            );
            tmp._selected = this.#picker
              .getSelectedObjects()
              .includes(heliostat);
            return tmp;
          }),
        )}
        ${this.#createAccordionItem(
          "Receivers",
          this.#editor.objects.receiverList.map((receiver) => {
            const tmp = new OverviewEntry(
              "receiver",
              receiver,
              "bi-pencil-square",
              (e) => this.#updateSelection(receiver, e),
            );
            tmp._selected = this.#picker
              .getSelectedObjects()
              .includes(receiver);
            return tmp;
          }),
        )}
        ${this.#createAccordionItem(
          "Light sources",
          this.#editor.objects.lightsourceList.map((lightSource) => {
            const tmp = new OverviewEntry(
              "lightSource",
              lightSource,
              "bi-pencil-square",
              (e) => this.#updateSelection(lightSource, e),
            );
            tmp._selected = this.#picker
              .getSelectedObjects()
              .includes(lightSource);
            return tmp;
          }),
        )}
      </div>
    `;
  }
}
customElements.define("object-overview", Overview);

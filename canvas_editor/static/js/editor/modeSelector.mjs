import { Mode, Picker } from "picker";
import * as bootstrap from "bootstrap";

/**
 * Class to manage the mode switching in the editor mode of Canvas.
 * This class handles the selection of different modes by clicking on the tab buttons or
 * toggling through modes using a keyboard shortcut (Ctrl/Cmd + M).
 *
 * The class sets the mode in the Picker instance and updates the UI accordingly.
 */
export class ModeSelector {
  /** @type {"none" | "rotate" | "move"} */
  #mode = Mode.NONE;
  #picker;
  #tabButtons;

  /**
   * Creates a new mode selector instance.
   * @param {Picker} picker the picker in use
   */
  constructor(picker) {
    this.#picker = picker;
    this.#picker = picker;
    // Initialize the tab buttons for each mode from the HTML
    this.#tabButtons = {
      [Mode.NONE]: document.getElementById("modeSelect"),
      [Mode.MOVE]: document.getElementById("modeMove"),
      [Mode.ROTATE]: document.getElementById("modeRotate"),
    };
    this.#addEventListeners();
  }

  /**
   * Adds event listeners to the tab buttons and keyboard shortcuts.
   */
  #addEventListeners() {
    // Add event listeners to the tab buttons to switch modes when clicked
    this.#tabButtons[Mode.NONE].addEventListener("click", () =>
      this.#switchToMode(Mode.NONE),
    );
    this.#tabButtons[Mode.MOVE].addEventListener("click", () =>
      this.#switchToMode(Mode.MOVE),
    );
    this.#tabButtons[Mode.ROTATE].addEventListener("click", () =>
      this.#switchToMode(Mode.ROTATE),
    );

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        // handles the toggling of modes
        // by cycling through the modes in the order: NONE -> MOVE -> ROTATE
        const modes = [Mode.NONE, Mode.MOVE, Mode.ROTATE];
        const nextIndex = (modes.indexOf(this.#mode) + 1) % modes.length;
        this.#switchToMode(modes[nextIndex]);
      }
    });
  }

  /**
   * Switches the mode of the picker and updates the UI.
   * @param {string} mode the mode to switch to
   */
  #switchToMode(mode) {
    this.#mode = mode;
    this.#picker.setMode(mode);
    const button = this.#tabButtons[mode];
    if (button) {
      new bootstrap.Tab(button).show();
    }
  }
}

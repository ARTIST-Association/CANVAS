import { methodMustBeImplementedError } from "message_dict";
import { CommandPrompt } from "../commandPrompt.mjs";

/**
 * Parent class of all prompt commands
 */
export class PromptCommand extends HTMLElement {
  /**
   * The score of how good the current input of the command prompt matches the command.
   * Is used to filter and sort all of the currently available commands.
   * @type {number}
   */
  matchScore = 0;

  #commandName;

  /**
   * An array containing all the indices of the chars that should be highlighted
   * @type {number[] | null}
   */
  #selectedCharsIndices = null;
  #commandElem;
  #commandPrompt;

  /**
   * Creates a new prompt command
   * @param {string} name the name of the command
   * @param {CommandPrompt} commandPrompt the command prompt in use for this command
   * @param {string} [keybind] the keybinding of the command
   */
  constructor(name, commandPrompt, keybind = null) {
    super();
    this.#commandName = name;
    this.#commandPrompt = commandPrompt;
    this.classList.add("rounded-2", "p-1", "px-2", "d-flex", "justify-content-between", "align-items-center");
    this.style.cursor = "pointer";

    this.#commandElem = document.createElement("div");
    this.#commandElem.innerHTML = name;
    this.appendChild(this.#commandElem);

    if (keybind) {
      const keybindElem = document.createElement("div");
      keybindElem.innerHTML = keybind;
      keybindElem.classList.add("rounded-2", "border", "p-0", "px-2");
      keybindElem.style.fontSize = "80%";
      this.appendChild(keybindElem);
    }

    // execute on click
    this.addEventListener("click", () => {
      this.execute();
      this.#commandPrompt.hide();
    });

    // select this element on hover
    this.addEventListener("mousemove", () => {
      this.#commandPrompt.selectCommand(this.#commandPrompt.currentlyAvailableCommands.indexOf(this));
    });
  }

  /**
   * Returns the name of the command.
   * @returns {string} the name of the command
   */
  get commandName() {
    return this.#commandName;
  }

  /**
   * Set the indices for the chars that should be highlighted for the search functionality
   * @param {number[]} chars is an array of char indexes you want to be selected
   */
  set selectedCharsIndices(chars) {
    this.#selectedCharsIndices = chars;
  }

  /**
   * Calculates the new match score of this command.
   * @param {number[] | null} indices an array containing all the indices of the selected chars
   * by the searching algorithm.
   */
  calculateMatchScore(indices) {
    if (indices != null) {
      if (indices.length == 0) {
        this.matchScore = 0;
      } else if (indices.length == 1) {
        this.matchScore = 1;
      } else {
        this.matchScore = indices.at(-1) - indices[0];
      }
    }
  }

  /**
   * Makes all the characters specified by 'selectedChars' bold.
   */
  formatCommandName() {
    if (this.#selectedCharsIndices) {
      let formattedName = "";
      let lastIndex = 0;
      for (const index of this.#selectedCharsIndices) {
        formattedName += this.#commandName.slice(lastIndex, index);
        formattedName += `<b>${this.#commandName[index]}</b>`;
        lastIndex = index + 1;
      }
      formattedName += this.#commandName.slice(lastIndex);
      this.#commandElem.innerHTML = formattedName;
    } else {
      this.#commandElem.innerHTML = this.#commandName;
    }
  }

  /**
   * Selects this command (adds a background color).
   */
  select() {
    this.classList.add("bg-primary", "text-white");
    this.scrollIntoView({ block: "nearest" });
  }

  /**
   * Unselects this command (removes the background color).
   */
  unselect() {
    this.classList.remove("bg-primary", "text-white");
  }

  /**
   * Executes the prompt command.
   */
  execute() {
    throw new Error(methodMustBeImplementedError);
  }
}
customElements.define("prompt-command", PromptCommand);

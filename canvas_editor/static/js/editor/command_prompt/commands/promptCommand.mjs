import { methodMustBeImplementedError } from "message_dict";
import { CommandPrompt } from "../commandPrompt.mjs";

/**
 * Parent class of all prompt commands
 */
export class PromptCommand extends HTMLElement {
  #commandName;
  #occurrenceLength = null;
  /**
   * @type {number[]}
   */
  #selectedChars = null;
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
   * Returns the length of the occurrence that got selected by the searching algorithm.
   * @returns {number|null} the length of the occurrence or null if no occurrence got selected
   */
  get occurrenceLength() {
    return this.#occurrenceLength;
  }

  /**
   * Sets the length of the occurrence that got selected by the searching algorithm.
   * @param {number|null} length the length of the occurrence or null if no occurrence got selected
   */
  set occurrenceLength(length) {
    this.#occurrenceLength = length;
  }

  /**
   * Returns an array of all indexes of characters that got selected by the searching algorithm.
   * Use for highlighting them.
   * @param {number[]} chars is an array of char indexes you want to be selected
   */
  set selectedChars(chars) {
    this.#selectedChars = chars;
    if (this.#selectedChars !== null) {
      if (this.#selectedChars.length > 1) {
        this.#occurrenceLength = this.#selectedChars[this.#selectedChars.length - 1] - this.#selectedChars[0];
      } else {
        this.#occurrenceLength = 0;
      }
    }
  }

  /**
   * Makes all the characters specified by 'selectedChars' bold.
   */
  formatCommandName() {
    if (this.#selectedChars) {
      let formattedName = "";
      let lastIndex = 0;
      this.#selectedChars.forEach((index) => {
        formattedName += this.#commandName.slice(lastIndex, index);
        formattedName += `<b>${this.#commandName[index]}</b>`;
        lastIndex = index + 1;
      });
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

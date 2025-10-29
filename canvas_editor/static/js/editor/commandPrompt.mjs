import { Modal } from "bootstrap";
import { ObjectManager } from "objectManager";
import {
  LightModePromptCommand,
  DarkModePromptCommand,
  AutoModePromptCommand,
  AddHeliostatPromptCommand,
  AddReceiverPromptCommand,
  AddLightSourcePromptCommand,
  ToggleFullscreenPromptCommand,
  ExportProjectPromptCommand,
  RenderProjectPromptCommand,
  OpenSettingsPromptCommand,
  OpenJobInterfacePromptCommand,
  PromptCommand,
  OpenKeybindsPromptCommand,
  LogoutPromptCommand,
  NewProjectPromptCommand,
  OpenProjectPromptCommand,
} from "promptCommands";

/**
 * Manages the command prompt in the editor
 */
export class CommandPrompt {
  /**
   * @type {HTMLInputElement}
   */
  #commandInput;
  #commandListElem;
  /**
   * @type {PromptCommand[]}
   */
  #commandList = [];
  /**
   * @type {PromptCommand[]}
   */
  #currentlyAvailableCommands = [];
  #modal;
  #selectedIndex = 0;
  /**
   * @type {PromptCommand}
   */
  #selectedCommand;
  #objectManager;

  /**
   * Creates the new command prompt handler
   * @param {ObjectManager} objectManager the object manager for this scene
   */
  constructor(objectManager) {
    this.#commandListElem = document.getElementById("commandList");
    this.#modal = new Modal(document.getElementById("commandPrompt"));
    this.#objectManager = objectManager;

    this.#createInputField();

    // open and close the command prompt
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.code == "Space") {
        event.preventDefault();
        this.#openCommandPrompt();
      }
    });

    document
      .getElementById("commandPromptToggle")
      .addEventListener("click", () => {
        this.#openCommandPrompt();
      });

    // handle command navigation and execution
    document.addEventListener("keydown", (event) => {
      if (document.getElementById("commandPrompt").classList.contains("show")) {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          this.#selectedIndex =
            (this.#selectedIndex - 1 + this.#commandListElem.children.length) %
            this.#commandListElem.children.length;
          this.selectCommand();
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          this.#selectedIndex =
            (this.#selectedIndex + 1) % this.#commandListElem.children.length;
          this.selectCommand();
        }

        if (event.key === "Enter") {
          this.#modal.hide();
          if (this.#selectedCommand) {
            this.#selectedCommand.execute();
          }
        }
        if (event.key === "Escape") {
          this.#modal.hide();
        }
      }
    });

    // handle user input
    this.#commandInput.addEventListener("input", () => {
      this.#updateCommandPrompt();
    });

    this.#commandList = [
      new LightModePromptCommand(this),
      new DarkModePromptCommand(this),
      new AutoModePromptCommand(this),
      new AddHeliostatPromptCommand(this, this.#objectManager),
      new AddReceiverPromptCommand(this, this.#objectManager),
      new AddLightSourcePromptCommand(this, this.#objectManager),
      new ToggleFullscreenPromptCommand(this),
      new ExportProjectPromptCommand(this),
      new RenderProjectPromptCommand(this),
      new OpenSettingsPromptCommand(this),
      new OpenJobInterfacePromptCommand(this),
      new OpenKeybindsPromptCommand(this),
      new LogoutPromptCommand(this),
      new NewProjectPromptCommand(this),
      new OpenProjectPromptCommand(this),
    ];

    this.#commandList.sort((command1, command2) =>
      command1.commandName.localeCompare(command2.commandName),
    );
  }

  /**
   * Hide the command prompt
   */
  hide() {
    this.#modal.hide();
  }

  /**
   * Open the command prompt
   * Also closes all other modals
   */
  #openCommandPrompt() {
    // Prevent that the command prompt closes the loading modal
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal?.classList.contains("show")) {
      return;
    }

    // Close all other modals
    document.querySelectorAll(".modal.show").forEach((modal) => {
      if (modal !== document.getElementById("commandPrompt")) {
        Modal.getInstance(modal).hide();
      }
    });

    this.#modal.toggle();
    if (document.getElementById("commandPrompt").classList.contains("show")) {
      this.#commandInput.value = "";
      this.#commandListElem.innerHTML = "";
      this.#commandInput.focus();
      this.#currentlyAvailableCommands = this.#commandList;
      this.#currentlyAvailableCommands.forEach((command) => {
        command.occurrenceLength = null;
        command.selectedChars = null;
        this.#commandListElem.appendChild(command);
        command.formatCommandName();
      });
      this.#selectedIndex = 0;
      this.selectCommand();
    }
  }

  /**
   * Creates the input field for the command prompt
   */
  #createInputField() {
    this.#commandInput = document.createElement("input");
    this.#commandInput.classList.add("form-control", "border-0", "shadow-none");
    this.#commandInput.placeholder = "Select a command";
    document.getElementById("commandInput").appendChild(this.#commandInput);
  }

  /**
   * Selects the command specified by the selectedIndex
   * @param {number} selectedIndex - the index of the command to select
   */
  selectCommand(selectedIndex = this.#selectedIndex) {
    if (this.#selectedCommand) {
      this.#selectedCommand.unselect();
    }

    if (selectedIndex !== this.#selectedIndex) {
      this.#selectedIndex = selectedIndex;
    }

    //@ts-ignore
    this.#selectedCommand = this.#commandListElem.children[this.#selectedIndex];
    this.#selectedCommand.select();
  }

  /**
   * Updates the command prompt for the updated input given by the user.
   */
  #updateCommandPrompt() {
    this.#currentlyAvailableCommands = [];
    this.#commandListElem.innerHTML = "";

    // reset the values for each command
    this.#commandList.forEach((command) => {
      command.occurrenceLength = null;
      command.selectedChars = null;
    });

    // when no input is given -> render all commands
    if (this.#commandInput.value.length == 0) {
      this.#currentlyAvailableCommands = this.#commandList;
    } else {
      // calculate the new available commands
      this.#commandList.forEach((command) => {
        command.selectedChars = this.#calculateFirstOccurringInterval(
          this.#commandInput.value.toLowerCase(),
          command.commandName.toLowerCase(),
        );

        if (command.occurrenceLength !== null) {
          this.#currentlyAvailableCommands.push(command);
        }
      });

      this.#currentlyAvailableCommands.sort(
        (command1, command2) =>
          command1.occurrenceLength - command2.occurrenceLength,
      );
    }

    // render new available commands
    this.#currentlyAvailableCommands.forEach((command) => {
      this.#commandListElem.appendChild(command);
      command.formatCommandName();
    });

    if (this.#commandListElem.children.length > 0) {
      // select the new first element
      this.#selectedIndex = 0;
      this.selectCommand();
    } else {
      if (this.#selectedCommand) {
        this.#selectedCommand.unselect();
        this.#selectedCommand = null;
      }
      const noCommands = document.createElement("i");
      noCommands.classList.add("text-secondary");
      noCommands.innerHTML = "No matching commands available";

      this.#commandListElem.appendChild(noCommands);
    }
  }

  /**
   * Calculates the first occurring interval that contains all letters in the input in the correct order
   * @param {string} input the input
   * @param {string} compareTo the string you want to compare against
   * @returns {number[] | null} containing all the indexes of the letter in the 'compareTo' parameter, or null if no match is found
   */
  #calculateFirstOccurringInterval(input, compareTo) {
    const indexList = [];

    let lastSeenIndex = 0;

    for (const char of input) {
      const index = compareTo.indexOf(char, lastSeenIndex);
      if (index == -1) {
        return null;
      }
      lastSeenIndex = index + 1;
      indexList.push(index);
    }
    return indexList;
  }

  /**
   * Get the commands that are currently available
   * Means all commands that can be executed with the given search input
   * @returns {PromptCommand[]} array of all available commands
   */
  get currentlyAvailableCommands() {
    return this.#currentlyAvailableCommands;
  }
}

import { Modal } from "bootstrap";
import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

/**
 * Prompt command to create a new project
 */
export class OpenModalCommand extends PromptCommand {
  #modalId;
  #focusElementId;
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   * @param {string} name the name of the command
   * @param {string} modalId the id of the modal you want to open
   * @param {string} [focusElementId] the element you want to focus after opening
   */
  constructor(commandPrompt, name, modalId, focusElementId = null) {
    super(name, commandPrompt);
    this.#modalId = modalId;
    this.#focusElementId = focusElementId;
    console.log(this.#focusElementId);
  }

  /**
   * Executes the new project command.
   */
  execute() {
    const newProjectModal = new Modal(document.getElementById(this.#modalId));
    newProjectModal.show();

    if (this.#focusElementId) {
      document.getElementById("createNewProject").addEventListener("shown.bs.modal", () => {
        document.getElementById(this.#focusElementId).focus();
      });
    }
  }
}
customElements.define("open-modal-prompt-command", OpenModalCommand);

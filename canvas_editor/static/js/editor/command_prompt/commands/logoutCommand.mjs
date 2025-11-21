import { SaveAndLoadHandler } from "saveAndLoadHandler";
import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

/**
 * Prompt command to logout the user
 */
export class LogoutPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Logout", commandPrompt);
  }

  /**
   * Executes the logout command.
   */
  execute() {
    fetch(globalThis.location.origin + "/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
    }).then(() => {
      globalThis.location.href = globalThis.location.origin;
    });
  }
}
customElements.define("logout-prompt-command", LogoutPromptCommand);

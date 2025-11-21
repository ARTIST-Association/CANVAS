import { Modal } from "bootstrap";
import { SaveAndLoadHandler } from "saveAndLoadHandler";
import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

/**
 * Prompt command to open the new job pane to the current project
 */
export class ExportProjectPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Export project", commandPrompt);
  }

  /**
   * Executes the export project command.
   */
  execute() {
    let modal = new Modal(document.getElementById("loadingModal"));
    modal.show();

    const projectName = globalThis.location.pathname.split("/")[2];

    fetch(globalThis.location + "/download", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
    })
      .then((response) => {
        // Trigger file download after response
        return response.blob();
      })
      .then((data) => {
        let link = document.createElement("a");

        link.href = URL.createObjectURL(data);
        link.download = projectName + `.h5`;
        link.click();

        // After download, close modal and redirect
        modal.hide();
        globalThis.location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
        modal.hide();
      });
  }
}
customElements.define("export-project-prompt-command", ExportProjectPromptCommand);

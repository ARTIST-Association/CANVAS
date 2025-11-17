import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

/**
 * Prompt command to toggle fullscreen
 */
export class ToggleFullscreenPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Toggle fullscreen", commandPrompt, "F11");
  }

  /**
   * Executes the toggle fullscreen command.
   */
  execute() {
    if (navigator.userAgent.indexOf("Safari") > -1) {
      if (document.webkitFullscreenElement === null) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      return;
    }

    if (document.fullscreenElement === null) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
customElements.define("toggle-fullscreen-prompt-command", ToggleFullscreenPromptCommand);

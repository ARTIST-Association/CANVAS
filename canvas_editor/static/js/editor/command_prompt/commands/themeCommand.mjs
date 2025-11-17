import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

/**
 * Parent class for all theme related prompt commands
 */
export class ThemePromptCommand extends PromptCommand {
  #theme;
  /**
   * Create a new theme command
   * @param {CommandPrompt} commandPrompt the command prompt in use
   * @param {string} name the description of the command
   * @param {"light" | "dark" | "auto"} theme - The theme to set. Can be "light", "dark", or "auto".
   */
  constructor(commandPrompt, name, theme) {
    super(name, commandPrompt);
    this.#theme = theme;
  }

  /**
   * Executes the theme command.
   * @throws {Error} if the method is not implemented in a subclass
   */
  execute() {
    this.#setTheme(this.#theme);
  }

  /**
   * Sets the theme of the application
   * @param {"light" | "dark" | "auto"} theme - The theme to set. Can be "light", "dark", or "auto".
   */
  #setTheme(theme) {
    // store the theme
    localStorage.setItem("theme", theme);

    // update the theme
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
    } else {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }

    // update the settings
    const themeSelect = document.getElementById("theme-select");

    if (!themeSelect) {
      return;
    }

    switch (theme) {
      case "light":
        //@ts-ignore
        themeSelect.value = "light";
        break;
      case "dark":
        //@ts-ignore
        themeSelect.value = "dark";
        break;
      default:
        //@ts-ignore
        themeSelect.value = "auto";
        break;
    }
  }
}
customElements.define("theme-prompt-command", ThemePromptCommand);

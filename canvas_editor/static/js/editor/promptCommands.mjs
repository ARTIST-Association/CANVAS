import { Modal } from "bootstrap";
import { CommandPrompt } from "commandPrompt";
import { abstractClassError, methodMustBeImplementedError } from "message_dict";
import { ObjectManager } from "objectManager";
import { SaveAndLoadHandler } from "saveAndLoadHandler";

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
    this.classList.add(
      "rounded-2",
      "p-1",
      "px-2",
      "d-flex",
      "justify-content-between",
      "align-items-center",
    );
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
      this.#commandPrompt.selectCommand(
        this.#commandPrompt.currentlyAvailableCommands.indexOf(this),
      );
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
        this.#occurrenceLength =
          this.#selectedChars[this.#selectedChars.length - 1] -
          this.#selectedChars[0];
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

/**
 * Parent class for all theme related prompt commands
 */
export class ThemePromptCommand extends PromptCommand {
  /**
   * Create a new theme command
   * @param {string} description the description of the command
   * @param {CommandPrompt} commandPrompt the command prompt in use
   */
  constructor(description, commandPrompt) {
    if (new.target === ThemePromptCommand) {
      throw new Error(abstractClassError(ThemePromptCommand));
    }
    super(description, commandPrompt);
  }

  /**
   * Executes the theme command.
   * @throws {Error} if the method is not implemented in a subclass
   */
  execute() {
    throw new Error(methodMustBeImplementedError);
  }

  /**
   * Sets the theme of the application
   * @param {"light" | "dark" | "auto"} theme - The theme to set. Can be "light", "dark", or "auto".
   */
  setTheme(theme) {
    // store the theme
    localStorage.setItem("theme", theme);

    // update the theme
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
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

/**
 * Prompt command to enable light mode
 */
export class LightModePromptCommand extends ThemePromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Use light mode", commandPrompt);
  }

  /**
   * Executes the light mode command.
   */
  execute() {
    this.setTheme("light");
  }
}

/**
 * Prompt command to enable dark mode
 */
export class DarkModePromptCommand extends ThemePromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Use dark mode", commandPrompt);
  }

  /**
   * Executes the dark mode command.
   */
  execute() {
    this.setTheme("dark");
  }
}

/**
 * Prompt command to enable auto mode
 */
export class AutoModePromptCommand extends ThemePromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Adapt theme to system theme", commandPrompt);
  }

  /**
   * Executes the auto mode command.
   */
  execute() {
    this.setTheme("auto");
  }
}

/**
 * Prompt command to add a heliostat to the scene
 */
export class AddHeliostatPromptCommand extends PromptCommand {
  #objectManager;
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   * @param {ObjectManager} objectManager - The ObjectManager instance to manage the creation of objects.
   */
  constructor(commandPrompt, objectManager) {
    super("Add heliostat", commandPrompt);
    this.#objectManager = objectManager;
  }

  /**
   * Executes the add heliostat command.
   */
  execute() {
    this.#objectManager.createHeliostat();
  }
}

/**
 * Prompt command to add a receiver to the scene
 */
export class AddReceiverPromptCommand extends PromptCommand {
  #objectManager;
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   * @param {ObjectManager} objectManager - The ObjectManager instance to manage the creation of objects.
   */
  constructor(commandPrompt, objectManager) {
    super("Add receiver", commandPrompt);
    this.#objectManager = objectManager;
  }

  /**
   * Executes the add receiver command.
   */
  execute() {
    this.#objectManager.createReceiver();
  }
}

/**
 * Prompt command to add a light source to the scene
 */
export class AddLightSourcePromptCommand extends PromptCommand {
  #objectManager;
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   * @param {ObjectManager} objectManager - The ObjectManager instance to manage the creation of objects.
   */
  constructor(commandPrompt, objectManager) {
    super("Add light source", commandPrompt);
    this.#objectManager = objectManager;
  }

  /**
   * Executes the add light source command.
   */
  execute() {
    this.#objectManager.createLightSource();
  }
}

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

    const projectName = window.location.pathname.split("/")[2];

    fetch(window.location + "/download", {
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
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
        modal.hide();
      });
  }
}

/**
 * Prompt command to render the current project
 */
export class RenderProjectPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Render project", commandPrompt);
  }

  /**
   * Executes the render project command.
   */
  execute() {
    const jobModal = new Modal(document.getElementById("startJobModal"));
    jobModal.show();

    document
      .getElementById("startJobModal")
      .addEventListener("shown.bs.modal", () => {
        document.getElementById("createNewJob").focus();
      });
  }
}

/**
 * Prompt command to open the settings pane
 */
export class OpenSettingsPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Open settings", commandPrompt);
  }

  /**
   * Executes the open settings command.
   */
  execute() {
    globalThis.location.href = "/settings/change_username";
  }
}

/**
 * Prompt command to open the job interface pane
 */
export class OpenJobInterfacePromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Open job interface", commandPrompt);
  }

  /**
   * Executes the open job interface command.
   */
  execute() {
    const jobInterfaceModal = new Modal(
      document.getElementById("jobInterface"),
    );
    jobInterfaceModal.show();

    document
      .getElementById("jobInterface")
      .addEventListener("shown.bs.modal", () => {
        document.getElementById("createNewJob").focus();
      });
  }
}

/**
 * Prompt command to open the keybindings help page
 */
export class OpenKeybindsPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Open keybindings help page", commandPrompt);
  }

  /**
   * Executes the open keybindings command.
   */
  execute() {
    const keybindingsModal = new Modal(
      document.getElementById("keyboardModal"),
    );
    keybindingsModal.show();
  }
}

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
    fetch(globalThis.location.origin + "/accounts/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
    }).then(() => {
      globalThis.location.href = "/accounts/login";
    });
  }
}

/**
 * Prompt command to create a new project
 */
export class NewProjectPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Create new project", commandPrompt);
  }

  /**
   * Executes the new project command.
   */
  execute() {
    const newProjectModal = new Modal(
      document.getElementById("createNewProject"),
    );
    newProjectModal.show();

    document
      .getElementById("createNewProject")
      .addEventListener("shown.bs.modal", () => {
        document.getElementById("id_name").focus();
      });
  }
}

/**
 * Prompt command to open an existing project
 */
export class OpenProjectPromptCommand extends PromptCommand {
  /**
   * Create this prompt command
   * @param {CommandPrompt} commandPrompt the command prompt that handles this command
   */
  constructor(commandPrompt) {
    super("Open exisiting project", commandPrompt);
  }

  /**
   * Executes the open project command.
   */
  execute() {
    const newProjectModal = new Modal(document.getElementById("openProject"));
    newProjectModal.show();
  }
}

// define the new HTML elements
customElements.define("light-mode-prompt-command", LightModePromptCommand);
customElements.define("dark-mode-prompt-command", DarkModePromptCommand);
customElements.define("auto-mode-prompt-command", AutoModePromptCommand);
customElements.define(
  "add-heliostat-prompt-command",
  AddHeliostatPromptCommand,
);
customElements.define("add-receiver-prompt-command", AddReceiverPromptCommand);
customElements.define(
  "add-light-source-prompt-command",
  AddLightSourcePromptCommand,
);
customElements.define(
  "toggle-fullscreen-prompt-command",
  ToggleFullscreenPromptCommand,
);
customElements.define(
  "export-project-prompt-command",
  ExportProjectPromptCommand,
);
customElements.define(
  "render-project-prompt-command",
  RenderProjectPromptCommand,
);
customElements.define(
  "open-settings-prompt-command",
  OpenSettingsPromptCommand,
);
customElements.define(
  "open-job-interface-prompt-command",
  OpenJobInterfacePromptCommand,
);
customElements.define(
  "open-keybings-prompt-command",
  OpenKeybindsPromptCommand,
);
customElements.define("logout-prompt-command", LogoutPromptCommand);
customElements.define("new-project-prompt-command", NewProjectPromptCommand);
customElements.define("open-project-prompt-command", OpenProjectPromptCommand);

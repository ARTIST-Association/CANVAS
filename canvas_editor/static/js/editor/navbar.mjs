import { ObjectManager } from "objectManager";
/**
 * Manages the navigation bar in the editor on the top of the page.
 * and handles the functionality of the buttons in the navbar.
 */

/**
 * Class representing the navigation bar in the editor.
 */
export class Navbar {
  #objectManager;

  /**
   * Creates a new Navbar instance.
   * @param {ObjectManager} objectManager - The ObjectManager instance that manages the objects in the scene.
   */
  constructor(objectManager) {
    this.#objectManager = objectManager;

    this.#setupFullscreen();
    this.#setUpObjectPlacement();
    this.#setupFileOptions();
    this.#setUpKeybindings();
  }

  /**
   * Sets up the fullscreen functionality for the navbar.
   * This method adds an event listener to the fullscreen button
   */
  #setupFullscreen() {
    let fullscreen = document.getElementById("fullscreen");

    // Safari
    if (navigator.userAgent.indexOf("Safari") > -1) {
      /**
       * Handles the click event for the fullscreen button.
       * @param {MouseEvent} _ - The click event
       */
      fullscreen.onclick = (
        /* eslint-disable-next-line no-unused-vars */
        _,
      ) => {
        if (document.webkitFullscreenElement === null) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      };
      return;
    }

    /**
     * Handles the click event for the fullscreen button.
     * @param {MouseEvent} _ - The click event
     */
    fullscreen.onclick = (_) => {
      if (document.fullscreenElement === null) {
        _ = document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        _ = document.exitFullscreen(); // eslint-disable-line no-unused-vars -- disabling unused variable warning
      }
    };
  }

  /**
   * Sets up the file options modal functionality.
   * This method adds an event listener to the create new project modal
   */
  #setupFileOptions() {
    let createNewProject = document.getElementById("createNewProject");

    /**
     * Resets the form fields in the create new project modal.
     */
    function resetModalForm() {
      const form = createNewProject.querySelector("form");
      form.reset();
    }

    // ensure that the form is reset when the modal is closed
    createNewProject.addEventListener("hidden.bs.modal", function () {
      resetModalForm();
    });

    window.addEventListener("load", resetModalForm);
  }

  /**
   * Method to add event listeners to the buttons on the bottom bar for object placement.
   * This method sets up the buttons for creating heliostats, receivers, and light sources.
   */
  #setUpObjectPlacement() {
    // Define the buttons and their corresponding actions
    /** @type {[string, Function][]} */
    const buttons = [
      ["add-heliostat-nav-bar", this.#objectManager.createHeliostat],
      ["add-receiver-nav-bar", this.#objectManager.createReceiver],
      ["add-lightSource-nav-bar", this.#objectManager.createLightSource],
    ];

    buttons.forEach(([id, action]) => {
      // Get the button by its ID and add a click event listener
      // If the button is not found, log a warning
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => action.call(this.#objectManager));
      } else {
        console.warn(`Navbar: Button "${id}" not found.`);
      }
    });
  }

  /**
   * Sets up the keybindings modal functionality.
   * This method adds an event listener to the client select drop-down-menu
   * and updates the content based on the selected client type.
   */
  #setUpKeybindings() {
    const select = document.getElementById("clientSelect");
    const content = document.getElementById("clientContent");

    /**
     * Resets the form fields in the keybindings modal.
     */
    function resetModalForm() {
      select.value = "";
      content.innerHTML = "";
    }

    window.addEventListener("load", resetModalForm);

    select.addEventListener("change", () => {
      if (select.value === "mac") {
        content.innerHTML = document.getElementById("macKeybindings").innerHTML;
      } else if (select.value === "other") {
        content.innerHTML =
          document.getElementById("windowsKeybindings").innerHTML;
      } else {
        content.innerHTML = "";
      }
    });
  }
}

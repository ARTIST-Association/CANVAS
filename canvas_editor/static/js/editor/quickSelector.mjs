import { ObjectManager } from "objectManager";

/**
 * Manages the quick selector menu in the editor on the bottom of the page.
 * This class handles the creation of objects like heliostats, receivers, and light sources
 */

/**
 * Class representing the quick selector menu in the editor.
 */
export class QuickSelector {
  #objectManager;

  /**
   * Creates a new quick selector menu.
   * @param {ObjectManager} objectManager - The ObjectManager instance to manage the creation of objects.
   */
  constructor(objectManager) {
    this.#objectManager = objectManager;

    this.#addEventlisteners();
  }

  /**
   * Method to add event listeners to the buttons on the Quick Settings bar on the bottom of the page.
   */
  #addEventlisteners() {
    // Define the buttons and their corresponding actions
    /** @type {[string, Function][]} */
    const buttons = [
      ["quickSettingsHeliostat", this.#objectManager.createHeliostat],
      ["quickSettingsReceiver", this.#objectManager.createReceiver],
      ["quickSettingsLightsource", this.#objectManager.createLightSource],
    ];

    buttons.forEach(([id, action]) => {
      // Get the button by its ID and add a click event listener
      // If the button is not found, log a warning
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => action.call(this.#objectManager));
      } else {
        console.warn(`QuickSelector: Button "${id}" not found.`);
      }
    });
  }
}

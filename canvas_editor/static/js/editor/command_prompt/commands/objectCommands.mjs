import { ObjectManager } from "objectManager";
import { CommandPrompt } from "../commandPrompt.mjs";
import { PromptCommand } from "./promptCommand.mjs";

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
customElements.define("add-heliostat-prompt-command", AddHeliostatPromptCommand);

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
customElements.define("add-receiver-prompt-command", AddReceiverPromptCommand);

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
customElements.define("add-light-source-prompt-command", AddLightSourcePromptCommand);

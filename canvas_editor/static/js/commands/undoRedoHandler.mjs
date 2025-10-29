import { Command } from "command";

/**
 * This class manages the execution of commands and provides undo/redo functionality.
 * It maintains two stacks to keep track of executed and undone commands, allowing users to reverse or reapply actions seamlessly.
 */
export class UndoRedoHandler {
  /** @type {UndoRedoHandler} */
  static #instance;

  /**
   * A stack that stores commands that have been executed.
   * The stack has a maximum size of 100 commands, and any excess commands will result in the oldest commands
   * being removed to make room for new ones.
   * @type {Array<Command>}
   */
  #undoStack;
  /**
   * A stack that stores commands that have been undone.
   * The stack has a maximum size of 100 commands, and any excess commands will result in the oldest commands
   * being removed to make room for new ones.
   * @type {Array<Command>}
   */
  #redoStack;

  /**
   * Initializes a new instance of the UndoRedoHandler class.
   * Sets up the undo and redo stacks with a maximum size of 100 commands each.
   */
  constructor() {
    if (UndoRedoHandler.#instance) {
      throw new Error("Can not create class directly, use getInstance instead");
    }
    UndoRedoHandler.#instance = this;

    this.#undoStack = [];
    this.#redoStack = [];
    this.#initializeKeyBindings();
    this.#initializeButtons();
  }

  /**
   * Gets the current instance of the undo redo handler in use
   * @returns {UndoRedoHandler} the udno redo handler in use
   */
  static getInstance() {
    if (!UndoRedoHandler.#instance) {
      UndoRedoHandler.#instance = new UndoRedoHandler();
    }
    return UndoRedoHandler.#instance;
  }

  /**
   * Executes the command, performing the associated action. After execution, the command is added to the undoStack
   * Side effect: The redoStack is cleared, as executing a new command invalidates any previous redo history.
   * @param {Command} command - The command to execute.
   */
  executeCommand(command) {
    command.execute();
    this.#undoStack.push(command);
    if (this.#undoStack.length > 100) {
      this.#undoStack.shift();
    }
    this.#redoStack = [];
  }

  /**
   * Reverts the most recent action by invoking the undo method of the command at the top of the undoStack.
   */
  undo() {
    if (this.#undoStack.length > 0) {
      const command = this.#undoStack.pop();
      command.undo();
      this.#redoStack.push(command);
      if (this.#redoStack.length > 100) {
        this.#redoStack.shift();
      }
    }
  }

  /**
   * Re-applies the most recently undone action by invoking the execute method of the command at the
   * top of the redoStack.
   */
  redo() {
    if (this.#redoStack.length > 0) {
      const command = this.#redoStack.pop();
      command.execute();
      this.#undoStack.push(command);
      if (this.#undoStack.length > 100) {
        this.#undoStack.shift();
      }
    }
  }

  /**
   * Initializes key bindings for undo and redo commands.
   */
  #initializeKeyBindings() {
    document.addEventListener("keydown", (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        this.undo();
      } else if (
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key.toLowerCase() === "z") ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        this.redo();
      }
    });
  }

  /**
   * Creates listeners for the undo and redo buttons to execute the undo and redo function.
   */
  #initializeButtons() {
    document.getElementById("undo").addEventListener("click", () => {
      this.undo();
    });

    document.getElementById("redo").addEventListener("click", () => {
      this.redo();
    });
  }
}

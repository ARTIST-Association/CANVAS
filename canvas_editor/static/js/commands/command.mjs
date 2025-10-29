import { abstractClassError } from "message_dict";

/**
 * This class serves as a base class for all specific command types.
 * It defines the structure for executing and undoing actions within the system.
 * Subclasses extend this class to implement the unique logic for each specific command.
 * @throws {Error} When the method is not implemented by a subclass.
 */

/**
 * Interface describing a command in it's raw form.
 */
export class Command {
  /**
   * Initializes a new instance of the Command class.
   * Throws an error if an attempt is made to instantiate the abstract class directly.
   * @throws {Error} When attempting to instantiate the abstract class directly.
   */
  constructor() {
    if (new.target === Command) {
      throw new Error(abstractClassError(Command));
    }
  }

  /**
   * Performs the specific action defined by the command.
   * Subclasses implement this method to execute their unique logic.
   * @throws {Error} When the method is not implemented by a subclass.
   */
  execute() {
    throw new Error(
      "Abstract method 'execute' must be implemented by subclass",
    );
  }

  /**
   * Reverts the action performed by the 'execute()' method.
   * Subclasses implement this method to define the logic required to undo the operation.
   * @throws {Error} When the method is not implemented by a subclass.
   */
  undo() {
    throw new Error("Abstract method 'undo' must be implemented by subclass");
  }
}

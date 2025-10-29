/**
 * Function to generate an error message when trying to instantiate an abstract class
 * @param {Function} cls The class that is abstract and should not be instantiated directly
 * @returns {string} message an error message
 */
export function abstractClassError(cls) {
  return `Cannot instantiate abstract class ${cls.name} directly`;
}
export const methodMustBeImplementedError =
  "This method must be implemented in all subclasses";
export const invalidCompassStyleError = "Invalid compass style specified";
export const projectIdRequiredError =
  "When executing get instance for the first time the project id is needed";
export const errorUploadingFile = "Error uploading file:";

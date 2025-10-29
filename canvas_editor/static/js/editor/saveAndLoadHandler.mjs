import { Heliostat } from "heliostat";
import { LightSource } from "lightSource";
import { projectIdRequiredError } from "message_dict";
import { Receiver } from "receiver";

/**
 * Provides a wrapper for the API
 * Contains a methods for every database manipulation needed.
 */
export class SaveAndLoadHandler {
  /** @type {SaveAndLoadHandler} */
  static #instance;
  #projectID;
  #baseAPIUrl;

  /**
   * Creates a saveAndLoadHandler or returns the existing one
   * @param {number} [projectId] the projectID for api requests.
   */
  constructor(projectId = null) {
    if (SaveAndLoadHandler.#instance) {
      throw new Error("Cannot create class directly, use getInstance instead");
    }
    SaveAndLoadHandler.#instance = this;
    this.#projectID = projectId;
    this.#baseAPIUrl = window.location.origin + "/api/";
  }

  /**
   * Gets the current saveAndLoadHandler instance in use
   * @param {number} [projectId] the id of the project, only needed for the first instantiation
   * @returns {SaveAndLoadHandler} the saveAndLoadHandler in use
   */
  static getInstance(projectId = null) {
    if (!SaveAndLoadHandler.#instance) {
      if (!projectId) {
        throw new Error(projectIdRequiredError);
      }
      SaveAndLoadHandler.#instance = new SaveAndLoadHandler(projectId);
    }
    return SaveAndLoadHandler.#instance;
  }

  /**
   * Returns a JSON representation of the project defined by the project_id
   * @returns {Promise<JSON>} A JSON representation of the project
   */
  async getProjectData() {
    const url = this.#baseAPIUrl + "projects/" + this.#projectID;
    return this.#makeApiCall(url, "GET");
  }

  /**
   * Creates a database entry for the given heliostat
   * @param {Heliostat} heliostat Is the heliostat you want an entry for
   * @returns {Promise<JSON>} JSON representation of the new heliostat.
   */
  async createHeliostat(heliostat) {
    const url =
      this.#baseAPIUrl + "projects/" + this.#projectID + "/heliostats/";

    const body = {
      name: heliostat.objectName,
      position_x: heliostat.position.x,
      position_y: heliostat.position.y,
      position_z: heliostat.position.z,
    };

    return this.#makeApiCall(url, "POST", body);
  }

  /**
   * Creates a database entry for the given receiver
   * @param {Receiver} receiver Is the receiver you want an entry for
   * @returns {Promise<JSON>} JSON representation of the new receiver.
   */
  async createReceiver(receiver) {
    const url =
      this.#baseAPIUrl + "projects/" + this.#projectID + "/receivers/";

    const body = {
      name: receiver.objectName,
      position_x: receiver.lastPosition.x,
      position_y: receiver.lastPosition.y,
      position_z: receiver.lastPosition.z,
      normal_x: receiver.normalVector.x,
      normal_y: receiver.normalVector.y,
      normal_z: receiver.normalVector.z,
      curvature_e: receiver.curvatureE,
      curvature_u: receiver.curvatureU,
      plane_e: receiver.planeE,
      plane_u: receiver.planeU,
      resolution_e: receiver.resolutionE,
      resolution_u: receiver.resolutionU,
    };

    return this.#makeApiCall(url, "POST", body);
  }

  /**
   * Creates a database entry for the given light source
   * @param {LightSource} lightSource Is the light source you want an entry for
   * @returns {Promise<JSON>} JSON representation of the new light source.
   */
  async createLightSource(lightSource) {
    const url =
      this.#baseAPIUrl + "projects/" + this.#projectID + "/light_sources/";

    const body = {
      name: lightSource.objectName,
      number_of_rays: lightSource.numberOfRays,
      lightsource_type: lightSource.lightSourceType,
      distribution_type: lightSource.distributionType,
      mean: lightSource.distributionMean,
      covariance: lightSource.distributionCovariance,
    };

    return this.#makeApiCall(url, "POST", body);
  }

  // Object deletion
  /**
   * Deletes the given heliostat from the backend
   * @param {Heliostat} heliostat Is the heliostat you want to delete
   * @returns {Promise<JSON>} Resolves when the heliostat is deleted
   */
  async deleteHeliostat(heliostat) {
    if (!heliostat.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/heliostats/" +
      heliostat.apiID +
      "/";

    return this.#makeApiCall(url, "DELETE");
  }

  // Object deletion
  /**
   * Deletes the given receiver from the backend
   * @param {Receiver} receiver Is the receiver you want to delete
   * @returns {Promise<JSON>} Resolves when the receiver is deleted
   */
  async deleteReceiver(receiver) {
    if (!receiver.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/receivers/" +
      receiver.apiID +
      "/";

    return this.#makeApiCall(url, "DELETE");
  }

  // Object deletion
  /**
   * Deletes the given light source from the backend
   * @param {LightSource} lightSource Is the light source you want to delete
   * @returns {Promise<JSON>} Resolves when the light source is deleted
   */
  async deleteLightsource(lightSource) {
    if (!lightSource.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/light_sources/" +
      lightSource.apiID +
      "/";

    return this.#makeApiCall(url, "DELETE");
  }

  // Object updating
  /**
   * Updates the given heliostat in the backend
   * @param {Heliostat} heliostat Is the updated heliostat from the frontend
   * @returns {Promise<JSON>} JSON representation of the updated heliostat
   */
  async updateHeliostat(heliostat) {
    if (!heliostat.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/heliostats/" +
      heliostat.apiID +
      "/";

    const body = {
      id: heliostat.apiID,
      name: heliostat.objectName,
      position_x: heliostat.position.x,
      position_y: heliostat.position.y,
      position_z: heliostat.position.z,
    };

    return this.#makeApiCall(url, "PUT", body);
  }

  /**
   * Updates the given receiver in the backend
   * @param {Receiver} receiver Is the updated receiver from the frontend
   * @returns {Promise<JSON>} JSON representation of the updated receiver
   */
  async updateReceiver(receiver) {
    if (!receiver.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/receivers/" +
      receiver.apiID +
      "/";

    const body = {
      id: receiver.apiID,
      name: receiver.objectName,
      receiver_type: receiver.towerType,
      position_x: receiver.lastPosition.x,
      position_y: receiver.lastPosition.y,
      position_z: receiver.lastPosition.z,
      normal_x: receiver.normalVector.x,
      normal_y: receiver.normalVector.y,
      normal_z: receiver.normalVector.z,
      curvature_e: receiver.curvatureE,
      curvature_u: receiver.curvatureU,
      plane_e: receiver.planeE,
      plane_u: receiver.planeU,
      resolution_e: receiver.resolutionE,
      resolution_u: receiver.resolutionU,
    };

    return this.#makeApiCall(url, "PUT", body);
  }

  /**
   * Updates the given light source in the backend
   * @param {LightSource} lightSource Is the updated light source from the frontend
   * @returns {Promise<JSON>} JSON representation of the updated light source
   */
  async updateLightsource(lightSource) {
    if (!lightSource.apiID) {
      return;
    }

    const url =
      this.#baseAPIUrl +
      "projects/" +
      this.#projectID +
      "/light_sources/" +
      lightSource.apiID +
      "/";

    const body = {
      id: lightSource.apiID,
      name: lightSource.objectName,
      number_of_rays: lightSource.numberOfRays,
      lightsource_type: lightSource.lightSourceType,
      distribution_type: lightSource.distributionType,
      mean: lightSource.distributionMean,
      covariance: lightSource.distributionCovariance,
    };

    return this.#makeApiCall(url, "PUT", body);
  }

  // Settings updating
  /**
   * Updates the settings according to the given changes
   * @param {string} attribute the attribute you want to change
   * @param {any} newValue the new value of the attribute
   * @returns {Promise<JSON>} JSON of all the project settings
   */
  async updateSettings(attribute, newValue) {
    const url = this.#baseAPIUrl + "projects/" + this.#projectID + "/settings/";

    const body = {
      [attribute]: newValue,
    };

    return this.#makeApiCall(url, "PUT", body);
  }

  /**
   * Utility function that gets the cookie specified by the name
   * @param {string} name The name of the cookie you want to get.
   * @returns {string|null} the cookie or null if it couldn't be found.
   */
  static getCookie(name) {
    if (!document.cookie) {
      return null;
    }

    // document.cookie is a key=value list separated by ';'
    const xsrfCookies = document.cookie
      .split(";")
      .map((c) => c.trim())
      //filter the right cookie name
      .filter((c) => c.startsWith(name + "="));

    if (xsrfCookies.length === 0) {
      return null;
    }
    // return the decoded value of the first cookie found
    return decodeURIComponent(xsrfCookies[0].split("=")[1]);
  }

  /**
   * Wrapper function for an standard api call
   * @param {string} endpoint The endpoint to make the api call to
   * @param {"PUT" | "POST" | "GET" | "DELETE"} method The method you want to use
   * @param {any} [body] the body for the api call
   * @returns {Promise<JSON>} the response of the api call as JSON
   */
  async #makeApiCall(endpoint, method, body) {
    return fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => console.log(error.message));
  }
}

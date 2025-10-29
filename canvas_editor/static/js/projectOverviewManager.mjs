/**
 * Handles the project overview page
 */
export class ProjectOverviewManager {
  /**
   * Create the project overview manager
   */
  constructor() {
    // handle all favorite buttons
    for (const button of document.querySelectorAll(".favoriteButton")) {
      button.addEventListener("click", () => {
        this.#toggleFavorite(button);
      });
    }

    this.#handleFavoriteFilter();
  }

  /**
   * Toggles the favorite setting for the given button
   * @param {HTMLElement} favoriteButton - The button that was clicked to toggle the favorite state
   */
  #toggleFavorite(favoriteButton) {
    const projectName = favoriteButton.dataset.projectName;
    const isFavorite = favoriteButton.dataset.isFavorite;

    if (isFavorite == "True") {
      favoriteButton.dataset.isFavorite = "False";
      const projectElement = favoriteButton.closest(".project");
      projectElement.dataset.isFavorite = "False";
      favoriteButton.children[0].classList.remove(
        "bi-star-fill",
        "text-warning",
      );
      favoriteButton.children[0].classList.add("bi-star");
    } else if (isFavorite == "False") {
      favoriteButton.dataset.isFavorite = "True";
      const projectElement = favoriteButton.closest(".project");
      projectElement.dataset.isFavorite = "True";
      favoriteButton.children[0].classList.remove("bi-star");
      favoriteButton.children[0].classList.add("bi-star-fill", "text-warning");
    } else {
      throw new Error(`invalid favorite state for project ${projectName}`);
    }
    fetch(globalThis.location + "toggle_favor/" + projectName, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.#getCookie("csrftoken"),
      },
    });
  }

  /**
   * Handle the favorite filtering functionality
   */
  #handleFavoriteFilter() {
    const favoriteSwitchWrapper = document.createElement("div");
    favoriteSwitchWrapper.classList.add(
      "form-check",
      "form-switch",
      "position-relative",
      "mx-auto",
    );
    const favoriteSwitch = document.createElement("input");
    favoriteSwitch.classList.add("form-check-input");
    favoriteSwitch.type = "checkbox";
    favoriteSwitch.role = "switch";
    favoriteSwitch.id = "favoriteSwitch";

    const favoriteSwitchLabel = document.createElement("label");
    favoriteSwitchLabel.classList.add("form-check-label");
    favoriteSwitchLabel.setAttribute("for", "favoriteSwitch");
    favoriteSwitchLabel.innerHTML = "Only favorites";

    favoriteSwitchWrapper.appendChild(favoriteSwitch);
    favoriteSwitchWrapper.appendChild(favoriteSwitchLabel);

    document
      .getElementById("projectList")
      .insertBefore(
        favoriteSwitchWrapper,
        document.getElementById("projectList").children[0],
      );

    favoriteSwitch.addEventListener("change", () => {
      for (const project of document.querySelectorAll(".project")) {
        if (favoriteSwitch.checked && project.dataset.isFavorite == "False") {
          project.classList.add("d-none");
          project.classList.remove("d-block");
        } else {
          project.classList.add("d-block");
          project.classList.remove("d-none");
        }
      }
    });
  }

  /**
   * Gets the cookie specified by the name
   * @param {string} name The name of the cookie you want to get.
   * @returns {string|null} the cookie or null if it couldn't be found.
   */
  #getCookie(name) {
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
}

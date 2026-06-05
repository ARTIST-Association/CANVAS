import { getCookie } from "@/core/csrf";

/**
 * Behaviour for the project list page: toggling a project's favorite state
 * (optimistic UI + POST) and a "only favorites" filter switch.
 */
export class ProjectOverview {
  constructor() {
    document
      .querySelectorAll<HTMLElement>(".favoriteButton")
      .forEach((button) => button.addEventListener("click", () => this.#toggleFavorite(button)));
    this.#addFavoriteFilter();
  }

  #toggleFavorite(button: HTMLElement): void {
    const name = button.dataset.projectName;
    if (!name) {
      return;
    }
    const next = button.dataset.isFavorite !== "True";
    const flag = next ? "True" : "False";
    button.dataset.isFavorite = flag;
    const card = button.closest<HTMLElement>(".project");
    if (card) {
      card.dataset.isFavorite = flag;
    }
    const icon = button.querySelector("i");
    if (icon) {
      icon.className = next ? "bi bi-star-fill text-warning" : "bi bi-star";
    }

    void fetch(`${window.location.origin}/projects/toggle_favor/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") ?? "" },
    });
  }

  #addFavoriteFilter(): void {
    const list = document.getElementById("projectList");
    if (!list || list.querySelector("#favoriteSwitch")) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "form-check form-switch position-relative mx-auto";
    wrapper.innerHTML = `
      <input class="form-check-input" type="checkbox" role="switch" id="favoriteSwitch">
      <label class="form-check-label" for="favoriteSwitch">Only favorites</label>`;
    list.insertBefore(wrapper, list.firstChild);

    const toggle = wrapper.querySelector("input") as HTMLInputElement;
    toggle.addEventListener("change", () => {
      document.querySelectorAll<HTMLElement>(".project").forEach((project) => {
        // Cards render data-is-favorite="True"/"False" (Django booleans).
        const show = !toggle.checked || project.dataset.isFavorite === "True";
        project.classList.toggle("d-none", !show);
      });
    });
  }
}

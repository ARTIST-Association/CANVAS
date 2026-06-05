import { Modal } from "bootstrap";
import { getCookie } from "@/core/csrf";

interface JobStatus {
  jobID: number;
  status: string;
  progress: number;
  result: string | null;
}

interface JobRow {
  status: HTMLElement;
  bar: HTMLElement;
  result: HTMLAnchorElement;
  finished: boolean;
}

const POLL_INTERVAL_MS = 5000;

/**
 * Modal for managing render jobs for the current project: list existing jobs,
 * create a new one, poll status/progress, view the result and delete. The
 * backend job runner is currently mocked.
 */
export class JobInterface {
  readonly #baseUrl: string;
  readonly #modal: Modal;
  readonly #body: HTMLElement;
  readonly #jobs = new Map<number, JobRow>();
  #pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(projectId: number) {
    this.#baseUrl = `${window.location.origin}/jobs/${projectId}/`;

    const element = document.createElement("div");
    element.className = "modal fade";
    element.tabIndex = -1;
    element.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Render jobs</h5>
            <button type="button" class="btn btn-primary btn-sm ms-auto me-2" data-role="create">
              <i class="bi bi-plus-lg"></i> New job
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body d-flex flex-column gap-2" data-role="body"></div>
        </div>
      </div>`;
    document.body.appendChild(element);
    this.#modal = new Modal(element);
    this.#body = element.querySelector('[data-role="body"]') as HTMLElement;
    (element.querySelector('[data-role="create"]') as HTMLElement).addEventListener("click", () => void this.#createJob());

    element.addEventListener("shown.bs.modal", () => {
      void this.#refresh();
      this.#pollTimer = setInterval(() => void this.#refresh(), POLL_INTERVAL_MS);
    });
    element.addEventListener("hidden.bs.modal", () => {
      if (this.#pollTimer !== null) {
        clearInterval(this.#pollTimer);
        this.#pollTimer = null;
      }
    });

    void this.#loadJobs();
  }

  open(): void {
    this.#modal.show();
  }

  #headers(): HeadersInit {
    return { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") ?? "" };
  }

  async #loadJobs(): Promise<void> {
    try {
      const response = await fetch(this.#baseUrl, { headers: this.#headers() });
      const data: { jobIDs: number[] } = await response.json();
      data.jobIDs.forEach((id) => this.#addJobRow(id));
      this.#renderEmptyState();
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  }

  async #createJob(): Promise<void> {
    try {
      const response = await fetch(this.#baseUrl, { method: "POST", headers: this.#headers() });
      const data: { jobID: number } = await response.json();
      this.#addJobRow(data.jobID);
      void this.#refresh();
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  }

  async #refresh(): Promise<void> {
    await Promise.all(
      [...this.#jobs.entries()]
        .filter(([, row]) => !row.finished)
        .map(async ([id, row]) => {
          try {
            const response = await fetch(`${this.#baseUrl}${id}`, { headers: this.#headers() });
            const data: JobStatus = await response.json();
            row.status.textContent = `Status: ${data.status}`;
            row.bar.style.width = `${Math.round(data.progress * 100)}%`;
            if (data.progress >= 1 && data.result) {
              row.result.href = window.location.origin + data.result;
              row.result.classList.remove("d-none");
              row.finished = true;
            }
          } catch (error) {
            console.error("Failed to fetch job status:", error);
          }
        }),
    );
  }

  #addJobRow(id: number): void {
    if (this.#jobs.has(id)) {
      return;
    }
    const row = document.createElement("div");
    row.className = "rounded-3 bg-body-secondary d-flex p-2 gap-2 align-items-center";
    row.innerHTML = `
      <div class="fw-bold text-nowrap">Job ${id}</div>
      <div class="text-secondary text-nowrap" data-role="status">Status: …</div>
      <div class="progress w-100 bg-body"><div class="progress-bar" role="progressbar" style="width:0%"></div></div>
      <a class="btn btn-primary btn-sm text-nowrap d-none" data-role="result" target="_blank">View result</a>
      <button class="btn btn-danger btn-sm" data-role="delete"><i class="bi bi-trash"></i></button>`;
    const jobRow: JobRow = {
      status: row.querySelector('[data-role="status"]') as HTMLElement,
      bar: row.querySelector(".progress-bar") as HTMLElement,
      result: row.querySelector('[data-role="result"]') as HTMLAnchorElement,
      finished: false,
    };
    (row.querySelector('[data-role="delete"]') as HTMLElement).addEventListener("click", () => {
      void this.#deleteJob(id, row);
    });
    this.#jobs.set(id, jobRow);
    this.#clearEmptyState();
    this.#body.prepend(row);
  }

  async #deleteJob(id: number, row: HTMLElement): Promise<void> {
    this.#jobs.delete(id);
    row.remove();
    this.#renderEmptyState();
    try {
      await fetch(`${this.#baseUrl}${id}/`, { method: "DELETE", headers: this.#headers() });
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  }

  #clearEmptyState(): void {
    this.#body.querySelector('[data-role="empty"]')?.remove();
  }

  #renderEmptyState(): void {
    if (this.#jobs.size === 0 && !this.#body.querySelector('[data-role="empty"]')) {
      const empty = document.createElement("div");
      empty.dataset.role = "empty";
      empty.className = "text-secondary text-center py-3";
      empty.textContent = "You currently have no jobs.";
      this.#body.appendChild(empty);
    }
  }
}

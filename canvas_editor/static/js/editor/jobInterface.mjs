import { SaveAndLoadHandler } from "saveAndLoadHandler";

let apiUrl = window.location.origin;

/**
 * Interface for managing jobs within a project.
 */
export class JobInterface {
  #jobInterfaceBody;
  #projectID;
  /**
   * @type {Job[]}
   */
  #jobList = [];

  /**
   * Creates a new JobInterface for managing jobs within a project.
   * @param {number} projectID - The ID of the project for which jobs are being managed.
   */
  constructor(projectID) {
    this.#jobInterfaceBody = document.getElementById("jobInterfaceBody");
    this.#projectID = projectID;

    document.getElementById("createNewJob").addEventListener("click", () => {
      this.#createNewJob();
    });

    /**
     * Update when opening
     */
    document
      .getElementById("jobInterface")
      .addEventListener("shown.bs.modal", () => {
        if (this.#jobList.length == 0) {
          this.#jobInterfaceBody.innerHTML = "You currently have no jobs.";
        }
        this.#jobList.forEach((job) => job.fetchStatus());
      });

    /**
     * Update job status every 5 seconds when modal is open
     */
    setInterval(() => {
      if (this.#jobInterfaceBody.checkVisibility()) {
        this.#jobList.forEach((job) => job.fetchStatus());
      }
    }, 5000);

    /**
     * Add all the previous jobs
     */
    this.#getJobs();
  }

  /**
   * Creates a new job by sending a POST request to the server and updates the job list.
   */
  #createNewJob() {
    fetch(apiUrl + "/jobs/" + this.#projectID + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const newJob = new Job(this, data.jobID, this.#projectID);
        if (this.#jobList.length == 0) {
          this.#jobInterfaceBody.innerHTML = "";
        }
        this.#jobList.push(newJob);
        this.#jobInterfaceBody.prepend(newJob);
        document
          .getElementById("hasActiveJobsIndicator")
          .classList.remove("d-none");
      })
      .catch((error) => {
        console.error("Error creating new job:", error);
      });
  }

  /**
   * Deletes a job from the job list and sends a DELETE request to the server.
   * @param {Job} job the job you want to delete
   */
  deleteJob(job) {
    this.#jobList.splice(this.#jobList.indexOf(job), 1);
    job.remove();
    if (this.#jobList.length == 0) {
      this.#jobInterfaceBody.innerHTML = "You currently have no jobs.";
      document.getElementById("hasActiveJobsIndicator").classList.add("d-none");
    }

    fetch(apiUrl + "/jobs/" + this.#projectID + "/" + job.jobID + "/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": SaveAndLoadHandler.getCookie("csrftoken"),
      },
    }).catch((error) => {
      console.error("Error deleting job:", error);
    });
  }

  /**
   * Fetches all jobs associated with the project and populates the job list.
   */
  #getJobs() {
    fetch(apiUrl + "/jobs/" + this.#projectID + "/")
      .then((res) => res.json())
      .then((data) => {
        data["jobIDs"].forEach((job) => {
          const newJob = new Job(this, job, this.#projectID);
          this.#jobList.push(newJob);
          this.#jobInterfaceBody.appendChild(newJob);
          document
            .getElementById("hasActiveJobsIndicator")
            .classList.remove("d-none");
        });
      })
      .catch((error) => {
        console.error("Error getting all jobs:", error);
      });
  }
}

/**
 * Represents a job element in the job interface.
 */
export class Job extends HTMLElement {
  #id;
  #jobInterface;
  #projectID;
  #progress = 0.8;
  #isFinished = false;

  #statusElem;
  #progressElem;
  #resultButton;

  /**
   * Creates a new Job element.
   * @param {JobInterface} jobInterface the job interface this job belongs to
   * @param {string} jobID the ID of the job
   * @param {string} projectID the ID of the project
   */
  constructor(jobInterface, jobID, projectID) {
    super();
    this.#id = jobID;
    this.#jobInterface = jobInterface;
    this.#projectID = projectID;

    this.#createJobElement();
  }

  /**
   * Creates the HTML structure for the job element.
   */
  #createJobElement() {
    this.classList.add(
      "rounded-3",
      "bg-body-secondary",
      "d-flex",
      "p-2",
      "gap-2",
      "align-items-center",
    );

    const jobName = document.createElement("div");
    jobName.classList.add("fw-bolder", "text-nowrap");
    jobName.innerHTML = "Job " + this.#id;
    this.appendChild(jobName);

    this.#statusElem = document.createElement("div");
    this.#statusElem.classList.add("text-secondary", "text-nowrap");
    this.appendChild(this.#statusElem);

    const progressBar = document.createElement("div");
    progressBar.classList.add("progress", "w-100", "bg-body");

    this.#progressElem = document.createElement("div");
    this.#progressElem.classList.add("progress-bar");
    this.#progressElem.style.width = this.#progress * 100 + "%";
    this.#progressElem.setAttribute("role", "progressbar");
    this.#progressElem.setAttribute(
      "aria-valuenow",
      (this.#progress * 100).toString(),
    );
    this.#progressElem.setAttribute("aria-valuemin", "0");
    this.#progressElem.setAttribute("aria-valuemax", "100");

    progressBar.appendChild(this.#progressElem);
    this.appendChild(progressBar);

    this.#resultButton = document.createElement("a");
    this.#resultButton.classList.add(
      "btn",
      "btn-primary",
      "text-nowrap",
      "rouned-3",
    );
    this.#resultButton.innerHTML = "View Result";
    this.#resultButton.classList.add("d-none");
    this.appendChild(this.#resultButton);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-danger", "text-nowrap");
    deleteButton.innerHTML = "<i class='bi bi-trash'></i>";
    deleteButton.addEventListener("click", () => {
      this.#jobInterface.deleteJob(this);
    });
    this.appendChild(deleteButton);
  }

  /**
   * Fetches the current status of the job from the server and updates the UI accordingly.
   */
  fetchStatus() {
    if (!this.#isFinished) {
      fetch(apiUrl + "/jobs/" + this.#projectID + "/" + this.#id)
        .then((res) => res.json())
        .then((data) => {
          this.#statusElem.innerHTML = "Status: " + data["status"];
          this.#progressElem.setAttribute(
            "aria-valuenow",
            (data["progress"] * 100).toString(),
          );
          this.#progressElem.style.width = data["progress"] * 100 + "%";
          if (data["progress"] >= 1) {
            this.#resultButton.classList.toggle("d-none");
            this.#resultButton.href = apiUrl + data["result"];
            this.#isFinished = true;
          }
        })
        .catch((error) => {
          console.error("Error creating new job:", error);
        });
    }
  }

  /**
   * Gets the job ID.
   * @returns {string} the job ID
   */
  get jobID() {
    return this.#id;
  }
}

customElements.define("job-element", Job);

import type { ObjectTypeSpec, ProjectData, Properties, SceneObjectData } from "@/core/types";

/** Reads a cookie value (used for Django's CSRF token). */
function getCookie(name: string): string | null {
  if (!document.cookie) {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export interface NewSceneObject {
  type: string;
  name: string;
  properties: Properties;
}

/**
 * Typed wrapper around the autosave API.
 *
 * A single generic create/update/delete works for every object type (the
 * backend validates `properties` against the type registry). Updates are
 * debounced per entity so a burst of edits (typing, dragging) collapses into a
 * single request; failures surface as rejected promises / console errors
 * instead of being silently swallowed.
 */
export class ApiClient {
  readonly #baseUrl: string;
  readonly #projectId: number;
  readonly #saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  readonly #debounceMs: number;

  constructor(projectId: number, options: { baseUrl?: string; debounceMs?: number } = {}) {
    this.#projectId = projectId;
    this.#baseUrl = options.baseUrl ?? `${window.location.origin}/api`;
    this.#debounceMs = options.debounceMs ?? 400;
  }

  /** Fetch the object-type registry (schema + presentation). */
  getObjectTypes(): Promise<ObjectTypeSpec[]> {
    return this.#request<ObjectTypeSpec[]>(`${this.#baseUrl}/object-types/`, "GET");
  }

  /** Fetch the full project payload (objects + settings). */
  getProject(): Promise<ProjectData> {
    return this.#request<ProjectData>(`${this.#projectUrl()}`, "GET");
  }

  /** Create a scene object; resolves with the persisted record (incl. id). */
  createObject(object: NewSceneObject): Promise<SceneObjectData> {
    return this.#request<SceneObjectData>(`${this.#objectsUrl()}`, "POST", object);
  }

  /** Debounced update of an existing object (fire-and-forget). */
  updateObject(object: SceneObjectData): void {
    this.#debounce(`object:${object.id}`, `${this.#objectUrl(object.id)}`, {
      type: object.type,
      name: object.name,
      properties: object.properties,
    });
  }

  /** Delete an object; resolves when the server confirms. */
  deleteObject(id: number): Promise<null> {
    return this.#request<null>(`${this.#objectUrl(id)}`, "DELETE");
  }

  /** Debounced update of a single project setting (fire-and-forget). */
  updateSetting(attribute: string, value: unknown): void {
    this.#debounce(`settings:${attribute}`, `${this.#projectUrl()}settings/`, { [attribute]: value });
  }

  #projectUrl(): string {
    return `${this.#baseUrl}/projects/${this.#projectId}/`;
  }

  #objectsUrl(): string {
    return `${this.#projectUrl()}objects/`;
  }

  #objectUrl(id: number): string {
    return `${this.#objectsUrl()}${id}/`;
  }

  #debounce(key: string, url: string, body: unknown): void {
    const existing = this.#saveTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.#saveTimers.delete(key);
      // Failures are already logged in #request; swallow here so a failed
      // autosave does not surface as an unhandled rejection.
      void this.#request(url, "PUT", body).catch(() => undefined);
    }, this.#debounceMs);
    this.#saveTimers.set(key, timer);
  }

  async #request<T>(url: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") ?? "",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      console.error(`API request to ${url} failed:`, error);
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Response status: ${response.status}`);
      console.error(`API request to ${url} failed:`, error);
      throw error;
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return null as T;
    }
    return (await response.json()) as T;
  }
}

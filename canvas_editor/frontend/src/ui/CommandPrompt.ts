export interface PromptAction {
  name: string;
  keybind?: string;
  run: () => void;
}

/** Subsequence match: indices of `query` chars within `text`, or null if no match. */
function matchIndices(query: string, text: string): number[] | null {
  const indices: number[] = [];
  let from = 0;
  for (const char of query.toLowerCase()) {
    const index = text.toLowerCase().indexOf(char, from);
    if (index === -1) {
      return null;
    }
    indices.push(index);
    from = index + 1;
  }
  return indices;
}

/** Lower is better: how tightly the matched chars cluster. */
function spanScore(indices: number[]): number {
  return indices.length <= 1 ? 0 : indices[indices.length - 1] - indices[0];
}

function highlight(name: string, indices: number[]): string {
  const set = new Set(indices);
  return [...name].map((char, i) => (set.has(i) ? `<strong>${char}</strong>` : char)).join("");
}

/**
 * A fuzzy command palette (Ctrl+Space). Actions are plain objects, so any part
 * of the editor can contribute commands without bespoke classes.
 */
export class CommandPrompt {
  readonly #actions: PromptAction[];
  readonly #overlay: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #list: HTMLElement;
  #filtered: PromptAction[] = [];
  #selected = 0;

  constructor(actions: PromptAction[]) {
    this.#actions = [...actions].sort((a, b) => a.name.localeCompare(b.name));

    this.#overlay = document.createElement("div");
    this.#overlay.className = "d-none position-fixed top-0 start-0 w-100 h-100";
    this.#overlay.style.zIndex = "1080";
    this.#overlay.style.background = "rgba(0,0,0,0.4)";
    this.#overlay.innerHTML = `
      <div class="card shadow position-absolute top-0 start-50 translate-middle-x mt-5" style="width:min(560px,92vw)">
        <input class="form-control form-control-lg border-0 shadow-none" placeholder="Type a command…" />
        <div class="list-group list-group-flush overflow-auto" style="max-height:50vh"></div>
      </div>`;
    document.body.appendChild(this.#overlay);
    this.#input = this.#overlay.querySelector("input") as HTMLInputElement;
    this.#list = this.#overlay.querySelector(".list-group") as HTMLElement;

    this.#overlay.addEventListener("pointerdown", (event) => {
      if (event.target === this.#overlay) {
        this.close();
      }
    });
    this.#input.addEventListener("input", () => this.#refresh());
    this.#input.addEventListener("keydown", (event) => this.#onKeyDown(event));
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.code === "Space") {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  get isOpen(): boolean {
    return !this.#overlay.classList.contains("d-none");
  }

  open(): void {
    this.#overlay.classList.remove("d-none");
    this.#input.value = "";
    this.#refresh();
    this.#input.focus();
  }

  close(): void {
    this.#overlay.classList.add("d-none");
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  #refresh(): void {
    const query = this.#input.value.trim();
    if (query.length === 0) {
      this.#filtered = this.#actions;
    } else {
      this.#filtered = this.#actions
        .map((action) => ({ action, indices: matchIndices(query, action.name) }))
        .filter((entry): entry is { action: PromptAction; indices: number[] } => entry.indices !== null)
        .sort((a, b) => spanScore(a.indices) - spanScore(b.indices))
        .map((entry) => entry.action);
    }
    this.#selected = 0;
    this.#renderList(query);
  }

  #renderList(query: string): void {
    this.#list.innerHTML = "";
    if (this.#filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "list-group-item text-secondary fst-italic";
      empty.textContent = "No matching commands";
      this.#list.appendChild(empty);
      return;
    }
    this.#filtered.forEach((action, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
      const indices = query ? (matchIndices(query, action.name) ?? []) : [];
      item.innerHTML = `<span>${highlight(action.name, indices)}</span>`;
      if (action.keybind) {
        const kbd = document.createElement("kbd");
        kbd.textContent = action.keybind;
        item.appendChild(kbd);
      }
      item.addEventListener("mousemove", () => this.#select(index));
      item.addEventListener("click", () => this.#run(action));
      this.#list.appendChild(item);
    });
    this.#select(0);
  }

  #select(index: number): void {
    this.#selected = index;
    [...this.#list.children].forEach((child, i) => child.classList.toggle("active", i === index));
    this.#list.children[index]?.scrollIntoView({ block: "nearest" });
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.#select((this.#selected + 1) % this.#filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.#select((this.#selected - 1 + this.#filtered.length) % this.#filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const action = this.#filtered[this.#selected];
      if (action) {
        this.#run(action);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.close();
    }
  }

  #run(action: PromptAction): void {
    this.close();
    action.run();
  }
}

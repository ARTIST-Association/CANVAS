import { Modal } from "bootstrap";

const BINDINGS: ReadonlyArray<{ keys: string; action: string }> = [
  { keys: "Ctrl + Space", action: "Open command palette" },
  { keys: "Click", action: "Select object" },
  { keys: "Drag gizmo", action: "Move the selected object" },
  { keys: "1 – 9", action: "Quick-add the nth object type" },
  { keys: "Delete / Backspace", action: "Delete the selected object" },
  { keys: "Ctrl/⌘ + D", action: "Duplicate the selected object" },
  { keys: "Ctrl/⌘ + Z", action: "Undo" },
  { keys: "Ctrl/⌘ + Shift + Z  ·  Ctrl + Y", action: "Redo" },
  { keys: "?", action: "Show this help" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return !!element && (element.tagName === "INPUT" || element.tagName === "SELECT" || element.isContentEditable);
}

/** A modal listing the editor's keyboard shortcuts. */
export class Keybindings {
  readonly #modal: Modal;

  constructor() {
    const element = document.createElement("div");
    element.className = "modal fade";
    element.tabIndex = -1;
    const rows = BINDINGS.map(
      (binding) => `<tr><td class="text-nowrap"><kbd>${binding.keys}</kbd></td><td>${binding.action}</td></tr>`,
    ).join("");
    element.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Keyboard shortcuts</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <table class="table table-sm align-middle mb-0"><tbody>${rows}</tbody></table>
          </div>
        </div>
      </div>`;
    document.body.appendChild(element);
    this.#modal = new Modal(element);

    document.addEventListener("keydown", (event) => {
      if (event.key === "?" && !isTypingTarget(event.target)) {
        event.preventDefault();
        this.open();
      }
    });
  }

  open(): void {
    this.#modal.show();
  }
}

import { ApiClient } from "@/api/ApiClient";
import {
  CreateObjectCommand,
  DeleteObjectCommand,
  DuplicateObjectCommand,
  UndoRedoService,
  UpdatePropertyCommand,
} from "@/commands/commands";
import { getCookie } from "@/core/csrf";
import { setTheme } from "@/core/theme";
import type { Vector3Tuple } from "@/core/types";
import { Selection } from "@/editor/Selection";
import { ObjectFactory } from "@/objects/ObjectFactory";
import { ObjectStore } from "@/objects/ObjectStore";
import { ObjectTypeRegistry } from "@/objects/registry";
import { Renderer } from "@/rendering/Renderer";
import { CommandPrompt, type PromptAction } from "@/ui/CommandPrompt";
import { Inspector } from "@/ui/Inspector";
import { JobInterface } from "@/ui/JobInterface";
import { Keybindings } from "@/ui/Keybindings";
import { Overview } from "@/ui/Overview";
import { Placement } from "@/ui/Placement";

export interface EditorElements {
  canvas: HTMLElement;
  inspector: HTMLElement;
  overview: HTMLElement;
  placement: HTMLElement;
  shadowsToggle?: HTMLInputElement;
  fogToggle?: HTMLInputElement;
  loadingScreen?: HTMLElement;
  commandsButton?: HTMLElement | null;
  jobsButton?: HTMLElement | null;
  keybindingsButton?: HTMLElement | null;
}

export interface EditorOptions {
  projectId: number;
  elements: EditorElements;
}

/**
 * Composition root: constructs and wires every editor service via dependency
 * injection (no global singletons), loads the project, and returns the live
 * editor. Everything below is generic - it has no knowledge of specific object
 * types, which come entirely from the registry.
 */
export async function createEditor({ projectId, elements }: EditorOptions): Promise<void> {
  const api = new ApiClient(projectId);
  const registry = new ObjectTypeRegistry(await api.getObjectTypes());

  const renderer = new Renderer(elements.canvas);
  const factory = new ObjectFactory(registry, { requestRender: () => renderer.requestRender() });
  const store = new ObjectStore(renderer, api);
  const selection = new Selection(renderer);
  const undoRedo = new UndoRedoService();

  new Inspector(elements.inspector, selection, undoRedo, store, factory);
  new Overview(elements.overview, store, selection);
  new Placement(elements.placement, registry, factory, store, undoRedo, selection);

  // Shared helper: create + select an object of a given type (used by the
  // command palette and the number-key quick selector).
  const addObject = (type: string): void => {
    const object = factory.create(type);
    undoRedo.execute(new CreateObjectCommand(store, object));
    selection.select(object);
  };

  const keybindings = new Keybindings();
  const jobInterface = new JobInterface(projectId);
  const commandPrompt = new CommandPrompt(
    buildCommands({ registry, undoRedo, addObject, keybindings, jobInterface }),
  );

  bindClick(elements.commandsButton, () => commandPrompt.toggle());
  bindClick(elements.jobsButton, () => jobInterface.open());
  bindClick(elements.keybindingsButton, () => keybindings.open());

  wireGizmoDragCommit(renderer, selection, undoRedo, store);
  wireKeyboardShortcuts(selection, undoRedo, store, factory, registry, addObject);

  const project = await api.getProject();
  for (const data of project.objects) {
    await store.add(factory.fromData(data));
  }

  renderer.setShadows(project.settings.shadows);
  renderer.setFog(project.settings.fog);
  wireSettingToggle(elements.shadowsToggle, project.settings.shadows, (value) => {
    renderer.setShadows(value);
    api.updateSetting("shadows", value);
  });
  wireSettingToggle(elements.fogToggle, project.settings.fog, (value) => {
    renderer.setFog(value);
    api.updateSetting("fog", value);
  });

  elements.loadingScreen?.classList.add("d-none");
  renderer.requestRender();
}

/** Commit a gizmo drag as one undoable position change when the drag ends. */
function wireGizmoDragCommit(
  renderer: Renderer,
  selection: Selection,
  undoRedo: UndoRedoService,
  store: ObjectStore,
): void {
  renderer.transformControls.addEventListener("dragging-changed", (event) => {
    if (event.value) {
      return; // drag started
    }
    const object = selection.selected.value;
    if (!object || !object.properties.has("position")) {
      return;
    }
    const { x, y, z } = object.object3d.position;
    const next: Vector3Tuple = [x, Math.max(0, y), z];
    undoRedo.execute(new UpdatePropertyCommand(store, object, "position", next));
  });
}

function wireKeyboardShortcuts(
  selection: Selection,
  undoRedo: UndoRedoService,
  store: ObjectStore,
  factory: ObjectFactory,
  registry: ObjectTypeRegistry,
  addObject: (type: string) => void,
): void {
  const types = registry.all().map((spec) => spec.type);

  window.addEventListener("keydown", (event) => {
    const meta = event.ctrlKey || event.metaKey;
    if (meta && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        undoRedo.redo();
      } else {
        undoRedo.undo();
      }
      return;
    }
    if (meta && event.key.toLowerCase() === "y") {
      event.preventDefault();
      undoRedo.redo();
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable)) {
      return; // don't hijack typing
    }

    // Quick selector: number keys add the nth registered object type.
    if (!meta && /^[1-9]$/.test(event.key)) {
      const type = types[Number(event.key) - 1];
      if (type) {
        event.preventDefault();
        addObject(type);
      }
      return;
    }

    const object = selection.selected.value;
    if (!object) {
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      undoRedo.execute(new DeleteObjectCommand(store, object));
      selection.select(null);
    } else if (meta && event.key.toLowerCase() === "d") {
      event.preventDefault();
      const command = new DuplicateObjectCommand(store, factory, object);
      undoRedo.execute(command);
      selection.select(command.clone);
    }
  });
}

function bindClick(element: HTMLElement | null | undefined, handler: () => void): void {
  element?.addEventListener("click", handler);
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}

function exportProject(): void {
  // The editor URL is /editor/<name>; the HDF5 export lives at .../download.
  window.location.assign(`${window.location.href.replace(/\/$/, "")}/download`);
}

function logout(): void {
  void fetch(`${window.location.origin}/logout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") ?? "" },
  }).then(() => window.location.assign(window.location.origin));
}

function buildCommands(deps: {
  registry: ObjectTypeRegistry;
  undoRedo: UndoRedoService;
  addObject: (type: string) => void;
  keybindings: Keybindings;
  jobInterface: JobInterface;
}): PromptAction[] {
  const { registry, undoRedo, addObject, keybindings, jobInterface } = deps;
  return [
    { name: "Use theme: light", run: () => setTheme("light") },
    { name: "Use theme: dark", run: () => setTheme("dark") },
    { name: "Use theme: system", run: () => setTheme("auto") },
    ...registry.all().map((spec) => ({ name: `Add ${spec.label}`, run: () => addObject(spec.type) })),
    { name: "Undo", keybind: "Ctrl+Z", run: () => undoRedo.undo() },
    { name: "Redo", keybind: "Ctrl+Y", run: () => undoRedo.redo() },
    { name: "Toggle fullscreen", run: toggleFullscreen },
    { name: "Export project (HDF5)", run: exportProject },
    { name: "Open render jobs", run: () => jobInterface.open() },
    { name: "Show keyboard shortcuts", keybind: "?", run: () => keybindings.open() },
    { name: "Log out", run: logout },
  ];
}

function wireSettingToggle(
  toggle: HTMLInputElement | undefined,
  initial: boolean,
  onChange: (value: boolean) => void,
): void {
  if (!toggle) {
    return;
  }
  toggle.checked = initial;
  toggle.addEventListener("change", () => onChange(toggle.checked));
}

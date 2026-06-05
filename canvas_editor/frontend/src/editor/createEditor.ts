import { ApiClient } from "@/api/ApiClient";
import {
  DeleteObjectCommand,
  DuplicateObjectCommand,
  UndoRedoService,
  UpdatePropertyCommand,
} from "@/commands/commands";
import type { Vector3Tuple } from "@/core/types";
import { Selection } from "@/editor/Selection";
import { ObjectFactory } from "@/objects/ObjectFactory";
import { ObjectStore } from "@/objects/ObjectStore";
import { ObjectTypeRegistry } from "@/objects/registry";
import { Renderer } from "@/rendering/Renderer";
import { Inspector } from "@/ui/Inspector";
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

  wireGizmoDragCommit(renderer, selection, undoRedo, store);
  wireKeyboardShortcuts(selection, undoRedo, store, factory);

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
): void {
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

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiClient } from "@/api/ApiClient";
import { ApiClient as ApiClientClass } from "@/api/ApiClient";
import type { ObjectTypeSpec } from "@/core/types";
import { UndoRedoService, UpdatePropertyCommand } from "@/commands/commands";
import { ObjectFactory } from "@/objects/ObjectFactory";
import { ObjectStore } from "@/objects/ObjectStore";
import { ObjectTypeRegistry } from "@/objects/registry";
import { SceneObject } from "@/objects/SceneObject";
import type { Renderer } from "@/rendering/Renderer";

const TARGET_SPEC: ObjectTypeSpec = {
  type: "target_point",
  label: "Target point",
  icon: "bi-bullseye",
  mesh: { kind: "primitive", shape: "octahedron", size: 2, color: "#ff4477" },
  fields: [
    { name: "position", label: "Position", kind: "vector3", default: [0, 0, 0] },
    { name: "power", label: "Power", kind: "slider", default: 1, min: 0, max: 10, step: 0.1 },
  ],
};

const hooks = { requestRender: () => undefined };

describe("ObjectTypeRegistry", () => {
  const registry = new ObjectTypeRegistry([TARGET_SPEC]);

  it("looks up types and throws on unknown", () => {
    expect(registry.get("target_point").label).toBe("Target point");
    expect(() => registry.get("nope")).toThrow();
  });

  it("deep-clones vector defaults", () => {
    const a = registry.defaultProperties("target_point");
    const b = registry.defaultProperties("target_point");
    (a.position as number[])[0] = 99;
    expect((b.position as number[])[0]).toBe(0);
  });
});

describe("SceneObject", () => {
  it("initializes reactive fields and syncs the position to the mesh", () => {
    const object = new SceneObject(TARGET_SPEC, { properties: { position: [1, 2, 3], power: 5 } }, hooks);
    expect(object.get("power")).toBe(5);
    expect([object.object3d.position.x, object.object3d.position.y, object.object3d.position.z]).toEqual([1, 2, 3]);

    object.set("position", [4, 5, 6]);
    expect(object.object3d.position.x).toBe(4);
    expect(object.snapshot()).toEqual({ position: [4, 5, 6], power: 5 });
  });
});

describe("UpdatePropertyCommand + UndoRedoService", () => {
  it("applies, persists and reverts a change", () => {
    const object = new SceneObject(TARGET_SPEC, {}, hooks);
    const save = vi.fn();
    const store = { save } as unknown as ObjectStore;
    const undoRedo = new UndoRedoService();

    undoRedo.execute(new UpdatePropertyCommand(store, object, "power", 9));
    expect(object.get("power")).toBe(9);
    expect(undoRedo.canUndo.value).toBe(true);

    undoRedo.undo();
    expect(object.get("power")).toBe(1);
    expect(undoRedo.canUndo.value).toBe(false);
    expect(save).toHaveBeenCalledTimes(2);
  });
});

describe("ObjectStore", () => {
  it("adds to the scene and persists new objects, removes and deletes", async () => {
    const renderer = { add: vi.fn(), remove: vi.fn() } as unknown as Renderer;
    const api = {
      createObject: vi.fn(async () => ({ id: 7, type: "target_point", name: "", properties: {} })),
      deleteObject: vi.fn(),
    } as unknown as ApiClient;
    const store = new ObjectStore(renderer, api);
    const factory = new ObjectFactory(new ObjectTypeRegistry([TARGET_SPEC]), hooks);

    const object = factory.create("target_point");
    await store.add(object);
    expect(renderer.add).toHaveBeenCalledOnce();
    expect(api.createObject).toHaveBeenCalledOnce();
    expect(object.apiId).toBe(7);
    expect(store.objects.value).toHaveLength(1);

    store.remove(object);
    expect(api.deleteObject).toHaveBeenCalledWith(7);
    expect(store.objects.value).toHaveLength(0);
  });
});

describe("ApiClient debounced autosave", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("coalesces rapid updates into a single PUT", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({}),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const api = new ApiClientClass(1, { debounceMs: 100 });
    const data = { id: 5, type: "heliostat", name: "H", properties: {} };
    api.updateObject(data);
    api.updateObject(data);
    api.updateObject(data);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "PUT" });
  });
});

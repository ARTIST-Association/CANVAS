import { effect } from "@preact/signals-core";
import type { FieldSpec, PropertyValue, Vector3Tuple } from "@/core/types";
import type { SceneObject } from "@/objects/SceneObject";

export interface FieldControl {
  element: HTMLElement;
  dispose: () => void;
}

export type CommitFn = (field: string, value: PropertyValue) => void;

const VECTOR_AXES = ["N", "U", "E"] as const;

function labelledRow(label: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "d-flex align-items-center gap-2 p-2 bg-body rounded-2";
  const name = document.createElement("label");
  name.className = "text-nowrap mb-0";
  name.textContent = label;
  row.appendChild(name);
  return row;
}

function clamp(value: number, field: FieldSpec): number {
  if (typeof field.min === "number" && value < field.min) return field.min;
  if (typeof field.max === "number" && value > field.max) return field.max;
  return value;
}

/**
 * Build a reactive control for a single field. The input is bound to the
 * object's signal via an effect (so external changes patch it in place) and
 * commits user edits through `commit`. We never overwrite an input the user is
 * actively editing, which preserves focus and caret position.
 */
export function createFieldControl(field: FieldSpec, object: SceneObject, commit: CommitFn): FieldControl {
  const signalForField = object.properties.get(field.name);
  if (!signalForField) {
    throw new Error(`No signal for field ${field.name}`);
  }

  if (field.kind === "vector3") {
    const row = labelledRow(field.label);
    const inputs = VECTOR_AXES.map((axis, index) => {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "form-control form-control-sm";
      input.title = axis;
      input.addEventListener("change", () => {
        const current = [...(signalForField.value as Vector3Tuple)] as Vector3Tuple;
        current[index] = Number.parseFloat(input.value) || 0;
        commit(field.name, current);
      });
      row.appendChild(input);
      return input;
    });
    const dispose = effect(() => {
      const vector = signalForField.value as Vector3Tuple;
      inputs.forEach((input, index) => {
        if (document.activeElement !== input) {
          input.value = String(vector[index]);
        }
      });
    });
    return { element: row, dispose };
  }

  if (field.kind === "select") {
    const row = labelledRow(field.label);
    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    for (const option of field.options ?? []) {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      select.appendChild(element);
    }
    select.addEventListener("change", () => commit(field.name, select.value));
    row.appendChild(select);
    const dispose = effect(() => {
      select.value = String(signalForField.value);
    });
    return { element: row, dispose };
  }

  // number | integer | slider
  const row = labelledRow(field.label);
  const input = document.createElement("input");
  input.type = "number";
  input.className = "form-control form-control-sm";
  if (typeof field.step === "number") input.step = String(field.step);
  if (typeof field.min === "number") input.min = String(field.min);
  if (typeof field.max === "number") input.max = String(field.max);
  input.addEventListener("change", () => {
    let value = Number.parseFloat(input.value) || 0;
    value = clamp(value, field);
    if (field.kind === "integer") value = Math.round(value);
    commit(field.name, value);
  });
  row.appendChild(input);

  let slider: HTMLInputElement | undefined;
  if (field.kind === "slider") {
    slider = document.createElement("input");
    slider.type = "range";
    slider.className = "form-range";
    if (typeof field.min === "number") slider.min = String(field.min);
    if (typeof field.max === "number") slider.max = String(field.max);
    if (typeof field.step === "number") slider.step = String(field.step);
    slider.addEventListener("input", () => commit(field.name, Number.parseFloat(slider!.value)));
    row.appendChild(slider);
  }

  const dispose = effect(() => {
    const value = String(signalForField.value);
    if (document.activeElement !== input) input.value = value;
    if (slider && document.activeElement !== slider) slider.value = value;
  });
  return { element: row, dispose };
}

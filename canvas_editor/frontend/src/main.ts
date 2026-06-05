import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@/styles/editor.css";
import { createEditor } from "@/editor/createEditor";
import { initTheme } from "@/core/theme";

function required<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Editor mount error: missing #${id}`);
  }
  return node as T;
}

function optionalInput(id: string): HTMLInputElement | undefined {
  return (document.getElementById(id) as HTMLInputElement | null) ?? undefined;
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  const root = required("editor-root");
  const projectId = Number(root.dataset.projectId);
  void createEditor({
    projectId,
    elements: {
      canvas: required("canvas"),
      inspector: required("inspector"),
      overview: required("overview"),
      placement: required("placement"),
      shadowsToggle: optionalInput("toggle-shadows"),
      fogToggle: optionalInput("toggle-fog"),
      loadingScreen: document.getElementById("loadingScreen") ?? undefined,
      commandsButton: document.getElementById("open-commands"),
      jobsButton: document.getElementById("open-jobs"),
      keybindingsButton: document.getElementById("open-keybindings"),
    },
  });
});

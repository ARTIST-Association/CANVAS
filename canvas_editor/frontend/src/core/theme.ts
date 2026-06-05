export type Theme = "light" | "dark" | "auto";

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/** Apply a theme to the document (without persisting it). */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.bsTheme = resolve(theme);
}

/** The persisted theme, defaulting to "auto". */
export function storedTheme(): Theme {
  const value = localStorage.getItem("theme");
  return value === "light" || value === "dark" ? value : "auto";
}

/** Persist and apply a theme. */
export function setTheme(theme: Theme): void {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

/** Apply the stored theme and keep "auto" in sync with the OS preference. */
export function initTheme(): void {
  applyTheme(storedTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (storedTheme() === "auto") {
      applyTheme("auto");
    }
  });
}

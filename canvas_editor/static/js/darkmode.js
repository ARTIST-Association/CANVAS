/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 *
 * Updated to fit own purposes.
 */

(() => {
  "use strict";

  /**
   * Get the currently stored theme.
   * @returns {string} the current theme
   */
  const getStoredTheme = () => localStorage.getItem("theme");
  /**
   * Stores the selected theme in localStorage.
   * @param {string} theme - The theme to be stored ("light", "dark", or "auto").
   * @returns {void} This function does not return a value.
   */
  const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

  /**
   * Get the preferred theme of the user
   * @returns {string} the preferred theme
   */
  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (!storedTheme) {
      return "auto";
    }

    return storedTheme;
  };

  /**
   * Sets the theme on the document.
   * @param {string} theme - The theme to set ("light", "dark", or "auto").
   */
  const setTheme = (theme) => {
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    } else {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }
  };

  setTheme(getPreferredTheme());

  /**
   * Updates the theme select dropdown to reflect the active theme.
   * @param {string} theme - The current theme ("light", "dark", or "auto").
   */
  const showActiveTheme = (theme) => {
    const themeSelect = document.getElementById("theme-select");

    if (!themeSelect) {
      return;
    }

    switch (theme) {
      case "light":
        //@ts-ignore
        themeSelect.value = "light";
        break;
      case "dark":
        //@ts-ignore
        themeSelect.value = "dark";
        break;
      default:
        //@ts-ignore
        themeSelect.value = "auto";
        break;
    }
  };

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedTheme = getStoredTheme();
      if (storedTheme !== "light" && storedTheme !== "dark") {
        setTheme(getPreferredTheme());
      }
    });

  window.addEventListener("DOMContentLoaded", () => {
    showActiveTheme(getPreferredTheme());

    const themeSelect = document.getElementById("theme-select");

    if (!themeSelect) {
      return;
    }

    themeSelect.addEventListener("change", () => {
      //@ts-ignore
      let theme = themeSelect.value;
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme);
    });
  });
})();

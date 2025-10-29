/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
  "use strict";

  /**
   * Gets the stored theme from localStorage
   * @returns {string|null} stored theme
   */
  const getStoredTheme = () => localStorage.getItem("theme");
  /**
   * Sets the stored theme in localStorage
   * @param {string} theme theme to store
   * @returns {void}
   */
  const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

  /**
   * checks for stored theme and if not found, uses system preference
   * @returns {string} preferred theme
   */
  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  /**
   *
   * @param {string}theme theme to set
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
   *
   * @param {string} theme theme to show
   */
  const showActiveTheme = (theme) => {
    const themeSwitcher = document.querySelector("#theme-switcher");

    if (!themeSwitcher) {
      return;
    }

    themeSwitcher.value = theme;
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

    document
      .querySelector("#theme-switcher")
      ?.addEventListener("change", () => {
        const theme = document.querySelector("#theme-switcher").value;
        setStoredTheme(theme);
        setTheme(theme);
        showActiveTheme(theme);
      });
  });
})();

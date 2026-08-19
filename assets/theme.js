/* Shared dark/light theme toggle. Include this once, early in <head>, on every page.
   1. Applies any saved theme immediately (before first paint), so there's no flash.
   2. Wires up #theme-toggle once the DOM is ready, wherever the script is placed. */
(function () {
  var STORAGE_KEY = "theme";

  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}

  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    var metaThemeColor = document.querySelector('meta[name="theme-color"]');

    var getStored = function () {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        return null;
      }
    };

    // Dark is the default for every visitor until they explicitly choose light.
    var effectiveTheme = function () {
      return getStored() === "light" ? "light" : "dark";
    };

    var reflectState = function (theme) {
      if (btn) {
        btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        btn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
      }
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", theme === "light" ? "#f4f7fc" : "#0b1220");
      }
    };

    reflectState(effectiveTheme());

    if (btn) {
      btn.addEventListener("click", function () {
        var next = effectiveTheme() === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {}
        reflectState(next);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
})();

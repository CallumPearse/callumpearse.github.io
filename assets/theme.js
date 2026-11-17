/* Shared behaviour. Include this once, early in <head>, on every page.
   1. Applies any saved theme immediately (before first paint), so there's no flash.
   2. Wires up #theme-toggle once the DOM is ready, wherever the script is placed.
   3. Adds "Copy citation" buttons to entries marked data-copy-citation (JS only).
   4. Opens every <details> while printing, then restores them. */
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
      // The accessible name stays fixed ("Light theme", set in the HTML) and
      // aria-pressed carries the state, so the two never contradict each other.
      if (btn) {
        btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
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

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(initThemeToggle);

  /* ---- Copy citation ------------------------------------------------- */

  var COPY_LABEL = "Copy citation";
  var RESET_MS = 2000;

  function normalise(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  // Builds the citation from the entry's own .meta line, exactly as displayed,
  // with the DOI written out as a full https://doi.org/ URL. Anything after the
  // DOI (e.g. "Publisher page: SpringerLink") is not part of the citation.
  function citationText(article) {
    var meta = article.querySelector(".meta");
    if (!meta) return "";

    var clone = meta.cloneNode(true);
    var doiLink = clone.querySelector('a[href^="https://doi.org/"]');
    var doiUrl = null;

    if (doiLink) {
      doiUrl = doiLink.getAttribute("href");
      doiLink.textContent = doiUrl;
    }

    var text = normalise(clone.textContent);

    if (doiUrl) {
      var end = text.indexOf(doiUrl);
      if (end !== -1) text = text.slice(0, end + doiUrl.length);
    }

    return text;
  }

  function fallbackCopy(text) {
    var previous = document.activeElement;
    var area = document.createElement("textarea");
    var ok = false;

    area.value = text;
    area.setAttribute("readonly", "");
    area.setAttribute("aria-hidden", "true");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "-9999px";
    area.style.opacity = "0";
    document.body.appendChild(area);

    try {
      area.select();
      area.setSelectionRange(0, text.length);
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }

    document.body.removeChild(area);
    if (previous && previous.focus) previous.focus();
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function initCopyCitation() {
    var entries = document.querySelectorAll("[data-copy-citation]");
    if (!entries.length) return;

    var live = document.createElement("div");
    live.className = "sr-only";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);

    var announce = function (message) {
      live.textContent = "";
      if (message) {
        setTimeout(function () { live.textContent = message; }, 50);
      }
    };

    Array.prototype.forEach.call(entries, function (article) {
      var row = article.querySelector(".btnrow");
      if (!row) {
        row = document.createElement("div");
        row.className = "btnrow";
        article.appendChild(row);
      }

      var heading = article.querySelector("h3");
      var title = heading ? normalise(heading.textContent) : "";
      var idleLabel = title ? COPY_LABEL + ": " + title : COPY_LABEL;
      var timer = null;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = COPY_LABEL;
      btn.setAttribute("aria-label", idleLabel);

      var reset = function () {
        btn.textContent = COPY_LABEL;
        btn.setAttribute("aria-label", idleLabel);
        announce("");
      };

      btn.addEventListener("click", function () {
        copyText(citationText(article)).then(function (ok) {
          clearTimeout(timer);
          btn.textContent = ok ? "Copied" : "Copy failed";
          btn.removeAttribute("aria-label");
          announce(ok ? "Citation copied to clipboard" : "Could not copy the citation");
          timer = setTimeout(reset, RESET_MS);
        });
      });

      row.appendChild(btn);
    });
  }

  onReady(initCopyCitation);

  /* ---- Print: open every <details> so "About this work" text prints ---- */

  function openAllDetails() {
    Array.prototype.forEach.call(document.querySelectorAll("details"), function (d) {
      if (!d.open) {
        d.setAttribute("data-was-closed", "");
        d.open = true;
      }
    });
  }

  function restoreDetails() {
    Array.prototype.forEach.call(document.querySelectorAll("details[data-was-closed]"), function (d) {
      d.open = false;
      d.removeAttribute("data-was-closed");
    });
  }

  window.addEventListener("beforeprint", openAllDetails);
  window.addEventListener("afterprint", restoreDetails);

  // Some browsers (older Safari) only report printing through the media query
  if (window.matchMedia) {
    var printQuery = window.matchMedia("print");
    var onPrintChange = function (e) {
      if (e.matches) openAllDetails();
      else restoreDetails();
    };
    if (printQuery.addEventListener) printQuery.addEventListener("change", onPrintChange);
    else if (printQuery.addListener) printQuery.addListener(onPrintChange);
  }
})();

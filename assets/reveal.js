/* Shared scroll-triggered fade-in for .card sections. Include once per page,
   anywhere after the cards exist in the DOM (or in <head> — it waits for DOMContentLoaded). */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function run() {
    document.documentElement.classList.add("js-reveal");

    var STAGGER_STEP_MS = 70;
    var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));

    var siblingIndex = new Map();
    cards.forEach(function (card) {
      var parent = card.parentElement;
      var idx = siblingIndex.get(parent) || 0;
      siblingIndex.set(parent, idx + 1);
      card.style.setProperty("--reveal-delay", (idx % 2) * STAGGER_STEP_MS + "ms");
    });

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    cards.forEach(function (card) {
      observer.observe(card);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

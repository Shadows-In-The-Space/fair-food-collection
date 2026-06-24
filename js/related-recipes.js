// Golden Crumbs — Related Recipes renderer
//
// Reads /js/related-recipes-data.json (built by scripts/build-recipes-data.js),
// finds the current page's recipe, picks up to 6 same-category recipes,
// and renders them into <div id="related-recipes"> using the design system's
// .related-recipes / .related-grid / .related-card CSS classes (already styled).
//
// Idempotent and silent on error — if anything goes wrong (no placeholder,
// fetch fails, recipe not in data), the section just doesn't appear.

(function () {
  "use strict";

  var PLACEHOLDER_ID = "related-recipes";
  var DATA_URL = "/js/related-recipes-data.json";
  var MAX_RELATED = 6;

  // Categories where the title prefix differs from the data label.
  var CATEGORY_HEADERS = {
    "Soul Food": "Soul-Food-Klassiker",
    "Süß": "Süße Verführungen",
    "Herzhaft": "Herzhafte Highlights",
    "Frittiert": "Frittiertes vom Feinsten",
    "Getränke": "Erfrischende Getränke",
  };

  function getSlugFromUrl() {
    var path = window.location.pathname;
    var file = path.split("/").pop() || "";
    return file.replace(/\.html$/, "");
  }

  function pickRelated(recipes, currentSlug, badge) {
    var sameCategory = recipes.filter(function (r) {
      return r.badge === badge && r.slug !== currentSlug;
    });
    // Shuffle (deterministic per currentSlug + badge so cards don't jump around
    // on every page load — uses a tiny hash instead of Math.random).
    var seed = (currentSlug + ":" + badge).split("").reduce(function (s, c) {
      return ((s << 5) - s + c.charCodeAt(0)) | 0;
    }, 0);
    function rand(i) {
      var x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    }
    sameCategory.sort(function () { return rand(0) - 0.5; });
    return sameCategory.slice(0, MAX_RELATED);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cardHtml(r) {
    var img = r.image || "/images/placeholder.png";
    return '<a href="/' + escapeHtml(r.slug) + '.html" class="related-card">' +
      '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(r.title) + '" loading="lazy">' +
      '<h4>' + escapeHtml(r.title) + '</h4>' +
      '<span>' + escapeHtml(r.badge) + '</span>' +
      '</a>';
  }

  function render(placeholder, current, related) {
    if (!related.length) return;
    var headerText = CATEGORY_HEADERS[current.badge]
      ? "Mehr " + CATEGORY_HEADERS[current.badge]
      : "Mehr Rezepte";
    placeholder.innerHTML =
      '<section class="related-recipes">' +
      '<h2>' + escapeHtml(headerText) + '</h2>' +
      '<div class="related-grid">' +
      related.map(cardHtml).join("") +
      '</div>' +
      '</section>';
  }

  function init() {
    var placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) return;

    var slug = getSlugFromUrl();
    if (!slug || slug === "index" || slug === "") return;

    fetch(DATA_URL, { credentials: "same-origin" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var current = data.find(function (r) { return r.slug === slug; });
        if (!current) return; // not a recipe page, skip silently
        var related = pickRelated(data, slug, current.badge);
        render(placeholder, current, related);
      })
      .catch(function () { /* silent: missing data is not a user-facing error */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
// Golden Crumbs — DSGVO cookie banner
// As of 2026-06-19: site uses NO non-essential cookies. The banner is a
// minimal notice that confirms this and links to the legal pages.
// When non-essential cookies are added in the future, this banner
// becomes a real consent gate (deny by default, opt-in).

(function () {
  "use strict";

  // Skip if user already dismissed
  try {
    if (localStorage.getItem("gc_cookie_dismissed") === "yes") return;
  } catch (e) { /* localStorage may be disabled — show banner */ }

  // Build banner DOM
  var banner = document.createElement("div");
  banner.id = "gc-cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie-Hinweis");
  banner.style.cssText = [
    "position: fixed",
    "left: 16px",
    "right: 16px",
    "bottom: 16px",
    "max-width: 720px",
    "margin: 0 auto",
    "background: var(--cream-pie, #FFF5DC)",
    "color: var(--brown, #3D2314)",
    "border: 1px solid var(--mustard, #E8A317)",
    "border-radius: 12px",
    "padding: 16px 20px",
    "font-family: 'Crimson Text', Georgia, serif",
    "font-size: 0.95rem",
    "line-height: 1.5",
    "box-shadow: 0 4px 24px rgba(0,0,0,0.18)",
    "z-index: 9999",
    "display: flex",
    "flex-wrap: wrap",
    "gap: 12px",
    "align-items: center",
    "justify-content: space-between"
  ].join(";");

  banner.innerHTML = [
    '<div style="flex: 1 1 320px; min-width: 0;">',
    '  <strong style="font-family: \'Josefin Sans\', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--ketchup, #C63D2F); display: block; margin-bottom: 6px;">Cookie-Hinweis</strong>',
    '  <span style="display:block;">Diese Website nutzt aktuell <strong>keine Tracking-, Analyse- oder Marketing-Cookies</strong>. Nur technisch notwendige Sitzungsdaten für den Betrieb. ',
    '    Mehr in unserer <a href="datenschutz.html" style="color:var(--ketchup,#C63D2F);text-decoration:underline;">Datenschutzerklärung</a>.',
    '  </span>',
    '</div>',
    '<div style="display: flex; gap: 8px; flex-shrink: 0;">',
    '  <button type="button" id="gc-cookie-ok" style="padding: 8px 18px; background: var(--mustard, #E8A317); color: var(--brown, #3D2314); border: none; border-radius: 6px; font-family: \'Josefin Sans\', sans-serif; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer;">Verstanden</button>',
    '</div>'
  ].join("");

  // Insert as late as possible (after DOM is ready)
  function mount() {
    document.body.appendChild(banner);
    var btn = document.getElementById("gc-cookie-ok");
    if (btn) {
      btn.addEventListener("click", function () {
        try { localStorage.setItem("gc_cookie_dismissed", "yes"); } catch (e) {}
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

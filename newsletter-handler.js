// Golden Crumbs — Newsletter form handler
// Reads config from window.GOLDENCRUMB_NEWSLETTER (newsletter-config.js)
// Submits email to Apps Script webhook, manages opt-in checkbox, displays states.

(function () {
  "use strict";

  var config = window.GOLDENCRUMB_NEWSLETTER || {};
  var webhookUrl = config.webhookUrl;
  var strings = (config.strings && config.strings.de) || {};

  function $(id) { return document.getElementById(id); }

  function initForm() {
    var form = $("nlForm");
    if (!form) return;

    // The form is wired up by the host page via onsubmit="return handleNewsletter(event)"
    // We expose a global handleNewsletter for backward compatibility.
    window.handleNewsletter = handleNewsletter;

    // Prefill checkbox state from localStorage so user only opts in once per device
    try {
      var consent = localStorage.getItem("gc_newsletter_consent") === "yes";
      var box = $("nlConsent");
      if (box && consent) box.checked = true;
    } catch (e) { /* localStorage may be disabled */ }
  }

  function handleNewsletter(e) {
    if (e && e.preventDefault) e.preventDefault();

    var emailEl = $("nlEmail");
    var consentEl = $("nlConsent");
    var btn = $("nlBtn");
    var msg = $("nlMsg");
    var email = emailEl ? emailEl.value.trim() : "";
    var consent = consentEl ? consentEl.checked : true; // default true if checkbox missing

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg(msg, strings.placeholder ? "⚠️ Bitte gültige E-Mail eingeben." : "Please enter a valid email.", "ketchup");
      return false;
    }

    if (!consent) {
      showMsg(msg, strings.errorConsent || "Please confirm the privacy notice to subscribe.", "ketchup");
      return false;
    }

    if (!webhookUrl || webhookUrl.indexOf("PLACEHOLDER") !== -1) {
      // App is not yet wired up — show fallback
      showMsg(msg, "📧 Newsletter ist noch nicht verkabelt. Schreib uns an hallo@goldencrumb.de.", "mustard");
      return false;
    }

    btn.disabled = true;
    btn.textContent = strings.submitting || "Submitting…";
    if (msg) msg.style.display = "none";

    try {
      localStorage.setItem("gc_newsletter_consent", consent ? "yes" : "no");
    } catch (e) { /* ignore */ }

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        optin: true,
        source: "goldencrumb-website",
        timestamp: new Date().toISOString()
      }),
      redirect: "follow",
    })
    .then(function (res) { return res.json().catch(function () { return { status: "unknown" }; }); })
    .then(function (data) {
      var status = (data && data.status) || "unknown";
      if (status === "pending_confirmation") {
        showMsg(msg, strings.successPending || "Confirm your email to subscribe.", "mustard");
        try { emailEl.value = ""; } catch (e) {}
      } else if (status === "already_subscribed" || status === "already_confirmed") {
        showMsg(msg, strings.successAlready || "You are already subscribed.", "mustard");
      } else if (status === "error" || status === "unknown") {
        showMsg(msg, strings.errorGeneric || "Something went wrong. Try again later.", "ketchup");
      } else {
        showMsg(msg, strings.successPending || "Confirm your email to subscribe.", "mustard");
      }
    })
    .catch(function () {
      showMsg(msg, strings.errorGeneric || "Something went wrong. Try again later.", "ketchup");
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = strings.submit || "Subscribe";
    });

    return false;
  }

  function showMsg(msg, text, color) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = "var(--" + (color || "mustard") + ")";
    msg.style.display = "block";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
})();

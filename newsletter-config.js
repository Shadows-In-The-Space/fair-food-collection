// Golden Crumbs — Newsletter config
//
// Single source of truth for the Apps Script webhook URL.
// Update this ONE file when Sonny provides the deployed webhook URL.
// All 90+ HTML pages include this script and read window.GOLDENCRUMB_NEWSLETTER.
//
// Required for legal/opt-in flow:
// - The Apps Script webhook must implement the contract documented in
//   mywiki/projects/goldencrumb-2-week-roadmap.md (POST with email + optin=true,
//   return JSON {status: "pending_confirmation"|"already_subscribed"|"error"}).
// - Double opt-in confirmation is handled by the Apps Script + Brevo/MailApp.

window.GOLDENCRUMB_NEWSLETTER = {
  // Replace this placeholder with the deployed Google Apps Script web app URL.
  // Example: "https://script.google.com/macros/s/AKfycbxxxxxxxx/exec"
  webhookUrl: "https://script.google.com/macros/s/PLACEHOLDER_DEPLOYED_URL/exec",

  // Brand label shown in the opt-in checkbox
  brand: "Golden Crumbs",

  // Where the user is sent after confirming the form (default = reload current page)
  successRedirect: null,

  // Localized strings
  strings: {
    de: {
      placeholder: "deine@email.de",
      submit: "Abonnieren",
      submitting: "Wird eingetragen…",
      successPending: "Fast da! Wir haben dir eine Bestätigungs-E-Mail geschickt. Klicke den Link, um den Newsletter zu abonnieren.",
      successAlready: "Du bist schon dabei. Wir haben dir gerade eine Bestätigungs-E-Mail geschickt — falls du sie verpasst hast.",
      errorGeneric: "Da ist was schiefgelaufen. Versuch's nochmal oder schreib uns an hallo@goldencrumb.de.",
      errorConsent: "Bitte bestätige die Datenschutzhinweise, um den Newsletter zu abonnieren.",
    }
  }
};

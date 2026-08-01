import "./config.js";

const configuredEmail = window.VILLAGE_ALCHEMIST_CONFIG?.email;
const contactEmail = configuredEmail ?? "mj@villagealchemist.com";
const emailLink =
  document.querySelector<HTMLAnchorElement>("[data-email-link]");

if (emailLink) {
  emailLink.href = `mailto:${contactEmail}`;
  emailLink.textContent = contactEmail;
}

const view = new URLSearchParams(window.location.search).get("view");
const targetId =
  view === "dev" ? "github" : view === "art" ? "instagram" : null;

if (targetId) {
  window.requestAnimationFrame((): void => {
    document.getElementById(targetId)?.scrollIntoView({ block: "center" });
  });
}

const redirectTarget = document.documentElement.dataset.redirect;

if (redirectTarget) {
  window.location.replace(redirectTarget);
}

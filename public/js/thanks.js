// Shows the message for ?plan=hosted or ?plan=dedicated; the neutral message stays otherwise.
(function () {
  var plan = new URLSearchParams(location.search).get('plan');
  if (plan !== 'hosted' && plan !== 'dedicated') return;
  document.querySelectorAll('[data-msg]').forEach(function (el) { el.hidden = el.getAttribute('data-msg') !== plan; });
})();

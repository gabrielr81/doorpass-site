// DoorPass site: request-access form. The form also works with JavaScript off (plain POST).
const FIELDS = ['name', 'venue', 'role', 'capacity', 'events_per_month', 'current_ticketing', 'email', 'phone'];
const MAX = 200;

function clean(value) {
  return String(value == null ? '' : value).trim().slice(0, MAX);
}

// data: a FormData (or a form element). Returns {ok: boolean}. Never throws.
async function submitRequest(data, fetchImpl, endpoint) {
  try {
    const fd = typeof FormData !== 'undefined' && data instanceof FormData ? data : new FormData(data);
    if (clean(fd.get('website')) !== '') return { ok: true }; // honeypot: pretend success, send nothing
    const body = new URLSearchParams();
    for (const f of FIELDS) body.set(f, clean(fd.get(f)));
    body.set('source', 'doorpass.vip');
    const res = await (fetchImpl || fetch)(endpoint || data.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString(),
    });
    return { ok: Boolean(res && res.ok) };
  } catch (e) {
    return { ok: false };
  }
}

if (typeof module !== 'undefined') module.exports = { submitRequest, clean, FIELDS, MAX };

if (typeof document !== 'undefined') {
  const form = document.getElementById('request-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    form.addEventListener('submit', async (event) => {
      if (!form.checkValidity()) return; // the browser shows its own messages
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.removeAttribute('data-state');
      status.textContent = 'Sending...';
      const result = await submitRequest(new FormData(form), undefined, form.action);
      if (result.ok) {
        form.reset();
        status.textContent = 'Thanks. We will reply within one business day.';
      } else {
        status.dataset.state = 'error';
        status.textContent = 'We could not send that. Your answers are still here. Email gabriel@getrevenuecopilot.com or call 775-313-0714 and we will set you up.';
      }
      button.disabled = false;
    });
  }
}

// DoorPass site: sign-up form. Works with JavaScript off (plain POST to n8n, then /thanks.html?plan=).
const FIELDS = ['name', 'venue', 'email', 'phone', 'venue_type', 'capacity', 'plan'];
const MAX = 200;
const COPY = {
  hosted: { button: 'Get your account', done: "You're in. Check your email for your sign-in link." },
  dedicated: { button: 'Request Dedicated', done: "Thanks. We'll call you within the next business day." },
};
const FAIL = 'We could not send that. Your answers are still here. Email gabriel@getrevenuecopilot.com or call 775-313-0714 and we will set you up.';

function clean(value) {
  return String(value == null ? '' : value).trim().slice(0, MAX);
}

function planFor(capacity) {
  return capacity === 'over-500' ? 'dedicated' : 'hosted';
}

// Sets the hidden plan, the button text and whether phone is required.
function applyPlan(form, plan) {
  const p = COPY[plan] ? plan : 'hosted';
  const button = form.querySelector('button[type="submit"]');
  const phone = form.querySelector('[name="phone"]');
  const hidden = form.querySelector('[name="plan"]');
  if (hidden) hidden.value = p;
  if (button) button.textContent = COPY[p].button;
  if (phone) phone.required = p === 'dedicated';
  form.dataset.plan = p;
}

// data: a FormData (or a form element). Returns {ok: boolean}. Never throws.
async function submitRequest(data, fetchImpl, endpoint) {
  try {
    const fd = typeof FormData !== 'undefined' && data instanceof FormData ? data : new FormData(data);
    if (clean(fd.get('website')) !== '') return { ok: true }; // honeypot: pretend success, send nothing
    const body = new URLSearchParams();
    for (const f of FIELDS) body.set(f, clean(fd.get(f)));
    if (!COPY[body.get('plan')]) body.set('plan', planFor(body.get('capacity')));
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

if (typeof module !== 'undefined') module.exports = { submitRequest, clean, planFor, applyPlan, FIELDS, MAX, COPY };

if (typeof document !== 'undefined') {
  const form = document.getElementById('request-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    const capacity = form.querySelector('[name="capacity"]');
    // Pricing and hero buttons pick the plan before scrolling to the form.
    document.querySelectorAll('[data-plan]').forEach((a) => a.addEventListener('click', () => {
      const plan = a.dataset.plan;
      applyPlan(form, plan);
      if (capacity) capacity.value = plan === 'dedicated' ? 'over-500' : capacity.value === 'over-500' ? '' : capacity.value;
    }));
    if (capacity) capacity.addEventListener('change', () => applyPlan(form, planFor(capacity.value)));
    form.addEventListener('submit', async (event) => {
      if (!form.checkValidity()) return; // the browser shows its own messages
      event.preventDefault();
      const plan = form.dataset.plan || 'hosted';
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.removeAttribute('data-state');
      status.textContent = 'Sending...';
      const result = await submitRequest(new FormData(form), undefined, form.action);
      if (result.ok) {
        form.reset();
        applyPlan(form, 'hosted');
        status.textContent = COPY[plan].done;
      } else {
        status.dataset.state = 'error';
        status.textContent = FAIL;
      }
      button.disabled = false;
    });
  }
}

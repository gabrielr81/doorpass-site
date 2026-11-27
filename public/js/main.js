// DoorPass site: sign-up form. Hosted (JavaScript on): n8n creates a Stripe Checkout and the browser goes there,
// then to /welcome.html. Dedicated, or JavaScript off: plain POST to n8n, then /thanks.html?plan=.
const FIELDS = ['name', 'venue', 'email', 'phone', 'venue_type', 'capacity', 'plan'];
const MAX = 200;
const HOSTED_ENDPOINT = 'https://n8n-k7si.srv2090917.hstgr.cloud/webhook/doorpass-hosted-checkout';
const GOING = 'Taking you to secure payment...';
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

// Builds the body n8n expects, or null for the honeypot. data: a FormData or a form element.
function buildBody(data) {
  const fd = typeof FormData !== 'undefined' && data instanceof FormData ? data : new FormData(data);
  if (clean(fd.get('website')) !== '') return null; // honeypot: pretend success, send nothing
  const body = new URLSearchParams();
  for (const f of FIELDS) body.set(f, clean(fd.get(f)));
  if (!COPY[body.get('plan')]) body.set('plan', planFor(body.get('capacity')));
  body.set('source', 'doorpass.vip');
  return body;
}

// Dedicated (and the no-JavaScript fallback). Returns {ok: boolean}. Never throws.
async function submitRequest(data, fetchImpl, endpoint) {
  try {
    const body = buildBody(data);
    if (!body) return { ok: true };
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

// Hosted: asks n8n for a Stripe Checkout address. Returns {ok, url} or {ok: false, error?}. Never throws.
// Only a https://checkout.stripe.com/ address is followed.
async function startCheckout(data, fetchImpl, endpoint) {
  try {
    const body = buildBody(data);
    if (!body) return { ok: true, url: '/thanks.html' };
    const res = await (fetchImpl || fetch)(endpoint || HOSTED_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
      body: body.toString(),
    });
    let json = {};
    try { json = (await res.json()) || {}; } catch (e) { json = {}; }
    const url = typeof json.url === 'string' ? json.url : '';
    if (res && res.ok && url.startsWith('https://checkout.stripe.com/')) return { ok: true, url };
    return typeof json.error === 'string' && json.error ? { ok: false, error: clean(json.error) } : { ok: false };
  } catch (e) {
    return { ok: false };
  }
}

if (typeof module !== 'undefined') module.exports = { submitRequest, startCheckout, buildBody, HOSTED_ENDPOINT, clean, planFor, applyPlan, FIELDS, MAX, COPY };

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
      if (plan === 'hosted') {
        const go = await startCheckout(new FormData(form));
        if (go.ok) {
          status.textContent = GOING;
          window.location.assign(go.url);
          return; // the button stays disabled while the browser leaves
        }
        status.dataset.state = 'error';
        status.textContent = go.error ? go.error + ' ' + FAIL.replace('We could not send that. ', '') : FAIL;
        button.disabled = false;
        return;
      }
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

# DoorPass website

Marketing site for `doorpass.vip`. Static HTML, CSS and a little JavaScript, served by nginx behind Traefik.

- Design and plan: see the DoorPass Project docs `doorpass-saas-launch-design.md` and `doorpass-website-plan.md`.
- Test: `npm test` (brand rules, copy rules, form behavior, nginx config). Tests expand the shared header and footer the same way nginx does, so assertions see the composed page.
- Header and footer live in `public/partials/header.html` and `public/partials/footer.html`. Every page pulls them in with nginx SSI (`ssi on;` in `nginx.conf`, `<!--#include virtual="/partials/header.html" -->`). Edit the partials, not the copies that used to sit in each page.
- Local preview: `npm run dev` serves `public/` at <http://127.0.0.1:8080> and expands those includes. Opening an HTML file directly leaves the header and footer blank, because the browser does not run SSI. Docker uses the same nginx config as production.
- Before deploying: replace the placeholder webhook host `n8n-k7si.srv2090917.hstgr.cloud` (in `public/index.html` and `security-headers.conf`), then run `PRE_DEPLOY=1 npm test`.
- Logo files come from the `doorpass-ticketing` repo (`public/logo.svg`, `logo-dark.svg`, `icon.svg`). Do not edit them here.
- The logo QR opens `doorpass.vip/go`; nginx redirects `/go` (any letter case, including `/GO`) to the home page.
- Prices on the page are mock launch prices (see the `MOCK PRICES` comment in `public/index.html`).

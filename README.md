# DoorPass website

Marketing site for `doorpass.vip`. Static HTML, CSS and a little JavaScript, served by nginx behind Traefik.

- Design and plan: see the DoorPass Project docs `doorpass-saas-launch-design.md` and `doorpass-website-plan.md`.
- Test: `npm test` (brand rules, copy rules, form behavior, nginx config).
- Before deploying: replace the placeholder webhook host `n8n-k7si.srv2090917.hstgr.cloud` (in `public/index.html` and `security-headers.conf`), then run `PRE_DEPLOY=1 npm test`.
- Logo files come from the `doorpass-ticketing` repo (`public/logo.svg`, `logo-dark.svg`, `icon.svg`). Do not edit them here.
- The logo QR opens `doorpass.vip/go`; nginx redirects `/go` (any letter case, including `/GO`) to the home page.
- Prices on the page are mock launch prices (see the `MOCK PRICES` comment in `public/index.html`).

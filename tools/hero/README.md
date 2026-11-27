# Hero scene sources

The home-page hero is built in layers (Gabriel's standing rule: design heroes in layers so they can be animated).

| Layer | Made by | Output |
|---|---|---|
| Back (wall, door, glow) | `scene.html` rendered with `layers.py` (`#back`) | `public/assets/hero/back-*-vN.webp` |
| Venue behind the door | `venue.py` (club, in `index.html`), `venues.py` (concert, lounge, comedy, festival, game day; run `python3 venues.py public/assets/hero/venues-vN`) | inline SVG + `public/assets/hero/venues-vN.html` / `.css` |
| Front (phone, ticket, rope) | `scene.html` (`#front`, `#frontns` for phones) | `public/assets/hero/front-*-vN.webp` |
| Scan result, scan line, sign | HTML/CSS in `index.html` + `styles.css` | live |
| Lights | `.fx` in `styles.css` | live |

Rules: `/assets` is cached for a year, so any changed image or bundle gets a new `-vN` name (a test enforces this for hero images). Render at 2x with Playwright and Chrome; `limbs.py` draws the tapered, jointed arms. Paths inside the scripts point at the session working folder; adjust before running.

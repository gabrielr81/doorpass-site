const fs = require('node:fs');
const path = require('node:path');

const INCLUDE = /<!--#include\s+virtual="([^"]+)"\s*-->/g;

// Same expansion nginx does with `ssi on` and `<!--#include virtual="..." -->`.
function expandHtml(html, root, seen = new Set()) {
  const rootResolved = path.resolve(root);
  return html.replace(INCLUDE, (whole, virtual) => {
    const rel = virtual.replace(/^\//, '');
    const target = path.resolve(rootResolved, rel);
    if (target !== rootResolved && !target.startsWith(rootResolved + path.sep)) {
      throw new Error(`SSI include escapes the site root: ${virtual}`);
    }
    if (seen.has(target)) throw new Error(`SSI include cycle: ${virtual}`);
    if (!fs.existsSync(target)) throw new Error(`SSI include not found: ${virtual}`);
    const next = new Set(seen);
    next.add(target);
    return expandHtml(fs.readFileSync(target, 'utf8'), rootResolved, next);
  });
}

module.exports = { expandHtml };

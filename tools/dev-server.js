#!/usr/bin/env node
// Local preview with the same SSI includes nginx uses in production.
// Opening the HTML files directly does not expand <!--#include -->.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { expandHtml } = require('./ssi');

const root = path.join(__dirname, '..', 'public');
const port = Number(process.env.PORT) || 8080;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded.replace(/^\//, '');
  const target = path.resolve(root, rel);
  if (target !== path.resolve(root) && !target.startsWith(path.resolve(root) + path.sep)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  let target = resolve(req.url || '/');
  if (!target) {
    res.writeHead(400);
    res.end('Bad path');
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(target);
  let body = fs.readFileSync(target);
  if (ext === '.html') body = Buffer.from(expandHtml(body.toString('utf8'), root));
  res.writeHead(200, {
    'Content-Type': types[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  res.end(body);
});

server.listen(port, () => {
  console.log(`DoorPass site at http://127.0.0.1:${port} (SSI on)`);
});

const fs = require('node:fs');
const path = require('node:path');
const { expandHtml } = require('../tools/ssi');
const root = path.join(__dirname, '..');
exports.root = root;
exports.readSite = (file) => {
  const text = fs.readFileSync(path.join(root, 'public', file), 'utf8');
  return file.endsWith('.html') ? expandHtml(text, path.join(root, 'public')) : text;
};
exports.read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

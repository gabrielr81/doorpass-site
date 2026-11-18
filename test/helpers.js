const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
exports.root = root;
exports.readSite = (file) => fs.readFileSync(path.join(root, 'public', file), 'utf8');
exports.read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

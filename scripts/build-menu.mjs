import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'index.html', 'index-old.html', 'about.html', 'architectural-wraps.html',
  'commercial-wraps.html', 'contact.html', 'vehicle-wraps.html',
  'projects.html', 'project-bold-vision-seo.html',
  'project-corvette-stingray.html', 'project-tiger-gas.html',
];
const template = (await readFile(path.join(root, 'partials/menu.html'), 'utf8')).trimEnd();
const start = '<!-- Shared menu: edit partials/menu.html, then run npm run build:menu -->';
const end = '<!-- End shared menu -->';
const check = process.argv.includes('--check');
let stale = false;

for (const page of pages) {
  const filename = path.join(root, page);
  const original = await readFile(filename, 'utf8');
  const region = /(?:<!-- Shared menu:.*?-->\s*)?<header class="pw-nav" id="pwNav">[\s\S]*?<\/aside>(?:\s*<!-- End shared menu -->)?/;
  if (!region.test(original)) throw new Error(`${page}: menu region not found`);
  let updated = original.replace(region, `${start}\n${template}\n${end}`);
  // The homepage drawer style is enabled with this class on every page.
  updated = updated.replace(/<body\b([^>]*)>/, (whole, attrs) => {
    if (/\bindex2-menu\b/.test(attrs)) return whole;
    return /\bclass="/.test(attrs)
      ? whole.replace(/\bclass="([^"]*)"/, (_, classes) => `class="${classes} index2-menu"`)
      : `<body class="index2-menu"${attrs}>`;
  });
  if (updated === original) continue;
  stale = true;
  if (!check) { await writeFile(filename, updated); console.log(`Updated ${page}`); }
  else console.error(`Out of date: ${page}`);
}
if (check && stale) process.exitCode = 1;

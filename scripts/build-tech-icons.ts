/**
 * Writes one single-colour SVG per technology to public/tech/<key>.svg and the
 * brand colours to src/content/tech-brands.json. The site draws the SVGs as
 * CSS masks, so only their shape matters.
 *
 *   npm run tech:icons
 *
 * Sources: Simple Icons (CC0) and Devicon (MIT), both devDependencies.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as simpleIcons from 'simple-icons';
import { technologies } from '../src/content/technologies';

const root = process.cwd();
const outDir = path.join(root, 'public', 'tech');
const deviconDir = path.join(root, 'node_modules', 'devicon', 'icons');
const deviconMeta = JSON.parse(readFileSync(path.join(root, 'node_modules', 'devicon', 'devicon.json'), 'utf8')) as { name: string; color: string }[];

type SimpleIcon = { slug: string; hex: string; path: string };
const bySlug = new Map<string, SimpleIcon>();
for (const value of Object.values(simpleIcons)) {
  const icon = value as Partial<SimpleIcon>;
  if (icon && typeof icon === 'object' && icon.slug && icon.path) bySlug.set(icon.slug, icon as SimpleIcon);
}

// Single-colour variants first; wordmarks only where no symbol exists.
const DEVICON_VARIANTS = ['plain', 'line', 'plain-wordmark', 'line-wordmark', 'original', 'original-wordmark'];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const brands: Record<string, string> = {};
const missing: string[] = [];

for (const tech of technologies) {
  if (!tech.icon) continue;
  const [source, name = ''] = tech.icon.split(':');

  if (source === 'si') {
    const icon = bySlug.get(name);
    if (!icon) {
      missing.push(tech.icon);
      continue;
    }
    writeFileSync(path.join(outDir, `${tech.key}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${icon.path}"/></svg>\n`);
    brands[tech.key] = `#${icon.hex}`;
    continue;
  }

  if (source === 'dev') {
    const files = new Set(readdirSync(path.join(deviconDir, name)));
    const variant = DEVICON_VARIANTS.find((v) => files.has(`${name}-${v}.svg`));
    if (!variant) {
      missing.push(tech.icon);
      continue;
    }
    const svg = readFileSync(path.join(deviconDir, name, `${name}-${variant}.svg`), 'utf8')
      .replace(/<\?xml[^>]*>/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    writeFileSync(path.join(outDir, `${tech.key}.svg`), `${svg}\n`);
    const color = deviconMeta.find((entry) => entry.name === name)?.color;
    if (color) brands[tech.key] = color;
    continue;
  }

  missing.push(tech.icon);
}

writeFileSync(path.join(root, 'src', 'content', 'tech-brands.json'), `${JSON.stringify(brands, null, 2)}\n`);

process.stdout.write(`wrote ${Object.keys(brands).length} logos to public/tech\n`);
if (missing.length) {
  console.error(`missing: ${missing.join(', ')}`);
  process.exitCode = 1;
}

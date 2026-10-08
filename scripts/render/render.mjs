// Drives the render studio in headless Chrome (GPU) and writes PNGs.
// Needs a static server on the project root:  python -m http.server 8765
// usage: node scripts/render/render.mjs <scene[,scene]> [w=1600] [h=2000] [samples=400]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const [list, w = '1600', h = '2000', samples = '400'] = process.argv.slice(2);
const OUT = path.resolve('scripts/render/out');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'],
  protocolTimeout: 3_600_000,
});
for (const name of list.split(',')) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`[${name}]`, e.message));
  page.on('console', (m) => m.type() === 'error' && console.error(`[${name}]`, m.text()));
  await page.setViewport({ width: Number(w), height: Number(h) });
  await page.goto(`http://localhost:8765/scripts/render/index.html?scene=${name}&w=${w}&h=${h}&samples=${samples}`, { waitUntil: 'load' });
  const t0 = Date.now();
  let last = -1;
  for (;;) {
    const s = await page.evaluate(() => ({ done: window.__done, n: window.__samples, err: window.__error }));
    if (s.err) {
      console.error(name, s.err);
      break;
    }
    if (s.done) break;
    if (Date.now() - t0 > 40 * 60_000) {
      console.error(name, 'timeout at', s.n);
      break;
    }
    if (s.n !== last && s.n % 50 === 0) last = s.n;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  console.log(name, `${Math.round((Date.now() - t0) / 1000)}s`);
  await page.close();
}
await browser.close();

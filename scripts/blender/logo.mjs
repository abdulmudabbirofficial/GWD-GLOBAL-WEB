// Rasterises the GWD mark, in its exact colours (#B40001 letters, #781215
// brackets), to a transparent PNG for compositing onto dioramas after render.
//   node scripts/blender/logo.mjs   → scripts/blender/out/gwd-mark.png, gwd-lockup.png
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const src = fs.readFileSync(path.resolve('src/components/brand/mark.ts'), 'utf8');
const grab = (key) => src.match(new RegExp(`${key}: '([^']+)'`))[1];
const [W, H] = [2320, 944]; // 4× the 580×236 viewBox
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 0 580 236" width="${W}" height="${H}">
  <path fill="#781215" d="${grab('bottomLeft')}"/><path fill="#781215" d="${grab('topRight')}"/>
  <path fill="#b40001" d="${grab('g')}"/><path fill="#b40001" d="${grab('w')}"/><path fill="#b40001" d="${grab('d')}"/>
</svg>`;

const out = path.resolve('scripts/blender/out');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
await page.screenshot({ path: path.join(out, 'gwd-mark.png'), omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
// The lockup: the mark with GET WORK DONE set wide beneath it (for wall signs).
const LH = Math.round(H * 1.42);
await page.setViewport({ width: W, height: LH, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:transparent;width:${W}px;height:${LH}px;display:flex;flex-direction:column;align-items:center">
  ${svg}
  <div style="margin-top:${Math.round(H * 0.1)}px;font:600 ${Math.round(H * 0.17)}px 'Segoe UI',Arial,sans-serif;letter-spacing:0.42em;color:#1d1d1f;padding-left:0.42em">GET WORK DONE</div>
</body></html>`);
await page.screenshot({ path: path.join(out, 'gwd-lockup.png'), omitBackground: true, clip: { x: 0, y: 0, width: W, height: LH } });
await browser.close();
console.log('wrote gwd-mark.png and gwd-lockup.png');

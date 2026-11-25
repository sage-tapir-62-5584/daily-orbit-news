// Local build script (not run by the grader): renders poster.html + news-data.json
// into ../assets/entry.png at exactly 1024x1024 with headless Chromium (puppeteer),
// and writes a 300px-wide legibility preview to /tmp/entry-300.png.
// Run: node render.mjs   (from this directory; puppeteer is borrowed from the
// sibling makefun/tools install via createRequire anchored there.)

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(new URL('../../tools/package.json', import.meta.url));
const puppeteer = require('puppeteer');

const data = JSON.parse(readFileSync(join(here, 'news-data.json'), 'utf8'));
let html = readFileSync(join(here, 'poster.html'), 'utf8');

// ---- small flat SVG icons, one per story (viewBox 0 0 76 76) ----
const ICONS = {
  // apartment block, corner broken, rubble at the base
  apartment: `<svg viewBox="0 0 76 76" width="70" height="70"><rect x="16" y="8" width="42" height="56" fill="#3c4a57"/><g fill="#f6f1e5"><rect x="23" y="15" width="7" height="8"/><rect x="35" y="15" width="7" height="8"/><rect x="23" y="29" width="7" height="8"/><rect x="35" y="29" width="7" height="8"/><rect x="23" y="43" width="7" height="8"/></g><polygon points="44,8 58,8 58,26 50,20 46,28" fill="#f6f1e5"/><polyline points="48,28 44,38 49,46" fill="none" stroke="#16181d" stroke-width="3"/><g fill="#8b959e"><polygon points="8,64 22,52 34,64"/><polygon points="30,64 44,54 56,64"/><polygon points="50,64 62,56 70,64"/></g></svg>`,
  // airstrike burst over a low skyline
  burst: `<svg viewBox="0 0 76 76" width="70" height="70"><polygon fill="#e2571e" points="38,2 43,14 55,8 51,21 64,20 53,29 66,34 52,36 56,48 45,40 41,52 36,39 24,44 29,32 16,28 28,24 22,12 33,19"/><polygon fill="#f2a03d" points="38,16 42,25 50,24 44,31 48,39 39,34 33,40 34,30 26,26 34,24"/><g fill="#232a33"><rect x="4" y="52" width="16" height="16"/><rect x="24" y="46" width="18" height="22"/><rect x="46" y="54" width="14" height="14"/><rect x="62" y="48" width="12" height="20"/></g></svg>`,
  // landmine warning sign
  mine: `<svg viewBox="0 0 76 76" width="70" height="70"><polygon points="38,6 71,64 5,64" fill="#f2c230" stroke="#16181d" stroke-width="4" stroke-linejoin="round"/><circle cx="38" cy="46" r="9" fill="#16181d"/><g stroke="#16181d" stroke-width="3.5" stroke-linecap="round"><line x1="38" y1="37" x2="38" y2="30"/><line x1="31" y1="40" x2="26" y2="34"/><line x1="45" y1="40" x2="50" y2="34"/></g></svg>`,
  // rising bars and arrow
  chart: `<svg viewBox="0 0 76 76" width="70" height="70"><line x1="8" y1="8" x2="8" y2="66" stroke="#16181d" stroke-width="4"/><line x1="8" y1="66" x2="70" y2="66" stroke="#16181d" stroke-width="4"/><g fill="#3c4a57"><rect x="15" y="48" width="10" height="18"/><rect x="30" y="40" width="10" height="26"/><rect x="45" y="30" width="10" height="36"/></g><polyline points="13,44 30,32 44,36 63,14" fill="none" stroke="#b3271e" stroke-width="5" stroke-linecap="round"/><polygon points="66,8 68,22 54,18" fill="#b3271e"/></svg>`,
  // bird with a medical-cross badge
  bird: `<svg viewBox="0 0 76 76" width="70" height="70"><g fill="#232a33"><ellipse cx="33" cy="42" rx="17" ry="11"/><circle cx="51" cy="29" r="8.5"/><polygon points="20,37 6,27 11,45"/><polygon points="58,26 69,29.5 58,33"/></g><g stroke="#232a33" stroke-width="3" stroke-linecap="round"><line x1="29" y1="52" x2="29" y2="62"/><line x1="38" y1="52" x2="38" y2="62"/></g><circle cx="16" cy="60" r="12" fill="#b3271e"/><g fill="#f6f1e5"><rect x="13.5" y="52" width="5" height="16"/><rect x="8" y="57.5" width="16" height="5"/></g></svg>`,
};

const cells = data.stories
  .map(
    (s, i) => `    <section class="cell ${i < 3 ? 'span2' : 'span3'}">
      <div class="kick">${s.kicker}</div>
      <div class="row"><div class="icon">${ICONS[s.icon]}</div><h3>${s.headline}</h3></div>
      <p class="cap">${s.caption}</p>
    </section>`,
  )
  .join('\n');

const also = data.also.map((t) => `    <div class="item"><b>&#9656;</b> ${t}</div>`).join('\n');

html = html
  .replace('{{TITLE}}', data.masthead.title)
  .replace('{{TAGLINE}}', data.masthead.tagline)
  .replace('{{DATELINE}}', data.masthead.dateline)
  .replace('{{LEAD_KICKER}}', data.lead.kicker)
  .replace('{{LEAD_HEADLINE}}', data.lead.headline)
  .replace('{{LEAD_CAPTION}}', data.lead.caption)
  .replace('{{STORY_CELLS}}', cells)
  .replace('{{ALSO_ITEMS}}', also);

const out = join(here, '..', 'assets', 'entry.png');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 150));
await page.screenshot({ path: out, type: 'png' });
console.log('wrote', out);

// 300px legibility preview (data URI: a setContent page cannot load file:// images)
const b64 = readFileSync(out).toString('base64');
const page2 = await browser.newPage();
await page2.setViewport({ width: 300, height: 300, deviceScaleFactor: 1 });
await page2.setContent(`<body style="margin:0"><img src="data:image/png;base64,${b64}" style="width:300px;height:300px"></body>`, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 100));
await page2.screenshot({ path: '/tmp/entry-300.png', type: 'png' });
console.log('wrote /tmp/entry-300.png');
await browser.close();

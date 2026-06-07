import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch();
const url = 'http://localhost:8743/home.html';
const out = 'c:/Users/ivesp/Downloads/LP/.verify-shots';
fs.mkdirSync(out, { recursive: true });

const sizes = [
  { name: 'mobile', width: 420, height: 900 },
  { name: 'tablet', width: 880, height: 900 },
  { name: 'desktop', width: 1440, height: 950 },
];

for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#depoimentos').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const info = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('#depoimentos .t-col')];
    return cols.map((col) => {
      const track = col.querySelector('.t-col-track');
      const cs = getComputedStyle(track);
      const visible = getComputedStyle(col).display !== 'none';
      const cards = track.querySelectorAll('.t-card').length;
      const sets = track.querySelectorAll('.t-col-set').length;
      const ariaHiddenSets = track.querySelectorAll('.t-col-set[aria-hidden="true"]').length;
      return {
        classes: col.className,
        visible,
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        cardCount: cards,
        setCount: sets,
        ariaHiddenSets,
        trackHeight: track.scrollHeight,
      };
    });
  });

  await page.screenshot({ path: `${out}/${s.name}-initial.png`, fullPage: false, clip: { x: 0, y: 0, width: s.width, height: s.height } });

  // capture mid-animation frame to visually confirm motion + seamless wrap math
  await page.waitForTimeout(2500);
  const translateAfter = await page.evaluate(() => {
    const track = document.querySelector('#depoimentos .t-col .t-col-track');
    const m = getComputedStyle(track).transform;
    return m;
  });
  await page.screenshot({ path: `${out}/${s.name}-mid-anim.png`, fullPage: false, clip: { x: 0, y: 0, width: s.width, height: s.height } });

  console.log(`\n=== ${s.name} (${s.width}x${s.height}) ===`);
  console.log('console/page errors:', errors.length ? errors : 'none');
  console.log('transform mid-animation:', translateAfter);
  console.log(JSON.stringify(info, null, 2));

  await page.close();
}

await browser.close();

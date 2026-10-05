// Real-Chrome check of the page: every panel populated, a segment filter changes the numbers,
// no console errors, and the layout holds at 1280x800 and 390 wide.
//   node tools/serve.mjs 8000      (in another terminal)
//   CHROME=/usr/bin/google-chrome node tools/verify.mjs [http://localhost:8000/] [--shots dir]
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const shots = shotsAt >= 0 ? args.splice(shotsAt, 2)[1] : '';
const url = args[0] || 'http://localhost:8000/';
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
let failed = 0;
const check = (ok, what) => { if (!ok) failed += 1; console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); };

/** What each panel currently shows. */
const snapshot = () => window.__demo && (() => {
  const { grid, model } = window.__demo;
  const fit = grid.statistics.regressionModel(model);
  const keys = Array.from({ length: 4177 }, (_, i) => String(i + 1));
  const flagged = (col) => keys.filter((k) => grid.rows.value(k, col) === true).length;
  const profile = grid.statistics.profile('shell');
  const svg = (id) => { const s = document.querySelector(`#${id} svg`); return s ? { marks: s.querySelectorAll('circle').length, paths: s.querySelectorAll('path').length } : null; };
  return {
    rows: grid.rows.matchCount(), r2: fit && +fit.r2.toFixed(3), n: fit && fit.n,
    coefficients: fit && fit.coefficients.map((c) => `${c.term || c.name}=${(+c.estimate).toFixed(3)}`),
    influential: flagged('influential'), unusualAges: +(document.querySelector('.lat-anomaly-chip')?.innerText.match(/\d+/) || [0])[0],
    shellMean: profile && +profile.mean.toFixed(2), shellMedian: profile && +profile.median.toFixed(2),
    compare: document.getElementById('compare').innerText.replace(/\n/g, ' | '), fit: svg('fit'), influence: svg('influence'),
    anomalyChip: document.querySelector('.lat-anomaly-chip')?.innerText,
    toolPanel: (document.querySelector('.lat-toolpanel, [class*=toolpanel]')?.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
  };
})();

try {
  for (const [name, width, height] of [['desktop', 1280, 800], ['mobile', 390, 800]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const errors = []; const warnings = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warnings.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction('window.__demo', { timeout: 60000 });
    await sleep(2500);
    const all = await page.evaluate(snapshot);
    console.log(`\n[${name}] all abalone`, JSON.stringify(all, null, 1));
    if (shots) await page.screenshot({ path: `${shots}/demo-1888-${name}-all.png` });
    await page.select('#segment', 'Infant');
    await sleep(1500);
    const infants = await page.evaluate(snapshot);
    console.log(`[${name}] infants`, JSON.stringify(infants, null, 1));
    if (shots) await page.screenshot({ path: `${shots}/demo-1888-${name}-infants.png` });
    check(all.rows === 4177 && infants.rows === 1342, `${name}: filter takes 4,177 rows to ${infants.rows}`);
    check(all.r2 !== infants.r2 && all.shellMean !== infants.shellMean, `${name}: model and profile refit (R2 ${all.r2} to ${infants.r2})`);
    check(all.influential !== infants.influential || all.unusualAges !== infants.unusualAges, `${name}: flags refit`);
    check(all.fit && all.fit.marks > 0 && all.influence && all.influence.marks > 0, `${name}: both charts drawn`);
    check(all.compare !== infants.compare, `${name}: group comparison follows the filter`);
    check(errors.length === 0, `${name}: no console errors ${errors.join(' / ')}`);
    console.log(`[${name}] [lattice] warnings:`, warnings.filter((w) => w.includes('[lattice]')));
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name}: no sideways scroll`);
    await page.close();
  }
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);

/* Verify the KPOT redirect layer resolves to the right destination.
   Reuses the project's proven CDP startup pattern.
   Usage: node verify_redirect.js <baseUrl> */
const fs = require('fs');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9355;
const BASE = (process.argv[2] || 'http://127.0.0.1:8932').replace(/\/+$/, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const profile = require('os').tmpdir() + '\\cdp-redir-' + Date.now();
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    '--window-size=430,932', 'about:blank'
  ], { stdio: 'ignore' });

  let list = null;
  for (let i = 0; i < 60; i++) {
    await sleep(300);
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      list = await r.json();
      if (list && list.some((t) => t.type === 'page')) break;
    } catch (e) {}
  }
  if (!list) { console.error('Chrome did not start'); try { chrome.kill(); } catch (e) {} process.exit(1); }

  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Runtime.enable');
  await send('Page.enable');

  /* Each case is [path, wantTable, wantPath].
       wantTable — the ?table=N the destination must carry (null = must not)
       wantPath  — the path the destination must end at (staff pages only)
       wantPath === '__STAY__' — this page must NOT redirect at all: it is
                                 content served from this layer, not a doorway.
                                 `/staff/` is the staff menu; `/` is the public
                                 landing page (since 2026-10-16). `/staff/menu/`
                                 is a DIFFERENT path and does redirect (to the
                                 menu editor) — do not confuse the two.
       wantPath === '__LEAVE__' — this page must leave this host and forward to
                                 the ordering app, carrying no ?table=. Used for
                                 `/order/`, the doorway every "Order Online"
                                 button on the landing page depends on.

     ⚠️ An empty wantPath only asserts "the destination has no ?table=", which
     passes even when the page never redirected at all. That was a false green
     for `/` once the root became a landing page — never use '' for a page that
     is supposed to move; use __LEAVE__ so a page that sits still fails. */
  const cases = [
    ['/', null, '__STAY__'],
    ['/order/', null, '__LEAVE__'],
    ['/tables/1/', '1', ''],
    ['/tables/7/', '7', ''],
    ['/tables/12/', '12', ''],
    ['/staff/board/', null, '/admin-orders.html'],
    ['/staff/console/', null, '/admin.html'],
    ['/staff/menu/', null, '/admin-menu.html'],
    ['/staff/', null, '__STAY__']
  ];
  console.log('Redirect layer check @ ' + BASE + '\n');
  let pass = 0;

  for (const [p, wantTable, wantPath] of cases) {
    await send('Page.navigate', { url: BASE + p });
    await sleep(2500);                       // redirect delay is 350ms
    const r = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
    const got = r.result.value;
    const hasTable = /\?table=(\d+)/.exec(got);
    let ok;
    if (wantPath === '__STAY__') {
      ok = got.indexOf(BASE) === 0;          // stayed on the redirect host
    } else if (wantPath === '__LEAVE__') {
      /* Left this host AND carried no table number. Without the first half this
         would pass while the page sat still — the exact false green this file
         used to have on '/'. */
      ok = got.indexOf(BASE) !== 0 && !hasTable;
    } else if (wantPath) {
      /* Staff pages must leave the redirect host AND land on the right document.
         Checking only the suffix would pass even if it never redirected. */
      ok = got.indexOf(BASE) !== 0 && got.indexOf(wantPath) === got.length - wantPath.length;
    } else {
      ok = wantTable ? (hasTable && hasTable[1] === wantTable) : !hasTable;
    }
    console.log((ok ? '  PASS  ' : '  FAIL  ') + p.padEnd(17) + ' -> ' + got);
    if (ok) pass++;
  }

  /* ---- the landing page itself ------------------------------------------
     Staying put is not enough: '/' could sit still while still being the old
     "Opening…" bounce page. Pin what the page actually IS — and pin the trap
     that bites hardest, because it fails silently: an "Order Online" button
     pointing back at '/' reloads the landing page instead of opening the menu,
     which looks like a working button and sells nothing. */
  const extra = [];

  await send('Page.navigate', { url: BASE + '/' });
  await sleep(1200);
  const t = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
  const title = String((t.result && t.result.value) || '');
  extra.push([
    '/ serves the landing page, not the "Opening…" bounce',
    /KPOT To Go/.test(title) && !/Opening/i.test(title),
    title
  ]);

  const b = await send('Runtime.evaluate', {
    expression: "Array.prototype.slice.call(document.querySelectorAll('[data-order]'))" +
                ".map(function (a) { return a.getAttribute('href') || ''; }).join('|')",
    returnByValue: true
  });
  const hrefs = String((b.result && b.result.value) || '').split('|').filter(Boolean);
  extra.push([
    'every order button points at /order/, never back at /',
    hrefs.length > 0 && hrefs.every(function (h) { return h.indexOf('/order/') === 0; }),
    hrefs.join('  ') || '(no buttons found — the selector changed)'
  ]);

  for (const [label, ok, detail] of extra) {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + label + '  [' + detail + ']');
    if (ok) pass++;
  }

  const total = cases.length + extra.length;
  console.log('\n' + pass + '/' + total + ' passed');
  ws.close();
  try { chrome.kill(); } catch (e) {}
  await sleep(300);
  process.exit(pass === total ? 0 : 2);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });

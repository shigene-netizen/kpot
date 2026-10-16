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
       wantPath === '__STAY__' — this page must NOT redirect at all. Only the
                                 staff hub `/staff/` does that: it is the menu
                                 page itself, served here. `/staff/menu/` is a
                                 DIFFERENT path and does redirect (to the menu
                                 editor) — do not confuse the two. */
  const cases = [
    ['/', null, ''],
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

  console.log('\n' + pass + '/' + cases.length + ' passed');
  ws.close();
  try { chrome.kill(); } catch (e) {}
  await sleep(300);
  process.exit(pass === cases.length ? 0 : 2);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });

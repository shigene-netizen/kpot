/* Screenshot the redirect layer's table page.
   Usage: node shot_redirect.js <url> <outPng> */
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9366;
const url = process.argv[2] || 'http://127.0.0.1:8932/tables/7/';
const out = process.argv[3] || 'redirect-preview.png';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const profile = require('os').tmpdir() + '\\cdp-shot-' + Date.now();
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
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });

  // Freeze the page before it redirects so the screenshot captures it.
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + '_shot=1' });
  await sleep(150);   // inside the 350ms delay window

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('wrote ' + out + ' (' + Math.round(Buffer.from(shot.data, 'base64').length / 1024) + ' KB)');

  ws.close();
  try { chrome.kill(); } catch (e) {}
  await sleep(300);
  process.exit(0);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });

/* KPOT To Go — redirect layer
   Reads window.KPOT_TARGET from target.js and forwards to the live ordering
   page, preserving /table/N (or ?table=N) so the table number survives. */
(function () {
  'use strict';

  var T = window.KPOT_TARGET || {};
  var base = String(T.baseUrl || '').replace(/\/+$/, '');

  /* ---- work out the table number, if any ------------------------------- */
  function tableFromPath() {
    // /tables/7/  or  /tables/7
    var m = location.pathname.match(/\/tables\/(\d{1,3})\/?$/i);
    if (m) return m[1];
    // /table-07.html
    m = location.pathname.match(/\/table-0*(\d{1,3})\.html?$/i);
    if (m) return m[1];
    return null;
  }

  function tableFromQuery() {
    var m = location.search.match(/[?&]table=(\d{1,3})\b/i);
    return m ? m[1] : null;
  }

  var table = tableFromQuery() || tableFromPath();

  /* ---- build the destination ------------------------------------------- */
  var dest = base + '/';
  if (table) dest += '?table=' + encodeURIComponent(table);

  /* ---- show store name + the exact URL (for the no-redirect fallback) --- */
  if (T.storeName) {
    var h = document.getElementById('store');
    if (h) h.textContent = T.storeName;
  }

  var go = document.getElementById('go');
  if (go) go.setAttribute('href', dest);

  var fallback = document.getElementById('fallback');
  var urlText = document.getElementById('urlText');
  if (fallback && urlText) {
    var a = document.createElement('a');
    a.href = dest;
    a.textContent = dest;
    urlText.appendChild(a);
  }

  /* ---- forward ---------------------------------------------------------- */
  var delay = typeof T.delayMs === 'number' ? T.delayMs : 350;
  if (!base) {
    // Misconfigured: leave the user on this page with the fallback visible.
    if (fallback) fallback.hidden = false;
    return;
  }

  setTimeout(function () {
    location.replace(dest);
  }, delay);

  // If we are still here after a few seconds, show the manual link too.
  setTimeout(function () {
    if (fallback) fallback.hidden = false;
  }, Math.max(2500, delay + 2000));
})();

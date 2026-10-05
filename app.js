/* KPOT To Go — redirect layer
   Reads window.KPOT_TARGET from target.js and forwards to the live ordering
   page, preserving /table/N (or ?table=N) so the table number survives, and
   /staff/<page>/ so the staff QR codes survive a domain change too. */
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

  /* ---- work out a STAFF page, if any -----------------------------------
     Staff QR codes point at /staff/board/, /staff/console/, /staff/menu/ so
     the code printed once keeps working after the app is re-published on a
     new domain. Only an allow-list is mapped — this layer must never become
     an open redirect that forwards to arbitrary paths. */
  var STAFF_PAGES = {
    board: '/admin-orders.html',
    console: '/admin.html',
    menu: '/admin-menu.html'
  };

  function staffFromPath() {
    var m = location.pathname.match(/\/staff\/([a-z]+)\/?$/i);
    if (!m) return null;
    var page = STAFF_PAGES[m[1].toLowerCase()];
    return page ? { key: m[1].toLowerCase(), path: page } : null;
  }

  var staff = staffFromPath();
  var table = tableFromQuery() || tableFromPath();

  /* ---- build the destination ------------------------------------------- */
  var dest;
  if (staff) {
    // Staff pages are distinct documents, so the table query does not apply.
    dest = base + staff.path;
  } else {
    dest = base + '/';
    if (table) dest += '?table=' + encodeURIComponent(table);
  }

  /* ---- show store name + the exact URL (for the no-redirect fallback) --- */
  if (T.storeName) {
    var h = document.getElementById('store');
    if (h) h.textContent = T.storeName;
  }

  /* Staff pages get their own wording, since "Continue to order" is wrong
     for someone opening the kitchen board. */
  if (staff) {
    var lead = document.getElementById('lead');
    if (lead) lead.textContent = staff.key === 'board'
      ? 'Opening the kitchen order board…'
      : (staff.key === 'menu' ? 'Opening the menu editor…' : 'Opening the owner console…');
    var goBtn = document.getElementById('go');
    if (goBtn) goBtn.textContent = 'Continue →';
    var note = document.querySelector('.card-note');
    if (note) note.textContent = 'Staff only — admin key required.';
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

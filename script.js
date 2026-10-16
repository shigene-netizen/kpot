/* KPOT To Go — landing page behaviour.
   ---------------------------------------------------------------------------
   Deliberately tiny: no frameworks, no trackers, nothing to load.

   The only job is to point every "order" button at ONE place, so the link can
   never drift out of sync between the hero, the nav, the menu and the footer.

   ⚠️ ORDER_URL must NOT be the site root. The root is this landing page — a
   button pointing at '/' would just reload the page the visitor is already
   looking at. /order/ is a doorway that forwards straight to the ordering app
   (see order/index.html), and it reads the app's address from target.js, so
   re-publishing the app on a new host never means editing this file. */
(function () {
  'use strict';

  var ORDER_URL = '/order/';

  /* A guest who arrived from a table QR code keeps their table number: the
     landing page passes ?table=7 through to the app, so tapping "Order Online"
     still orders to table 7. */
  var m = location.search.match(/[?&]table=(\d{1,3})\b/i);
  var suffix = m ? '?table=' + encodeURIComponent(m[1]) : '';

  var buttons = document.querySelectorAll('[data-order]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute('href', ORDER_URL + suffix);
  }
})();

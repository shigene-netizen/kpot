/* ============================================================================
   KPOT To Go — redirect target  (THE ONLY FILE YOU EDIT WHEN THE URL CHANGES)
   ============================================================================

   All the printed QR codes on this layer point at THIS site (GitHub Pages),
   and this site forwards to whatever URL is written below.

   When the ordering app is re-published on a new domain, change ONLY the
   string on the next line, commit, and push. Every printed code keeps working
   forever — no reprints.

   Do not add a trailing slash to the table URLs; the query string is appended
   automatically (…/?table=7).
   ---------------------------------------------------------------------------- */

window.KPOT_TARGET = {
  /* The live KPOT To Go ordering page. No trailing slash. */
  baseUrl: 'https://5ecacf1cb5f94d2396d6d1141edc28e6.sg.agentos-app.run',

  /* ⚠️ SECOND READER: the kitchen print agent parses this file to find the app
     (see kpot-order/print-agent/). Two things that break it:
       - leaving the OLD address commented out right above — the agent strips
         comments before matching, so it is safe, but keep only one baseUrl;
       - changing the `baseUrl: '...'` shape (quotes, spacing) — the parser
         matches `baseUrl` followed by a quoted string. */

  /* Shown to a visitor for a moment before the forward happens. */
  storeName: 'KPOT To Go',

  /* milliseconds to wait before redirecting — keep it short. */
  delayMs: 350
};

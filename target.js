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
  baseUrl: 'https://ae14fe556e314f8fb287e0afa6dec55e.sg.agentos-app.run',

  /* Shown to a visitor for a moment before the forward happens. */
  storeName: 'KPOT To Go',

  /* milliseconds to wait before redirecting — keep it short. */
  delayMs: 350
};

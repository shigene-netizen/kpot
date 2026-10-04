"""
KPOT To Go — redirect layer: table page generator
------------------------------------------------------------------
Creates   tables/<n>/index.html   for each table number.

Each page is a copy of the master redirect page with the table number
baked into the visible copy. The actual ?table=N is derived from the
URL path at runtime by app.js, so these files stay tiny and never need
editing when the live URL changes.

Usage:
    python build_tables.py            # uses TABLES below
    python build_tables.py 1 20       # tables 1..20

Re-run after changing TABLE_RANGE. Safe to re-run at any time.
"""

import os
import sys

# This script lives in <project>/_dev/ ; the site root is one level up.
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TABLES = range(1, 13)          # change this if the store needs more tables

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#111014">
<meta name="robots" content="noindex, nofollow">
<title>{store} \u2014 Table {n} \u00b7 Opening\u2026</title>
<link rel="stylesheet" href="../../style.css">
</head>
<body>
<main class="wrap">
  <div class="roundel">K</div>
  <h1 id="store">{store}</h1>
  <p class="lead">Table <strong>{n}</strong> \u00b7 taking you to the menu\u2026</p>

  <a id="go" class="go" href="#" rel="noopener">Continue to order&nbsp;\u2192</a>

  <noscript>
    <p class="note">JavaScript is off. Tap the button above to open the ordering page.</p>
  </noscript>

  <p class="note" id="fallback" hidden>
    Not redirecting? <span id="urlText"></span>
  </p>
</main>

<script src="../../target.js"></script>
<script src="../../app.js"></script>
</body>
</html>
"""


def main():
    store = "KPOT To Go"

    # optional range override:  python build_tables.py 1 20
    if len(sys.argv) >= 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    else:
        lo, hi = min(TABLES), max(TABLES)

    made = 0
    for n in range(lo, hi + 1):
        d = os.path.join(HERE, "tables", str(n))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(TEMPLATE.format(store=store, n=n))
        made += 1

    print(f"  -> tables/{lo}/ .. tables/{hi}/  ({made} pages)")


if __name__ == "__main__":
    main()

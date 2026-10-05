"""
KPOT To Go — build the STAFF redirect pages on the fixed layer
------------------------------------------------------------------
Creates  /staff/board/ , /staff/console/ , /staff/menu/
which the redirect layer forwards to the matching admin page on whatever
domain the ordering app currently lives on.

Why this exists: the staff QR codes used to encode the live app domain, which
changes on every re-publish — so the code taped to the kitchen wall went dead
each time. Printing them against this fixed layer means they never need
reprinting, exactly like the table codes.

Usage:
    python _dev/build_staff.py
"""

import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# key -> (page title, lead text)
PAGES = {
    "board":   ("Kitchen", "Opening the kitchen order board…"),
    "console": ("Owner",   "Opening the owner console…"),
    "menu":    ("Menu",    "Opening the menu editor…"),
}

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#111014">
<meta name="robots" content="noindex, nofollow">
<title>KPOT To Go — {title} · Opening…</title>
<link rel="stylesheet" href="../../style.css">
</head>
<body>
<main class="wrap">
  <div class="roundel">K</div>
  <h1 id="store">KPOT To Go</h1>
  <p class="lead" id="lead">{lead}</p>

  <a id="go" class="go" href="#" rel="noopener">Continue&nbsp;→</a>

  <noscript>
    <p class="note">JavaScript is off. Tap the button above to open the page.</p>
  </noscript>

  <p class="note card-note">Staff only — admin key required.</p>

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
    for key, (title, lead) in PAGES.items():
        d = os.path.join(HERE, "staff", key)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(TPL.format(title=title, lead=lead))
        print("  -> staff/%s/index.html" % key)
    print("Done.")


if __name__ == "__main__":
    main()

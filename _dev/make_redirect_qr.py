"""
KPOT To Go — redirect-layer QR generator
------------------------------------------------------------------
Generates the PRINT-ONCE QR codes that point at the stable GitHub Pages
redirect layer (NOT at the changing platform domain).

Usage:
    python make_redirect_qr.py <github-username>
    python make_redirect_qr.py <github-username> --repo kpot

Outputs into ./qrcodes-stable :
    entry-qr.png       1024px  - generic entry (posters, flyers, takeout)
    entry-qr.svg       vector  - for the print shop
    table-01-qr.png    one per table, encodes  /tables/N/
    table-01-qr.svg    vector per table

These codes NEVER need regenerating when the live ordering domain changes —
only target.js in the redirect layer changes.

Every file is decoded back and checked before the script reports success.
"""

import os
import sys

import qrcode
from qrcode.image.svg import SvgPathImage
from PIL import Image, ImageDraw, ImageFont
from pyzbar.pyzbar import decode as zbar_decode

# This script lives in <project>/_dev/ ; output goes to the project root.
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "qrcodes-stable")
os.makedirs(OUT, exist_ok=True)

RED = (215, 38, 61)
BLACK = (17, 16, 20)
CREAM = (247, 241, 230)
WHITE = (255, 255, 255)

TABLES = range(1, 13)
BRAND = "KPOT TO GO"
CTA = "SCAN TO ORDER & PAY"
SUB = "Korean BBQ · Hot Pot · Boba"


def font(size, bold=False):
    names = (
        ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"]
        if bold else
        ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"]
    )
    roots = [
        r"C:\Windows\Fonts",
        "/usr/share/fonts/truetype/dejavu",
        "/System/Library/Fonts/Supplemental",
        "/Library/Fonts",
    ]
    for r in roots:
        for n in names:
            p = os.path.join(r, n)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    pass
    return ImageFont.load_default()


def centered(draw, y, text, f, fill, width):
    w = draw.textlength(text, font=f)
    draw.text(((width - w) / 2, y), text, font=f, fill=fill)
    return w


def qr_fit(data, target=512, border=2):
    """Render at a WHOLE number of pixels per module.

    Never build a code then resize to an arbitrary size: modules land on
    fractional pixels and scanners become unreliable. This bit us before.
    """
    q = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=border,
    )
    q.add_data(data)
    q.make(fit=True)
    unit = max(4, round(target / (q.modules_count + 2 * border)))
    q.box_size = unit
    return q.make_image(fill_color=BLACK, back_color=WHITE).convert("RGB")


def exact(img, size):
    if img.width == size and img.height == size:
        return img
    canvas = Image.new("RGB", (size, size), WHITE)
    canvas.paste(img, ((size - img.width) // 2, (size - img.height) // 2))
    return canvas


FAILED = []


def verify(path, expect):
    """Decode the saved file back with pyzbar and compare."""
    img = Image.open(path)
    got = [d.data.decode("utf-8") for d in zbar_decode(img)]
    if expect in got:
        return True
    FAILED.append((os.path.basename(path), expect, got))
    return False


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("Usage: python make_redirect_qr.py <github-username> [--repo kpot]")
        sys.exit(1)

    user = args[0].strip()
    repo = "kpot"
    if "--repo" in sys.argv:
        repo = sys.argv[sys.argv.index("--repo") + 1].strip("/")

    base = f"https://{user}.github.io/{repo}"
    print("Redirect layer base:", base)
    print("Generating codes into qrcodes-stable/\n")

    # ---------- 1. generic entry code ----------
    entry_url = base + "/"
    img = exact(qr_fit(entry_url, target=1010, border=3), 1024)
    p = os.path.join(OUT, "entry-qr.png")
    img.save(p, optimize=True)
    ok = verify(p, entry_url)
    print(f"  entry-qr.png          {'OK' if ok else 'DECODE FAILED'}  -> {entry_url}")

    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
    q.add_data(entry_url)
    q.make(fit=True)
    q.make_image(image_factory=SvgPathImage).save(os.path.join(OUT, "entry-qr.svg"))

    # ---------- 2. per-table codes ----------
    for n in TABLES:
        turl = f"{base}/tables/{n}/"
        tq = qr_fit(turl, target=410, border=2)

        CW, CH = 700, 900
        c = Image.new("RGB", (CW, CH), WHITE)
        dd = ImageDraw.Draw(c)
        dd.rectangle([0, 0, CW, 96], fill=RED)
        centered(dd, 22, BRAND, font(40, True), WHITE, CW)

        centered(dd, 130, "TABLE", font(30, True), (130, 125, 120), CW)
        nf = font(150, True)
        nw = dd.textlength(str(n), font=nf)
        dd.text(((CW - nw) / 2, 165), str(n), font=nf, fill=RED)

        qs = 420
        c.paste(exact(tq, qs), ((CW - qs) // 2, 360))

        centered(dd, 800, CTA, font(30, True), BLACK, CW)
        centered(dd, 842, SUB, font(22), (120, 115, 110), CW)

        p = os.path.join(OUT, f"table-{n:02d}-qr.png")
        c.save(p, optimize=True)
        ok = verify(p, turl)

        # vector twin
        q2 = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=12, border=2)
        q2.add_data(turl)
        q2.make(fit=True)
        q2.make_image(image_factory=SvgPathImage).save(
            os.path.join(OUT, f"table-{n:02d}-qr.svg"))

        print(f"  table-{n:02d}-qr.png     {'OK' if ok else 'DECODE FAILED'}  -> {turl}")

    # ---------- 3. staff codes ----------
    # These point at /staff/<key>/ on THIS layer, so they survive a domain
    # change exactly like the table codes. Printed once, taped to the wall.
    #
    # The first entry is the HUB at /staff/ (no key) — it does NOT redirect,
    # it shows a menu of the three pages below. Handy as a single code to
    # stick in the office: scan once, then pick which console you want.
    staff = [
        (None,      "STAFF",   "Menu of all consoles", "staff-hub-qr.png"),
        ("board",   "KITCHEN", "Live order board",   "staff-board-qr.png"),
        ("console", "OWNER",   "Console & QR codes", "staff-console-qr.png"),
        ("menu",    "MENU",    "Edit prices live",   "staff-menu-qr.png"),
    ]
    for key, label, blurb, fname in staff:
        surl = f"{base}/staff/{key}/" if key else f"{base}/staff/"
        sq = qr_fit(surl, target=410, border=2)

        CW, CH = 700, 900
        c = Image.new("RGB", (CW, CH), BLACK)
        dd = ImageDraw.Draw(c)
        dd.rectangle([0, 0, CW, 96], fill=RED)
        centered(dd, 22, BRAND, font(40, True), WHITE, CW)

        centered(dd, 130, "STAFF ONLY", font(30, True), (200, 195, 190), CW)
        centered(dd, 172, label, font(76, True), WHITE, CW)

        qs = 420
        c.paste(exact(sq, qs), ((CW - qs) // 2, 300))

        centered(dd, 760, "SCAN TO OPEN", font(34, True), RED, CW)
        centered(dd, 806, blurb, font(24), (170, 165, 160), CW)
        centered(dd, 846, "Admin key required (once per device)",
                 font(20), (140, 136, 132), CW)

        p = os.path.join(OUT, fname)
        c.save(p, optimize=True)
        ok = verify(p, surl)

        q2 = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=12, border=2)
        q2.add_data(surl)
        q2.make(fit=True)
        q2.make_image(image_factory=SvgPathImage).save(
            os.path.join(OUT, fname.replace(".png", ".svg")))

        print(f"  {fname:<22}{'OK' if ok else 'DECODE FAILED'}  -> {surl}")

    print()
    total = 1 + len(list(TABLES)) + len(staff)
    if FAILED:
        print(f"!! {len(FAILED)} of {total} codes did NOT decode. Fix before printing:")
        for name, want, got in FAILED:
            print(f"   {name}\n     wanted: {want}\n     got:    {got}")
        sys.exit(2)

    print(f"All {total} codes generated and decoded OK.")
    print("These are the PRINT-ONCE codes — they never need regenerating.")
    print("Files in", OUT)


if __name__ == "__main__":
    main()

# 👟 Kicks Check

A single-page web app for your iPhone that scans a shoe box's barcode/QR code,
identifies the shoe, and helps you decide whether the price is a good deal.

It's **100% client-side** — no server, no accounts, no API keys, nothing
uploaded. Just static files you host anywhere with HTTPS.

## What it does

1. **Scan** the UPC barcode or QR code on the box with your camera.
   Decoding runs on-device via [ZXing](https://github.com/zxing-js/library).
2. **Identifies** the shoe from a small built-in catalog (name + MSRP), or
   falls back to showing the raw style/UPC for unknown shoes.
3. **Discount check** — enter the in-store sticker price (or tap **📷
   Auto-fill from a sticker photo** to read it with on-device OCR via
   [Tesseract.js](https://github.com/naptha/tesseract.js)) and it shows the
   percentage off MSRP with a plain-English verdict. OCR also reads the style
   code off the label as a second way to identify the shoe.
4. **Real resale comps** — one-tap links to **eBay sold listings, StockX,
   GOAT, and Google Shopping** for the exact model. This is the honest answer
   to "is it a good price?", because the box only knows MSRP, not resale value.

### Why the resale links matter

A barcode identifies the shoe; it does **not** contain any market price.
There's no free, key-free, browser-usable API for sneaker resale values, so
rather than fake a number the app sends you straight to the marketplaces where
the real answer lives.

## Two ways to run it on your iPhone

The whole app is a **single self-contained `index.html`** (styles, logic, and
catalog inlined). It still pulls the scanner/OCR libraries from a CDN, so you
need internet the first time.

### Option A — just save the file (no hosting)

1. Get `index.html` onto your phone (AirDrop it, email it to yourself, or
   save it from the repo).
2. Open it in **Safari** (Files app → tap the file → Share → open in Safari,
   or "Open in Safari").
3. Tap **📷 Read a photo** and snap the box label — it decodes the barcode
   **and** reads the sticker price from one photo.

> **Why photo mode here?** iOS only allows the *live* camera (`getUserMedia`)
> on a hosted `https://` page — never on a saved `file://` page. The photo
> path uses the native camera/photo picker, which works from a saved file,
> so you get the full flow without hosting anything. Option B adds live
> point-and-scan.

### Option B — host it for live scanning (GitHub Pages)

For live point-at-the-barcode scanning, serve it from a secure origin. The
easiest free host is **GitHub Pages**:

1. Push this repo to GitHub.
2. Repo → **Settings → Pages → Build and deployment**.
   Set **Source: Deploy from a branch**, branch = your branch (or `main`),
   folder = `/ (root)`. Save.
3. Open the given `https://<you>.github.io/<repo>/` URL in **Safari** on your
   iPhone, tap **Start camera**, and allow camera access.
4. Optional: **Share → Add to Home Screen** to use it like a native app.

### Test locally

```bash
# any static server works; camera needs https or localhost
python3 -m http.server 8000
# then open http://localhost:8000 (localhost is treated as secure)
```

## Adding more shoes

Edit the `window.SHOE_CATALOG` block near the bottom of
[`index.html`](index.html). Each entry is keyed by 12-digit UPC and by style
code (no dash). Unknown shoes still work — you just confirm the MSRP by hand.

```js
byUpc: {
  "193151456335": { name: "Nike Air Tailwind 79", colorway: "Black / White – Team Orange", style: "487754-012", msrp: 90 }
}
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole app — markup, styles, scanning/OCR logic, and the shoe catalog, all in one self-contained file |
| `manifest.webmanifest`, `icon.svg` | Add-to-Home-Screen support (used when hosted) |

## Limitations

- Verdict % is measured against **MSRP only** — always tap the resale links
  for the true market picture.
- The camera decoder (and OCR) needs decent light and a steady, close shot.
- OCR runs on-device and downloads its model (~a few MB) the first time you
  use it; accuracy varies with lighting and glare on the sticker.
- The built-in catalog is a starter set; most boxes will scan as "Unknown"
  until you add them (the app still works, you just confirm the MSRP).

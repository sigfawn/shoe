# 👟 Kicks Check

A single-page web app for your iPhone that reads a shoe box's **label and price
sticker with your camera** and helps you decide whether the price is a good deal
— then saves each box to a running list so you can work down a whole shelf.

It's **100% client-side** — no server, no accounts, no API keys, nothing
uploaded. Just static files you host anywhere with HTTPS.

> **No barcodes.** The barcode only encodes a UPC — it has no price, and you'd
> need a catalog to turn it into a name. Since the app OCRs the name *and* the
> price off the label anyway, the barcode was dead weight, so it's gone. Pure
> OCR ([Tesseract.js](https://github.com/naptha/tesseract.js)).

## What it does

1. **Point** the camera so the box's **label fills the frame** (name + size box
   + price sticker). It reads on the fly and shows two ✓ chips — **Name** and
   **Price** — filling in as it captures each.
2. **Keeps trying until it's sure.** The name is only confirmed once its words
   **recur across several frames** (this scrubs OCR noise like `ee NIKE COURT
   ROYALE SUGE TAR` down to `NIKE COURT ROYALE`); a price is only accepted once
   the **same value reads twice**. Shaky/half reads keep scanning instead of
   saving garbage — so hold steady on each box for a second.
3. **Saves the box** once it has a name + price: a **✓ toast** fires and it's
   added to the list below, then you move to the next box. Can't read the tiny
   price sticker (common — it's small)? Type it in the prompt, or tap **Save
   name only**.
4. **Each saved box** shows the discount vs the "was" price (when read) and
   one-tap **eBay sold / StockX / GOAT / Google Shopping** links — the honest
   answer to "good price?", since the box only knows MSRP, not resale value.
   Every item has an **Edit price** and remove button.

### Why the resale links matter

A barcode identifies the shoe; it does **not** contain any market price.
There's no free, key-free, browser-usable API for sneaker resale values, so
rather than fake a number the app sends you straight to the marketplaces where
the real answer lives.

## Two ways to run it on your iPhone

The whole app is a **single self-contained `index.html`** (styles + logic
inlined). It pulls the OCR library from a CDN, so you need internet the first
time.

### Option A — just save the file (no hosting)

1. Get `index.html` onto your phone (AirDrop it, email it to yourself, or
   save it from the repo).
2. Open it in **Safari** (Files app → tap the file → Share → open in Safari,
   or "Open in Safari").
3. Tap **📷 Read a photo** and snap the box label — it OCRs the name and price
   from one photo and saves it to the list.

> **Why photo mode here?** iOS only allows the *live* camera (`getUserMedia`)
> on a hosted `https://` page — never on a saved `file://` page. The photo
> path uses the native camera/photo picker, which works from a saved file,
> so you get the full flow without hosting anything. Option B adds the live,
> continuous scanning.

### Option B — host it for live scanning (GitHub Pages)

For live continuous scanning, serve it from a secure origin. The
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

## Add a box by hand

No catalog to maintain — the app reads everything off the label. If the camera
can't get a box (bad light, torn label), open **"Add a box by hand"** on the
scan screen and type the name + price; it lands in the same list.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole app — markup, styles, camera + OCR logic, and the saved list, all in one self-contained file |
| `manifest.webmanifest`, `icon.svg` | Add-to-Home-Screen support (used when hosted) |

## Limitations

- Verdict % is measured against **MSRP only** — always tap the resale links
  for the true market picture.
- The camera decoder (and OCR) needs decent light and a steady, close shot.
- OCR runs on-device and downloads its model (~a few MB) the first time you
  use it. **Fill the frame with the label** — the app crops, upscales, and
  contrast-boosts that region before reading it; a label that's small in the
  frame won't resolve.
- Reading the model **name** is reliable when you hold steady (it needs a few
  agreeing frames); a fast pan won't confirm — that's deliberate, so it never
  saves a garbled name.
- Reading the tiny **price sticker** live is hit-or-miss (small text,
  strikethrough on the "WAS" price). When it can't, you type the price in the
  prompt — that's expected, not a failure. **📷 Read a photo** (a close-up of
  the label) often does better than the live feed.

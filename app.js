/* Kicks Check — scan a shoe box, judge the price. Pure client-side. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    video: $("video"),
    reticle: $("reticle"),
    placeholder: $("scanPlaceholder"),
    scanBtn: $("scanBtn"),
    stopBtn: $("stopBtn"),
    status: $("scanStatus"),
    resultCard: $("resultCard"),
    scanCard: $("scanCard"),
    shoeName: $("shoeName"),
    shoeMeta: $("shoeMeta"),
    idBadge: $("idBadge"),
    msrp: $("msrpInput"),
    price: $("priceInput"),
    verdict: $("verdict"),
    vEmoji: $("verdictEmoji"),
    vLabel: $("verdictLabel"),
    vSub: $("verdictSub"),
    vNote: $("verdictNote"),
    discountFill: $("discountFill"),
    compLinks: $("compLinks"),
    scanAgain: $("scanAgainBtn"),
    manualUpc: $("manualUpc"),
    manualStyle: $("manualStyle"),
    manualBtn: $("manualBtn"),
    helpBtn: $("helpBtn"),
    helpDialog: $("helpDialog"),
    helpClose: $("helpClose"),
  };

  const CATALOG = window.SHOE_CATALOG || { byUpc: {}, byStyle: {} };
  let reader = null;
  let running = false;
  // current identified shoe context, so links + verdict can use it
  let current = { name: null, style: null, upc: null, colorway: null };

  /* ---------- Scanning ---------- */

  function makeReader() {
    const ZX = window.ZXing;
    const hints = new Map();
    hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [
      ZX.BarcodeFormat.UPC_A,
      ZX.BarcodeFormat.UPC_E,
      ZX.BarcodeFormat.EAN_13,
      ZX.BarcodeFormat.EAN_8,
      ZX.BarcodeFormat.QR_CODE,
    ]);
    hints.set(ZX.DecodeHintType.TRY_HARDER, true);
    return new ZX.BrowserMultiFormatReader(hints, 400);
  }

  async function startScan() {
    if (running) return;
    if (!window.ZXing) {
      setStatus("Scanner library didn't load — check your connection, or enter it by hand below.");
      return;
    }
    setStatus("Starting camera…");
    els.scanBtn.hidden = true;
    els.stopBtn.hidden = false;
    try {
      reader = reader || makeReader();
      // Prefer the rear camera.
      let deviceId = null;
      try {
        const devices = await reader.listVideoInputDevices();
        const back = devices.find((d) => /back|rear|environment/i.test(d.label));
        deviceId = (back || devices[devices.length - 1] || {}).deviceId || null;
      } catch (_) { /* fall through to constraint-based */ }

      const onResult = (result, err) => {
        if (result) handleScan(result.getText(), result.getBarcodeFormat());
      };

      if (deviceId) {
        await reader.decodeFromVideoDevice(deviceId, els.video, onResult);
      } else {
        await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          els.video,
          onResult
        );
      }
      running = true;
      els.placeholder.hidden = true;
      els.reticle.hidden = false;
      setStatus("Point at the barcode or QR code…");
    } catch (e) {
      stopScan();
      if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
        setStatus("Camera blocked. Allow camera access (needs an https page), or enter it by hand below.");
      } else {
        setStatus("Couldn't start the camera. Try the manual entry below.");
      }
    }
  }

  function stopScan() {
    running = false;
    try { if (reader) reader.reset(); } catch (_) {}
    els.scanBtn.hidden = false;
    els.stopBtn.hidden = true;
    els.reticle.hidden = true;
    els.placeholder.hidden = false;
  }

  let lastValue = null;
  let lastAt = 0;
  function handleScan(text, format) {
    const now = Date.now();
    if (text === lastValue && now - lastAt < 2500) return; // debounce repeats
    lastValue = text;
    lastAt = now;
    if (navigator.vibrate) navigator.vibrate(40);

    const fmt = String(format || "");
    if (fmt.includes("QR")) {
      handleQr(text);
    } else {
      identifyByUpc(onlyDigits(text));
    }
  }

  function handleQr(text) {
    // Nike QR usually holds a product URL. Pull a style code if present,
    // otherwise keep the link so the user can open the official page.
    const styleMatch = text.match(/\b([A-Z]{2}\d{4}|\d{6})[-\s]?(\d{3})\b/);
    if (styleMatch) {
      identifyByStyle(styleMatch[1] + styleMatch[2]);
    }
    if (/^https?:\/\//i.test(text)) {
      current.qrUrl = text;
    }
    if (!styleMatch) {
      showResult({ name: null }, "QR");
      setStatus("Read a QR code. If it didn't identify the shoe, scan the barcode too.");
    }
  }

  /* ---------- Identify ---------- */

  function identifyByUpc(upc) {
    if (!upc || upc.length < 8) {
      setStatus("That didn't look like a valid barcode. Try again, steady and close.");
      return;
    }
    current.upc = upc;
    const hit = CATALOG.byUpc[upc];
    showResult(hit || { name: null }, hit ? "Matched" : "Scanned");
  }

  function identifyByStyle(styleDigits) {
    const key = onlyAlnum(styleDigits).toUpperCase();
    current.style = key;
    const hit = CATALOG.byStyle[key];
    showResult(hit || { name: null, style: prettyStyle(key) }, hit ? "Matched" : "Scanned");
  }

  /* ---------- Result UI ---------- */

  function showResult(shoe, badge) {
    stopScan();
    current.name = shoe.name || current.name || null;
    current.style = shoe.style || current.style || (current.style ? prettyStyle(current.style) : null);
    current.colorway = shoe.colorway || current.colorway || null;

    els.scanCard.hidden = true;
    els.resultCard.hidden = false;
    els.idBadge.textContent = badge || "Scanned";

    if (shoe.name) {
      els.shoeName.textContent = shoe.name;
      const bits = [shoe.colorway, prettyStyle(shoe.style)].filter(Boolean);
      els.shoeMeta.textContent = bits.join("  ·  ");
    } else {
      els.shoeName.textContent = "Unknown shoe";
      const bits = [];
      if (current.style) bits.push("Style " + prettyStyle(current.style));
      if (current.upc) bits.push("UPC " + current.upc);
      els.shoeMeta.textContent = bits.length
        ? bits.join("  ·  ") + " — confirm the MSRP below"
        : "Enter the MSRP printed on the box";
    }

    // Prefill MSRP when we know it.
    if (shoe.msrp) {
      els.msrp.value = shoe.msrp;
    }
    els.price.focus({ preventScroll: true });
    buildCompLinks();
    updateVerdict();
    els.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildCompLinks() {
    const q = searchTerms();
    const enc = encodeURIComponent(q);
    const links = [
      { label: "eBay sold", url: `https://www.ebay.com/sch/i.html?_nkw=${enc}&LH_Sold=1&LH_Complete=1`, full: false },
      { label: "StockX", url: `https://stockx.com/search?s=${enc}`, full: false },
      { label: "GOAT", url: `https://www.goat.com/search?query=${enc}`, full: false },
      { label: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${enc}`, full: false },
    ];
    if (current.qrUrl) {
      links.push({ label: "Open box QR link ↗", url: current.qrUrl, full: true });
    }
    els.compLinks.innerHTML = "";
    links.forEach((l) => {
      const a = document.createElement("a");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = l.label;
      if (l.full) a.className = "full";
      els.compLinks.appendChild(a);
    });
  }

  function searchTerms() {
    if (current.name) {
      const s = prettyStyle(current.style);
      return [current.name, s].filter(Boolean).join(" ");
    }
    if (current.style) return "sneaker " + prettyStyle(current.style);
    if (current.upc) return current.upc;
    return "sneaker";
  }

  /* ---------- Verdict ---------- */

  function num(v) {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : NaN;
  }

  function updateVerdict() {
    const msrp = num(els.msrp.value);
    const price = num(els.price.value);
    if (!(msrp > 0) || !(price >= 0)) {
      els.verdict.hidden = true;
      return;
    }
    els.verdict.hidden = false;

    const off = (msrp - price) / msrp; // fraction off MSRP
    const pct = Math.round(off * 100);
    const fillPct = Math.max(0, Math.min(100, pct));
    els.discountFill.style.width = fillPct + "%";

    let emoji, label, color, note;
    if (price >= msrp) {
      emoji = "🚩"; label = "At or above retail"; color = "var(--bad)";
      note = "No discount off MSRP. Only worth it if resale runs higher — check the sold links.";
    } else if (off >= 0.5) {
      emoji = "🔥"; label = `Great — ${pct}% off MSRP`; color = "var(--good)";
      note = "Steep discount. Still confirm resale isn't even lower for this model.";
    } else if (off >= 0.3) {
      emoji = "✅"; label = `Good — ${pct}% off MSRP`; color = "var(--good)";
      note = "Solid outlet-level discount for a general release.";
    } else if (off >= 0.15) {
      emoji = "🤔"; label = `Okay — ${pct}% off MSRP`; color = "var(--ok)";
      note = "Modest discount. Common shoes often sell for less on resale — check first.";
    } else {
      emoji = "😐"; label = `Small — ${pct}% off MSRP`; color = "var(--ok)";
      note = "Barely a discount. Worth comparing against sold listings before buying.";
    }

    els.vEmoji.textContent = emoji;
    els.vLabel.textContent = label;
    els.vSub.textContent = `$${price.toFixed(2)} vs $${msrp.toFixed(2)} MSRP`;
    els.vNote.textContent = note;
    els.discountFill.style.background = color;
  }

  /* ---------- Helpers ---------- */

  function onlyDigits(s) { return String(s).replace(/\D/g, ""); }
  function onlyAlnum(s) { return String(s).replace(/[^a-zA-Z0-9]/g, ""); }
  function prettyStyle(s) {
    if (!s) return "";
    const k = onlyAlnum(s).toUpperCase();
    // Nike style codes: 6 chars + 3 digits -> XXXXXX-000
    if (/^[A-Z0-9]{6}\d{3}$/.test(k)) return k.slice(0, 6) + "-" + k.slice(6);
    return s;
  }
  function setStatus(msg) { els.status.textContent = msg; }

  function resetToScan() {
    current = { name: null, style: null, upc: null, colorway: null };
    lastValue = null;
    els.msrp.value = "";
    els.price.value = "";
    els.manualUpc.value = "";
    els.manualStyle.value = "";
    els.verdict.hidden = true;
    els.resultCard.hidden = true;
    els.scanCard.hidden = false;
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- Events ---------- */

  els.scanBtn.addEventListener("click", startScan);
  els.stopBtn.addEventListener("click", () => { stopScan(); setStatus(""); });
  els.scanAgain.addEventListener("click", resetToScan);
  els.msrp.addEventListener("input", updateVerdict);
  els.price.addEventListener("input", updateVerdict);

  els.manualBtn.addEventListener("click", () => {
    const upc = onlyDigits(els.manualUpc.value);
    const style = els.manualStyle.value.trim();
    if (style) {
      current.upc = upc || null;
      identifyByStyle(style);
    } else if (upc) {
      identifyByUpc(upc);
    } else {
      setStatus("Type a barcode number or a style code first.");
    }
  });

  els.helpBtn.addEventListener("click", () => els.helpDialog.showModal());
  els.helpClose.addEventListener("click", () => els.helpDialog.close());
  els.helpDialog.addEventListener("click", (e) => {
    if (e.target === els.helpDialog) els.helpDialog.close();
  });

  // Stop the camera if the page is hidden (saves battery, releases the lens).
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) stopScan();
  });
})();

// Tiny built-in catalog so known shoes auto-fill their name + MSRP.
// Keyed by UPC (12-digit) and by style code (normalized, no dash).
// This is a starter list — add more as you scan them. Unknown shoes still
// work: the app just asks you to confirm the MSRP by hand.
window.SHOE_CATALOG = {
  byUpc: {
    "193151456335": {
      name: "Nike Air Tailwind 79",
      colorway: "Black / White – Team Orange",
      style: "487754-012",
      msrp: 90,
    },
  },
  byStyle: {
    "487754012": {
      name: "Nike Air Tailwind 79",
      colorway: "Black / White – Team Orange",
      style: "487754-012",
      msrp: 90,
    },
  },
};

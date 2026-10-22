// Format uang untuk dashboard dengan nilai penuh dan pemisah ribuan Indonesia.

const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const UNITS = [
  { div: 1e12, suffix: "T" },
  { div: 1e9, suffix: "M" },
  { div: 1e6, suffix: "jt" },
] as const;

export interface MoneyParts {
  /** Angka utama, mis. "845.000" atau "64,2" */
  amount: string;
  /** Satuan singkatan, mis. "jt". Kosong kalau angka penuh. */
  suffix: string;
  /** Nilai penuh untuk tooltip / aria-label, mis. "Rp 64.151.000" */
  full: string;
}

export function moneyParts(value: number | null | undefined): MoneyParts {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  const full = `${sign}Rp ${nf0.format(abs)}`;

  for (const u of UNITS) {
    // Dibulatkan dulu agar 999,96 jt naik jadi "1 M", bukan "1.000 jt".
    if (Math.round((abs / u.div) * 10) / 10 >= 1) {
      return { amount: sign + nf1.format(abs / u.div), suffix: u.suffix, full };
    }
  }
  return { amount: sign + nf0.format(abs), suffix: "", full };
}

/** Contoh: 1100000 -> "Rp 1.100.000". */
export function formatMoney(value: number | null | undefined): string {
  return moneyParts(value).full;
}

// Helper format angka untuk dashboard (locale Indonesia).

const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/** 1234.5 -> "1.234,5" */
export function formatNumber(value: number): string {
  return decimal.format(value)
}

/** 6.2 -> "6,2%" */
export function formatPercent(value: number): string {
  return `${decimal.format(value)}%`
}

/** 198600000 -> "Rp 198.600.000" */
export function formatRupiah(value: number): string {
  return `Rp ${integer.format(value)}`
}

/** 198600000 -> "Rp 198,6 jt" · 5500000 -> "Rp 5,5 jt" · 262698 -> "Rp 262,7 rb" */
export function formatRupiahCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `Rp ${decimal.format(value / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `Rp ${decimal.format(value / 1_000_000)} jt`
  if (abs >= 1_000) return `Rp ${decimal.format(value / 1_000)} rb`
  return `Rp ${integer.format(value)}`
}

/** "Dewi Anggraini" -> "DA" */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

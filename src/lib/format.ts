const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatters = new Map<string, Intl.NumberFormat>();

function nf(currency: string, decimals: number) {
  const key = `${currency}:${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, f);
  }
  return f;
}

/** `$553,359.89` — currency formatting with fixed decimals (count-up safe). */
export function money(value: number, decimals = 2, currency = "USD") {
  const d = currency === "JPY" ? 0 : decimals;
  return nf(currency, d).format(value);
}

export function signedMoney(value: number, direction: "in" | "out", decimals = 0) {
  return `${direction === "in" ? "+" : "-"}${money(value, decimals)}`;
}

const plain = new Intl.NumberFormat("en-US");
export function int(value: number) {
  return plain.format(Math.round(value));
}

function parts(at: string) {
  const [d, t = "00:00"] = at.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  return { y, m, day, hh, mm };
}

/** `17 Apr, 2026 03:45 PM` (timezone-free, deterministic on server and client). */
export function dateTime(at: string) {
  const { y, m, day, hh, mm } = parts(at);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${day} ${MONTHS[m - 1]}, ${y} ${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
}

/** `12 Apr` */
export function dayMonth(date: string) {
  const { m, day } = parts(date);
  return `${day} ${MONTHS[m - 1]}`;
}

/** `Jun 2026` from `2026-06` */
export function monthYear(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function timeOfDay(at: string) {
  const { hh, mm } = parts(at);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
}

/** Current local time as `YYYY-MM-DDTHH:mm` (event handlers only — never during render). */
export function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function compactK(value: number) {
  return value === 0 ? "0k" : `${Math.round(value / 1000)}k`;
}

export function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export const MONTH_NAMES = MONTHS;

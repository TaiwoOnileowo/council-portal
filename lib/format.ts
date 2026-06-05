export function formatAmount(naira: number) {
  return `₦${naira.toLocaleString("en-NG")}`;
}

export function formatWithCommas(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

export function parseAmount(value: string) {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

export function parse24(time: string) {
  const [h, m] = time.split(":").map(Number);
  const isPM = h >= 12;
  return { hours12: h % 12 || 12, minutes: m ?? 0, isPM };
}

export function to24(hours12: number, minutes: number, isPM: boolean) {
  const h = isPM ? (hours12 % 12) + 12 : hours12 % 12;
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

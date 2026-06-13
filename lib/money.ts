export const COMMISSION_NAIRA = 1000;
export const COMMISSION_KOBO = COMMISSION_NAIRA * 100;

export const MIN_ROUTE_PRICE_NAIRA = COMMISSION_NAIRA;

export const MIN_PAYOUT_NAIRA = 1000;
export const MIN_PAYOUT_KOBO = MIN_PAYOUT_NAIRA * 100;

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

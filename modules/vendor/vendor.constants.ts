import { cacheGet, cacheSet } from "@/lib/cache";

const APPROVED_VENDORS_KEY = "approved-vendors";

const FALLBACK_APPROVED_VENDORS: string[] = [
  "swiftmove@vendor.council.ng",
  "campusride@vendor.council.ng",
  "cuexpress@vendor.council.ng",
];

const normalize = (email: string) => email.toLowerCase().trim();

export async function getApprovedVendors(): Promise<string[]> {
  const list = await cacheGet<string[]>(APPROVED_VENDORS_KEY);
  return list ?? FALLBACK_APPROVED_VENDORS;
}

export async function setApprovedVendors(emails: string[]): Promise<void> {
  await cacheSet(APPROVED_VENDORS_KEY, emails.map(normalize));
}

export async function isApprovedVendor(email: string): Promise<boolean> {
  const list = await getApprovedVendors();
  return list.map(normalize).includes(normalize(email));
}

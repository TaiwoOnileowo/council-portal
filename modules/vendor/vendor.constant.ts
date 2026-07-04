import { cacheGet, cacheSet } from "@/lib/cache";

const APPROVED_VENDORS_KEY = "approved-vendors";

const DEFAULT_APPROVED_VENDORS: string[] = [
  "taiwoonileowo17@gmail.com",
  "Sratnigeria@gmail.com",
  "movelitehq@gmail.com",
  "Hellosnugride@gmail.com",
  "swift.rides.official@gmail.com",
  "tobilobaarogundade07@gmail.com",
  "davidcityconsulting247@gmail.com",
];

const normalize = (email: string) => email.toLowerCase().trim();

export async function getApprovedVendors(): Promise<string[]> {
  // const list = await cacheGet<string[]>(APPROVED_VENDORS_KEY);
  return DEFAULT_APPROVED_VENDORS;
}

export async function setApprovedVendors(emails: string[]): Promise<void> {
  await cacheSet(APPROVED_VENDORS_KEY, emails.map(normalize));
}

export async function isApprovedVendor(email: string): Promise<boolean> {
  const list = await getApprovedVendors();
  return list.map(normalize).includes(normalize(email));
}

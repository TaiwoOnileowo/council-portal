import { getSetting } from "@/lib/settings";

const normalize = (email: string) => email.toLowerCase().trim();

export async function getApprovedVendors(): Promise<string[]> {
  return getSetting("approved_vendors");
}

export async function isApprovedVendor(email: string): Promise<boolean> {
  const list = await getApprovedVendors();
  return list.map(normalize).includes(normalize(email));
}

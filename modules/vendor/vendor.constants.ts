export const APPROVED_VENDOR_EMAILS: string[] = [
  "swiftmove@vendor.council.ng",
  "campusride@vendor.council.ng",
  "cuexpress@vendor.council.ng",
  // Add more approved vendor emails here
];

export function isApprovedVendor(email: string): boolean {
  return APPROVED_VENDOR_EMAILS.includes(email.toLowerCase().trim());
}

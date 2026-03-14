import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function VendorProfilePage() {
  const session = await auth();
  if (!session?.user?.isVendor) redirect("/vendor-gate");

  const vendor = await db.vendor.findUnique({ where: { id: session.user.id } });
  if (!vendor) redirect("/vendor-gate");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-portal-text">Vendor Profile</h1>
        <p className="text-portal-muted text-sm mt-1">Manage your public vendor profile</p>
      </div>

      <div className="bg-portal-surface rounded-2xl border border-portal-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          {vendor.image ? (
            <img
              src={vendor.image}
              alt={`${vendor.firstName} ${vendor.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-portal-accent flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {vendor.firstName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-heading text-lg font-bold text-portal-text">
              {vendor.firstName} {vendor.lastName}
            </h2>
            <p className="text-portal-muted text-sm">{vendor.email}</p>
            {vendor.tagline && (
              <p className="text-portal-text2 text-sm mt-1 italic">"{vendor.tagline}"</p>
            )}
          </div>
        </div>

        {vendor.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-muted mb-1">About</p>
            <p className="text-portal-text2 text-sm">{vendor.description}</p>
          </div>
        )}

        {(vendor.tiktok || vendor.instagram) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-portal-muted mb-2">Socials</p>
            <div className="flex gap-3">
              {vendor.instagram && (
                <a
                  href={vendor.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-portal-accent hover:underline"
                >
                  Instagram
                </a>
              )}
              {vendor.tiktok && (
                <a
                  href={vendor.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-portal-accent hover:underline"
                >
                  TikTok
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

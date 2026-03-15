"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Check, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { updateVendorPersonalInfo } from "@/lib/actions/vendor.action";
import { updateVendorPersonalInfoSchema } from "@/lib/validations/vendor";

type ProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
};

type FieldErrors = Partial<Record<keyof ProfileFields, string>>;

type Props = {
  vendor: ProfileFields & { id: string };
};

const inputCls = (err?: string) =>
  `w-full text-[13.5px] text-portal-text bg-portal-bg border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all`;

export default function VendorProfileDetails({ vendor }: Props) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileFields>({
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
  });
  const [draft, setDraft] = useState<ProfileFields>({ ...profile });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function startEdit() {
    setDraft({ ...profile });
    setErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...profile });
    setErrors({});
    setEditing(false);
  }

  async function saveEdit() {
    const parsed = updateVendorPersonalInfoSchema.safeParse(draft);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProfileFields;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setLoading(true);
    const result = await updateVendorPersonalInfo({
      vendorId: vendor.id,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
    });
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setProfile({ ...draft });
    setEditing(false);
    toast.success("Profile updated successfully");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.14, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-[15px] font-bold text-portal-text">
          Personal Information
        </h3>
        {!editing ? (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-portal-muted hover:text-portal-text px-2.5 py-1.5 rounded-lg border border-portal-border transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            First Name
          </label>
          {editing ? (
            <>
              <input
                type="text"
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                className={inputCls(errors.firstName)}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
              )}
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">
              {profile.firstName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Last Name
          </label>
          {editing ? (
            <>
              <input
                type="text"
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                className={inputCls(errors.lastName)}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
              )}
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">
              {profile.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
          Email Address
        </label>
        {editing ? (
          <>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={inputCls(errors.email)}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 pl-6">{errors.email}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2.5 py-2">
            <Mail className="w-4 h-4 text-portal-muted flex-shrink-0" />
            <p className="text-[13.5px] font-medium text-portal-text">{profile.email}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

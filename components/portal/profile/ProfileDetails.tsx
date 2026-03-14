"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Pencil,
  Check,
  X,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/user.action";
import { updateProfileSchema, LEVELS } from "@/lib/validations/auth";

type ProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  department: string;
};

type FieldErrors = Partial<Record<keyof ProfileFields, string>>;

type Props = {
  user: ProfileFields & { id: string };
};

const inputCls = (err?: string) =>
  `w-full text-[13.5px] text-portal-text bg-portal-bg border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all`;

export default function ProfileDetails({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileFields>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    matricNumber: user.matricNumber,
    level: user.level,
    department: user.department,
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
    const parsed = updateProfileSchema.safeParse(draft);
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
    const result = await updateProfile({ userId: user.id, ...draft });
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

      <div className="space-y-4">
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
                  placeholder="you@stu.cu.edu.ng"
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

        {/* Phone */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Phone Number
          </label>
          {editing ? (
            <>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-portal-muted flex-shrink-0" />
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setDraft({ ...draft, phone: digits });
                  }}
                  placeholder="08012345678"
                  inputMode="numeric"
                  maxLength={11}
                  className={inputCls(errors.phone)}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500 pl-6">{errors.phone}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Phone className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{profile.phone}</p>
            </div>
          )}
        </div>

        {/* Matric Number */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Matric Number
          </label>
          {editing ? (
            <>
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-portal-muted flex-shrink-0" />
                <input
                  type="text"
                  value={draft.matricNumber}
                  onChange={(e) => setDraft({ ...draft, matricNumber: e.target.value })}
                  placeholder="23CG03000"
                  className={inputCls(errors.matricNumber)}
                />
              </div>
              {errors.matricNumber && (
                <p className="mt-1 text-xs text-red-500 pl-6">{errors.matricNumber}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <GraduationCap className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{profile.matricNumber}</p>
            </div>
          )}
        </div>

        {/* Level */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Level
          </label>
          {editing ? (
            <>
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-portal-muted flex-shrink-0" />
                <select
                  value={draft.level}
                  onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                  className={inputCls(errors.level)}
                >
                  <option value="" disabled>Select level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </div>
              {errors.level && (
                <p className="mt-1 text-xs text-red-500 pl-6">{errors.level}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <BookOpen className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{profile.level} Level</p>
            </div>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Department
          </label>
          {editing ? (
            <>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-portal-muted flex-shrink-0" />
                <input
                  type="text"
                  value={draft.department}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                  placeholder="Computer Engineering"
                  className={inputCls(errors.department)}
                />
              </div>
              {errors.department && (
                <p className="mt-1 text-xs text-red-500 pl-6">{errors.department}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Building2 className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{profile.department}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

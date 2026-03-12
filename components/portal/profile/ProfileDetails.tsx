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
import { mockProfile, type UserProfile } from "./profileData";

const fields: {
  key: keyof UserProfile;
  label: string;
  icon: typeof Mail;
  editable: boolean;
}[] = [
  { key: "email", label: "Email Address", icon: Mail, editable: true },
  { key: "phone", label: "Phone Number", icon: Phone, editable: true },
  {
    key: "matricNumber",
    label: "Matric Number",
    icon: GraduationCap,
    editable: false,
  },
  { key: "level", label: "Level", icon: BookOpen, editable: false },
  { key: "department", label: "Department", icon: Building2, editable: false },
  { key: "faculty", label: "Faculty", icon: Building2, editable: false },
];

export default function ProfileDetails() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [draft, setDraft] = useState<UserProfile>(mockProfile);

  function startEdit() {
    setDraft({ ...profile });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...profile });
    setEditing(false);
  }

  function saveEdit() {
    setProfile({ ...draft });
    setEditing(false);
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
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save
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
            <input
              type="text"
              value={draft.firstName}
              onChange={(e) =>
                setDraft({ ...draft, firstName: e.target.value })
              }
              className="w-full text-[13.5px] text-portal-text bg-portal-bg border border-portal-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 focus:border-portal-accent transition-all"
            />
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
            <input
              type="text"
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              className="w-full text-[13.5px] text-portal-text bg-portal-bg border border-portal-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 focus:border-portal-accent transition-all"
            />
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">
              {profile.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Other fields */}
      <div className="space-y-3">
        {fields.map((field) => {
          const Icon = field.icon;
          const value = editing ? draft[field.key] : profile[field.key];
          return (
            <div key={field.key}>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
                {field.label}
              </label>
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-portal-muted flex-shrink-0" />
                {editing && field.editable ? (
                  <input
                    type={field.key === "email" ? "email" : "text"}
                    value={value as string}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                    className="flex-1 text-[13.5px] text-portal-text bg-portal-bg border border-portal-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-portal-accent/30 focus:border-portal-accent transition-all"
                  />
                ) : (
                  <p
                    className={`text-[13.5px] py-2 ${
                      field.editable
                        ? "font-medium text-portal-text"
                        : "text-portal-text2"
                    }`}
                  >
                    {value as string}
                    {!field.editable && (
                      <span className="ml-2 text-[10px] text-portal-muted bg-portal-bg px-1.5 py-0.5 rounded">
                        Read-only
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

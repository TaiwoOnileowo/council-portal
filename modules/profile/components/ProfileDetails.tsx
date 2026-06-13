"use client";

import { updateProfile } from "@/lib/actions/user.action";
import { queryKeys } from "@/lib/query-keys";
import { inputClass } from "@/lib/utils";
import {
  LEVELS,
  LevelValue,
  UpdateProfileInput,
  updateStudentProfileSchema,
} from "@/modules/auth/auth.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  Check,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  X,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type ProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: LevelValue;
  department: string;
};

type Props = {
  user: Omit<ProfileFields, "level"> & { id: string; level: string };
};

const inputCls = (err?: string) => inputClass(err, "sm");

export default function ProfileDetails({ user }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileFields>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    matricNumber: user.matricNumber,
    level: user.level as LevelValue,
    department: user.department,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateStudentProfileSchema),
  });

  function startEdit() {
    reset({ ...profile });
    setEditing(true);
  }

  function cancelEdit() {
    reset();
    setEditing(false);
  }

  async function onSubmit(data: UpdateProfileInput) {
    const result = await updateProfile({ userId: user.id, ...data });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setProfile(data);
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
    toast.success("Profile updated successfully");
  }

  return (
    <div className="bg-portal-surface border border-portal-border rounded-2xl p-6">
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
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || isSubmitting}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save"}
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
                {...register("firstName")}
                className={inputCls(errors.firstName?.message)}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
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
                {...register("lastName")}
                className={inputCls(errors.lastName?.message)}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
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
                  {...register("email")}
                  placeholder="you@stu.cu.edu.ng"
                  className={inputCls(errors.email?.message)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 pl-6">
                  {errors.email.message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Mail className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">
                {profile.email}
              </p>
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
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.replace(/\D/g, "").slice(0, 11),
                        )
                      }
                      placeholder="08012345678"
                      inputMode="numeric"
                      maxLength={11}
                      className={inputCls(errors.phone?.message)}
                    />
                  )}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500 pl-6">
                  {errors.phone.message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Phone className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">
                {profile.phone}
              </p>
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
                  {...register("matricNumber")}
                  placeholder="23CG03000"
                  className={inputCls(errors.matricNumber?.message)}
                />
              </div>
              {errors.matricNumber && (
                <p className="mt-1 text-xs text-red-500 pl-6">
                  {errors.matricNumber.message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <GraduationCap className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">
                {profile.matricNumber}
              </p>
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
                  {...register("level")}
                  className={inputCls(errors.level?.message)}
                >
                  <option value="" disabled>
                    Select level
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l} Level
                    </option>
                  ))}
                </select>
              </div>
              {errors.level && (
                <p className="mt-1 text-xs text-red-500 pl-6">
                  {errors.level.message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <BookOpen className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">
                {profile.level} Level
              </p>
            </div>
          )}
        </div>

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
                  {...register("department")}
                  placeholder="Computer Engineering"
                  className={inputCls(errors.department?.message)}
                />
              </div>
              {errors.department && (
                <p className="mt-1 text-xs text-red-500 pl-6">
                  {errors.department.message}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Building2 className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">
                {profile.department}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

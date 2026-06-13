"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Pencil,
  Check,
  X,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/lib/actions/user.action";
import { updateVendorProfile } from "@/lib/actions/vendor.action";
import { queryKeys } from "@/lib/query-keys";
import {
  LEVELS,
  LevelValue,
  UpdateProfileInput,
  updateStudentProfileSchema,
} from "@/modules/auth/auth.types";
import { updateVendorPersonalInfoSchema } from "@/modules/vendor/vendor.types";
import { inputClass } from "@/lib/utils";

type BaseProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type StudentProfile = BaseProfile & {
  matricNumber: string;
  level: LevelValue;
  department: string;
};

type Props = { profile: BaseProfile | StudentProfile };

function isStudent(p: BaseProfile | StudentProfile): p is StudentProfile {
  return "matricNumber" in p;
}

const inputCls = (err?: string) => inputClass(err, "sm");

export default function ProfileDetails({ profile }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(profile);
  const student = isStudent(current);

  const { register, handleSubmit, reset, control, formState: { errors, isDirty, isSubmitting } } =
    useForm<UpdateProfileInput>({
      resolver: zodResolver(student ? updateStudentProfileSchema : updateVendorPersonalInfoSchema) as unknown as Resolver<UpdateProfileInput>,
    });

  function startEdit() {
    reset(current);
    setEditing(true);
  }

  function cancelEdit() {
    reset();
    setEditing(false);
  }

  async function onSubmit(data: UpdateProfileInput) {
    let result;
    if (isStudent(current)) {
      result = await updateProfile({ userId: current.id, ...data });
    } else {
      result = await updateVendorProfile(data);
    }

    if (result?.error) { toast.error(result.error); return; }
    setCurrent({ ...current, ...data });
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
    toast.success("Profile updated successfully");
  }

  const e = errors;

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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            First Name
          </label>
          {editing ? (
            <>
              <input type="text" {...register("firstName")} className={inputCls(e.firstName?.message)} />
              {e.firstName && <p className="mt-1 text-xs text-red-500">{e.firstName.message}</p>}
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">{current.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Last Name
          </label>
          {editing ? (
            <>
              <input type="text" {...register("lastName")} className={inputCls(e.lastName?.message)} />
              {e.lastName && <p className="mt-1 text-xs text-red-500">{e.lastName.message}</p>}
            </>
          ) : (
            <p className="text-[13.5px] font-medium text-portal-text py-2">{current.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
            Email Address
          </label>
          {editing ? (
            <>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-portal-muted flex-shrink-0" />
                <input type="email" {...register("email")} className={inputCls(e.email?.message)} />
              </div>
              {e.email && <p className="mt-1 text-xs text-red-500 pl-6">{e.email.message}</p>}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Mail className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{current.email}</p>
            </div>
          )}
        </div>

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
                      onChange={(ev) => field.onChange(ev.target.value.replace(/\D/g, "").slice(0, 11))}
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="08012345678"
                      className={inputCls(e.phone?.message)}
                    />
                  )}
                />
              </div>
              {e.phone && <p className="mt-1 text-xs text-red-500 pl-6">{e.phone.message}</p>}
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-2">
              <Phone className="w-4 h-4 text-portal-muted flex-shrink-0" />
              <p className="text-[13.5px] font-medium text-portal-text">{current.phone || "—"}</p>
            </div>
          )}
        </div>

        {student && (
          <>
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
                      className={inputCls(e.matricNumber?.message)}
                    />
                  </div>
                  {e.matricNumber && <p className="mt-1 text-xs text-red-500 pl-6">{e.matricNumber.message}</p>}
                </>
              ) : (
                <div className="flex items-center gap-2.5 py-2">
                  <GraduationCap className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  <p className="text-[13.5px] font-medium text-portal-text">
                    {(current as StudentProfile).matricNumber}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
                Level
              </label>
              {editing ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-portal-muted flex-shrink-0" />
                    <select {...register("level")} className={inputCls(e.level?.message)}>
                      <option value="" disabled>Select level</option>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l} Level</option>
                      ))}
                    </select>
                  </div>
                  {e.level && <p className="mt-1 text-xs text-red-500 pl-6">{e.level.message}</p>}
                </>
              ) : (
                <div className="flex items-center gap-2.5 py-2">
                  <BookOpen className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  <p className="text-[13.5px] font-medium text-portal-text">
                    {(current as StudentProfile).level} Level
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
                      className={inputCls(e.department?.message)}
                    />
                  </div>
                  {e.department && <p className="mt-1 text-xs text-red-500 pl-6">{e.department.message}</p>}
                </>
              ) : (
                <div className="flex items-center gap-2.5 py-2">
                  <Building2 className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  <p className="text-[13.5px] font-medium text-portal-text">
                    {(current as StudentProfile).department}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

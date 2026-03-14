"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { signUpUser } from "@/lib/actions/user.action";
import { signUpBaseSchema, signUpSchema, LEVELS } from "@/lib/validations/auth";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  matricNumber: string;
  phone: string;
  department: string;
  level: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

const step1Fields = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;
const step2Fields = ["matricNumber", "phone", "department", "level"] as const;

const fieldSchemas = signUpBaseSchema.shape;

function validateField(
  field: keyof Omit<Fields, "confirmPassword">,
  value: string,
): string | undefined {
  const result = fieldSchemas[field].safeParse(value);
  if (!result.success) return result.error.issues[0].message;
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (confirmPassword && password !== confirmPassword)
    return "Passwords do not match";
}

function setOrDelete(
  errors: FieldErrors,
  field: keyof Fields,
  msg: string | undefined,
): FieldErrors {
  const next = { ...errors };
  if (msg) {
    next[field] = msg;
  } else {
    delete next[field];
  }
  return next;
}

const inputClass = (err?: string) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

export default function SignUpForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    matricNumber: "",
    phone: "",
    department: "",
    level: "",
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof Fields, boolean>>
  >({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(field: keyof Fields, value: string) {
    const updated = { ...fields, [field]: value };
    setFields(updated);

    if (!touched[field]) return;

    let errs = { ...fieldErrors };
    if (field === "confirmPassword") {
      errs = setOrDelete(
        errs,
        "confirmPassword",
        validateConfirmPassword(updated.password, value),
      );
    } else if (field === "password") {
      errs = setOrDelete(errs, "password", validateField("password", value));
      if (touched.confirmPassword) {
        errs = setOrDelete(
          errs,
          "confirmPassword",
          validateConfirmPassword(value, updated.confirmPassword),
        );
      }
    } else {
      errs = setOrDelete(
        errs,
        field,
        validateField(field as keyof Omit<Fields, "confirmPassword">, value),
      );
    }
    setFieldErrors(errs);
  }

  function handleBlur(field: keyof Fields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let errs = { ...fieldErrors };
    if (field === "confirmPassword") {
      errs = setOrDelete(
        errs,
        "confirmPassword",
        validateConfirmPassword(fields.password, fields.confirmPassword),
      );
    } else {
      errs = setOrDelete(
        errs,
        field,
        validateField(
          field as keyof Omit<Fields, "confirmPassword">,
          fields[field],
        ),
      );
    }
    setFieldErrors(errs);
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();

    const newTouched = { ...touched };
    for (const f of step1Fields) newTouched[f] = true;
    setTouched(newTouched);

    let errs = { ...fieldErrors };
    for (const f of step1Fields) {
      if (f === "confirmPassword") {
        errs = setOrDelete(
          errs,
          "confirmPassword",
          validateConfirmPassword(fields.password, fields.confirmPassword),
        );
      } else {
        errs = setOrDelete(errs, f, validateField(f, fields[f]));
      }
    }
    setFieldErrors(errs);

    const hasErrors = step1Fields.some((f) => errs[f]);
    if (!hasErrors) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newTouched = { ...touched };
    for (const f of step2Fields) newTouched[f] = true;
    setTouched(newTouched);

    const parsed = signUpSchema.safeParse(fields);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const result = await signUpUser(fields);
      if (result?.error) {
        toast.error(result.error);
        setFormError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${step === 1 ? "bg-portal-accent" : "bg-portal-accent"}`}
          />
          <div
            className={`h-0.5 w-8 ${step === 2 ? "bg-portal-accent" : "bg-portal-border"}`}
          />
          <div
            className={`h-2 w-2 rounded-full ${step === 2 ? "bg-portal-accent" : "bg-portal-border"}`}
          />
        </div>
        <span className="text-xs text-portal-muted ml-1">Step {step} of 2</span>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-5">
          {/* First + Last name row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                First name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                value={fields.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                onBlur={() => handleBlur("firstName")}
                placeholder="John"
                className={inputClass(fieldErrors.firstName)}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Last name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                value={fields.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                placeholder="Doe"
                className={inputClass(fieldErrors.lastName)}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Email<span className="text-portal-accent">*</span>
            </label>
            <input
              type="email"
              value={fields.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="john.23CG03000@stu.cu.edu.ng"
              className={inputClass(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={fields.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••••••••••"
                className={`${inputClass(fieldErrors.password)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Confirm password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={fields.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleBlur("confirmPassword")}
                placeholder="••••••••••••••••"
                className={`${inputClass(fieldErrors.confirmPassword)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text transition"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2"
          >
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Matric number */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Matric number<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              value={fields.matricNumber}
              onChange={(e) => handleChange("matricNumber", e.target.value)}
              onBlur={() => handleBlur("matricNumber")}
              placeholder="23CG03000"
              className={inputClass(fieldErrors.matricNumber)}
            />
            {fieldErrors.matricNumber && (
              <p className="mt-1 text-xs text-red-500">
                {fieldErrors.matricNumber}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Phone number<span className="text-portal-accent">*</span>
            </label>
            <input
              type="tel"
              value={fields.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                handleChange("phone", digits);
              }}
              onBlur={() => handleBlur("phone")}
              placeholder="08012345678"
              inputMode="numeric"
              maxLength={11}
              className={inputClass(fieldErrors.phone)}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Department<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              value={fields.department}
              onChange={(e) => handleChange("department", e.target.value)}
              onBlur={() => handleBlur("department")}
              placeholder="Computer Engineering"
              className={inputClass(fieldErrors.department)}
            />
            {fieldErrors.department && (
              <p className="mt-1 text-xs text-red-500">
                {fieldErrors.department}
              </p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Level<span className="text-portal-accent">*</span>
            </label>
            <select
              value={fields.level}
              onChange={(e) => handleChange("level", e.target.value)}
              onBlur={() => handleBlur("level")}
              className={inputClass(fieldErrors.level)}
            >
              <option value="" disabled>
                Select your level
              </option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} Level
                </option>
              ))}
            </select>
            {fieldErrors.level && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.level}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 rounded-lg border border-portal-border text-portal-text font-medium py-3 px-4 text-[15px] transition-colors hover:bg-portal-border/30"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

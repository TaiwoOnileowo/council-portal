"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signUpUser } from "@/lib/actions/user.action";
import { signUpBaseSchema, signUpSchema } from "@/lib/validations/auth";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

const fieldSchemas = signUpBaseSchema.shape;

function validateField(
  field: keyof Omit<Fields, "confirmPassword">,
  value: string
): string | undefined {
  const result = fieldSchemas[field].safeParse(value);
  if (!result.success) return result.error.issues[0].message;
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | undefined {
  if (confirmPassword && password !== confirmPassword)
    return "Passwords do not match";
}

function setOrDelete(
  errors: FieldErrors,
  field: keyof Fields,
  msg: string | undefined
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

  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    matricNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof Fields, boolean>>
  >({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
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
        validateConfirmPassword(updated.password, value)
      );
    } else if (field === "password") {
      errs = setOrDelete(errs, "password", validateField("password", value));
      if (touched.confirmPassword) {
        errs = setOrDelete(
          errs,
          "confirmPassword",
          validateConfirmPassword(value, updated.confirmPassword)
        );
      }
    } else {
      errs = setOrDelete(
        errs,
        field,
        validateField(field as keyof Omit<Fields, "confirmPassword">, value)
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
        validateConfirmPassword(fields.password, fields.confirmPassword)
      );
    } else {
      errs = setOrDelete(
        errs,
        field,
        validateField(field as keyof Omit<Fields, "confirmPassword">, fields[field])
      );
    }
    setFieldErrors(errs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      matricNumber: true,
      password: true,
      confirmPassword: true,
    });

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

    setLoading(true);
    const result = await signUpUser(fields);
    setLoading(false);

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>
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
            <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>
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

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Phone number<span className="text-portal-accent">*</span>
        </label>
        <input
          type="tel"
          value={fields.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="+234 800 000 0000"
          className={inputClass(fieldErrors.phone)}
        />
        {fieldErrors.phone && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
        )}
      </div>

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
          <p className="mt-1 text-xs text-red-500">{fieldErrors.matricNumber}</p>
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
          <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
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
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
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

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

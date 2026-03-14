"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft, Upload, Check, X } from "lucide-react";
import { toast } from "sonner";
import { signUpVendor, checkVendorEmail } from "@/lib/actions/vendor.action";
import { vendorStep1Schema, vendorStep2Schema } from "@/lib/validations/vendor";
import { uploadFiles } from "@/lib/uploadthing";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step1Fields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Step2Fields = {
  transportName: string;
  tagline: string;
  description: string;
  tiktok: string;
  instagram: string;
};

type FieldErrors = Partial<Record<string, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass = (err?: string) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                step >= s ? "bg-portal-accent" : "bg-portal-border"
              }`}
            />
            {i < 2 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  step > s ? "bg-portal-accent" : "bg-portal-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-portal-muted ml-1">Step {step} of 3</span>
    </div>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadFiles("vendorProfileImage", { files: [file] });
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl);
        toast.success("Image uploaded!");
      }
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-24 rounded-full border-2 border-dashed border-portal-border bg-portal-bg flex items-center justify-center cursor-pointer hover:border-portal-accent transition-colors overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <img
            src={value}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-portal-muted">
            <Upload className="w-6 h-6" />
            <span className="text-[10px]">Upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-portal-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-red-500 hover:underline"
        >
          Remove image
        </button>
      )}
      <p className="text-xs text-portal-muted text-center">
        Click to upload a display picture (max 4MB)
      </p>
    </div>
  );
}

// ─── Unapproved screen ────────────────────────────────────────────────────────

function UnapprovedScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <X className="w-7 h-7 text-red-500" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-heading font-bold text-portal-text text-lg">
          Not approved
        </h3>
        <p className="text-portal-muted text-sm leading-relaxed">
          <span className="text-portal-text font-medium break-all">
            {email}
          </span>{" "}
          is not on our approved vendor list. If you believe this is a mistake,
          please contact the Student Council.
        </p>
      </div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-portal-muted hover:text-portal-text transition-colors mx-auto"
      >
        <ChevronLeft size={15} />
        Try a different email
      </button>
    </div>
  );
}

// ─── Commission screen ────────────────────────────────────────────────────────

function CommissionStep({
  onBack,
  onAccept,
  loading,
}: {
  onBack: () => void;
  onAccept: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-portal-accent-bg border border-portal-accent-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-heading font-bold text-portal-text">
            Commission Structure
          </h3>
        </div>
        <p className="text-portal-text2 text-sm leading-relaxed">
          As a transport vendor on the CU Student Council portal, a flat
          commission of{" "}
          <span className="font-semibold text-portal-text">₦1,000</span> is
          charged per completed, booked ride.
        </p>

        <p className="text-[12px] text-portal-muted pt-1">
          By clicking &ldquo;Accept &amp; Create Account&rdquo; you agree to
          these terms.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-portal-border text-portal-text font-medium py-3 px-4 text-[15px] transition-colors hover:bg-portal-border/30"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={loading}
          className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Accept & Create Account"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function VendorSignUpForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [unapproved, setUnapproved] = useState(false);

  const [step1, setStep1] = useState<Step1Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [step2, setStep2] = useState<Step2Fields>({
    transportName: "",
    tagline: "",
    description: "",
    tiktok: "",
    instagram: "",
  });
  const [image, setImage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Step 1: credentials ────────────────────────────────────────────────────

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();

    const result = vendorStep1Schema.safeParse(step1);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setChecking(true);
    try {
      const { approved } = await checkVendorEmail(step1.email);
      if (!approved) {
        setUnapproved(true);
        return;
      }
      setStep(2);
    } catch {
      toast.error("Could not verify email. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  // ── Step 2: profile info ───────────────────────────────────────────────────

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();

    const result = vendorStep2Schema.safeParse(step2);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setStep(3);
  }

  // ── Step 3: accept commission & submit ─────────────────────────────────────

  async function handleSubmit() {
    setLoading(true);
    try {
      const result = await signUpVendor({
        ...step1,
        ...step2,
        image: image || undefined,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.push("/vendor-dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Unapproved state ───────────────────────────────────────────────────────

  if (unapproved) {
    return (
      <div className="space-y-5">
        <StepIndicator step={1} />
        <UnapprovedScreen
          email={step1.email}
          onBack={() => {
            setUnapproved(false);
            setStep1((prev) => ({ ...prev, email: "" }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepIndicator step={step} />

      {/* ── Step 1: Account credentials ────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                First name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                value={step1.firstName}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, firstName: e.target.value }))
                }
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
                value={step1.lastName}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, lastName: e.target.value }))
                }
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

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Email<span className="text-portal-accent">*</span>
            </label>
            <input
              type="email"
              value={step1.email}
              onChange={(e) =>
                setStep1((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="yourname@vendor.council.ng"
              className={inputClass(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={step1.password}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, password: e.target.value }))
                }
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

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Confirm password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={step1.confirmPassword}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, confirmPassword: e.target.value }))
                }
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
            disabled={checking}
            className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
          >
            {checking ? "Checking eligibility…" : "Continue"}
          </button>
        </form>
      )}

      {/* ── Step 2: Profile info ────────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Transport name<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              value={step2.transportName}
              onChange={(e) =>
                setStep2((p) => ({ ...p, transportName: e.target.value }))
              }
              placeholder="e.g. SwiftMove NG"
              maxLength={60}
              className={inputClass(fieldErrors.transportName)}
              autoFocus
            />
            {fieldErrors.transportName && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.transportName}</p>
            )}
          </div>

          <ImageUpload value={image} onChange={setImage} />

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Tagline{" "}
              <span className="text-portal-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={step2.tagline}
              onChange={(e) =>
                setStep2((p) => ({ ...p, tagline: e.target.value }))
              }
              placeholder="Your campus ride, always on time"
              maxLength={80}
              className={inputClass(fieldErrors.tagline)}
            />
            <div className="flex justify-between mt-1">
              {fieldErrors.tagline ? (
                <p className="text-xs text-red-500">{fieldErrors.tagline}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-portal-muted">
                {step2.tagline.length}/80
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              About your service{" "}
              <span className="text-portal-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={step2.description}
              onChange={(e) =>
                setStep2((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Tell students about your transport service, vehicles, and what makes you stand out..."
              rows={4}
              maxLength={500}
              className={`${inputClass(fieldErrors.description)} resize-none`}
            />
            <div className="flex justify-between mt-1">
              {fieldErrors.description ? (
                <p className="text-xs text-red-500">
                  {fieldErrors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-portal-muted">
                {step2.description.length}/500
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-portal-text">
              Socials{" "}
              <span className="text-portal-muted font-normal">(optional)</span>
            </p>
            <div>
              <label className="block text-xs text-portal-muted mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={step2.instagram}
                onChange={(e) =>
                  setStep2((p) => ({ ...p, instagram: e.target.value }))
                }
                placeholder="https://instagram.com/youraccount"
                className={inputClass(fieldErrors.instagram)}
              />
              {fieldErrors.instagram && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.instagram}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-portal-muted mb-1">
                TikTok URL
              </label>
              <input
                type="url"
                value={step2.tiktok}
                onChange={(e) =>
                  setStep2((p) => ({ ...p, tiktok: e.target.value }))
                }
                placeholder="https://tiktok.com/@youraccount"
                className={inputClass(fieldErrors.tiktok)}
              />
              {fieldErrors.tiktok && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.tiktok}
                </p>
              )}
            </div>
          </div>

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
              className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: Commission acknowledgment ──────────────────────────────── */}
      {step === 3 && (
        <CommissionStep
          onBack={() => setStep(2)}
          onAccept={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}

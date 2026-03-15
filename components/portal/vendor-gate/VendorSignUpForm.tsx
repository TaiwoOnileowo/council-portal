"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ChevronLeft,
  Upload,
  Check,
  X,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { signUpVendor, checkVendorEmail } from "@/lib/actions/vendor.action";
import { getBanks, verifyBankAccount } from "@/lib/actions/bank.action";
import type { Bank } from "@/lib/actions/bank.action";
import { vendorStep1Schema, vendorStep2Schema, vendorBankSchema } from "@/lib/validations/vendor";
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

type Step3Fields = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
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

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                step >= s ? "bg-portal-accent" : "bg-portal-border"
              }`}
            />
            {i < 3 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  step > s ? "bg-portal-accent" : "bg-portal-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-portal-muted ml-1">Step {step} of 4</span>
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
          <img src={value} alt="Profile" className="w-full h-full object-cover" />
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

// ─── Bank Selector ────────────────────────────────────────────────────────────

function BankSelector({
  banks,
  value,
  onChange,
  error,
}: {
  banks: Bank[];
  value: { code: string; name: string } | null;
  onChange: (bank: { code: string; name: string }) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-lg border ${
          error
            ? "border-red-400"
            : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
        } bg-white px-4 py-3 text-[15px] text-left flex items-center justify-between outline-none focus:ring-1 transition`}
      >
        <span className={value ? "text-portal-text" : "text-portal-muted"}>
          {value ? value.name : "Select your bank"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-portal-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-portal-border bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-portal-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search banks..."
              className="w-full px-3 py-2 text-[14px] rounded-lg border border-portal-border outline-none focus:border-portal-accent bg-portal-bg"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[13px] text-portal-muted text-center py-4">No banks found</p>
            ) : (
              filtered.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    onChange({ code: bank.code, name: bank.name });
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-portal-accent-bg transition-colors ${
                    value?.code === bank.code
                      ? "bg-portal-accent-bg text-portal-accent font-medium"
                      : "text-portal-text"
                  }`}
                >
                  {bank.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bank Step ────────────────────────────────────────────────────────────────

function BankStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: Step3Fields;
  onChange: (fields: Step3Fields) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    getBanks().then(({ banks, error }) => {
      if (error || !banks) {
        setBanksError(error ?? "Failed to load banks.");
      } else {
        setBanks(banks);
      }
      setBanksLoading(false);
    });
  }, []);

  const selectedBank =
    value.bankCode ? { code: value.bankCode, name: value.bankName } : null;

  function handleBankChange(bank: { code: string; name: string }) {
    // Reset verification when bank changes
    onChange({ ...value, bankCode: bank.code, bankName: bank.name, accountName: "" });
    setFieldErrors({});
  }

  function handleAccountNumberChange(accountNumber: string) {
    const digits = accountNumber.replace(/\D/g, "").slice(0, 10);
    // Reset verification when account number changes
    onChange({ ...value, accountNumber: digits, accountName: "" });
    setFieldErrors({});
  }

  async function handleVerify() {
    const errs: FieldErrors = {};
    if (!value.bankCode) errs.bankCode = "Please select a bank";
    if (!/^\d{10}$/.test(value.accountNumber))
      errs.accountNumber = "Account number must be exactly 10 digits";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setVerifying(true);
    const result = await verifyBankAccount(value.accountNumber, value.bankCode);
    setVerifying(false);

    if (result.error || !result.account) {
      setFieldErrors({ accountNumber: result.error ?? "Verification failed." });
      return;
    }

    onChange({ ...value, accountName: result.account.accountName });
    toast.success("Account verified!");
  }

  function handleNext() {
    const parsed = vendorBankSchema.safeParse(value);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      {/* Bank */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Bank<span className="text-portal-accent">*</span>
        </label>
        {banksLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-portal-border px-4 py-3 text-portal-muted text-[14px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading banks...
          </div>
        ) : banksError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {banksError}
          </div>
        ) : (
          <BankSelector
            banks={banks}
            value={selectedBank}
            onChange={handleBankChange}
            error={fieldErrors.bankCode}
          />
        )}
        {fieldErrors.bankCode && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.bankCode}</p>
        )}
      </div>

      {/* Account Number + Verify */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Account Number<span className="text-portal-accent">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={value.accountNumber}
            onChange={(e) => handleAccountNumberChange(e.target.value)}
            placeholder="0123456789"
            maxLength={10}
            className={`${inputClass(fieldErrors.accountNumber)} flex-1`}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={
              verifying ||
              !value.bankCode ||
              value.accountNumber.length !== 10
            }
            className="px-4 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
        {fieldErrors.accountNumber && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.accountNumber}</p>
        )}
      </div>

      {/* Verified Account Name */}
      {value.accountName ? (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-[12px] text-green-700 font-medium uppercase tracking-wide">
              Account Verified
            </p>
            <p className="text-[15px] font-semibold text-portal-text">{value.accountName}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-portal-border bg-portal-bg px-4 py-3 text-[13px] text-portal-muted">
          Enter your account number and click <span className="font-medium text-portal-text">Verify</span> to confirm your account details.
        </div>
      )}

      {fieldErrors.accountName && (
        <p className="text-xs text-red-500">{fieldErrors.accountName}</p>
      )}

      <div className="flex gap-3 mt-2">
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
          onClick={handleNext}
          disabled={!value.accountName}
          className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
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
        <h3 className="font-heading font-bold text-portal-text text-lg">Not approved</h3>
        <p className="text-portal-muted text-sm leading-relaxed">
          <span className="text-portal-text font-medium break-all">{email}</span>{" "}
          is not on our approved vendor list. If you believe this is a mistake, please contact the
          Student Council.
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
          <h3 className="font-heading font-bold text-portal-text">Commission Structure</h3>
        </div>
        <p className="text-portal-text2 text-sm leading-relaxed">
          As a transport vendor on the CU Student Council portal, a flat commission of{" "}
          <span className="font-semibold text-portal-text">₦1,000</span> is charged per completed,
          booked ride.
        </p>
        <p className="text-[12px] text-portal-muted pt-1">
          By clicking &ldquo;Accept &amp; Create Account&rdquo; you agree to these terms.
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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [step3, setStep3] = useState<Step3Fields>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
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

  // ── Step 4: accept commission & submit ─────────────────────────────────────

  async function handleSubmit() {
    setLoading(true);
    try {
      const result = await signUpVendor({
        ...step1,
        ...step2,
        ...step3,
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

      {/* ── Step 1: Account credentials ─────────────────────────────────────── */}
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
                onChange={(e) => setStep1((p) => ({ ...p, firstName: e.target.value }))}
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
                value={step1.lastName}
                onChange={(e) => setStep1((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe"
                className={inputClass(fieldErrors.lastName)}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>
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
              onChange={(e) => setStep1((p) => ({ ...p, email: e.target.value }))}
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
                onChange={(e) => setStep1((p) => ({ ...p, password: e.target.value }))}
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

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Confirm password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={step1.confirmPassword}
                onChange={(e) => setStep1((p) => ({ ...p, confirmPassword: e.target.value }))}
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
              <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
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

      {/* ── Step 2: Profile info ─────────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Transport name<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              value={step2.transportName}
              onChange={(e) => setStep2((p) => ({ ...p, transportName: e.target.value }))}
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
              onChange={(e) => setStep2((p) => ({ ...p, tagline: e.target.value }))}
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
              <span className="text-xs text-portal-muted">{step2.tagline.length}/80</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              About your service{" "}
              <span className="text-portal-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={step2.description}
              onChange={(e) => setStep2((p) => ({ ...p, description: e.target.value }))}
              placeholder="Tell students about your transport service, vehicles, and what makes you stand out..."
              rows={4}
              maxLength={500}
              className={`${inputClass(fieldErrors.description)} resize-none`}
            />
            <div className="flex justify-between mt-1">
              {fieldErrors.description ? (
                <p className="text-xs text-red-500">{fieldErrors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-portal-muted">{step2.description.length}/500</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-portal-text">
              Socials <span className="text-portal-muted font-normal">(optional)</span>
            </p>
            <div>
              <label className="block text-xs text-portal-muted mb-1">Instagram URL</label>
              <input
                type="url"
                value={step2.instagram}
                onChange={(e) => setStep2((p) => ({ ...p, instagram: e.target.value }))}
                placeholder="https://instagram.com/youraccount"
                className={inputClass(fieldErrors.instagram)}
              />
              {fieldErrors.instagram && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.instagram}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-portal-muted mb-1">TikTok URL</label>
              <input
                type="url"
                value={step2.tiktok}
                onChange={(e) => setStep2((p) => ({ ...p, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@youraccount"
                className={inputClass(fieldErrors.tiktok)}
              />
              {fieldErrors.tiktok && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.tiktok}</p>
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

      {/* ── Step 3: Bank details ─────────────────────────────────────────────── */}
      {step === 3 && (
        <BankStep
          value={step3}
          onChange={setStep3}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {/* ── Step 4: Commission acknowledgment ───────────────────────────────── */}
      {step === 4 && (
        <CommissionStep
          onBack={() => setStep(3)}
          onAccept={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}

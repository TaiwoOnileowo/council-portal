"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpUser } from "@/lib/actions/user.action";
import { signUpSchema, LEVELS } from "@/modules/auth/auth.types";
import type { SignUpInput } from "@/modules/auth/auth.types";

const step1Fields = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;
const RESEND_COOLDOWN = 60;
const EMAIL_VERIFICATION_DEFAULT = true; // set to true to enable by default

const inputClass = (err?: string) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

function StepIndicator({
  step,
  emailVerification,
}: {
  step: 1 | 2 | 3;
  emailVerification: boolean;
}) {
  const totalSteps = emailVerification ? 3 : 2;
  // When verification is off, step 3 displays as step 2
  const displayStep = emailVerification ? step : step === 3 ? 2 : step;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                displayStep >= s ? "bg-portal-accent" : "bg-portal-border"
              }`}
            />
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  displayStep > s ? "bg-portal-accent" : "bg-portal-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-portal-muted ml-1">
        Step {displayStep} of {totalSteps}
      </span>
    </div>
  );
}

function OtpInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = digits
          .map((d, idx) => (idx === i ? "" : d))
          .join("")
          .trimEnd();
        onChange(next.padEnd(i, digits.slice(0, i).join("")));
        // re-derive: replace index i with empty
        const arr = [...digits];
        arr[i] = "";
        onChange(arr.join("").trimEnd());
      } else if (i > 0) {
        const arr = [...digits];
        arr[i - 1] = "";
        onChange(arr.join("").trimEnd());
        inputs.current[i - 1]?.focus();
      }
    }
  }

  function handleInput(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const arr = [...digits];
    arr[i] = digit;
    onChange(arr.join("").trimEnd());
    if (i < 5) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  }

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={disabled}
            onPaste={handlePaste}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className={`w-11 h-13 text-center rounded-lg border text-xl font-semibold text-portal-text outline-none transition
              ${error ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400" : "border-portal-border focus:border-portal-accent focus:ring-1 focus:ring-portal-accent"}
              ${disabled ? "bg-gray-50 text-portal-muted cursor-not-allowed" : "bg-white"}`}
            style={{ height: "52px" }}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}

export default function SignUpForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailVerification, setEmailVerification] = useState(
    EMAIL_VERIFICATION_DEFAULT,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendOtp = useCallback(async (email: string, firstName: string) => {
    setSendingOtp(true);
    setOtpError(undefined);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Failed to send code.");
        toast.error(data.error ?? "Failed to send code.");
        return false;
      }
      setCooldown(RESEND_COOLDOWN);
      if (data.fromEmail) setFromEmail(data.fromEmail);
      return true;
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    } finally {
      setSendingOtp(false);
    }
  }, []);

  async function handleNext(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const valid = await trigger(step1Fields);
    if (!valid) return;

    if (!emailVerification) {
      setStep(3);
      return;
    }

    if (getValues("email") === verifiedEmail) {
      setStep(3);
      return;
    }

    const ok = await sendOtp(getValues("email"), getValues("firstName"));
    if (ok) {
      setOtp("");
      setOtpError(undefined);
      setStep(2);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || sendingOtp) return;
    await sendOtp(getValues("email"), getValues("firstName"));
    setOtp("");
  }

  async function handleVerify(e: { preventDefault(): void }) {
    e.preventDefault();
    if (otp.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }
    setVerifying(true);
    setOtpError(undefined);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: getValues("email"), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error);
        if (data.invalidated) {
          setOtp("");
        }
        return;
      }
      setVerifiedEmail(getValues("email"));
      setStep(3);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    const result = await signUpUser(data);
    if ("error" in result) {
      toast.error(result.error);
      if ("field" in result && result.field) {
        setError(result.field, { message: result.error });
      } else {
        setError("root", { message: result.error });
      }
      return;
    }
    router.push("/");
    router.refresh();
  });

  return (
    <div className="space-y-5">
      <StepIndicator step={step} emailVerification={emailVerification} />

      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                First name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                {...register("firstName")}
                placeholder="John"
                className={inputClass(errors.firstName?.message)}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-portal-text mb-1.5">
                Last name<span className="text-portal-accent">*</span>
              </label>
              <input
                type="text"
                {...register("lastName")}
                placeholder="Doe"
                className={inputClass(errors.lastName?.message)}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
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
              {...register("email")}
              placeholder="john.23CG03000@stu.cu.edu.ng"
              className={inputClass(errors.email?.message)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Password<span className="text-portal-accent">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••••••••••"
                className={`${inputClass(errors.password?.message)} pr-11`}
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
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
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
                {...register("confirmPassword")}
                placeholder="••••••••••••••••"
                className={`${inputClass(errors.confirmPassword?.message)} pr-11`}
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
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={sendingOtp}
            className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
          >
            {sendingOtp ? "Sending code…" : "Continue"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="text-center space-y-1">
            <p className="text-sm text-portal-text">
              We sent a 6-digit code to
            </p>
            <p className="font-medium text-portal-accent break-all">
              {getValues("email")}
            </p>
            <p className="text-xs text-portal-muted pt-1">
              Can&apos;t find it? Check your spam folder.{" "}
              {fromEmail && (
                <a
                  href={`https://mail.google.com/mail/u/0/#search/from:${fromEmail}+in:anywhere`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-portal-accent hover:underline"
                >
                  Open Gmail
                </a>
              )}
            </p>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={verifying}
            error={otpError}
          />

          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Verify email"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-portal-muted hover:text-portal-text transition-colors"
            >
              <ChevronLeft size={15} />
              Change email
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || sendingOtp}
              className="text-portal-accent hover:underline disabled:text-portal-muted disabled:no-underline disabled:cursor-not-allowed transition-colors"
            >
              {sendingOtp
                ? "Sending…"
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Matric number<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              {...register("matricNumber")}
              placeholder="23CG03000"
              className={inputClass(errors.matricNumber?.message)}
            />
            {errors.matricNumber && (
              <p className="mt-1 text-xs text-red-500">
                {errors.matricNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Phone number<span className="text-portal-accent">*</span>
            </label>
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
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="08012345678"
                  className={inputClass(errors.phone?.message)}
                />
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Department<span className="text-portal-accent">*</span>
            </label>
            <input
              type="text"
              {...register("department")}
              placeholder="Computer Engineering"
              className={inputClass(errors.department?.message)}
            />
            {errors.department && (
              <p className="mt-1 text-xs text-red-500">
                {errors.department.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Level<span className="text-portal-accent">*</span>
            </label>
            <select
              {...register("level")}
              className={inputClass(errors.level?.message)}
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
            {errors.level && (
              <p className="mt-1 text-xs text-red-500">
                {errors.level.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {errors.root.message}
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
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

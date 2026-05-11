"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpUser } from "@/lib/actions/user.action";
import { signUpSchema, LEVELS } from "@/modules/auth/auth.types";
import type { SignUpInput } from "@/modules/auth/auth.types";
import StepIndicator from "./StepIndicator";
import OtpInput from "./OtpInput";

const STEP_1_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;

const RESEND_COOLDOWN = 60;
const EMAIL_VERIFICATION_DEFAULT = true;

const inputClass = (err?: string) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

export default function SignUpForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailVerification] = useState(EMAIL_VERIFICATION_DEFAULT);

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
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName }),
    });
    const data = await res.json();
    setSendingOtp(false);

    if (!res.ok) {
      setOtpError(data.error);
      toast.error(data.error);
      return false;
    }

    setCooldown(RESEND_COOLDOWN);
    if (data.fromEmail) setFromEmail(data.fromEmail);
    return true;
  }, []);

  async function handleNext(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const valid = await trigger(STEP_1_FIELDS);
    if (!valid) return;

    if (!emailVerification || getValues("email") === verifiedEmail) {
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
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: getValues("email"), code: otp }),
    });
    const data = await res.json();
    setVerifying(false);

    if (!res.ok) {
      setOtpError(data.error);
      return;
    }

    setVerifiedEmail(getValues("email"));
    setStep(3);
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

  const totalSteps = emailVerification ? 3 : 2;
  const displayStep = emailVerification ? step : step === 3 ? 2 : step;

  return (
    <div className="space-y-5">
      <StepIndicator step={displayStep} totalSteps={totalSteps} />

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
                <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
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
                <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
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
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
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
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text transition"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
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
            <p className="text-sm text-portal-text">We sent a 6-digit code to</p>
            <p className="font-medium text-portal-accent break-all">{getValues("email")}</p>
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

          <OtpInput value={otp} onChange={setOtp} disabled={verifying} error={otpError} />

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
              {sendingOtp ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
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
              <p className="mt-1 text-xs text-red-500">{errors.matricNumber.message}</p>
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
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="08012345678"
                  className={inputClass(errors.phone?.message)}
                />
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
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
              <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-portal-text mb-1.5">
              Level<span className="text-portal-accent">*</span>
            </label>
            <select {...register("level")} className={inputClass(errors.level?.message)}>
              <option value="" disabled>Select your level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </select>
            {errors.level && (
              <p className="mt-1 text-xs text-red-500">{errors.level.message}</p>
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

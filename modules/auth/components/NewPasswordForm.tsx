"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/lib/actions/password.action";
import { signInUser } from "@/lib/actions/user.action";
import { newPasswordSchema, NewPasswordInput } from "@/modules/auth/auth.types";

interface NewPasswordFormProps {
  email: string;
  token: string;
}

export default function NewPasswordForm({ email, token }: NewPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onChange",
  });

  async function onSubmit(data: NewPasswordInput) {
    const resetResult = await resetPassword(token, data.password);
    if (resetResult.error) {
      toast.error(resetResult.error);
      setError("root", { message: resetResult.error });
      return;
    }

    const signInResult = await signInUser({ email, password: data.password });
    if (signInResult?.error) {
      toast.error("Password changed but sign-in failed. Please log in manually.");
      router.push("/gate");
      return;
    }

    toast.success("Keys changed! Welcome back.");
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email — readonly */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-lg border border-portal-border bg-portal-surface px-4 py-3 text-[15px] text-portal-muted outline-none cursor-not-allowed"
        />
      </div>

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          New Password<span className="text-portal-accent">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Min 6 characters"
            className={`w-full rounded-lg border bg-white px-4 py-3 pr-11 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition ${
              errors.password
                ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Confirm Password<span className="text-portal-accent">*</span>
        </label>
        <input
          type="password"
          {...register("confirmPassword")}
          placeholder="Re-enter new password"
          className={`w-full rounded-lg border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition ${
            errors.confirmPassword
              ? "border-red-300 focus:border-red-400 focus:ring-red-200"
              : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
          }`}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {errors.root?.message && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Changing keys...
          </>
        ) : (
          "Change keys"
        )}
      </button>
    </form>
  );
}

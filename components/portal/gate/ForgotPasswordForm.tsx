"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/password.action";

type Step = "email" | "sent";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({
  onBack,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    if (!email.endsWith("@stu.cu.edu.ng")) {
      setEmailError("Only @stu.cu.edu.ng email addresses are allowed");
      return;
    }

    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setStep("sent");
  }

  if (step === "sent") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-5 text-center">
          <p className="text-[15px] font-semibold text-green-800 mb-1">
            Check your inbox
          </p>
          <p className="text-sm text-green-700">
            If <span className="font-medium">{email}</span> is registered,
            we&apos;ve sent a link to change your keys. It expires in 1 hour.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-portal-border text-portal-text2 font-medium py-3 text-[15px] transition-colors hover:bg-portal-surface mt-2"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-portal-text2">
        Enter the email address linked to your account and we&apos;ll send you a
        link to change your keys.
      </p>

      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Email<span className="text-portal-accent">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder="you@stu.cu.edu.ng"
          required
          className={`w-full rounded-lg border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition ${
            emailError
              ? "border-red-300 focus:border-red-400 focus:ring-red-200"
              : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
          }`}
        />
        {emailError && (
          <p className="text-xs text-red-500 mt-1">{emailError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </button>

      <p className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-portal-text2 hover:text-portal-accent transition-colors"
        >
          Back to log in
        </button>
      </p>
    </form>
  );
}

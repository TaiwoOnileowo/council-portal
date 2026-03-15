"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { signInVendor } from "@/lib/actions/vendor.action";

const inputClass = (err?: string) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

export default function VendorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await signInVendor({ email, password });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/vendor-dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Email<span className="text-portal-accent">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@vendor.council.ng"
          autoComplete="email"
          className={inputClass(error ? " " : undefined)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Password<span className="text-portal-accent">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••"
            autoComplete="current-password"
            className={`${inputClass(error ? " " : undefined)} pr-11`}
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
      </div>

      {error && (
        <p className="text-sm text-red-500 -mt-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

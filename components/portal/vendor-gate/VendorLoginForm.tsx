"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInVendor } from "@/lib/actions/vendor.action";
import { vendorSignInSchema } from "@/lib/validations/vendor";
import type { z } from "zod";

type VendorSignInInput = z.infer<typeof vendorSignInSchema>;

const inputClass = (err?: boolean) =>
  `w-full rounded-lg border ${
    err
      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent"
  } bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:ring-1 transition`;

export default function VendorLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorSignInInput>({
    resolver: zodResolver(vendorSignInSchema),
  });

  async function onSubmit(data: VendorSignInInput) {
    const result = await signInVendor({ email: data.email, password: data.password });

    if (result?.error) {
      setError("root", { message: result.error });
      return;
    }

    router.push("/vendor-dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Email<span className="text-portal-accent">*</span>
        </label>
        <input
          type="email"
          {...register("email")}
          placeholder="yourname@vendor.council.ng"
          autoComplete="email"
          className={inputClass(!!errors.root)}
        />
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
            autoComplete="current-password"
            className={`${inputClass(!!errors.root)} pr-11`}
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

      {errors.root?.message && (
        <p className="text-sm text-red-500 -mt-1">{errors.root.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

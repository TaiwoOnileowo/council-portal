"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import type { VendorSignUpInput } from "@/modules/vendor/vendor.types";
import { inputClass } from "./shared";

type Props = {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  checking: boolean;
};

export default function CredentialsStep({ onSubmit, checking }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<VendorSignUpInput>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          placeholder="yourname@vendor.council.ng"
          className={inputClass(errors.email?.message)}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                field.onChange(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
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
        disabled={checking}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
      >
        {checking ? "Checking eligibility…" : "Continue"}
      </button>
    </form>
  );
}

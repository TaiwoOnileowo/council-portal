"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInUser } from "@/lib/actions/user.action";
import { Eye, EyeOff } from "lucide-react";
import { signInSchema, SignInInput } from "@/lib/validations/auth";

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInInput) {
    const result = await signInUser({ email: data.email, password: data.password });

    if (result?.error) {
      toast.error(result.error);
      setError("root", { message: result.error });
      return;
    }
    toast.success("Logged in successfully");
    router.push("/");
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
          placeholder="you@email.com"
          className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
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
            className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 pr-11 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
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

      {errors.root?.message && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>

      <p className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-portal-text2 hover:text-portal-accent transition-colors"
        >
          I forgot my password
        </button>
      </p>
    </form>
  );
}

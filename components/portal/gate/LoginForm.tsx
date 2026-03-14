"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInUser } from "@/lib/actions/user.action";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const result = await signInUser({ email, password });

    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      setFormError(result.error);
      return;
    }

    router.push("/");
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
          placeholder="you@email.com"
          required
          className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Password<span className="text-portal-accent">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••••••"
          required
          className="w-full rounded-lg border border-portal-border bg-white px-4 py-3 text-[15px] text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent focus:ring-1 focus:ring-portal-accent transition"
        />
      </div>


      {formError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors mt-2 disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="text-center">
        <a
          href="#"
          className="text-sm text-portal-text2 hover:text-portal-accent transition-colors"
        >
          I forgot my password
        </a>
      </p>
    </form>
  );
}

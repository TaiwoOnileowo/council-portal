"use client";

import { requestPasswordReset } from "@/lib/actions/password.action";
import { reportClientError } from "@/lib/client-log";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ChangePasswordProps {
  email: string;
}

export default function ChangePassword({ email }: ChangePasswordProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRequest() {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success("Check your email for next steps.");
    } catch (error) {
      reportClientError(
        "[change-password]",
        "requestPasswordReset failed",
        error,
      );
      toast.error(
        "Error sending password reset email. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-portal-surface border border-portal-border rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-portal-accent-bg flex items-center justify-center">
            <Lock className="w-4 h-4 text-portal-accent" />
          </div>
          <div>
            <h3 className="font-heading text-[15px] font-bold text-portal-text">
              Password
            </h3>
            <p className="text-[12px] text-portal-muted">
              Change via secure email link
            </p>
          </div>
        </div>

        {!sent && (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              "Change Password"
            )}
          </button>
        )}
      </div>

      {sent && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Check your email for next steps. The link expires in 1 hour.
        </div>
      )}
    </div>
  );
}

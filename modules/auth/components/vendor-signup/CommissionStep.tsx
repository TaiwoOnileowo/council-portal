"use client";

import { ChevronLeft, Check } from "lucide-react";
import { formatAmount } from "@/lib/format";

type Props = {
  onBack: () => void;
  onAccept: () => void;
  loading: boolean;
  commissionNaira: number;
};

export default function CommissionStep({
  onBack,
  onAccept,
  loading,
  commissionNaira,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-portal-accent-bg border border-portal-accent-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-heading font-bold text-portal-text">
            Commission Structure
          </h3>
        </div>
        <p className="text-portal-text2 text-sm leading-relaxed">
          As a transport vendor on the CU Student Council portal, a flat
          commission of{" "}
          <span className="font-semibold text-portal-text">
            {formatAmount(commissionNaira)}
          </span>{" "}
          is charged per completed, booked ride.
        </p>
        <p className="text-[12px] text-portal-muted pt-1">
          By clicking &ldquo;Accept &amp; Create Account&rdquo; you agree to
          these terms.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-portal-border text-portal-text font-medium py-3 px-4 text-[15px] transition-colors hover:bg-portal-border/30"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={loading}
          className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Accept & Create Account"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export default function DetailRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-portal-border last:border-b-0">
      <span className="text-[12.5px] text-portal-muted flex-shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-portal-text text-right">
          {value}
        </span>
        {copyValue && (
          <button
            onClick={() => copy(copyValue)}
            className="flex-shrink-0 text-portal-muted/60 hover:text-portal-accent transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

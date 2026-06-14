"use client";

import { toggleVendorActive } from "@/lib/actions/admin.action";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function AdminVendorToggle({
  vendorId,
  initialIsActive,
}: {
  vendorId: string;
  initialIsActive: boolean;
}) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleVendorActive(vendorId);
      if (result.ok) {
        setIsActive(result.isActive);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
        isActive ? "bg-portal-green" : "bg-portal-border"
      }`}
      aria-label={isActive ? "Deactivate vendor" : "Activate vendor"}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 text-white m-auto animate-spin" />
      ) : (
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
            isActive ? "translate-x-4" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
}

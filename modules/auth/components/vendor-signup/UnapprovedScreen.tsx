"use client";

import { ChevronLeft, X } from "lucide-react";

type Props = {
  email: string;
  onBack: () => void;
};

export default function UnapprovedScreen({ email, onBack }: Props) {
  return (
    <div className="space-y-5 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <X className="w-7 h-7 text-red-500" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-heading font-bold text-portal-text text-lg">
          Not approved
        </h3>
        <p className="text-portal-muted text-sm leading-relaxed">
          <span className="text-portal-text font-medium break-all">{email}</span>{" "}
          is not on our approved vendor list. If you believe this is a mistake,
          please contact the Student Council.
        </p>
      </div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-portal-muted hover:text-portal-text transition-colors mx-auto"
      >
        <ChevronLeft size={15} />
        Try a different email
      </button>
    </div>
  );
}

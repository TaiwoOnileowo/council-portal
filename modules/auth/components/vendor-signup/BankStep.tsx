"use client";

import { useState } from "react";
import { ChevronLeft, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verifyBankAccount } from "@/lib/actions/bank.action";
import { vendorBankSchema } from "@/modules/vendor/vendor.types";
import BankSelector from "@/components/ui/BankSelector";
import { inputClass } from "@/lib/utils";

export type BankFields = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type Props = {
  value: BankFields;
  onChange: (fields: BankFields) => void;
  onBack: () => void;
  onNext: () => void;
};

type FieldErrors = Partial<Record<string, string>>;

export default function BankStep({ value, onChange, onBack, onNext }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const selectedBank = value.bankCode
    ? { code: value.bankCode, name: value.bankName }
    : null;

  function handleBankChange(bank: { code: string; name: string }) {
    onChange({
      ...value,
      bankCode: bank.code,
      bankName: bank.name,
      accountName: "",
    });
    setFieldErrors({});
  }

  function handleAccountNumberChange(accountNumber: string) {
    const digits = accountNumber.replace(/\D/g, "").slice(0, 10);
    onChange({ ...value, accountNumber: digits, accountName: "" });
    setFieldErrors({});
  }

  async function handleVerify() {
    const errs: FieldErrors = {};
    if (!value.bankCode) errs.bankCode = "Please select a bank";
    if (!/^\d{10}$/.test(value.accountNumber))
      errs.accountNumber = "Account number must be exactly 10 digits";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setVerifying(true);
    const result = await verifyBankAccount(value.accountNumber, value.bankCode);
    setVerifying(false);

    if (result.error || !result.account) {
      setFieldErrors({ accountNumber: result.error ?? "Verification failed." });
      return;
    }

    onChange({ ...value, accountName: result.account.accountName });
    toast.success("Account verified!");
  }

  function handleNext() {
    const parsed = vendorBankSchema.safeParse(value);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Bank<span className="text-portal-accent">*</span>
        </label>
        <BankSelector
          value={selectedBank}
          onChange={handleBankChange}
          error={fieldErrors.bankCode}
        />
        {fieldErrors.bankCode && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.bankCode}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-portal-text mb-1.5">
          Account Number<span className="text-portal-accent">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={value.accountNumber}
            onChange={(e) => handleAccountNumberChange(e.target.value)}
            placeholder="0123456789"
            maxLength={10}
            className={`${inputClass(fieldErrors.accountNumber)} flex-1`}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={
              verifying || !value.bankCode || value.accountNumber.length !== 10
            }
            className="px-4 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
        {fieldErrors.accountNumber && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.accountNumber}</p>
        )}
      </div>

      {value.accountName ? (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-[12px] text-green-700 font-medium uppercase tracking-wide">
              Account Verified
            </p>
            <p className="text-[15px] font-semibold text-portal-text">
              {value.accountName}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-portal-border bg-portal-bg px-4 py-3 text-[13px] text-portal-muted">
          Enter your account number and click{" "}
          <span className="font-medium text-portal-text">Verify</span> to confirm
          your account details.
        </div>
      )}

      {fieldErrors.accountName && (
        <p className="text-xs text-red-500">{fieldErrors.accountName}</p>
      )}

      <div className="flex gap-3 mt-2">
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
          onClick={handleNext}
          disabled={!value.accountName}
          className="flex-1 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white font-medium py-3 text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

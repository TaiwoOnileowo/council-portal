"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Check, X, Loader2, ShieldCheck, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyBankAccount } from "@/lib/actions/bank.action";
import { updateVendorProfile } from "@/lib/actions/vendor.action";
import { vendorBankSchema } from "@/modules/vendor/vendor.types";
import { useBanks } from "@/modules/vendor/hooks/useBanks";
import BankSelector from "@/components/ui/BankSelector";
import { inputClass } from "@/lib/utils";

type BankFields = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type Props = {
  vendor: { id: string } & Partial<BankFields>;
};

const inputCls = (err?: string) => inputClass(err, "sm");

export default function VendorBankDetails({ vendor }: Props) {
  useBanks();

  const initialFields: BankFields = {
    bankCode: vendor.bankCode ?? "",
    bankName: vendor.bankName ?? "",
    accountNumber: vendor.accountNumber ?? "",
    accountName: vendor.accountName ?? "",
  };

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<BankFields>(initialFields);
  const [verifying, setVerifying] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BankFields>({
    resolver: zodResolver(vendorBankSchema),
    defaultValues: {
      bankCode: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const watchedBankCode = watch("bankCode");
  const watchedBankName = watch("bankName");
  const watchedAccountNumber = watch("accountNumber");
  const watchedAccountName = watch("accountName");

  function startEdit() {
    reset({ ...saved });
    setEditing(true);
  }

  function cancelEdit() {
    reset();
    setEditing(false);
  }

  function handleBankChange(bank: { code: string; name: string }) {
    setValue("bankCode", bank.code, { shouldDirty: true });
    setValue("bankName", bank.name, { shouldDirty: true });
    setValue("accountName", "");
  }

  async function handleVerify() {
    if (!watchedBankCode || !/^\d{10}$/.test(watchedAccountNumber)) return;

    setVerifying(true);
    const result = await verifyBankAccount(watchedAccountNumber, watchedBankCode);
    setVerifying(false);

    if (result.error || !result.account) {
      toast.error(result.error ?? "Verification failed.");
      return;
    }

    setValue("accountName", result.account.accountName, { shouldDirty: true });
    toast.success("Account verified!");
  }

  async function onSubmit(data: BankFields) {
    const result = await updateVendorProfile({ ...data });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setSaved(data);
    setEditing(false);
    toast.success("Bank details updated");
  }

  const hasDetails = saved.bankName && saved.accountNumber && saved.accountName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-portal-accent-bg flex items-center justify-center">
            <Landmark className="w-4 h-4 text-portal-accent" />
          </div>
          <h3 className="font-heading text-[15px] font-bold text-portal-text">Bank Details</h3>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-portal-accent bg-portal-accent-bg hover:bg-portal-accent hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {hasDetails ? "Edit" : "Add"}
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-portal-muted hover:text-portal-text px-2.5 py-1.5 rounded-lg border border-portal-border transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || !watchedAccountName || isSubmitting}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        hasDetails ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                Bank
              </p>
              <p className="text-[13.5px] font-medium text-portal-text">{saved.bankName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Account Number
                </p>
                <p className="text-[13.5px] font-medium text-portal-text font-mono">
                  {saved.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Account Name
                </p>
                <p className="text-[13.5px] font-medium text-portal-text">{saved.accountName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-portal-border bg-portal-bg px-4 py-4">
            <Landmark className="w-5 h-5 text-portal-muted flex-shrink-0" />
            <p className="text-[13px] text-portal-muted">
              No bank details added yet. Click <span className="font-medium text-portal-text">Add</span> to set up your payout account.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Bank
            </label>
            <BankSelector
              size="sm"
              value={watchedBankCode ? { code: watchedBankCode, name: watchedBankName } : null}
              onChange={handleBankChange}
              error={errors.bankCode?.message}
            />
            {errors.bankCode && (
              <p className="mt-1 text-xs text-red-500">{errors.bankCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Account Number
            </label>
            <div className="flex gap-2">
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      field.onChange(digits);
                      setValue("accountName", "");
                    }}
                    className={`${inputCls(errors.accountNumber?.message)} flex-1`}
                  />
                )}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || !watchedBankCode || watchedAccountNumber.length !== 10}
                className="px-3 rounded-lg bg-portal-accent hover:bg-portal-accent2 text-white text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              >
                {verifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </div>
            {errors.accountNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.accountNumber.message}</p>
            )}
          </div>

          {watchedAccountName ? (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-green-700 font-medium uppercase tracking-wide">
                  Account Verified
                </p>
                <p className="text-[14px] font-semibold text-portal-text">{watchedAccountName}</p>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-portal-muted bg-portal-bg rounded-lg border border-portal-border px-3 py-2.5">
              Enter your account number and click{" "}
              <span className="font-medium text-portal-text">Verify</span> to confirm your
              account details.
            </p>
          )}

          {errors.accountName && (
            <p className="text-xs text-red-500">{errors.accountName.message}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

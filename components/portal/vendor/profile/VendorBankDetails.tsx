"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Pencil,
  Check,
  X,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { getBanks, verifyBankAccount } from "@/lib/actions/bank.action";
import type { Bank } from "@/lib/actions/bank.action";
import { updateVendorBankDetails } from "@/lib/actions/vendor.action";

type BankFields = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type FieldErrors = Partial<Record<keyof BankFields, string>>;

type Props = {
  vendor: { id: string } & Partial<BankFields>;
};

const inputCls = (err?: string) =>
  `w-full text-[13.5px] text-portal-text bg-portal-bg border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-portal-border focus:border-portal-accent focus:ring-portal-accent/30"
  } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all`;

// ─── Bank Selector ─────────────────────────────────────────────────────────────

function BankSelector({
  banks,
  value,
  onChange,
  error,
}: {
  banks: Bank[];
  value: { code: string; name: string } | null;
  onChange: (bank: { code: string; name: string }) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-lg border ${
          error ? "border-red-400" : "border-portal-border"
        } bg-portal-bg px-3 py-2 text-[13.5px] text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-portal-accent/30 focus:border-portal-accent transition-all`}
      >
        <span className={value ? "text-portal-text" : "text-portal-muted"}>
          {value ? value.name : "Select your bank"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-portal-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-portal-border bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-portal-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search banks..."
              className="w-full px-3 py-1.5 text-[13px] rounded-lg border border-portal-border outline-none focus:border-portal-accent bg-portal-bg"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[12px] text-portal-muted text-center py-4">No banks found</p>
            ) : (
              filtered.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    onChange({ code: bank.code, name: bank.name });
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-portal-accent-bg transition-colors ${
                    value?.code === bank.code
                      ? "bg-portal-accent-bg text-portal-accent font-medium"
                      : "text-portal-text"
                  }`}
                >
                  {bank.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function VendorBankDetails({ vendor }: Props) {
  const initialFields: BankFields = {
    bankCode: vendor.bankCode ?? "",
    bankName: vendor.bankName ?? "",
    accountNumber: vendor.accountNumber ?? "",
    accountName: vendor.accountName ?? "",
  };

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<BankFields>(initialFields);
  const [draft, setDraft] = useState<BankFields>(initialFields);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function startEdit() {
    setDraft({ ...saved });
    setErrors({});
    setEditing(true);

    if (banks.length === 0) {
      setBanksLoading(true);
      const { banks: fetched, error } = await getBanks();
      setBanksLoading(false);
      if (error || !fetched) {
        setBanksError(error ?? "Failed to load banks.");
      } else {
        setBanks(fetched);
      }
    }
  }

  function cancelEdit() {
    setDraft({ ...saved });
    setErrors({});
    setEditing(false);
  }

  function handleBankChange(bank: { code: string; name: string }) {
    setDraft((d) => ({ ...d, bankCode: bank.code, bankName: bank.name, accountName: "" }));
    setErrors({});
  }

  function handleAccountNumberChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setDraft((d) => ({ ...d, accountNumber: digits, accountName: "" }));
    setErrors({});
  }

  async function handleVerify() {
    const errs: FieldErrors = {};
    if (!draft.bankCode) errs.bankCode = "Please select a bank";
    if (!/^\d{10}$/.test(draft.accountNumber))
      errs.accountNumber = "Account number must be exactly 10 digits";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setVerifying(true);
    const result = await verifyBankAccount(draft.accountNumber, draft.bankCode);
    setVerifying(false);

    if (result.error || !result.account) {
      setErrors({ accountNumber: result.error ?? "Verification failed." });
      return;
    }

    setDraft((d) => ({ ...d, accountName: result.account!.accountName }));
    toast.success("Account verified!");
  }

  async function handleSave() {
    if (!draft.accountName) {
      setErrors({ accountName: "Please verify your account first" });
      return;
    }
    if (!draft.bankCode) {
      setErrors({ bankCode: "Please select a bank" });
      return;
    }
    if (!/^\d{10}$/.test(draft.accountNumber)) {
      setErrors({ accountNumber: "Account number must be exactly 10 digits" });
      return;
    }

    setSaving(true);
    const result = await updateVendorBankDetails({ vendorId: vendor.id, ...draft });
    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setSaved({ ...draft });
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
              onClick={handleSave}
              disabled={saving || !draft.accountName}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-portal-accent hover:bg-portal-accent2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
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
          {/* Bank selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Bank
            </label>
            {banksLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-portal-border px-3 py-2 text-portal-muted text-[13px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading banks...
              </div>
            ) : banksError ? (
              <p className="text-[13px] text-red-500">{banksError}</p>
            ) : (
              <BankSelector
                banks={banks}
                value={draft.bankCode ? { code: draft.bankCode, name: draft.bankName } : null}
                onChange={handleBankChange}
                error={errors.bankCode}
              />
            )}
            {errors.bankCode && (
              <p className="mt-1 text-xs text-red-500">{errors.bankCode}</p>
            )}
          </div>

          {/* Account number */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1.5">
              Account Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={draft.accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="0123456789"
                maxLength={10}
                className={`${inputCls(errors.accountNumber)} flex-1`}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || !draft.bankCode || draft.accountNumber.length !== 10}
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
              <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>
            )}
          </div>

          {/* Verified account name */}
          {draft.accountName ? (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-green-700 font-medium uppercase tracking-wide">
                  Account Verified
                </p>
                <p className="text-[14px] font-semibold text-portal-text">{draft.accountName}</p>
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
            <p className="text-xs text-red-500">{errors.accountName}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

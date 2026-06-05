"use client";

import { useBanks } from "@/modules/vendor/hooks/useBanks";
import Select from "@/components/ui/Select";

type SelectedBank = { code: string; name: string };

type Props = {
  value: SelectedBank | null;
  onChange: (bank: SelectedBank) => void;
  error?: string;
  size?: "sm" | "md";
};

export default function BankSelector({ value, onChange, error, size = "md" }: Props) {
  const { data: banks = [], isLoading, isError, error: queryError } = useBanks();

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {queryError instanceof Error ? queryError.message : "Failed to load banks."}
      </div>
    );
  }

  const options = Array.from(
    new Map(banks.map((b) => [b.code, { value: b.code, label: b.name }])).values(),
  );

  return (
    <Select
      options={options}
      value={value?.code ?? null}
      onChange={(code) => {
        const bank = banks.find((b) => b.code === code);
        if (bank) onChange({ code: bank.code, name: bank.name });
      }}
      placeholder="Select your bank"
      searchable
      searchPlaceholder="Search banks..."
      emptyText="No banks found"
      loading={isLoading}
      error={error}
      size={size}
    />
  );
}

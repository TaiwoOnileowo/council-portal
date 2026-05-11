"use client";

import { useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OtpInput({ value, onChange, disabled, error }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    const arr = [...digits];
    if (arr[i]) {
      arr[i] = "";
      onChange(arr.join("").trimEnd());
    } else if (i > 0) {
      arr[i - 1] = "";
      onChange(arr.join("").trimEnd());
      inputs.current[i - 1]?.focus();
    }
  }

  function handleInput(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const arr = [...digits];
    arr[i] = digit;
    onChange(arr.join("").trimEnd());
    if (i < 5) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={disabled}
            onPaste={handlePaste}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            style={{ height: "52px" }}
            className={`w-11 text-center rounded-lg border text-xl font-semibold text-portal-text outline-none transition
              ${error ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400" : "border-portal-border focus:border-portal-accent focus:ring-1 focus:ring-portal-accent"}
              ${disabled ? "bg-gray-50 text-portal-muted cursor-not-allowed" : "bg-white"}`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

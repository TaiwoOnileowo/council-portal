import { parse24, to24 } from "@/lib/format";

export default function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { hours12, minutes, isPM } = parse24(value);
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <select
        value={hours12}
        onChange={(e) => onChange(to24(Number(e.target.value), minutes, isPM))}
        className="w-12 px-1 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-portal-muted text-[13px]">:</span>
      <select
        value={minutes}
        onChange={(e) => onChange(to24(hours12, Number(e.target.value), isPM))}
        className="w-14 px-1 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
      >
        {[0, 15, 30, 45].map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
      <div className="flex rounded-md border border-portal-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(to24(hours12, minutes, false))}
          className={`px-2 py-1.5 text-[12px] font-semibold transition-colors ${
            !isPM
              ? "bg-portal-accent text-white"
              : "bg-portal-bg text-portal-muted hover:bg-portal-bg2"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => onChange(to24(hours12, minutes, true))}
          className={`px-2 py-1.5 text-[12px] font-semibold transition-colors ${
            isPM
              ? "bg-portal-accent text-white"
              : "bg-portal-bg text-portal-muted hover:bg-portal-bg2"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}

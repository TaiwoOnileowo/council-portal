import type { PriceList } from "@/modules/vendor/vendor.types";
import StatusPill from "./StatusPill";

export default function PriceListCard({ pl, onEdit }: { pl: PriceList; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="text-left w-full bg-portal-surface border border-portal-border rounded-xl p-4 hover:border-portal-accent/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[14px] font-semibold text-portal-text group-hover:text-portal-accent transition-colors leading-snug">
          {pl.name}
        </p>
        <StatusPill availability={pl.availability} />
      </div>
      <p className="text-[12px] text-portal-muted">
        {pl.routes.length} route{pl.routes.length !== 1 ? "s" : ""}
      </p>
    </button>
  );
}

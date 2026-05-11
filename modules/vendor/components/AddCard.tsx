import { Plus } from "lucide-react";

export default function AddCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="text-left w-full border border-dashed border-portal-border rounded-xl p-4 hover:border-portal-accent/50 hover:bg-portal-accent/[0.02] transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-portal-accent/10 flex items-center justify-center flex-shrink-0">
          <Plus className="w-3.5 h-3.5 text-portal-accent" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-portal-text">Add price list</p>
          <p className="text-[11px] text-portal-muted mt-0.5">
            Set routes, prices & departure times
          </p>
        </div>
      </div>
    </button>
  );
}

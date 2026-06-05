import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function DirectionBadge({ direction }: { direction: "LEAVING" | "RETURNING" }) {
  const isLeaving = direction === "LEAVING";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
        isLeaving
          ? "bg-portal-blue-bg text-portal-blue"
          : "bg-portal-green-bg text-portal-green"
      }`}
    >
      {isLeaving ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
      {isLeaving ? "Leaving" : "Returning"}
    </span>
  );
}

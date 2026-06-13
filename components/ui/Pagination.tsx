"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
};

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

type PageItem = number | "ellipsis";

function getPageItems(
  page: number,
  pageCount: number,
  siblingCount: number,
): PageItem[] {
  const totalSlots = siblingCount * 2 + 5;
  if (pageCount <= totalSlots) return range(0, pageCount - 1);

  const left = Math.max(page - siblingCount, 0);
  const right = Math.min(page + siblingCount, pageCount - 1);
  const showLeftEllipsis = left > 1;
  const showRightEllipsis = right < pageCount - 2;
  const edgeCount = 3 + siblingCount * 2;

  if (!showLeftEllipsis && showRightEllipsis)
    return [...range(0, edgeCount - 1), "ellipsis", pageCount - 1];

  if (showLeftEllipsis && !showRightEllipsis)
    return [0, "ellipsis", ...range(pageCount - edgeCount, pageCount - 1)];

  return [0, "ellipsis", ...range(left, right), "ellipsis", pageCount - 1];
}

const arrowCls =
  "flex items-center justify-center w-8 h-8 rounded-full border border-portal-border bg-portal-surface text-portal-text hover:bg-portal-accent-bg/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className = "",
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const items = getPageItems(page, pageCount, siblingCount);

  return (
    <div
      className={`flex items-center justify-between px-1 print:hidden ${className}`}
    >
      <p className="text-[12.5px] text-portal-muted">
        Page <span className="font-semibold text-portal-text">{page + 1}</span>{" "}
        of {pageCount}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className={arrowCls}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {items.map((item, i) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex items-center justify-center w-8 h-8 text-[12.5px] text-portal-muted select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item + 1}`}
              aria-current={item === page}
              className={`w-8 h-8 rounded-full text-[12.5px] font-semibold transition-colors ${
                item === page
                  ? "bg-portal-green text-white"
                  : "border border-portal-border bg-portal-surface text-portal-text hover:bg-portal-accent-bg/50"
              }`}
            >
              {item + 1}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
          disabled={page === pageCount - 1}
          className={arrowCls}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

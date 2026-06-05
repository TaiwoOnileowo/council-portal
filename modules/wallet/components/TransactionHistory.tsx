"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useTransactions } from "@/modules/wallet/hooks/useTransactions";
import {
  WALLET_TX_PAGE_SIZE,
  type WalletTransaction,
} from "@/modules/wallet/wallet.types";
import {
  TRANSACTION_TYPE_FILTERS,
  transactionTypeConfig,
} from "@/modules/wallet/wallet.constant";
import { formatAmount } from "@/lib/format";
import {
  formatSignedAmount,
  formatTransactionDate,
} from "@/modules/wallet/wallet.util";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-portal-border last:border-b-0 animate-pulse">
      <div className="w-9 h-9 rounded-[10px] bg-portal-border flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-portal-border rounded w-2/3" />
        <div className="h-3 bg-portal-border rounded w-1/3" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-3.5 bg-portal-border rounded w-16 ml-auto" />
        <div className="h-3 bg-portal-border rounded w-12 ml-auto" />
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const cfg = transactionTypeConfig(tx.type, tx.difference);
  const Icon = cfg.icon;
  const credit = tx.difference >= 0;

  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-portal-border last:border-b-0">
      <div
        className={`w-9 h-9 rounded-[10px] ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-[17px] h-[17px] ${cfg.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-portal-text truncate">
          {tx.reason}
        </p>
        <p className="text-xs text-portal-muted mt-0.5 truncate">
          {formatTransactionDate(tx.createdAt)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={`text-[13.5px] font-bold font-heading ${
            credit ? "text-portal-green" : "text-portal-text"
          }`}
        >
          {formatSignedAmount(tx.difference)}
        </p>
        <p className="text-[11px] text-portal-muted mt-0.5">
          Bal {formatAmount(tx.balance / 100)}
        </p>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const [page, setPage] = useState(0);
  const [type, setType] = useState("all");

  const { data, isLoading, isFetching } = useTransactions({ type, page });

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / WALLET_TX_PAGE_SIZE);

  const hasFilter = type !== "all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">
          Transaction History
        </h2>

        <div className="relative">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(0);
            }}
            className="appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
          >
            {TRANSACTION_TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
        </div>
      </div>

      <div
        className={`bg-portal-surface border border-portal-border rounded-2xl overflow-hidden transition-opacity ${
          isFetching && !isLoading ? "opacity-60" : ""
        }`}
      >
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13.5px] font-medium text-portal-text">
              {hasFilter ? "No matching transactions" : "No transactions yet"}
            </p>
            <p className="text-[12.5px] text-portal-muted mt-1">
              {hasFilter
                ? "Try a different filter"
                : "Your wallet activity will appear here"}
            </p>
          </div>
        ) : (
          transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          className="mt-3.5"
        />
      )}
    </motion.div>
  );
}

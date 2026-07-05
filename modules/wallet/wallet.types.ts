import { z } from "zod";

export const WALLET_TX_PAGE_SIZE = 20;

export const walletTopupMetadataSchema = z.object({
  requestedAmountKobo: z.number().int().positive(),
});

export type WalletTopupMetadata = z.infer<typeof walletTopupMetadataSchema>;

export type WalletTransactionType = "topup" | "booking" | "refund";

export type WalletTransaction = {
  id: string;
  reason: string;
  type: string | null;
  difference: number; // signed delta in kobo
  balance: number; // running balance in kobo
  reference: string | null;
  createdAt: string;
};

export type WalletTransactionsFilters = {
  type: string; // "all" | WalletTransactionType
  page: number;
};

export type WalletTransactionsResponse = {
  transactions: WalletTransaction[];
  total: number;
};

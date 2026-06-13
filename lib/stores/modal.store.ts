import { create } from "zustand";

type BankAccount = { name: string; accountName: string; mask: string };

interface ModalStore {
  topUp: {
    open: boolean;
    prefilledAmount?: number;
    onSuccess?: () => void;
  };
  withdraw: {
    open: boolean;
    availableKobo: number;
    bankAccount: BankAccount | null;
  };
  openTopUp: (opts?: {
    prefilledAmount?: number;
    onSuccess?: () => void;
  }) => void;
  closeTopUp: () => void;
  openWithdraw: (opts: {
    availableKobo: number;
    bankAccount: BankAccount | null;
  }) => void;
  closeWithdraw: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  topUp: { open: false },
  withdraw: { open: false, availableKobo: 0, bankAccount: null },
  openTopUp: (opts = {}) => set({ topUp: { open: true, ...opts } }),
  closeTopUp: () => set({ topUp: { open: false } }),
  openWithdraw: (opts) => set({ withdraw: { open: true, ...opts } }),
  closeWithdraw: () =>
    set({ withdraw: { open: false, availableKobo: 0, bankAccount: null } }),
}));

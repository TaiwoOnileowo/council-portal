import { create } from "zustand";

type BankAccount = { name: string; accountName: string; mask: string };

interface ModalStore {
  topUp: {
    open: boolean;
    openId: number; // bumped on every openTopUp — used as a React key to
    // force TopUpModal to remount fresh instead of resetting state via effect
  };
  withdraw: {
    open: boolean;
    availableKobo: number;
    bankAccount: BankAccount | null;
  };
  openTopUp: () => void;
  closeTopUp: () => void;
  openWithdraw: (opts: {
    availableKobo: number;
    bankAccount: BankAccount | null;
  }) => void;
  closeWithdraw: () => void;
}

export const useModalStore = create<ModalStore>((set, get) => ({
  topUp: { open: false, openId: 0 },
  withdraw: { open: false, availableKobo: 0, bankAccount: null },
  openTopUp: () =>
    set({ topUp: { open: true, openId: get().topUp.openId + 1 } }),
  closeTopUp: () =>
    set((state) => ({ topUp: { open: false, openId: state.topUp.openId } })),
  openWithdraw: (opts) => set({ withdraw: { open: true, ...opts } }),
  closeWithdraw: () =>
    set({ withdraw: { open: false, availableKobo: 0, bankAccount: null } }),
}));

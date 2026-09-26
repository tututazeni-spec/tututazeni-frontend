// lib/modalVisibility.ts
//
// Estado partilhado de "há algum Modal aberto?" — usado pelo Topbar para se
// auto-ocultar enquanto um Modal está visível (o Topbar é `position: fixed`
// com z-index acima do Overlay/Content do Modal, por isso sem isto ficaria
// por cima do modal a interferir). O Modal em components/ui/Modal.tsx
// incrementa/decrementa isto sempre que abre/fecha.

import { create } from 'zustand';

interface ModalVisibilityState {
  openCount: number;
  increment: () => void;
  decrement: () => void;
}

export const useModalVisibilityStore = create<ModalVisibilityState>((set) => ({
  openCount: 0,
  increment: () => set((s) => ({ openCount: s.openCount + 1 })),
  decrement: () => set((s) => ({ openCount: Math.max(0, s.openCount - 1) })),
}));

export function useAnyModalOpen() {
  return useModalVisibilityStore((s) => s.openCount > 0);
}

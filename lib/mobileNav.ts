// lib/mobileNav.ts
//
// Estado da gaveta de navegação em ecrãs estreitos (< 1024px). Em ecrãs largos
// a Sidebar é fixa e este estado não tem efeito (as classes `.app-*` em
// globals.css só o aplicam dentro da media query).

import { create } from 'zustand';

interface MobileNavState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

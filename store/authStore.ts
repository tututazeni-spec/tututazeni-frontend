import { create } from "zustand";
import { logout as logoutRequest } from "../lib/auth";

// Estado de autenticação leve. O token vive num cookie httpOnly (o JS nunca lhe
// acede), por isso aqui guardamos apenas se há sessão activa — nunca o token.
interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  logout: () => {
    set({ isAuthenticated: false });
    void logoutRequest(); // pede ao backend para limpar o cookie + redirecciona
  },
}));

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type AuthUser = {
  id?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  [key: string]: unknown;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return noopStorage;
        return window.localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPublic } from "@nexape/shared";

interface AuthState {
  accessToken: string | null;
  user: UserPublic | null;
  setAuth: (auth: { accessToken: string; user: UserPublic }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    { name: "nexape-auth" },
  ),
);

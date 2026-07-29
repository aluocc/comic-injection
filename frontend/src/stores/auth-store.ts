"use client";

import { create } from "zustand";

/**
 * Authenticated user projection returned by /auth/register, /auth/login, /auth/me.
 */
export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  targetLanguage: string | null;
  currentLevel: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** Hydrate flag: true once we've attempted restoring from localStorage. */
  hydrated: boolean;
  login: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persist(token: string | null, user: AuthUser | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // ignore quota / privacy mode errors
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  login: (token, user) => {
    persist(token, user);
    set({ token, user, hydrated: true });
  },

  setUser: (user) => {
    set((state) => {
      const next = { ...user };
      persist(state.token, next);
      return { user: next };
    });
  },

  logout: () => {
    persist(null, null);
    set({ token: null, user: null, hydrated: true });
  },

  hydrate: () => {
    const token = readToken();
    const user = readUser();
    set({ token, user, hydrated: true });
  },
}));

import { create } from 'zustand';
import api, { setAuthToken } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.token ?? null;

      setAuthToken(token);

      set({
        user: res.data?.user ?? null,
        token,
        loading: false,
      });

      return true;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data: any) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);
      const token = res.data?.token ?? null;

      setAuthToken(token);

      set({
        user: res.data?.user ?? null,
        token,
        loading: false,
      });

      return true;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null });
  },
}));

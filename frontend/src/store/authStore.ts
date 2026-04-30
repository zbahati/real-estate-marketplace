import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken } from '../services/api';
import type { User } from '../types';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  favoriteIds: Set<number>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  addFavoriteId: (id: number) => void;
  removeFavoriteId: (id: number) => void;
  setFavoriteIds: (ids: number[]) => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function storeToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    console.warn('Failed to store token securely');
  }
}

async function removeStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    console.warn('Failed to remove stored token');
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
  favoriteIds: new Set(),

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.token ?? null;

      if (!token) {
        set({ loading: false });
        return false;
      }

      await storeToken(token);
      setAuthToken(token);

      const userRes = await api.get('/auth/me');
      const user = userRes.data?.data ?? userRes.data ?? null;

      set({
        user,
        token,
        loading: false,
      });

      return true;
    } catch (err: any) {
      set({ loading: false });
      const message = err.response?.data?.message ?? 'Login failed';
      throw new Error(message);
    }
  },

  register: async (data: RegisterData) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);

      const token = res.data?.token ?? null;
      const user = res.data?.user ?? null;

      if (token) {
        await storeToken(token);
        setAuthToken(token);
      }

      set({
        user,
        token,
        loading: false,
      });

      return true;
    } catch (err: any) {
      set({ loading: false });
      const message = err.response?.data?.message ?? 'Registration failed';
      throw new Error(message);
    }
  },

  logout: async () => {
    await removeStoredToken();
    setAuthToken(null);
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data ?? res.data;
      set({ user });
    } catch {
      set({ user: null, token: null });
      await removeStoredToken();
      setAuthToken(null);
    }
  },

  addFavoriteId: (id: number) => {
    const favoriteIds = new Set(get().favoriteIds);
    favoriteIds.add(id);
    set({ favoriteIds });
  },

  removeFavoriteId: (id: number) => {
    const favoriteIds = new Set(get().favoriteIds);
    favoriteIds.delete(id);
    set({ favoriteIds });
  },

  setFavoriteIds: (ids: number[]) => {
    set({ favoriteIds: new Set(ids) });
  },
}));

export async function initializeAuth(): Promise<void> {
  const token = await getStoredToken();
  if (token) {
    setAuthToken(token);
    await useAuthStore.getState().fetchMe();
  }
  useAuthStore.setState({ initialized: true });
}

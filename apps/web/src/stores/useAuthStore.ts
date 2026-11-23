import { create } from 'zustand';
import type { UserProfile } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; vehicle_type?: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('jalurtikus_token'),
  isAuthenticated: Boolean(localStorage.getItem('jalurtikus_token')),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { access_token } = await authService.login(credentials);
      set({ token: access_token, isAuthenticated: true, isLoading: false });
      const user = await authService.getMe();
      set({ user });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      const { access_token } = await authService.login({ email: data.email, password: data.password });
      set({ token: access_token, isAuthenticated: true, isLoading: false });
      const user = await authService.getMe();
      set({ user });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('jalurtikus_token');
    if (!token) return;
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      authService.logout();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

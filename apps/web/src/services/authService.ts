import { apiClient } from './api';
import type { APIResponse, UserProfile } from '../types';

export const authService = {
  async register(data: { email: string; password: string; full_name: string; vehicle_type?: string }): Promise<UserProfile> {
    const res = await apiClient.post<APIResponse<UserProfile>>('/auth/register', data);
    return res.data.data;
  },

  async login(credentials: { email: string; password: string }): Promise<{ access_token: string }> {
    const res = await apiClient.post<APIResponse<{ access_token: string }>>('/auth/login', credentials);
    const token = res.data.data.access_token;
    localStorage.setItem('jalurtikus_token', token);
    return res.data.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<APIResponse<UserProfile>>('/users/me');
    return res.data.data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiClient.patch<APIResponse<UserProfile>>('/users/me', updates);
    return res.data.data;
  },

  logout() {
    localStorage.removeItem('jalurtikus_token');
  },
};

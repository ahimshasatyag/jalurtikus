import { apiClient } from './api';
import type { APIResponse, LocationCandidate } from '../types';

export const locationService = {
  async searchLocations(query: string, limit = 5): Promise<LocationCandidate[]> {
    if (!query || query.trim().length < 2) return [];
    const res = await apiClient.get<APIResponse<LocationCandidate[]>>('/locations/search', {
      params: { q: query, limit },
    });
    return res.data.data;
  },
};

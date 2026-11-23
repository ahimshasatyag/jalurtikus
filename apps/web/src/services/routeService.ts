import { apiClient } from './api';
import type {
  APIResponse,
  RouteSearchRequest,
  RouteSearchData,
  RouteOption,
  Coordinates,
} from '../types';

export const routeService = {
  async searchRoutes(params: RouteSearchRequest): Promise<RouteSearchData> {
    const res = await apiClient.post<APIResponse<RouteSearchData>>('/routes/search', params);
    return res.data.data;
  },

  async getRouteById(routeId: string): Promise<RouteOption> {
    const res = await apiClient.get<APIResponse<RouteOption>>(`/routes/${routeId}`);
    return res.data.data;
  },

  async selectRoute(routeId: string): Promise<{ selected_route_id: string; status: string }> {
    const res = await apiClient.post<APIResponse<{ selected_route_id: string; status: string }>>(
      `/routes/${routeId}/select`
    );
    return res.data.data;
  },

  async reroute(routeId: string, currentLocation: Coordinates): Promise<RouteOption> {
    const res = await apiClient.post<APIResponse<RouteOption>>(`/routes/${routeId}/reroute`, {
      current_location: currentLocation,
    });
    return res.data.data;
  },
};

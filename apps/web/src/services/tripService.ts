import { apiClient } from './api';
import type { APIResponse, Trip, Coordinates } from '../types';

export const tripService = {
  async startTrip(routeId: string, origin: Coordinates, destination: Coordinates, vehicleType = 'motorcycle'): Promise<Trip> {
    const res = await apiClient.post<APIResponse<Trip>>('/trips/start', {
      route_id: routeId,
      origin,
      destination,
      vehicle_type: vehicleType,
    });
    return res.data.data;
  },

  async updateGPS(tripId: string, location: Coordinates, speedKmh = 30): Promise<Trip> {
    const res = await apiClient.post<APIResponse<Trip>>('/gps/update', {
      trip_id: tripId,
      current_location: location,
      speed_kmh: speedKmh,
    });
    return res.data.data;
  },

  async completeTrip(tripId: string): Promise<Trip> {
    const res = await apiClient.post<APIResponse<Trip>>(`/trips/${tripId}/complete`);
    return res.data.data;
  },

  async cancelTrip(tripId: string): Promise<Trip> {
    const res = await apiClient.post<APIResponse<Trip>>(`/trips/${tripId}/cancel`);
    return res.data.data;
  },

  async getTripHistory(): Promise<Trip[]> {
    const res = await apiClient.get<APIResponse<Trip[]>>('/trips/history');
    return res.data.data;
  },
};

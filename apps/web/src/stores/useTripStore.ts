import { create } from 'zustand';
import type { Trip, Coordinates } from '../types';
import { tripService } from '../services/tripService';

interface TripState {
  activeTrip: Trip | null;
  history: Trip[];
  isLoading: boolean;
  error: string | null;

  startTrip: (routeId: string, origin: Coordinates, destination: Coordinates, vehicleType?: string) => Promise<void>;
  updateGPS: (currentLocation: Coordinates) => Promise<void>;
  completeTrip: () => Promise<void>;
  cancelTrip: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  activeTrip: null,
  history: [],
  isLoading: false,
  error: null,

  startTrip: async (routeId, origin, destination, vehicleType = 'motorcycle') => {
    set({ isLoading: true, error: null });
    try {
      const trip = await tripService.startTrip(routeId, origin, destination, vehicleType);
      set({ activeTrip: trip, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateGPS: async (currentLocation) => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    try {
      const updated = await tripService.updateGPS(activeTrip.trip_id, currentLocation);
      set({ activeTrip: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  completeTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    try {
      await tripService.completeTrip(activeTrip.trip_id);
      set({ activeTrip: null });
      get().fetchHistory();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  cancelTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    try {
      await tripService.cancelTrip(activeTrip.trip_id);
      set({ activeTrip: null });
      get().fetchHistory();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchHistory: async () => {
    try {
      const history = await tripService.getTripHistory();
      set({ history });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));

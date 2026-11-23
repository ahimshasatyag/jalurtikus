import { create } from 'zustand';
import type { TrafficSnapshot, Incident } from '../types';
import { trafficService } from '../services/trafficService';

interface TrafficState {
  snapshot: TrafficSnapshot | null;
  incidents: Incident[];
  isLoading: boolean;
  error: string | null;

  fetchTraffic: () => Promise<void>;
  fetchIncidents: () => Promise<void>;
}

export const useTrafficStore = create<TrafficState>((set) => ({
  snapshot: null,
  incidents: [],
  isLoading: false,
  error: null,

  fetchTraffic: async () => {
    try {
      const data = await trafficService.getCurrentTraffic();
      set({ snapshot: data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchIncidents: async () => {
    set({ isLoading: true });
    try {
      const data = await trafficService.getIncidents();
      set({ incidents: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

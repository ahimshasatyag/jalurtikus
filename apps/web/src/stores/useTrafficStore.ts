import { create } from 'zustand';
import type { TrafficSnapshot, Incident } from '../types';
import { trafficService } from '../services/trafficService';

interface TrafficState {
  snapshot: TrafficSnapshot | null;
  incidents: Incident[];
  apiKey: string;
  isLoading: boolean;
  error: string | null;

  setApiKey: (key: string) => Promise<void>;
  fetchTraffic: () => Promise<void>;
  fetchIncidents: (bbox?: string) => Promise<void>;
}

const initialApiKey =
  typeof window !== 'undefined'
    ? localStorage.getItem('jalurtikus_tomtom_api_key') || 'ROoTCzMoyLgBWBWAmOqfLFCqxcPuP7Ww'
    : 'ROoTCzMoyLgBWBWAmOqfLFCqxcPuP7Ww';

export const useTrafficStore = create<TrafficState>((set, get) => ({
  snapshot: null,
  incidents: [],
  apiKey: initialApiKey,
  isLoading: false,
  error: null,

  setApiKey: async (key: string) => {
    const cleanKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('jalurtikus_tomtom_api_key', cleanKey);
    }
    set({ apiKey: cleanKey });
    try {
      await trafficService.saveConfig(cleanKey);
    } catch {
      // fallback
    }
    await get().fetchIncidents();
    await get().fetchTraffic();
  },

  fetchTraffic: async () => {
    try {
      const data = await trafficService.getCurrentTraffic();
      set({ snapshot: data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchIncidents: async (bbox?: string) => {
    set({ isLoading: true });
    try {
      const currentKey = get().apiKey;
      const data = await trafficService.getIncidents(bbox, currentKey || undefined);
      set({ incidents: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

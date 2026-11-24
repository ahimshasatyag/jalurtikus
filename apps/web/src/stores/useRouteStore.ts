import { create } from 'zustand';
import type {
  Coordinates,
  VehicleType,
  RoutePreference,
  RouteOption,
  RouteSearchData,
} from '../types';
import { routeService } from '../services/routeService';

interface RouteState {
  origin: Coordinates | null;
  originName: string;
  destination: Coordinates | null;
  destinationName: string;
  vehicleType: VehicleType;
  preference: RoutePreference;
  avoidTolls: boolean;
  avoidCongestion: boolean;

  recommendedRoute: RouteOption | null;
  alternatives: RouteOption[];
  selectedRoute: RouteOption | null;
  comparison: RouteSearchData['comparison'] | null;

  isLoading: boolean;
  error: string | null;

  setOrigin: (coords: Coordinates, name?: string) => void;
  setDestination: (coords: Coordinates, name?: string) => void;
  setVehicleType: (type: VehicleType) => void;
  setPreference: (pref: RoutePreference) => void;
  setAvoidTolls: (val: boolean) => void;
  setAvoidCongestion: (val: boolean) => void;
  setSelectedRoute: (route: RouteOption) => void;
  searchRoutes: () => Promise<void>;
  clearRoute: () => void;
}

// Mengambil posisi GPS tersimpan user jika ada, atau default ke lokasi terkalibrasi (-6.1372, 106.7892)
const getInitialOrigin = (): { coords: Coordinates; name: string } => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('jalurtikus_user_gps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          return {
            coords: { latitude: parsed.latitude, longitude: parsed.longitude },
            name: parsed.name || 'Lokasi Saya (Terkalibrasi)',
          };
        }
      }
    } catch {
      // fallback
    }
  }
  return {
    coords: { latitude: -6.1372, longitude: 106.7892 },
    name: 'Jl. Soka, Pejagalan (GPS Saya)',
  };
};

const initialOrigin = getInitialOrigin();

export const useRouteStore = create<RouteState>((set, get) => ({
  origin: initialOrigin.coords,
  originName: initialOrigin.name,
  destination: { latitude: -6.244383, longitude: 106.798132 },
  destinationName: 'Terminal Blok M',
  vehicleType: 'motorcycle',
  preference: 'avoid_congestion',
  avoidTolls: false,
  avoidCongestion: true,

  recommendedRoute: null,
  alternatives: [],
  selectedRoute: null,
  comparison: null,

  isLoading: false,
  error: null,

  setOrigin: (coords, name) => set({ origin: coords, originName: name || 'Titik Asal Terpilih' }),
  setDestination: (coords, name) =>
    set({ destination: coords, destinationName: name || 'Titik Tujuan Terpilih' }),
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setPreference: (preference) => set({ preference }),
  setAvoidTolls: (avoidTolls) => set({ avoidTolls }),
  setAvoidCongestion: (avoidCongestion) => set({ avoidCongestion }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),

  searchRoutes: async () => {
    const { origin, destination, vehicleType, preference, avoidTolls, avoidCongestion } = get();
    if (!origin || !destination) {
      set({ error: 'Titik asal dan tujuan harus diisi' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await routeService.searchRoutes({
        origin,
        destination,
        vehicle_type: vehicleType,
        route_preference: preference,
        avoid_tolls: avoidTolls,
        avoid_congestion: avoidCongestion,
        alternatives: 2,
      });

      set({
        recommendedRoute: data.recommended_route,
        alternatives: data.alternatives,
        selectedRoute: data.recommended_route,
        comparison: data.comparison,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mencari rute', isLoading: false });
    }
  },

  clearRoute: () =>
    set({
      recommendedRoute: null,
      alternatives: [],
      selectedRoute: null,
      comparison: null,
      error: null,
    }),
}));

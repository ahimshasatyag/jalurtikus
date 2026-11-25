import { create } from 'zustand';
import type { Trip, Coordinates } from '../types';
import { tripService } from '../services/tripService';
import { calculateBearing, haversineDistance } from '../utils/geo';

interface TripState {
  activeTrip: Trip | null;
  history: Trip[];
  isLoading: boolean;
  error: string | null;

  // Status Navigasi 3D & Tracking Kamera
  isNavigating: boolean;
  is3DMode: boolean;
  autoFollow: boolean;
  currentGPS: Coordinates | null;
  currentBearing: number;
  currentSpeedKmh: number;
  currentCoordIndex: number;
  routeCoordinates: [number, number][]; // [[lon, lat], ...]

  startTrip: (
    routeId: string,
    origin: Coordinates,
    destination: Coordinates,
    vehicleType?: string,
    coordinates?: [number, number][]
  ) => Promise<void>;
  updateGPS: (currentLocation: Coordinates, speedKmh?: number, bearing?: number) => Promise<void>;
  setIs3DMode: (is3D: boolean) => void;
  setAutoFollow: (follow: boolean) => void;
  setCurrentBearing: (bearing: number) => void;
  stepManual: (steps?: number) => void;
  jumpToProgress: (ratio: number) => void;
  completeTrip: () => Promise<void>;
  cancelTrip: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  activeTrip: null,
  history: [],
  isLoading: false,
  error: null,

  isNavigating: false,
  is3DMode: true,
  autoFollow: true,
  currentGPS: null,
  currentBearing: 0,
  currentSpeedKmh: 0,
  currentCoordIndex: 0,
  routeCoordinates: [],

  startTrip: async (routeId, origin, destination, vehicleType = 'motorcycle', coordinates = []) => {
    set({ isLoading: true, error: null });

    try {
      const trip = await tripService.startTrip(routeId, origin, destination, vehicleType);

      // Hitung arah pandang awal (bearing) dari titik 0 ke titik 1
      let initialBearing = 0;
      let startCoords = origin;
      if (coordinates.length >= 2) {
        startCoords = { latitude: coordinates[0][1], longitude: coordinates[0][0] };
        initialBearing = calculateBearing(
          coordinates[0][1],
          coordinates[0][0],
          coordinates[1][1],
          coordinates[1][0]
        );
      }

      set({
        activeTrip: trip,
        isNavigating: true,
        is3DMode: true,
        autoFollow: true,
        currentGPS: startCoords,
        currentBearing: initialBearing,
        currentCoordIndex: 0,
        routeCoordinates: coordinates,
        currentSpeedKmh: 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateGPS: async (currentLocation, speedKmh = 30, bearing) => {
    const { activeTrip, currentGPS } = get();
    if (!activeTrip) return;

    let newBearing = bearing;
    if (newBearing === undefined && currentGPS) {
      const dist = haversineDistance(
        currentGPS.latitude,
        currentGPS.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      // Hanya ubah sudut bearing jika ada pergerakan nyata > 1 meter
      if (dist > 1) {
        newBearing = calculateBearing(
          currentGPS.latitude,
          currentGPS.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );
      }
    }

    set({
      currentGPS: currentLocation,
      currentSpeedKmh: speedKmh,
      currentBearing: newBearing !== undefined ? newBearing : get().currentBearing,
      autoFollow: true,
    });

    try {
      const updated = await tripService.updateGPS(activeTrip.trip_id, currentLocation);
      set({ activeTrip: updated });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setIs3DMode: (is3DMode) => set({ is3DMode }),
  setAutoFollow: (autoFollow) => set({ autoFollow }),
  setCurrentBearing: (currentBearing) => set({ currentBearing }),

  stepManual: (steps = 1) => {
    const { routeCoordinates, currentCoordIndex, activeTrip, updateGPS } = get();
    if (!routeCoordinates || routeCoordinates.length === 0) return;

    let nextIndex = currentCoordIndex + steps;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= routeCoordinates.length) {
      // Tiba di tujuan
      set({ currentCoordIndex: routeCoordinates.length - 1 });
      get().completeTrip();
      return;
    }

    const currentPt = routeCoordinates[currentCoordIndex];
    const nextPt = routeCoordinates[nextIndex];
    const nextLon = nextPt[0];
    const nextLat = nextPt[1];

    const bearing = calculateBearing(currentPt[1], currentPt[0], nextLat, nextLon);

    // Hitung estimasi sisa jarak
    let remainingDistance = 0;
    for (let i = nextIndex; i < routeCoordinates.length - 1; i++) {
      remainingDistance += haversineDistance(
        routeCoordinates[i][1],
        routeCoordinates[i][0],
        routeCoordinates[i + 1][1],
        routeCoordinates[i + 1][0]
      );
    }

    const estimatedRemainingSeconds = remainingDistance / ((35 * 1000) / 3600);

    set({
      currentCoordIndex: nextIndex,
      currentGPS: { latitude: nextLat, longitude: nextLon },
      currentBearing: bearing,
      currentSpeedKmh: 35,
      autoFollow: true,
      activeTrip: activeTrip
        ? {
            ...activeTrip,
            remaining_distance_meters: Math.round(remainingDistance),
            remaining_duration_seconds: Math.round(estimatedRemainingSeconds),
          }
        : null,
    });

    // Kirim pembaruan GPS ke backend setiap beberapa langkah
    if (nextIndex % 4 === 0) {
      updateGPS({ latitude: nextLat, longitude: nextLon }, 35, bearing);
    }
  },

  jumpToProgress: (ratio) => {
    const { routeCoordinates } = get();
    if (!routeCoordinates || routeCoordinates.length === 0) return;
    const targetIndex = Math.max(
      0,
      Math.min(routeCoordinates.length - 1, Math.round(ratio * (routeCoordinates.length - 1)))
    );
    const steps = targetIndex - get().currentCoordIndex;
    get().stepManual(steps);
  },

  completeTrip: async () => {
    const { activeTrip } = get();
    set({
      isNavigating: false,
      is3DMode: false,
      autoFollow: false,
      currentGPS: null,
      currentCoordIndex: 0,
      activeTrip: null,
    });
    if (!activeTrip) return;
    try {
      await tripService.completeTrip(activeTrip.trip_id);
      get().fetchHistory();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  cancelTrip: async () => {
    const { activeTrip } = get();
    set({
      isNavigating: false,
      is3DMode: false,
      autoFollow: false,
      currentGPS: null,
      currentCoordIndex: 0,
      activeTrip: null,
    });
    if (!activeTrip) return;
    try {
      await tripService.cancelTrip(activeTrip.trip_id);
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

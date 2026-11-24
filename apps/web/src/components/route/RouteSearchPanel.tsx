import React, { useState } from 'react';
import { ArrowUpDown, Bike, Car, Navigation, Zap, Loader2 } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { LocationSearchInput } from './LocationSearchInput';

export const RouteSearchPanel: React.FC = () => {
  const [isLocating, setIsLocating] = useState(false);

  const {
    origin,
    originName,
    destination,
    destinationName,
    vehicleType,
    preference,
    avoidTolls,
    avoidCongestion,
    isLoading,
    setOrigin,
    setDestination,
    setVehicleType,
    setPreference,
    setAvoidTolls,
    setAvoidCongestion,
    searchRoutes,
  } = useRouteStore();

  const handleSwap = () => {
    if (origin && destination) {
      const tempCoords = origin;
      const tempName = originName;
      setOrigin(destination, destinationName);
      setDestination(tempCoords, tempName);
    }
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);

    // Lokasi GPS terkalibrasi user (Jalan Soka, Pejagalan, Penjaringan)
    let targetLat = -6.1372;
    let targetLon = 106.7892;
    let targetName = 'Jl. Soka, Pejagalan (GPS Saya)';

    try {
      const saved = localStorage.getItem('jalurtikus_user_gps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          targetLat = parsed.latitude;
          targetLon = parsed.longitude;
          if (parsed.name) targetName = parsed.name;
        }
      }
    } catch {
      // ignore
    }

    const applyLocation = (lat: number, lon: number, name: string) => {
      setOrigin({ latitude: lat, longitude: lon }, name);
      localStorage.setItem('jalurtikus_user_gps', JSON.stringify({ latitude: lat, longitude: lon, name }));
      setIsLocating(false);
    };

    if (!('geolocation' in navigator)) {
      applyLocation(targetLat, targetLon, targetName);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 0);

        // Jika akurasi sangat tinggi (misal di smartphone dengan sensor GPS satelit fisik < 35m)
        if (accuracy <= 35) {
          applyLocation(lat, lon, `Lokasi GPS Akurat (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        } else {
          // Di desktop PC / laptop Windows, terapkan koordinat terkalibrasi user (-6.1372, 106.7892)
          applyLocation(targetLat, targetLon, targetName);
        }
      },
      (_err) => {
        // Fallback jika permission browser ditolak atau timeout di PC
        applyLocation(targetLat, targetLon, targetName);
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 10000,
      }
    );
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl text-left space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-text-primary text-base">Cari Rute Pintar</h2>
        </div>
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="text-xs text-info hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          {isLocating ? 'Mencari GPS...' : 'GPS Saya'}
        </button>
      </div>

      <div className="relative space-y-2">
        <LocationSearchInput
          label="Titik Awal (Asal)"
          placeholder="Masukkan lokasi keberangkatan..."
          value={originName}
          onSelect={(coords, name) => setOrigin(coords, name)}
          iconColor="text-primary"
          onGpsClick={handleUseCurrentLocation}
          isGpsLoading={isLocating}
        />

        <div className="flex justify-end pr-3 -my-1">
          <button
            type="button"
            onClick={handleSwap}
            title="Tukar Asal dan Tujuan"
            className="p-1.5 rounded-full bg-surface-secondary border border-border text-text-secondary hover:text-primary hover:border-primary transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <LocationSearchInput
          label="Titik Akhir (Tujuan)"
          placeholder="Masukkan lokasi tujuan..."
          value={destinationName}
          onSelect={(coords, name) => setDestination(coords, name)}
          iconColor="text-traffic-heavy"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          Jenis Kendaraan
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVehicleType('motorcycle')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
              vehicleType === 'motorcycle'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Bike className="w-4 h-4" /> Motor
          </button>
          <button
            type="button"
            onClick={() => setVehicleType('car')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
              vehicleType === 'car'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Car className="w-4 h-4" /> Mobil
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary font-medium">Prioritas Jalur:</span>
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value as any)}
            className="bg-surface-secondary border border-border rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="avoid_congestion">Hindari Macet (Jalur Tikus - Rekomendasi)</option>
            <option value="fastest">Rute Cepat (Jalan Utama)</option>
            <option value="shortest">Terpendek (Jarak Minimum)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-text-primary">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidCongestion}
              onChange={(e) => setAvoidCongestion(e.target.checked)}
              className="accent-primary rounded"
            />
            <span>Hindari Macet (Jalur Tikus)</span>
          </label>

          {vehicleType === 'car' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidTolls}
                onChange={(e) => setAvoidTolls(e.target.checked)}
                className="accent-primary rounded"
              />
              <span>Hindari Tol</span>
            </label>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading || !origin || !destination}
        onClick={searchRoutes}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-midnight-navy font-bold py-2.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        {isLoading ? (
          <span>Menghitung Rute A*...</span>
        ) : (
          <>
            <Zap className="w-4 h-4 fill-current" /> Cari Rute
          </>
        )}
      </button>
    </div>
  );
};

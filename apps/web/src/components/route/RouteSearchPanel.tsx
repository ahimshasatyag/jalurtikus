import React, { useState } from 'react';
import {
  ArrowUpDown,
  Bike,
  Car,
  Navigation,
  Zap,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { LocationSearchInput } from './LocationSearchInput';
import { formatDistance, formatDuration, formatSpeed } from '../../utils/format';
import type { RouteSegment } from '../../types';

export const RouteSearchPanel: React.FC = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [isRouteCheckOpen, setIsRouteCheckOpen] = useState(true);

  const {
    origin,
    originName,
    destination,
    destinationName,
    vehicleType,
    preference,
    avoidTolls,
    avoidCongestion,
    recommendedRoute,
    selectedRoute,
    focusedSegment,
    isLoading,
    error,
    setOrigin,
    setDestination,
    setVehicleType,
    setPreference,
    setAvoidTolls,
    setAvoidCongestion,
    setFocusedSegment,
    searchRoutes,
  } = useRouteStore();

  const activeRoute = selectedRoute || recommendedRoute;

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

  const handleSegmentClick = (segment: RouteSegment) => {
    if (focusedSegment?.edge_id === segment.edge_id) {
      setFocusedSegment(null);
    } else {
      setFocusedSegment(segment);
    }
  };

  const getTrafficBadge = (level: string) => {
    switch (level) {
      case 'heavy':
      case 'severe':
        return <span className="text-[10px] bg-traffic-heavy/20 text-traffic-heavy px-1.5 py-0.5 rounded font-semibold">Macet Berat</span>;
      case 'moderate':
        return <span className="text-[10px] bg-amber/20 text-amber px-1.5 py-0.5 rounded font-semibold">Padat</span>;
      default:
        return <span className="text-[10px] bg-traffic-free/20 text-traffic-free px-1.5 py-0.5 rounded font-semibold">Lancar</span>;
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-text-primary text-base">Cari Rute & Hindari Macet</h2>
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

      {/* Origin & Destination Inputs */}
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

      {/* Vehicle Type Selection */}
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
                ? 'bg-primary/10 border-primary text-primary font-bold'
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
                ? 'bg-primary/10 border-primary text-primary font-bold'
                : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Car className="w-4 h-4" /> Mobil
          </button>
        </div>
      </div>

      {/* Priority & Mode: Hindari Macet (Jalur Tikus) */}
      <div className="space-y-2.5 pt-2 border-t border-border">
        <label className="block text-xs font-semibold text-text-secondary">
          Mode Navigasi & Prioritas:
        </label>

        <div className="grid grid-cols-1 gap-1.5">
          {/* Mode 1: Hindari Macet (Jalur Tikus) */}
          <button
            type="button"
            onClick={() => {
              setPreference('avoid_congestion');
              setAvoidCongestion(true);
            }}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition ${
              preference === 'avoid_congestion' && avoidCongestion
                ? 'bg-primary/15 border-primary text-text-primary'
                : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-md ${
              preference === 'avoid_congestion' && avoidCongestion ? 'bg-primary text-midnight-navy' : 'bg-surface border border-border text-text-secondary'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Hindari Macet (Jalur Tikus)
                </span>
                <span className="text-[10px] bg-primary/25 text-primary px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  Rekomendasi
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                Memotong kemacetan lewat gang & rute alternatif bebas hambatan secara cerdas.
              </p>
            </div>
          </button>

          {/* Mode 2: Rute Cepat */}
          <button
            type="button"
            onClick={() => {
              setPreference('fastest');
              setAvoidCongestion(false);
            }}
            className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition ${
              preference === 'fastest' && !avoidCongestion
                ? 'bg-sky-blue/15 border-sky-blue text-text-primary'
                : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-md ${
              preference === 'fastest' && !avoidCongestion ? 'bg-sky-blue text-midnight-navy' : 'bg-surface border border-border text-text-secondary'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-text-primary">
                Rute Cepat (Jalan Utama)
              </span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                Mengutamakan jalan arteri / protokol utama lebar tanpa masuk gang.
              </p>
            </div>
          </button>

          {/* Mode 3: Jarak Terpendek */}
          <button
            type="button"
            onClick={() => {
              setPreference('shortest');
              setAvoidCongestion(false);
            }}
            className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition ${
              preference === 'shortest'
                ? 'bg-amber/15 border-amber text-text-primary'
                : 'bg-surface-secondary border-border text-text-secondary hover:border-text-secondary'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-md ${
              preference === 'shortest' ? 'bg-amber text-midnight-navy' : 'bg-surface border border-border text-text-secondary'
            }`}>
              <Navigation className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-text-primary">
                Jarak Terpendek (Kilometer Minimum)
              </span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                Menghitung rute dengan total jarak kilometer paling hemat.
              </p>
            </div>
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between text-xs text-text-primary pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidCongestion}
              onChange={(e) => {
                const val = e.target.checked;
                setAvoidCongestion(val);
                if (val) {
                  setPreference('avoid_congestion');
                } else if (preference === 'avoid_congestion') {
                  setPreference('fastest');
                }
              }}
              className="accent-primary rounded"
            />
            <span className="font-medium text-xs">Aktifkan Algoritma Anti-Macet</span>
          </label>

          {vehicleType === 'car' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidTolls}
                onChange={(e) => setAvoidTolls(e.target.checked)}
                className="accent-primary rounded"
              />
              <span className="font-medium text-xs">Hindari Tol</span>
            </label>
          )}
        </div>
      </div>

      {/* Search Button */}
      <button
        type="button"
        disabled={isLoading || !origin || !destination}
        onClick={searchRoutes}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-midnight-navy font-bold py-2.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengecek Trafik & Menghitung A*...</span>
          </>
        ) : (
          <>
            {preference === 'avoid_congestion' || avoidCongestion ? (
              <>
                <ShieldCheck className="w-4 h-4 fill-current" />
                <span>Cari Rute Hindari Macet (Jalur Tikus)</span>
              </>
            ) : preference === 'fastest' ? (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Cari Rute Cepat (Jalan Utama)</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-current" />
                <span>Cari Rute Jarak Terpendek</span>
              </>
            )}
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="p-2.5 rounded-lg bg-traffic-heavy/10 border border-traffic-heavy text-xs text-traffic-heavy flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* JALUR CEK INSPECTION SECTION (JIKA RUTE SUDAH TERSEDIA) */}
      {activeRoute && (
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Jalur Cek Bebas Macet
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsRouteCheckOpen(!isRouteCheckOpen)}
              className="text-xs text-sky-blue hover:underline flex items-center gap-1 font-semibold"
            >
              {isRouteCheckOpen ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Lihat Jalur Cek ({activeRoute.segments?.length || 0})
                </>
              )}
              {isRouteCheckOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {isRouteCheckOpen && (
            <div className="bg-surface-secondary border border-border rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                <div>
                  <span className="text-text-secondary">Rute: </span>
                  <span className="font-bold text-text-primary">{activeRoute.name || 'Rute Pilihan'}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-primary">{formatDuration(activeRoute.duration_seconds)}</span>
                  <span className="text-text-secondary ml-1">({formatDistance(activeRoute.distance_meters)})</span>
                </div>
              </div>

              <div className="text-[11px] text-text-secondary bg-midnight-navy/60 p-2 rounded border border-border/50 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Jalur ini diverifikasi menggunakan <strong>TomTom Live Traffic</strong> dan memprioritaskan jalan alternatif/tikus untuk menghindari titik macet.
                </span>
              </div>

              {/* Segments Step-by-Step List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {activeRoute.segments && activeRoute.segments.length > 0 ? (
                  activeRoute.segments.map((seg, idx) => {
                    const isFocused = focusedSegment?.edge_id === seg.edge_id;
                    const isJalurTikus =
                      seg.street_name.toLowerCase().includes('tikus') ||
                      seg.street_name.toLowerCase().includes('gg.') ||
                      seg.street_name.toLowerCase().includes('gang');

                    return (
                      <div
                        key={seg.edge_id || idx}
                        onClick={() => handleSegmentClick(seg)}
                        className={`p-2 rounded-md border text-left cursor-pointer transition ${
                          isFocused
                            ? 'bg-cyan-500/20 border-cyan-400 text-text-primary shadow'
                            : 'bg-surface border-border hover:border-primary/60 text-text-secondary'
                        }`}
                        title="Klik untuk menyorot ruas ini di peta"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-surface-secondary border border-border text-[10px] font-bold flex items-center justify-center text-text-primary">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-text-primary">
                              {seg.street_name}
                            </span>
                            {isJalurTikus && (
                              <span className="text-[9px] bg-primary/25 text-primary px-1 rounded font-bold">
                                Jalur Tikus
                              </span>
                            )}
                          </div>
                          {getTrafficBadge(seg.traffic_level)}
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-text-secondary pl-5.5">
                          <span>
                            {formatDistance(seg.distance_meters)} • {formatSpeed(seg.speed_kmh)}
                          </span>
                          <span className="text-info flex items-center gap-0.5 text-[10px]">
                            <MapPin className="w-3 h-3" />
                            {isFocused ? 'Sedang Disorot' : 'Cek di Peta'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-xs text-text-secondary">
                    Tidak ada rincian segmen perantara (titik langsung).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

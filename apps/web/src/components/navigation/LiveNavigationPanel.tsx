import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation2,
  AlertTriangle,
  CheckCircle,
  Compass,
  StepForward,
  Layers,
  Radio,
  Gauge,
  ArrowUp,
  RotateCcw,
} from 'lucide-react';
import { useTripStore } from '../../stores/useTripStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { formatDistance, formatDuration } from '../../utils/format';
import { getCompassDirection } from '../../utils/geo';

export const LiveNavigationPanel: React.FC = () => {
  const {
    activeTrip,
    is3DMode,
    autoFollow,
    currentSpeedKmh,
    currentBearing,
    currentCoordIndex,
    routeCoordinates,
    stepManual,
    jumpToProgress,
    setIs3DMode,
    setAutoFollow,
    updateGPS,
    completeTrip,
    cancelTrip,
  } = useTripStore();

  const { selectedRoute, recommendedRoute } = useRouteStore();
  const [gpsActive] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const activeRoute = selectedRoute || recommendedRoute;

  // Nama jalan aktif berdasarkan progres posisi rute
  let currentStreetName = 'Menyusuri Rute';
  if (activeRoute?.segments && activeRoute.segments.length > 0) {
    const totalPoints = routeCoordinates.length || 1;
    const progressRatio = currentCoordIndex / totalPoints;
    const segIndex = Math.min(
      Math.floor(progressRatio * activeRoute.segments.length),
      activeRoute.segments.length - 1
    );
    currentStreetName = activeRoute.segments[segIndex]?.street_name || currentStreetName;
  }

  // Sensor GPS Fisik: Aktif secara langsung agar mengikuti pergerakan nyata pengguna
  useEffect(() => {
    if (gpsActive && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 30;
          const heading =
            pos.coords.heading !== null && !isNaN(pos.coords.heading) ? pos.coords.heading : undefined;

          setGpsAccuracy(Math.round(pos.coords.accuracy || 0));
          updateGPS({ latitude: lat, longitude: lon }, spd, heading);
        },
        (err) => {
          console.warn('Sensor GPS:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 1500, timeout: 6000 }
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [gpsActive]);

  // Kontrol Keyboard: Pengendara dapat menekan Panah Atas (↑) atau W untuk maju secara manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stepManual(1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stepManual(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepManual]);

  const handleCancelAndRestore = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    await cancelTrip();
  };

  const handleCompleteAndRestore = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    await completeTrip();
  };

  if (!activeTrip) return null;

  const totalPoints = routeCoordinates.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentCoordIndex + 1) / totalPoints) * 100));

  return (
    <div className="bg-surface rounded-xl border border-primary p-4 shadow-2xl space-y-4 text-left animate-in fade-in duration-300">
      {/* Header Status Navigasi */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
          </div>
          <div>
            <h2 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
              <Navigation2 className="w-4 h-4 text-primary fill-current" /> Navigasi 3D Aktif
            </h2>
            <p className="text-[10px] text-text-secondary">Mengikuti Pergerakan Pengendara</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border transition ${
              is3DMode
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface-secondary text-text-secondary border-border'
            }`}
            title="Klik untuk beralih antara Mode 3D dan 2D"
          >
            <Layers className="w-3 h-3" />
            {is3DMode ? '3D' : '2D'}
          </button>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> GPS
          </span>
        </div>
      </div>

      {/* Banner Ruas Jalan Saat Ini */}
      <div className="bg-gradient-to-r from-primary/15 to-transparent border-l-4 border-primary p-2.5 rounded-r-lg">
        <div className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
          <Navigation2 className="w-3 h-3 rotate-45" /> Ruas Jalan Aktif
        </div>
        <div className="text-sm font-black text-text-primary mt-0.5 truncate">
          {currentStreetName}
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-primary" /> {Math.round(currentBearing)}° {getCompassDirection(currentBearing)}
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" /> {currentSpeedKmh > 0 ? `${currentSpeedKmh} km/jam` : '0 km/jam'}
          </span>
        </div>
      </div>

      {/* Metrik Jarak & Estimasi Tiba */}
      <div className="grid grid-cols-2 gap-2 bg-surface-secondary p-3 rounded-lg border border-border">
        <div>
          <div className="text-[11px] text-text-secondary font-medium">Sisa Jarak</div>
          <div className="text-xl font-black text-text-primary">
            {formatDistance(activeTrip.remaining_distance_meters)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-text-secondary font-medium">Estimasi Waktu</div>
          <div className="text-xl font-black text-primary">
            {formatDuration(activeTrip.remaining_duration_seconds)}
          </div>
        </div>
      </div>

      {/* Slider Progress Perjalanan */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-text-secondary font-medium">
          <span>Posisi di Rute</span>
          <span>{progressPercent}% ({currentCoordIndex + 1}/{totalPoints} titik)</span>
        </div>
        <input
          type="range"
          min={0}
          max={totalPoints - 1}
          value={currentCoordIndex}
          onChange={(e) => jumpToProgress(Number(e.target.value) / Math.max(1, totalPoints - 1))}
          className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-primary border border-border"
        />
      </div>

      {/* Peringatan Simpangan Jika Ada */}
      {activeTrip.reroute_suggested && (
        <div className="bg-amber/10 border border-amber/40 rounded-lg p-2.5 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber">
            <AlertTriangle className="w-3.5 h-3.5" /> Kemacetan di Depan
          </div>
          <p className="text-text-secondary text-[11px]">
            Sistem mendeteksi alternatif rute baru untuk menghindari perlambatan di depan.
          </p>
        </div>
      )}

      {/* Kontrol Pergerakan: Mengikuti Pengendara / Kontrol Manual */}
      <div className="bg-surface-secondary p-3 rounded-lg border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" /> Mode Pergerakan:
          </span>
          {gpsAccuracy !== null && (
            <span className="text-[10px] text-text-secondary">Akurasi GPS: ±{gpsAccuracy}m</span>
          )}
        </div>

        <div className="text-xs text-text-secondary">
          Kamera 3D secara otomatis bergerak mengikuti posisi fisik perangkat Anda saat Anda berjalan/berkendara.
        </div>

        {/* Tombol Maju Manual untuk pengujian di komputer */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => stepManual(1)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-primary hover:bg-primary-hover text-midnight-navy font-black rounded-lg text-xs shadow transition active:scale-95"
            title="Maju 1 langkah di sepanjang jalan (atau tekan tombol Panah Atas / W)"
          >
            <ArrowUp className="w-4 h-4 stroke-[3]" /> Maju Manual (↑)
          </button>
          <button
            type="button"
            onClick={() => stepManual(5)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-surface hover:bg-border border border-border rounded-lg text-xs text-text-primary font-bold transition"
            title="Maju 5 titik koordinat"
          >
            <StepForward className="w-3.5 h-3.5 text-primary" /> Loncat +5 Titik
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
          <span>Tips: Tekan tombol <strong>Panah Atas (↑)</strong> di keyboard untuk melangkah.</span>
          {!autoFollow && (
            <button
              type="button"
              onClick={() => setAutoFollow(true)}
              className="text-primary hover:underline font-bold"
            >
              Kunci Kamera
            </button>
          )}
        </div>
      </div>

      {/* Tombol Akhiri & Batalkan (Kembalikan ke Tampilan Semula) */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleCompleteAndRestore}
          className="flex-1 bg-traffic-free hover:bg-green-600 text-midnight-navy font-bold py-2 px-3 rounded-lg text-xs shadow flex items-center justify-center gap-1.5 transition"
        >
          <CheckCircle className="w-4 h-4" /> Tiba di Tujuan
        </button>
        <button
          type="button"
          onClick={handleCancelAndRestore}
          className="flex-1 bg-surface-secondary hover:bg-traffic-heavy/20 border border-border text-text-secondary hover:text-traffic-heavy font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
          title="Batalkan navigasi dan kembalikan peta ke posisi awal"
        >
          <RotateCcw className="w-4 h-4" /> Batalkan (Kembali)
        </button>
      </div>
    </div>
  );
};

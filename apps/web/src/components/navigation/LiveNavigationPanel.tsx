import React, { useState } from 'react';
import {
  Navigation2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LocateFixed,
  Compass,
} from 'lucide-react';
import { useTripStore } from '../../stores/useTripStore';
import { formatDistance, formatDuration } from '../../utils/format';

export const LiveNavigationPanel: React.FC = () => {
  const { activeTrip, updateGPS, completeTrip, cancelTrip } = useTripStore();
  const [isSimulating, setIsSimulating] = useState(false);

  if (!activeTrip) return null;

  const handleSimulateGPSMove = async () => {
    setIsSimulating(true);
    try {
      await updateGPS({
        latitude: -6.219827,
        longitude: 106.815250,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateDeviation = async () => {
    setIsSimulating(true);
    try {
      await updateGPS({
        latitude: -6.230000,
        longitude: 106.845000,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-primary p-4 shadow-2xl space-y-4 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          <h2 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
            <Navigation2 className="w-4 h-4 text-primary fill-current" /> Perjalanan Aktif
          </h2>
        </div>
        <span className="text-xs bg-primary/20 text-primary font-bold px-2 py-0.5 rounded">
          LIVE GPS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-surface-secondary p-3 rounded-lg border border-border">
        <div>
          <div className="text-[11px] text-text-secondary font-medium">Sisa Jarak</div>
          <div className="text-xl font-black text-text-primary">
            {formatDistance(activeTrip.remaining_distance_meters)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-text-secondary font-medium">Estimasi Tiba</div>
          <div className="text-xl font-black text-primary">
            {formatDuration(activeTrip.remaining_duration_seconds)}
          </div>
        </div>
      </div>

      {activeTrip.reroute_suggested && (
        <div className="bg-amber/10 border border-amber/40 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber">
            <AlertTriangle className="w-4 h-4" /> Kemacetan / Simpangan Terdeteksi!
          </div>
          <p className="text-text-secondary">
            Sistem JalurTikus mendeteksi alternatif rute baru yang diperkirakan lebih optimal dari lokasi saat ini.
          </p>
        </div>
      )}

      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          Testing GPS & Reroute:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateGPSMove}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-surface-secondary hover:bg-border border border-border rounded text-xs text-text-primary font-medium transition"
          >
            <LocateFixed className="w-3.5 h-3.5 text-sky-blue" /> Update GPS Normal
          </button>
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateDeviation}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber/10 hover:bg-amber/20 border border-amber/30 rounded text-xs text-amber font-medium transition"
          >
            <Compass className="w-3.5 h-3.5" /> Uji Simpangan &gt;50m
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => completeTrip()}
          className="flex-1 bg-traffic-free hover:bg-green-600 text-midnight-navy font-bold py-2 px-3 rounded-lg text-xs shadow flex items-center justify-center gap-1.5 transition"
        >
          <CheckCircle className="w-4 h-4" /> Selesai
        </button>
        <button
          type="button"
          onClick={() => cancelTrip()}
          className="flex-1 bg-surface-secondary hover:bg-traffic-heavy/20 border border-border text-text-secondary hover:text-traffic-heavy font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
        >
          <XCircle className="w-4 h-4" /> Batalkan
        </button>
      </div>
    </div>
  );
};

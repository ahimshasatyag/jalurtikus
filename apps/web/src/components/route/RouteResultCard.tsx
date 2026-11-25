import React, { useState } from 'react';
import {
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { formatDistance, formatDuration, formatTime, formatSpeed } from '../../utils/format';
import type { RouteOption, RouteSegment } from '../../types';

interface RouteResultCardProps {
  onStartTrip: (route: RouteOption) => void;
  onOpenBenchmark: () => void;
}

export const RouteResultCard: React.FC<RouteResultCardProps> = ({
  onStartTrip,
  onOpenBenchmark,
}) => {
  const [showSegments, setShowSegments] = useState(false);
  const {
    recommendedRoute,
    alternatives,
    selectedRoute,
    setSelectedRoute,
    focusedSegment,
    setFocusedSegment,
  } = useRouteStore();

  if (!recommendedRoute) return null;

  const activeRoute = selectedRoute || recommendedRoute;

  const getTrafficBadge = (level: string) => {
    switch (level) {
      case 'heavy':
      case 'severe':
        return <span className="text-xs bg-traffic-heavy/20 text-traffic-heavy px-2 py-0.5 rounded font-semibold">Macet Berat</span>;
      case 'moderate':
        return <span className="text-xs bg-amber/20 text-amber px-2 py-0.5 rounded font-semibold">Padat</span>;
      default:
        return <span className="text-xs bg-traffic-free/20 text-traffic-free px-2 py-0.5 rounded font-semibold">Lancar</span>;
    }
  };

  const handleSegmentClick = (segment: RouteSegment) => {
    if (focusedSegment?.edge_id === segment.edge_id) {
      setFocusedSegment(null);
    } else {
      setFocusedSegment(segment);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl space-y-4 text-left">
      {/* Rekomendasi Utama Card */}
      <div className="bg-surface-secondary rounded-lg p-3.5 border-2 border-primary relative">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" /> Rekomendasi Utama
          </span>
          {getTrafficBadge(recommendedRoute.traffic_level)}
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-text-primary">
              {formatDuration(recommendedRoute.duration_seconds)}
            </span>
            <span className="text-sm text-text-secondary ml-2 font-medium">
              ({formatDistance(recommendedRoute.distance_meters)})
            </span>
          </div>
          <span className="text-xs text-text-secondary">
            Update: {formatTime(recommendedRoute.traffic_updated_at)}
          </span>
        </div>

        <p className="text-xs text-text-secondary mt-1">
          {recommendedRoute.is_toll_free ? 'Bebas Tol • ' : 'Jalan Tol • '}
          Algoritma {recommendedRoute.algorithm}
        </p>

        {/* Info Jalur Hindari Macet */}
        <div className="mt-2.5 p-2 bg-midnight-navy/60 rounded border border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>{activeRoute.segments?.length || 0} ruas jalan terverifikasi</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSegments(!showSegments)}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            {showSegments ? 'Tutup Segmen' : 'Cek Detail Rute'}
            {showSegments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Segment List */}
        {showSegments && (
          <div className="mt-2 pt-2 border-t border-border/60 space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                    className={`p-2 rounded border cursor-pointer transition text-xs ${
                      isFocused
                        ? 'bg-cyan-500/20 border-cyan-400 text-text-primary'
                        : 'bg-surface border-border hover:border-primary/50 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-surface-secondary text-[10px] font-bold flex items-center justify-center text-text-primary">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-text-primary">{seg.street_name}</span>
                        {isJalurTikus && (
                          <span className="text-[9px] bg-primary/25 text-primary px-1 rounded font-bold">
                            Jalur Tikus
                          </span>
                        )}
                      </div>
                      {getTrafficBadge(seg.traffic_level)}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] pl-5.5 text-text-secondary">
                      <span>{formatDistance(seg.distance_meters)} • {formatSpeed(seg.speed_kmh)}</span>
                      <span className="text-info flex items-center gap-0.5 text-[10px]">
                        <Eye className="w-3 h-3" />
                        {isFocused ? 'Disorot di Peta' : 'Sorot Peta'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-text-secondary text-center py-1">
                Tidak ada data segmen.
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => onStartTrip(activeRoute)}
          className="mt-3 w-full bg-primary hover:bg-primary-hover text-midnight-navy font-black py-2.5 px-3 rounded-lg text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition"
        >
          <Zap className="w-4 h-4 fill-current" />
          Mulai Navigasi 3D (Kamera Ikuti Jalan)
        </button>
      </div>

      {/* Alternatif Lainnya */}
      {alternatives.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Alternatif Lainnya ({alternatives.length})
          </h3>
          {alternatives.map((alt, idx) => {
            const isSelected = activeRoute.route_id === alt.route_id;
            const diffSeconds = alt.duration_seconds - recommendedRoute.duration_seconds;
            const diffMin = Math.round(diffSeconds / 60);

            return (
              <div
                key={alt.route_id}
                onClick={() => setSelectedRoute(alt)}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-blue/10 border-sky-blue text-text-primary'
                    : 'bg-surface-secondary border-border hover:border-text-secondary text-text-secondary'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-text-primary">
                    {alt.name || `Alternatif ${idx + 1}`}
                  </div>
                  <div className="text-xs font-medium">
                    {formatDuration(alt.duration_seconds)} • {formatDistance(alt.distance_meters)}
                    {diffMin > 0 && <span className="text-amber ml-1">+{diffMin} mnt</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getTrafficBadge(alt.traffic_level)}
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Benchmark Button */}
      <button
        type="button"
        onClick={onOpenBenchmark}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary hover:text-sky-blue border border-dashed border-border rounded-lg transition"
      >
        <BarChart3 className="w-3.5 h-3.5" /> Lihat Perbandingan A* vs Dijkstra
      </button>
    </div>
  );
};

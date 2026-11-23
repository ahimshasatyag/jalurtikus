import React from 'react';
import { Zap, ChevronRight, BarChart3 } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { formatDistance, formatDuration, formatTime } from '../../utils/format';
import type { RouteOption } from '../../types';

interface RouteResultCardProps {
  onStartTrip: (route: RouteOption) => void;
  onOpenBenchmark: () => void;
}

export const RouteResultCard: React.FC<RouteResultCardProps> = ({
  onStartTrip,
  onOpenBenchmark,
}) => {
  const { recommendedRoute, alternatives, selectedRoute, setSelectedRoute } = useRouteStore();

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

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl space-y-4 text-left">
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

        {activeRoute.route_id === recommendedRoute.route_id ? (
          <button
            onClick={() => onStartTrip(recommendedRoute)}
            className="mt-3 w-full bg-primary hover:bg-primary-hover text-midnight-navy font-bold py-2 px-3 rounded-lg text-sm shadow transition"
          >
            Mulai Navigasi
          </button>
        ) : (
          <button
            onClick={() => setSelectedRoute(recommendedRoute)}
            className="mt-3 w-full bg-surface border border-primary text-primary hover:bg-primary/10 font-bold py-2 px-3 rounded-lg text-sm transition"
          >
            Pilih Rute Ini
          </button>
        )}
      </div>

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

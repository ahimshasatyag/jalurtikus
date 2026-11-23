import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Layers,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { useTripStore } from '../../stores/useTripStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { formatDistance, formatDuration, formatTime } from '../../utils/format';

export const AdminDashboardView: React.FC = () => {
  const { snapshot, incidents, fetchTraffic, fetchIncidents } = useTrafficStore();
  const { history, fetchHistory } = useTripStore();
  const { comparison } = useRouteStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTraffic();
    fetchIncidents();
    fetchHistory();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchTraffic(), fetchIncidents(), fetchHistory()]);
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-6 text-left max-w-7xl mx-auto">
      {/* Header Admin */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Dashboard Operasional & Benchmark
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Pemantauan Jaringan Jalan, Metrik Algoritma Routing & Status Provider (PRD 8.10)
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:border-primary text-text-primary text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* KPI Cards (PRD 13.4 Low-Fidelity Wireframe Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 shadow-lg">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Perjalanan Aktif</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-text-primary mt-2">
            {history.filter((h) => h.status === 'active').length}
          </div>
          <div className="text-[11px] text-text-secondary mt-1">Sesi pemantauan GPS live</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-lg">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Insiden Terlapor</span>
            <AlertTriangle className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-black text-text-primary mt-2">{incidents.length}</div>
          <div className="text-[11px] text-text-secondary mt-1">Kondisi jalan terdeteksi</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-lg">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Segmen Jaringan Jalan</span>
            <Layers className="w-4 h-4 text-sky-blue" />
          </div>
          <div className="text-2xl font-black text-text-primary mt-2">35+</div>
          <div className="text-[11px] text-text-secondary mt-1">Koridor graf Jakarta MVP</div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-lg">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Status Provider Trafik</span>
            <Server className="w-4 h-4 text-traffic-free" />
          </div>
          <div className="text-base font-bold text-traffic-free mt-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> {snapshot?.is_fresh ? 'Fresh / Online' : 'Active'}
          </div>
          <div className="text-[11px] text-text-secondary mt-1">SLA Provider: Terhubung</div>
        </div>
      </div>

      {/* Evaluasi Algoritma Routing (PRD 4.3 Benchmark Analysis) */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-primary">
              Metrik Evaluasi Algoritma: A* vs Dijkstra (GOAL-08)
            </h2>
          </div>
          <span className="text-xs text-text-secondary">Uji Snapshot Jaringan Terakhir</span>
        </div>

        {comparison ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-secondary rounded-lg p-4 border border-primary/40 space-y-3">
              <div className="font-extrabold text-primary text-sm flex items-center justify-between">
                <span>A* (A-Star) Engine</span>
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded text-primary">Utama</span>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Node Dieksplorasi:</span>
                  <strong className="text-text-primary">{comparison.astar?.explored_nodes} node</strong>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Komputasi:</span>
                  <strong className="text-text-primary">{comparison.astar?.execution_time_ms} ms</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hasil Estimasi Waktu:</span>
                  <strong className="text-text-primary">
                    {formatDuration(comparison.astar?.duration_seconds || 0)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg p-4 border border-border space-y-3">
              <div className="font-extrabold text-sky-blue text-sm flex items-center justify-between">
                <span>Dijkstra Engine</span>
                <span className="text-xs bg-sky-blue/20 px-2 py-0.5 rounded text-sky-blue">Benchmark</span>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Node Dieksplorasi:</span>
                  <strong className="text-text-primary">{comparison.dijkstra?.explored_nodes} node</strong>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Komputasi:</span>
                  <strong className="text-text-primary">{comparison.dijkstra?.execution_time_ms} ms</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hasil Estimasi Waktu:</span>
                  <strong className="text-text-primary">
                    {formatDuration(comparison.dijkstra?.duration_seconds || 0)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-surface-secondary rounded-lg text-center text-xs text-text-secondary">
            Lakukan pencarian rute pada dashboard untuk melihat perbandingan node dieksplorasi dan waktu komputasi secara langsung.
          </div>
        )}
      </div>

      {/* Tabel Log Riwayat Perjalanan Pengguna */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-blue" /> Riwayat Sesi Perjalanan
        </h2>
        {history.length === 0 ? (
          <div className="p-6 bg-surface-secondary rounded-lg text-center text-xs text-text-secondary">
            Belum ada riwayat perjalanan yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-text-secondary font-semibold">
                  <th className="py-2.5 px-3">Trip ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Waktu Mulai</th>
                  <th className="py-2.5 px-3">Sisa Jarak</th>
                  <th className="py-2.5 px-3">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-text-primary">
                {history.map((t) => (
                  <tr key={t.trip_id} className="hover:bg-surface-secondary/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-blue">{t.trip_id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          t.status === 'completed'
                            ? 'bg-traffic-free/20 text-traffic-free'
                            : t.status === 'active'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-traffic-heavy/20 text-traffic-heavy'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{formatTime(t.started_at)}</td>
                    <td className="py-2.5 px-3">{formatDistance(t.remaining_distance_meters)}</td>
                    <td className="py-2.5 px-3">{formatDuration(t.remaining_duration_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

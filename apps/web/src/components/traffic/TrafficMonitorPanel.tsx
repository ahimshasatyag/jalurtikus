import React, { useEffect } from 'react';
import { Activity, AlertOctagon, CheckCircle2, Clock, PlusCircle, RefreshCw } from 'lucide-react';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { formatTime } from '../../utils/format';

interface TrafficMonitorPanelProps {
  onOpenReportModal: () => void;
}

export const TrafficMonitorPanel: React.FC<TrafficMonitorPanelProps> = ({
  onOpenReportModal,
}) => {
  const { snapshot, incidents, isLoading, error, fetchTraffic, fetchIncidents } = useTrafficStore();

  useEffect(() => {
    fetchTraffic();
    fetchIncidents();
    const interval = setInterval(() => {
      fetchTraffic();
      fetchIncidents();
    }, 30000); // Polling tiap 30 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl space-y-4 text-left">
      {/* Header Monitor */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-blue" />
          <h2 className="font-bold text-text-primary text-base">Pantau Lalu Lintas</h2>
        </div>
        <button
          onClick={() => {
            fetchTraffic();
            fetchIncidents();
          }}
          className="p-1 rounded text-text-secondary hover:text-primary transition"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Snapshot Kesegaran Data Trafik (PRD 8.5 & 3.3) */}
      {error && !snapshot ? (
        <div className="bg-amber/10 border border-amber/30 text-amber p-3 rounded-lg text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber">
            <AlertOctagon className="w-4 h-4" /> Backend Belum Terhubung
          </div>
          <p className="text-[11px] text-text-secondary">
            Server backend di <code className="text-primary font-mono">http://localhost:8000</code> belum aktif. Silakan jalankan backend di terminal terpisah.
          </p>
        </div>
      ) : snapshot ? (
        <div className="bg-surface-secondary rounded-lg p-3 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Sumber Provider:</span>
            <span className="font-bold text-text-primary">{snapshot.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Waktu Pembaruan:</span>
            <span className="text-text-primary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-blue" /> {formatTime(snapshot.recorded_at)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status Kesegaran:</span>
            {snapshot.is_fresh ? (
              <span className="text-traffic-free font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Real-Time Fresh
              </span>
            ) : (
              <span className="text-amber font-bold">Stale (Kadaluwarsa)</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-text-secondary py-2">Memuat status provider trafik...</div>
      )}

      {/* Daftar Insiden Aktif */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Laporan Insiden ({incidents.length})
          </span>
          <button
            onClick={onOpenReportModal}
            className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Lapor Jalan
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="bg-surface-secondary p-4 rounded-lg text-center text-xs text-text-secondary border border-border">
            Tidak ada insiden atau kemacetan luar biasa saat ini.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {incidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="bg-surface-secondary p-3 rounded-lg border border-border/70 hover:border-border transition space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-traffic-heavy flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    {inc.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    {formatTime(inc.reported_at)}
                  </span>
                </div>
                <p className="text-text-primary font-medium">{inc.description}</p>
                <div className="text-text-secondary text-[11px] truncate">
                  {inc.street_name || 'Lokasi jalan'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


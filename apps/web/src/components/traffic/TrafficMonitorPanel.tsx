import React, { useEffect, useState } from 'react';
import { Activity, AlertOctagon, CheckCircle2, Clock, RefreshCw, Radio, Zap, Key, ExternalLink } from 'lucide-react';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { formatTime } from '../../utils/format';

interface TrafficMonitorPanelProps {
  onOpenReportModal?: () => void;
}

export const TrafficMonitorPanel: React.FC<TrafficMonitorPanelProps> = () => {
  const { snapshot, incidents, apiKey, setApiKey, isLoading, error, fetchTraffic, fetchIncidents } = useTrafficStore();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  useEffect(() => {
    fetchTraffic();
    fetchIncidents();
    const interval = setInterval(() => {
      fetchTraffic();
      fetchIncidents();
    }, 15000); // Polling real-time tiap 15 detik
    return () => clearInterval(interval);
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKey(true);
    try {
      await setApiKey(keyInput);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-xl space-y-4 text-left">
      {/* Header Monitor */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-blue" />
          <div>
            <h2 className="font-bold text-text-primary text-base">Pantau Lalu Lintas Real-Time</h2>
            <p className="text-[10px] text-text-secondary flex items-center gap-1">
              <Radio className="w-3 h-3 text-traffic-free animate-pulse" /> TomTom Live API & Sensor Engine
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchTraffic();
            fetchIncidents();
          }}
          className="p-1 rounded text-text-secondary hover:text-primary transition"
          title="Segarkan Data Real-Time"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Konfigurasi TomTom API Key */}
      <div className="bg-surface-secondary rounded-lg p-3 border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-primary" /> TomTom Traffic API Key
          </span>
          {apiKey ? (
            <span className="text-[10px] text-traffic-free font-bold flex items-center gap-1 bg-traffic-free/10 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Terhubung
            </span>
          ) : (
            <span className="text-[10px] text-amber font-bold bg-amber/10 px-2 py-0.5 rounded">
              Belum Diisi
            </span>
          )}
        </div>

        <form onSubmit={handleSaveKey} className="flex gap-2">
          <input
            type="text"
            placeholder="Masukkan TomTom API Key..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary font-mono"
          />
          <button
            type="submit"
            disabled={isSavingKey}
            className="bg-primary hover:bg-primary-hover text-midnight-navy font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 shrink-0"
          >
            {isSavingKey ? 'Menghubungkan...' : 'Simpan'}
          </button>
        </form>

        {saveSuccess && (
          <div className="text-[11px] text-traffic-free flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> TomTom API Key berhasil disimpan & disinkronkan.
          </div>
        )}

        <div className="text-[10px] text-text-secondary flex items-center justify-between">
          <span>Kunci gratis dapat diperoleh di portal TomTom</span>
          <a
            href="https://developer.tomtom.com/"
            target="_blank"
            rel="noreferrer"
            className="text-info hover:underline flex items-center gap-0.5 font-semibold"
          >
            TomTom Portal <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Snapshot Kesegaran Data Trafik */}
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
            <span className="font-bold text-text-primary">
              {apiKey ? 'TomTom Incident & Flow API v5' : snapshot.source}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Waktu Pembaruan:</span>
            <span className="text-text-primary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-blue" /> {formatTime(snapshot.recorded_at)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status Trafik:</span>
            {snapshot.is_fresh ? (
              <span className="text-traffic-free font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Real-Time Live
              </span>
            ) : (
              <span className="text-amber font-bold">Stale (Kadaluwarsa)</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-text-secondary py-2">Menghubungkan ke live feed trafik...</div>
      )}

      {/* Informasi Sensor Trafik Real-Time */}
      <div className="bg-surface-secondary/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-text-secondary leading-relaxed">
        <div className="font-semibold text-text-primary flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" /> Algoritma Jalur Tikus Aktif
        </div>
        <p className="text-[11px]">
          Sistem secara otomatis membaca kondisi jaringan jalan secara live. Ruas arteri yang terdeteksi padat atau lambat langsung dialihkan menuju jalur pemukiman dan gang alternatif bebas macet.
        </p>
      </div>

      {/* Daftar Peringatan Kemacetan & Insiden Real-Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Peringatan Trafik Real-Time ({incidents.length})
          </span>
          <span className="text-[10px] text-text-secondary bg-surface-secondary px-2 py-0.5 rounded border border-border">
            Live Feed Otomatis
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="bg-surface-secondary p-4 rounded-lg text-center text-xs text-text-secondary border border-border space-y-1">
            <p className="font-medium text-text-primary">Belum ada data insiden aktif.</p>
            {!apiKey && (
              <p className="text-[11px] text-amber">
                Masukkan API Key TomTom di kotak di atas agar data insiden kecelakaan & kemacetan satelit langsung muncul.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
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

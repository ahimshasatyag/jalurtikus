import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { trafficService } from '../../services/trafficService';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { useRouteStore } from '../../stores/useRouteStore';
import type { IncidentCategory } from '../../types';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fetchIncidents } = useTrafficStore();
  const { origin } = useRouteStore();

  const [category, setCategory] = useState<IncidentCategory>('congestion');
  const [description, setDescription] = useState('');
  const [streetName, setStreetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Deskripsi kondisi jalan harus diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await trafficService.submitReport({
        category,
        description,
        street_name: streetName || undefined,
        location: origin || { latitude: -6.2000, longitude: 106.8166 },
      });
      await fetchIncidents();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 text-left space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber" />
            <h2 className="text-base font-bold text-text-primary">Lapor Kondisi Jalan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-traffic-heavy/20 border border-traffic-heavy/40 text-xs text-traffic-heavy">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-text-secondary mb-1">
              Kategori Kondisi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="congestion">Kemacetan Parah</option>
              <option value="accident">Kecelakaan Lalu Lintas</option>
              <option value="flood">Banjir / Genangan Air</option>
              <option value="road_closed">Penutupan Jalan</option>
              <option value="road_work">Pekerjaan Jalan</option>
              <option value="road_damage">Jalan Rusak / Lubang</option>
              <option value="other">Kondisi Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-text-secondary mb-1">
              Nama Jalan / Koridor
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. H.R. Rasuna Said"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-medium text-text-secondary mb-1">
              Keterangan Lengkap
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan kondisi secara spesifik..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-surface-secondary hover:bg-border text-text-secondary text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-midnight-navy font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" /> Kirim Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

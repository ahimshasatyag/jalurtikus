import React from 'react';
import { X, CheckCircle2, Cpu } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';

interface AlgorithmComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmComparisonModal: React.FC<AlgorithmComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { comparison } = useRouteStore();

  if (!isOpen || !comparison) return null;

  const astar = comparison.astar || { explored_nodes: 0, execution_time_ms: 0, duration_seconds: 0 };
  const dijkstra = comparison.dijkstra || { explored_nodes: 0, execution_time_ms: 0, duration_seconds: 0 };

  const nodeSavings = dijkstra.explored_nodes > 0
    ? Math.round(((dijkstra.explored_nodes - astar.explored_nodes) / dijkstra.explored_nodes) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 text-left space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Evaluasi Performa Algoritma
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Target Evaluasi Algoritma PRD Bab 4.3 & Goal-08
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-secondary rounded-xl p-4 border-2 border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-primary text-sm">A* Algorithm</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                UTAMA
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Node Dieksplorasi:</span>
                <strong className="text-text-primary text-sm">{astar.explored_nodes}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Waktu Komputasi:</span>
                <strong className="text-text-primary">{astar.execution_time_ms} ms</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Durasi Rute:</span>
                <strong className="text-text-primary">{Math.round(astar.duration_seconds)} dtk</strong>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sky-blue text-sm">Dijkstra</span>
              <span className="text-[10px] bg-sky-blue/20 text-sky-blue px-1.5 py-0.5 rounded font-bold">
                BENCHMARK
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Node Dieksplorasi:</span>
                <strong className="text-text-primary text-sm">{dijkstra.explored_nodes}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Waktu Komputasi:</span>
                <strong className="text-text-primary">{dijkstra.execution_time_ms} ms</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Durasi Rute:</span>
                <strong className="text-text-primary">{Math.round(dijkstra.duration_seconds)} dtk</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 rounded-xl p-3.5 border border-primary/30 text-xs text-text-primary space-y-1.5">
          <div className="font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Insight Efisiensi Heuristik:
          </div>
          <p className="text-text-secondary leading-relaxed">
            A* berhasil memangkas eksplorasi sebanyak{' '}
            <strong className="text-primary">{nodeSavings}% node</strong> dibandingkan Dijkstra berkat
            penerapan fungsi heuristik Haversine yang <em>admissible</em>, sehingga rute optimal ditemukan
            jauh lebih cepat tanpa mengorbankan kualitas rute.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-secondary hover:bg-border text-text-primary text-sm font-semibold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

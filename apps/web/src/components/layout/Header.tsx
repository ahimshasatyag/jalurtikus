import React from 'react';
import { Navigation, Activity, BarChart3, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface HeaderProps {
  activeTab: 'peta' | 'trafik' | 'admin';
  setActiveTab: (tab: 'peta' | 'trafik' | 'admin') => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 bg-midnight-navy border-b border-border flex items-center justify-between px-4 lg:px-6 z-40 select-none shadow-md">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-midnight-navy font-black text-xl shadow-lg shadow-primary/20">
          JT
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-text-primary">
              Jalur<span className="text-primary">Tikus</span>
            </span>
            <span className="text-[10px] font-bold bg-surface-secondary text-primary px-1.5 py-0.5 rounded border border-border">
              v1.0 MVP
            </span>
          </div>
          <p className="text-[10px] text-text-secondary hidden sm:block">
            Real-Time Traffic-Aware Route Recommendation
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-1 bg-surface-secondary p-1 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setActiveTab('peta')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'peta'
              ? 'bg-primary text-midnight-navy shadow'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Peta & Rute</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trafik')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'trafik'
              ? 'bg-primary text-midnight-navy shadow'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Trafik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'admin'
              ? 'bg-primary text-midnight-navy shadow'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Admin & Benchmark</span>
          <span className="md:hidden">Admin</span>
        </button>
      </nav>

      {/* User Session */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-text-primary truncate max-w-[120px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-text-secondary capitalize">{user.vehicle_type}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-traffic-heavy transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-xs font-bold text-text-primary hover:text-primary transition"
          >
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
};


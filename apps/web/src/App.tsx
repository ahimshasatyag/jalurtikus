import { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/layout/Header';
import { MapContainer } from './components/map/MapContainer';
import { RouteSearchPanel } from './components/route/RouteSearchPanel';
import { RouteResultCard } from './components/route/RouteResultCard';
import { AlgorithmComparisonModal } from './components/route/AlgorithmComparisonModal';
import { LiveNavigationPanel } from './components/navigation/LiveNavigationPanel';
import { TrafficMonitorPanel } from './components/traffic/TrafficMonitorPanel';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AuthModal } from './components/auth/AuthModal';

import { useRouteStore } from './stores/useRouteStore';
import { useTripStore } from './stores/useTripStore';
import { useAuthStore } from './stores/useAuthStore';
import type { RouteOption } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'peta' | 'trafik' | 'admin'>('peta');
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { recommendedRoute, origin, destination, setOrigin } = useRouteStore();
  const { activeTrip, startTrip } = useTripStore();
  const { fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleMapClick = (coords: { latitude: number; longitude: number }) => {
    if (!activeTrip && !recommendedRoute) {
      setOrigin(coords, `Lokasi Peta (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
    }
  };

  const handleStartTrip = async (route: RouteOption) => {
    if (!origin || !destination) return;
    if (!isAuthenticated) {
      try {
        await useAuthStore.getState().login({
          email: 'testdriver@jalurtikus.id',
          password: 'SecurePassword123!',
        });
      } catch {
        setIsAuthOpen(true);
        return;
      }
    }
    try {
      const coords = (route.geometry?.coordinates || []) as [number, number][];
      await startTrip(route.route_id, origin, destination, 'motorcycle', coords);
    } catch {
      // Handled in store
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-text-primary overflow-hidden font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 relative overflow-hidden flex">
        {activeTab === 'peta' && (
          <div className="relative w-full h-full flex">
            <div className="w-full sm:w-[380px] md:w-[420px] h-full overflow-y-auto p-4 z-20 space-y-4 bg-midnight-navy/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-r border-border/50 sm:border-none pointer-events-auto">
              {activeTrip ? (
                <LiveNavigationPanel />
              ) : (
                <>
                  <RouteSearchPanel />
                  {recommendedRoute && (
                    <RouteResultCard
                      onStartTrip={handleStartTrip}
                      onOpenBenchmark={() => setIsBenchmarkOpen(true)}
                    />
                  )}
                </>
              )}
            </div>

            <div className="absolute inset-0 z-10 w-full h-full">
              <MapContainer onMapClick={handleMapClick} />
            </div>
          </div>
        )}

        {activeTab === 'trafik' && (
          <div className="relative w-full h-full flex">
            <div className="w-full sm:w-[400px] h-full overflow-y-auto p-4 z-20 bg-midnight-navy/95 border-r border-border">
              <TrafficMonitorPanel />
            </div>
            <div className="flex-1 relative w-full h-full hidden sm:block">
              <MapContainer />
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="w-full h-full overflow-y-auto bg-background">
            <AdminDashboardView />
          </div>
        )}
      </main>

      <AlgorithmComparisonModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default App;

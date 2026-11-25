import React, { useEffect, useRef } from 'react';
import {
  Map,
  NavigationControl,
  AttributionControl,
  Marker,
  Popup,
  LngLatBounds,
  setWorkerUrl,
  type MapMouseEvent,
  type GeoJSONSource,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Compass, Layers } from 'lucide-react';
import { useRouteStore } from '../../stores/useRouteStore';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { useTripStore } from '../../stores/useTripStore';

// Mengatur worker URL eksplisit agar Vite dapat melayani web worker dengan benar
setWorkerUrl(maplibreglWorkerUrl);

const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface MapContainerProps {
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({ onMapClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const originMarkerRef = useRef<Marker | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const incidentMarkersRef = useRef<Marker[]>([]);
  const vehicleMarkerRef = useRef<Marker | null>(null);
  const vehicleElementRef = useRef<HTMLDivElement | null>(null);

  const { origin, destination, recommendedRoute, alternatives, selectedRoute, focusedSegment } = useRouteStore();
  const { incidents, apiKey } = useTrafficStore();
  const {
    isNavigating,
    is3DMode,
    autoFollow,
    currentGPS,
    currentBearing,
    setAutoFollow,
    setIs3DMode,
  } = useTripStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = origin
      ? [origin.longitude, origin.latitude]
      : [106.7892, -6.1372];

    const map = new Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE,
      center: initialCenter,
      zoom: 13,
      maxPitch: 75,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      map.addSource('alt-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'alt-routes-layer',
        type: 'line',
        source: 'alt-routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#64748B'],
          'line-width': 5,
          'line-opacity': 0.85,
          'line-dasharray': [3, 2],
        },
      });

      map.addSource('primary-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'primary-route-casing',
        type: 'line',
        source: 'primary-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#050B14',
          'line-width': 10,
          'line-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'primary-route-layer',
        type: 'line',
        source: 'primary-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#22C55E'],
          'line-width': 6,
          'line-opacity': 1.0,
        },
      });
      map.addLayer({
        id: 'primary-route-core',
        type: 'line',
        source: 'primary-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 2,
          'line-opacity': 0.6,
        },
      });

      map.addSource('focused-segment', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'focused-segment-glow',
        type: 'line',
        source: 'focused-segment',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#F59E0B',
          'line-width': 12,
          'line-opacity': 0.85,
        },
      });
      map.addLayer({
        id: 'focused-segment-core',
        type: 'line',
        source: 'focused-segment',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 4,
          'line-opacity': 1.0,
        },
      });
    });

    map.on('click', (e: MapMouseEvent) => {
      if (onMapClick) {
        onMapClick({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
      }
    });

    map.on('dragstart', () => {
      if (useTripStore.getState().isNavigating) {
        useTripStore.getState().setAutoFollow(false);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateFlowLayer = () => {
      if (apiKey) {
        if (!map.getSource('tomtom-flow')) {
          map.addSource('tomtom-flow', {
            type: 'raster',
            tiles: [
              `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${apiKey}`,
            ],
            tileSize: 256,
          });

          const beforeId = map.getLayer('primary-route-casing') ? 'primary-route-casing' : undefined;
          map.addLayer(
            {
              id: 'tomtom-flow-layer',
              type: 'raster',
              source: 'tomtom-flow',
              paint: { 'raster-opacity': 0.8 },
            },
            beforeId
          );
        }
      } else {
        if (map.getLayer('tomtom-flow-layer')) map.removeLayer('tomtom-flow-layer');
        if (map.getSource('tomtom-flow')) map.removeSource('tomtom-flow');
      }
    };

    if (map.isStyleLoaded()) {
      updateFlowLayer();
    } else {
      map.once('load', updateFlowLayer);
    }
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (origin) {
      if (!originMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full bg-primary border-2 border-midnight-navy flex items-center justify-center text-midnight-navy font-bold text-xs shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform';
        el.innerText = 'A';
        el.title = 'Titik Asal (A) - Dapat digeser (drag) ke titik persis';
        const marker = new Marker({ element: el, anchor: 'center', draggable: true })
          .setLngLat([origin.longitude, origin.latitude])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const lat = Number(lngLat.lat.toFixed(6));
          const lon = Number(lngLat.lng.toFixed(6));
          const name = `Lokasi Pilihan (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          localStorage.setItem(
            'jalurtikus_user_gps',
            JSON.stringify({ latitude: lat, longitude: lon, name })
          );
          useRouteStore.getState().setOrigin(
            { latitude: lat, longitude: lon },
            name
          );
        });

        originMarkerRef.current = marker;
      } else {
        originMarkerRef.current.setLngLat([origin.longitude, origin.latitude]);
      }

      // Fokuskan kamera peta ke lokasi titik asal jika belum ada rute aktif
      if (!recommendedRoute && !selectedRoute) {
        map.flyTo({ center: [origin.longitude, origin.latitude], zoom: 15, duration: 800 });
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full bg-traffic-heavy border-2 border-cloud-white flex items-center justify-center text-cloud-white font-bold text-xs shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform';
        el.innerText = 'B';
        el.title = 'Titik Tujuan (B) - Dapat digeser (drag) ke titik persis';
        const marker = new Marker({ element: el, anchor: 'center', draggable: true })
          .setLngLat([destination.longitude, destination.latitude])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          useRouteStore.getState().setDestination(
            { latitude: lngLat.lat, longitude: lngLat.lng },
            `Titik Tujuan (${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)})`
          );
        });

        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setLngLat([destination.longitude, destination.latitude]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [origin, destination]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const primarySource = map.getSource('primary-route') as GeoJSONSource;
    const altSource = map.getSource('alt-routes') as GeoJSONSource;

    const activeRoute = selectedRoute || recommendedRoute;

    if (activeRoute && primarySource) {
      const segments = activeRoute.segments || [];
      const features = segments.length > 0
        ? segments.map((seg, idx) => {
            let color = '#22C55E'; // HIJAU LANCAR
            if (seg.traffic_level === 'heavy' || seg.traffic_level === 'severe') {
              color = '#EF4444'; // MERAH MACET
            } else if (seg.traffic_level === 'moderate') {
              color = '#F59E0B'; // ORANYE PADAT
            } else if (seg.traffic_level === 'light') {
              color = '#22C55E'; // HIJAU LANCAR
            }

            return {
              type: 'Feature' as const,
              properties: {
                segment_id: seg.edge_id || `seg_${idx}`,
                traffic_level: seg.traffic_level,
                color: color,
                street_name: seg.street_name,
              },
              geometry: seg.geometry,
            };
          })
        : [
            {
              type: 'Feature' as const,
              properties: {
                color: activeRoute.traffic_level === 'heavy' || activeRoute.traffic_level === 'severe'
                  ? '#EF4444'
                  : activeRoute.traffic_level === 'moderate'
                  ? '#F59E0B'
                  : '#22C55E',
              },
              geometry: activeRoute.geometry,
            },
          ];

      primarySource.setData({
        type: 'FeatureCollection',
        features: features,
      });

      const coordinates = activeRoute.geometry.coordinates;
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce(
          (b, coord) => b.extend(coord as [number, number]),
          new LngLatBounds(coordinates[0], coordinates[0])
        );
        map.fitBounds(bounds, { padding: 80, duration: 800 });
      }
    } else if (primarySource) {
      primarySource.setData({ type: 'FeatureCollection', features: [] });
    }

    if (alternatives.length > 0 && altSource) {
      const altFeatures = alternatives
        .filter((alt) => alt.route_id !== activeRoute?.route_id)
        .flatMap((alt) => {
          const segs = alt.segments || [];
          if (segs.length > 0) {
            return segs.map((seg, idx) => {
              let color = '#64748B'; // Abu-abu standar alternatif
              if (seg.traffic_level === 'heavy' || seg.traffic_level === 'severe') {
                color = '#EF4444'; // MERAH MACET
              } else if (seg.traffic_level === 'moderate') {
                color = '#F59E0B'; // ORANYE PADAT
              } else if (seg.traffic_level === 'free_flow' || seg.traffic_level === 'light') {
                color = '#22C55E'; // HIJAU LANCAR
              }
              return {
                type: 'Feature' as const,
                properties: {
                  route_id: alt.route_id,
                  segment_id: seg.edge_id || `alt_seg_${idx}`,
                  traffic_level: seg.traffic_level,
                  color: color,
                },
                geometry: seg.geometry,
              };
            });
          }
          return [
            {
              type: 'Feature' as const,
              properties: {
                route_id: alt.route_id,
                color: alt.traffic_level === 'heavy' || alt.traffic_level === 'severe'
                  ? '#EF4444'
                  : alt.traffic_level === 'moderate'
                  ? '#F59E0B'
                  : '#64748B',
              },
              geometry: alt.geometry,
            },
          ];
        });

      altSource.setData({
        type: 'FeatureCollection',
        features: altFeatures,
      });
    } else if (altSource) {
      altSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [selectedRoute, recommendedRoute, alternatives]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('focused-segment') as GeoJSONSource;
    if (!source) return;

    if (focusedSegment && focusedSegment.geometry && focusedSegment.geometry.coordinates?.length > 0) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: focusedSegment.geometry,
      });

      const coords = focusedSegment.geometry.coordinates;
      if (coords.length > 1) {
        const bounds = coords.reduce(
          (b, coord) => b.extend(coord as [number, number]),
          new LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 120, maxZoom: 16, duration: 600 });
      } else if (coords.length === 1) {
        map.flyTo({ center: coords[0] as [number, number], zoom: 16, duration: 600 });
      }
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [focusedSegment]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    incidentMarkersRef.current.forEach((m) => m.remove());
    incidentMarkersRef.current = [];

    // Tampilkan hingga 80 insiden prioritas agar peta tetap responsif 60 FPS
    const displayedIncidents = incidents.slice(0, 80);

    displayedIncidents.forEach((inc) => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full bg-amber text-midnight-navy flex items-center justify-center font-bold text-xs shadow-md border border-cloud-white animate-pulse';
      el.title = `${inc.category.toUpperCase()}: ${inc.description}`;
      el.innerText = '!';

      const popup = new Popup({ offset: 15 }).setHTML(`
        <div style="color: #101B2D; font-family: sans-serif; font-size: 13px;">
          <strong style="color: #EF4444;">${inc.category.replace('_', ' ').toUpperCase()}</strong><br/>
          <span>${inc.description}</span><br/>
          <small style="color: #64748B;">${inc.street_name || 'Ruas Jalan'}</small>
        </div>
      `);

      const marker = new Marker({ element: el })
        .setLngLat([inc.location.longitude, inc.location.latitude])
        .setPopup(popup)
        .addTo(map);

      incidentMarkersRef.current.push(marker);
    });
  }, [incidents]);

  // Efek Navigasi 3D & Tracking Posisi / Arah Kendaraan
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isNavigating && currentGPS) {
      // 1. Inisialisasi atau Perbarui Posisi Marker Kendaraan (3D Navigation Puck)
      if (!vehicleMarkerRef.current) {
        const wrapper = document.createElement('div');
        wrapper.className = 'vehicle-puck-container relative flex items-center justify-center';
        wrapper.innerHTML = `
          <div class="absolute w-12 h-12 rounded-full bg-cyan-400/30 animate-ping pointer-events-none"></div>
          <div class="relative w-10 h-10 rounded-full bg-cyan-500 border-2 border-white shadow-2xl flex items-center justify-center text-midnight-navy font-black z-20">
            <svg class="vehicle-arrow w-5 h-5 fill-current text-midnight-navy transition-transform duration-300" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
        `;

        const marker = new Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([currentGPS.longitude, currentGPS.latitude])
          .addTo(map);

        vehicleMarkerRef.current = marker;
        vehicleElementRef.current = wrapper.querySelector('.vehicle-arrow') as HTMLDivElement;
      } else {
        vehicleMarkerRef.current.setLngLat([currentGPS.longitude, currentGPS.latitude]);
      }

      if (vehicleElementRef.current) {
        vehicleElementRef.current.style.transform = `rotate(${currentBearing}deg)`;
      }

      // 2. Kamera Mengikuti Pergerakan Kendaraan secara Mulus dalam Mode 3D
      if (autoFollow) {
        map.easeTo({
          center: [currentGPS.longitude, currentGPS.latitude],
          bearing: currentBearing,
          pitch: is3DMode ? 60 : 0,
          zoom: 18,
          duration: 600,
          easing: (t) => t,
        });
      }
    } else {
      // Bersihkan marker kendaraan saat navigasi dibatalkan / selesai
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
        vehicleElementRef.current = null;
      }
      // Kembalikan orientasi kamera ke tampilan 2D datar semula dan zoom out ke rute awal
      if (map.isStyleLoaded()) {
        const activeRoute = selectedRoute || recommendedRoute;
        const coordinates = activeRoute?.geometry?.coordinates;
        if (coordinates && coordinates.length > 1) {
          const bounds = coordinates.reduce(
            (b, coord) => b.extend(coord as [number, number]),
            new LngLatBounds(coordinates[0], coordinates[0])
          );
          map.fitBounds(bounds, { padding: 80, duration: 800, pitch: 0, bearing: 0 });
        } else if (origin) {
          map.flyTo({ center: [origin.longitude, origin.latitude], zoom: 14, pitch: 0, bearing: 0, duration: 800 });
        } else {
          map.easeTo({ pitch: 0, bearing: 0, zoom: 13, duration: 800 });
        }
      }
    }
  }, [isNavigating, is3DMode, autoFollow, currentGPS, currentBearing]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating 3D Navigation Controls */}
      {isNavigating && (
        <>
          {/* Tombol Toggle 3D / 2D di Sudut Kanan Atas */}
          <div className="absolute top-4 right-14 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIs3DMode(!is3DMode)}
              className="bg-midnight-navy/90 hover:bg-surface border border-border text-text-primary px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur transition"
              title="Ganti Sudut Pandang Kamera 3D / 2D"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{is3DMode ? '3D Navigasi' : '2D Peta'}</span>
            </button>
          </div>

          {/* Tombol Pusatkan Kembali (Muncul jika user menggeser peta secara manual) */}
          {!autoFollow && currentGPS && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={() => {
                  setAutoFollow(true);
                  const map = mapRef.current;
                  if (map && currentGPS) {
                    map.flyTo({
                      center: [currentGPS.longitude, currentGPS.latitude],
                      pitch: is3DMode ? 60 : 0,
                      bearing: currentBearing,
                      zoom: 18,
                      duration: 800,
                    });
                  }
                }}
                className="bg-primary hover:bg-primary-hover text-midnight-navy font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs border border-white/20 hover:scale-105 active:scale-95 transition-transform"
              >
                <Compass className="w-4 h-4 animate-spin text-midnight-navy" style={{ animationDuration: '6s' }} />
                <span>Pusatkan Kembali (3D Ikuti Jalan)</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

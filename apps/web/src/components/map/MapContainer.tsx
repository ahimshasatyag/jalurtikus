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
import { useRouteStore } from '../../stores/useRouteStore';
import { useTrafficStore } from '../../stores/useTrafficStore';
import { THEME_COLORS } from '../../theme/colors';

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

  const { origin, destination, recommendedRoute, alternatives, selectedRoute } = useRouteStore();
  const { incidents, apiKey } = useTrafficStore();

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
          'line-color': THEME_COLORS.route.alternative,
          'line-width': 4,
          'line-opacity': 0.75,
          'line-dasharray': [2, 2],
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
          'line-color': '#000000',
          'line-width': 8,
          'line-opacity': 0.6,
        },
      });
      map.addLayer({
        id: 'primary-route-layer',
        type: 'line',
        source: 'primary-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': THEME_COLORS.route.primary,
          'line-width': 6,
          'line-opacity': 0.95,
        },
      });
    });

    map.on('click', (e: MapMouseEvent) => {
      if (onMapClick) {
        onMapClick({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
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
      primarySource.setData({
        type: 'Feature',
        properties: {},
        geometry: activeRoute.geometry,
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
        .map((alt) => ({
          type: 'Feature' as const,
          properties: { route_id: alt.route_id },
          geometry: alt.geometry,
        }));

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

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

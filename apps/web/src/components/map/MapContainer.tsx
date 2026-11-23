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
  const { incidents } = useTrafficStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE,
      center: [106.827153, -6.175392],
      zoom: 12,
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

    if (origin) {
      if (!originMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full bg-primary border-2 border-midnight-navy flex items-center justify-center text-midnight-navy font-bold text-xs shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2';
        el.innerText = 'A';
        originMarkerRef.current = new Marker({ element: el })
          .setLngLat([origin.longitude, origin.latitude])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([origin.longitude, origin.latitude]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full bg-traffic-heavy border-2 border-cloud-white flex items-center justify-center text-cloud-white font-bold text-xs shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2';
        el.innerText = 'B';
        destMarkerRef.current = new Marker({ element: el })
          .setLngLat([destination.longitude, destination.latitude])
          .addTo(map);
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

    incidents.forEach((inc) => {
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

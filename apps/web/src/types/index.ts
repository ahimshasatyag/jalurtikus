export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationCandidate {
  place_id: string;
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  category?: string;
}

export type VehicleType = 'motorcycle' | 'car';
export type RoutePreference = 'fastest' | 'shortest' | 'avoid_tolls' | 'avoid_congestion';
export type TrafficCondition = 'free_flow' | 'light' | 'moderate' | 'heavy' | 'severe' | 'unknown';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lon, lat]
}

export interface RouteSegment {
  edge_id: string;
  street_name: string;
  distance_meters: number;
  duration_seconds: number;
  speed_kmh: number;
  traffic_level: TrafficCondition;
  is_toll: boolean;
  geometry: RouteGeometry;
}

export interface RouteOption {
  route_id: string;
  algorithm: string;
  name?: string;
  distance_meters: number;
  duration_seconds: number;
  traffic_level: TrafficCondition;
  traffic_updated_at: string;
  is_toll_free: boolean;
  geometry: RouteGeometry;
  segments?: RouteSegment[];
  nodes?: string[];
}

export interface AlgorithmMetrics {
  explored_nodes: number;
  execution_time_ms: number;
  duration_seconds: number;
}

export interface RouteSearchData {
  recommended_route: RouteOption;
  alternatives: RouteOption[];
  comparison?: {
    astar?: AlgorithmMetrics;
    dijkstra?: AlgorithmMetrics;
  };
}

export interface RouteSearchRequest {
  origin: Coordinates;
  destination: Coordinates;
  vehicle_type: VehicleType;
  route_preference: RoutePreference;
  avoid_tolls: boolean;
  avoid_congestion: boolean;
  alternatives: number;
}

export interface TrafficSnapshot {
  snapshot_id: string;
  source: string;
  recorded_at: string;
  expires_at: string;
  is_fresh: boolean;
  overall_status: TrafficCondition;
  active_incidents_count: number;
}

export interface TrafficSegment {
  edge_id: string;
  street_name: string;
  speed_kmh: number;
  free_flow_speed_kmh: number;
  condition: TrafficCondition;
  delay_seconds: number;
  updated_at: string;
  source: string;
}

export type IncidentCategory =
  | 'accident'
  | 'congestion'
  | 'flood'
  | 'road_closed'
  | 'road_work'
  | 'road_damage'
  | 'other';

export interface Incident {
  incident_id: string;
  category: IncidentCategory;
  description: string;
  location: Coordinates;
  street_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_verified: boolean;
  reported_at: string;
  expires_at?: string;
}

export interface UserReportCreate {
  category: IncidentCategory;
  description: string;
  location: Coordinates;
  street_name?: string;
}

export type TripStatus = 'active' | 'completed' | 'cancelled';

export interface Trip {
  trip_id: string;
  user_id?: string;
  route_id: string;
  status: TripStatus;
  started_at: string;
  completed_at?: string | null;
  remaining_distance_meters: number;
  remaining_duration_seconds: number;
  is_deviated?: boolean;
  reroute_suggested?: boolean;
  new_route_id?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  vehicle_type: VehicleType;
  route_preference: RoutePreference;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  error?: string;
}


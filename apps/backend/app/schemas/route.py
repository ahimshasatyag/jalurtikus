from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.location import Coordinates


class VehicleType(str, Enum):
    MOTORCYCLE = "motorcycle"
    CAR = "car"


class RoutePreference(str, Enum):
    FASTEST = "fastest"
    SHORTEST = "shortest"
    AVOID_TOLLS = "avoid_tolls"
    AVOID_CONGESTION = "avoid_congestion"


class RouteGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]  # List of [lon, lat]


class RouteSegment(BaseModel):
    edge_id: str
    street_name: str
    distance_meters: float
    duration_seconds: float
    speed_kmh: float
    traffic_level: str
    is_toll: bool = False
    geometry: RouteGeometry


class RouteOption(BaseModel):
    route_id: str
    algorithm: str  # A_STAR / DIJKSTRA
    name: Optional[str] = "Rute Utama"
    distance_meters: float
    duration_seconds: float
    traffic_level: str  # free_flow, light, moderate, heavy, severe, unknown
    traffic_updated_at: str
    is_toll_free: bool = True
    geometry: RouteGeometry
    segments: Optional[List[RouteSegment]] = None
    nodes: Optional[List[str]] = None


class RouteSearchRequest(BaseModel):
    origin: Coordinates
    destination: Coordinates
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE
    route_preference: RoutePreference = RoutePreference.FASTEST
    avoid_tolls: bool = False
    avoid_congestion: bool = True
    alternatives: int = Field(default=2, ge=0, le=3)


class RouteSearchData(BaseModel):
    recommended_route: RouteOption
    alternatives: List[RouteOption] = []
    comparison: Optional[Dict[str, Any]] = None  # Benchmark stats: explored nodes, time_ms


class ReRouteRequest(BaseModel):
    current_location: Coordinates
    current_speed_kmh: Optional[float] = None
    heading_degrees: Optional[float] = None


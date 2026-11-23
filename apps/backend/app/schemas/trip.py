from enum import Enum
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.location import Coordinates


class TripStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TripStartRequest(BaseModel):
    route_id: str
    origin: Coordinates
    destination: Coordinates
    vehicle_type: str = "motorcycle"


class GPSUpdateRequest(BaseModel):
    trip_id: str
    current_location: Coordinates
    speed_kmh: Optional[float] = 0.0
    heading_degrees: Optional[float] = 0.0
    accuracy_meters: Optional[float] = 5.0
    timestamp: Optional[str] = None


class TripResponse(BaseModel):
    trip_id: str
    user_id: Optional[str] = None
    route_id: str
    status: TripStatus
    started_at: str
    completed_at: Optional[str] = None
    remaining_distance_meters: float
    remaining_duration_seconds: float
    is_deviated: bool = False
    reroute_suggested: bool = False
    new_route_id: Optional[str] = None


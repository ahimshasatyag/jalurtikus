from enum import Enum
from typing import Optional
from pydantic import BaseModel
from app.schemas.location import Coordinates


class IncidentCategory(str, Enum):
    ACCIDENT = "accident"
    CONGESTION = "congestion"
    FLOOD = "flood"
    ROAD_CLOSED = "road_closed"
    ROAD_WORK = "road_work"
    ROAD_DAMAGE = "road_damage"
    OTHER = "other"


class IncidentResponse(BaseModel):
    incident_id: str
    category: IncidentCategory
    description: str
    location: Coordinates
    street_name: Optional[str] = None
    severity: str = "medium"  # low / medium / high / critical
    is_verified: bool = True
    reported_at: str
    expires_at: Optional[str] = None


class IncidentCreate(BaseModel):
    category: IncidentCategory
    description: str
    location: Coordinates
    street_name: Optional[str] = None
    severity: str = "medium"


class UserReportCreate(BaseModel):
    category: IncidentCategory
    description: str
    location: Coordinates
    street_name: Optional[str] = None


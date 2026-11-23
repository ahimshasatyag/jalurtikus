from enum import Enum
from typing import Optional
from pydantic import BaseModel


class TrafficCondition(str, Enum):
    FREE_FLOW = "free_flow"
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"
    UNKNOWN = "unknown"


class TrafficSnapshot(BaseModel):
    snapshot_id: str
    source: str
    recorded_at: str
    expires_at: str
    is_fresh: bool = True
    overall_status: TrafficCondition = TrafficCondition.FREE_FLOW
    active_incidents_count: int = 0


class TrafficSegmentResponse(BaseModel):
    edge_id: str
    street_name: str
    speed_kmh: float
    free_flow_speed_kmh: float
    condition: TrafficCondition
    delay_seconds: float
    updated_at: str
    source: str


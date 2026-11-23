from typing import List, Optional
from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class LocationCandidate(BaseModel):
    place_id: str
    name: str
    display_name: str
    latitude: float
    longitude: float
    category: Optional[str] = "landmark"


class LocationSearchResponse(BaseModel):
    query: str
    candidates: List[LocationCandidate]


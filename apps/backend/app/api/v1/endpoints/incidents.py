from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.incident import IncidentResponse
from app.schemas.common import APIResponse
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=APIResponse[List[IncidentResponse]])
async def get_incidents(
    bbox: Optional[str] = Query(None, description="Bounding box koordinat minLon,minLat,maxLon,maxLat"),
    key: Optional[str] = Query(None, description="TomTom API key override")
):
    """
    Mengambil semua data kejadian/insiden lalu lintas real-time.
    Mendukung integrasi langsung TomTom Incident Details API v5.
    """
    incidents = incident_service.get_all_incidents(bbox=bbox, api_key=key)
    return APIResponse(success=True, data=incidents, meta={"count": len(incidents)})

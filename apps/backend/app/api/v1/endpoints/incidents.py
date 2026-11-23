from typing import List
from fastapi import APIRouter
from app.schemas.incident import IncidentResponse
from app.schemas.common import APIResponse
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=APIResponse[List[IncidentResponse]])
async def get_incidents():
    incidents = incident_service.get_all_incidents()
    return APIResponse(success=True, data=incidents, meta={"count": len(incidents)})


from fastapi import APIRouter
from app.schemas.incident import UserReportCreate, IncidentResponse
from app.schemas.common import APIResponse
from app.services.incident_service import incident_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=APIResponse[IncidentResponse])
async def submit_report(report: UserReportCreate):
    created = incident_service.create_report(report)
    return APIResponse(success=True, data=created)


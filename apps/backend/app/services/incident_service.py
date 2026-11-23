import uuid
from datetime import datetime, timezone
from typing import List
from app.database.repositories.incident_repository import incident_repository
from app.schemas.incident import IncidentResponse, IncidentCreate, UserReportCreate


class IncidentService:
    def get_all_incidents(self) -> List[IncidentResponse]:
        raw_list = incident_repository.get_active_incidents()
        return [IncidentResponse(**item) for item in raw_list]

    def create_report(self, report: UserReportCreate) -> IncidentResponse:
        incident_id = f"inc_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()

        data = {
            "incident_id": incident_id,
            "category": report.category.value,
            "description": report.description,
            "location": report.location.model_dump(),
            "street_name": report.street_name or "Ruas Jalan Jakarta",
            "severity": "medium",
            "is_verified": False,
            "reported_at": now
        }
        incident_repository.save(incident_id, data)
        return IncidentResponse(**data)


incident_service = IncidentService()


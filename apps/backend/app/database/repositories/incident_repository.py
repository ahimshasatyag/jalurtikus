from typing import List, Dict, Any
from app.database.repositories.base_repository import BaseRepository


class IncidentRepository(BaseRepository):
    def __init__(self):
        super().__init__("incidents")

    def get_active_incidents(self) -> List[Dict[str, Any]]:
        return self.list_all()


incident_repository = IncidentRepository()


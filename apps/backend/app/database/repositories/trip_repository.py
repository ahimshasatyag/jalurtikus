from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class TripRepository(BaseRepository):
    def __init__(self):
        super().__init__("trips")

    def get_user_trips(self, user_id: str) -> List[Dict[str, Any]]:
        trips = self.list_all()
        if not user_id:
            return trips
        return [t for t in trips if t.get("user_id") == user_id]


trip_repository = TripRepository()


from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class RouteRepository(BaseRepository):
    def __init__(self):
        super().__init__("routes")

    def save_route(self, route_id: str, route_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.save(route_id, route_data)

    def get_route(self, route_id: str) -> Optional[Dict[str, Any]]:
        return self.find_by_id(route_id)


route_repository = RouteRepository()


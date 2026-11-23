from typing import List
from app.integrations.geocoding.geocoding_client import GeocodingClient
from app.schemas.location import LocationCandidate


class GeocodingService:
    def __init__(self):
        self.client = GeocodingClient()

    async def search(self, query: str, limit: int = 5) -> List[LocationCandidate]:
        if not query or len(query.strip()) < 2:
            return []
        return await self.client.search_locations(query, limit)


geocoding_service = GeocodingService()


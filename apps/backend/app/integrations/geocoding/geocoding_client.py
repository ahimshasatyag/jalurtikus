from typing import List
import httpx
from app.schemas.location import LocationCandidate


class GeocodingClient:
    """
    Client Geocoding riil menggunakan OpenStreetMap Nominatim.
    Tanpa data dummy atau hardcoded landmark.
    """
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    async def search_locations(self, query: str, limit: int = 5) -> List[LocationCandidate]:
        q_clean = query.strip()
        if not q_clean or len(q_clean) < 2:
            return []

        candidates: List[LocationCandidate] = []

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"User-Agent": "JalurTikus-App/1.0 (info@jalurtikus.id)"}
                params = {
                    "q": f"{q_clean}, Indonesia",
                    "format": "json",
                    "limit": limit,
                    "countrycodes": "id"
                }
                resp = await client.get(self.NOMINATIM_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        candidates.append(
                            LocationCandidate(
                                place_id=str(item.get("place_id")),
                                name=item.get("name") or item.get("display_name", "").split(",")[0].strip(),
                                display_name=item.get("display_name", ""),
                                latitude=float(item.get("lat")),
                                longitude=float(item.get("lon")),
                                category=item.get("type", "place")
                            )
                        )
        except Exception:
            return []

        return candidates[:limit]

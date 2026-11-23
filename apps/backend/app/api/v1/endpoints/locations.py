from typing import List
from fastapi import APIRouter, Query
from app.schemas.location import LocationCandidate
from app.schemas.common import APIResponse
from app.services.geocoding_service import geocoding_service

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/search", response_model=APIResponse[List[LocationCandidate]])
async def search_locations(
    q: str = Query(..., min_length=2, description="Alamat atau nama lokasi yang dicari"),
    limit: int = Query(5, ge=1, le=10)
):
    candidates = await geocoding_service.search(q, limit)
    return APIResponse(success=True, data=candidates, meta={"query": q, "count": len(candidates)})


from fastapi import APIRouter, HTTPException, status
from app.schemas.trip import GPSUpdateRequest, TripResponse
from app.schemas.common import APIResponse
from app.services.trip_service import trip_service

router = APIRouter(prefix="/gps", tags=["GPS"])


@router.post("/update", response_model=APIResponse[TripResponse])
async def update_gps(update: GPSUpdateRequest):
    try:
        res = trip_service.update_gps(update)
        return APIResponse(success=True, data=res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


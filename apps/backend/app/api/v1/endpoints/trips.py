from typing import List
from fastapi import APIRouter, HTTPException, status, Header
from app.schemas.trip import TripStartRequest, TripResponse
from app.schemas.common import APIResponse
from app.services.trip_service import trip_service
from app.api.v1.endpoints.users import get_current_user_id

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("/start", response_model=APIResponse[TripResponse])
async def start_trip(request: TripStartRequest, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    try:
        trip = trip_service.start_trip(request, user_id=user_id)
        return APIResponse(success=True, data=trip)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{trip_id}/complete", response_model=APIResponse[TripResponse])
async def complete_trip(trip_id: str):
    try:
        res = trip_service.complete_trip(trip_id)
        return APIResponse(success=True, data=res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{trip_id}/cancel", response_model=APIResponse[TripResponse])
async def cancel_trip(trip_id: str):
    try:
        res = trip_service.cancel_trip(trip_id)
        return APIResponse(success=True, data=res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/history", response_model=APIResponse[List[TripResponse]])
async def get_trip_history(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    trips = trip_service.get_trip_history(user_id=user_id)
    return APIResponse(success=True, data=trips, meta={"count": len(trips)})

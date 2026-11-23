from fastapi import APIRouter
from app.schemas.traffic import TrafficSnapshot, TrafficSegmentResponse
from app.schemas.common import APIResponse
from app.services.traffic_service import traffic_service

router = APIRouter(prefix="/traffic", tags=["Traffic"])


@router.get("/current", response_model=APIResponse[TrafficSnapshot])
async def get_current_traffic():
    snapshot = traffic_service.get_current_snapshot()
    return APIResponse(success=True, data=snapshot)


@router.get("/segments/{edge_id}", response_model=APIResponse[TrafficSegmentResponse])
async def get_traffic_segment(edge_id: str):
    segment = traffic_service.get_edge_traffic(edge_id)
    return APIResponse(success=True, data=segment)


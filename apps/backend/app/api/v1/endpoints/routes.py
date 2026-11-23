from fastapi import APIRouter, HTTPException, status
from app.schemas.route import (
    RouteSearchRequest, RouteSearchData, RouteOption, ReRouteRequest
)
from app.schemas.common import APIResponse
from app.services.routing_service import routing_service

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post("/search", response_model=APIResponse[RouteSearchData])
async def search_routes(request: RouteSearchRequest):
    try:
        data = routing_service.search_routes(request)
        return APIResponse(
            success=True,
            data=data,
            meta={
                "traffic_source": "jalurtikus_realtime_engine",
                "traffic_freshness": "fresh",
                "vehicle_type": request.vehicle_type.value,
                "preference": request.route_preference.value
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Gagal menghitung rute: {str(e)}")


@router.get("/{route_id}", response_model=APIResponse[RouteOption])
async def get_route_detail(route_id: str):
    route = routing_service.get_route_by_id(route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rute {route_id} tidak ditemukan.")
    return APIResponse(success=True, data=route)


@router.post("/{route_id}/select", response_model=APIResponse[dict])
async def select_route(route_id: str):
    route = routing_service.get_route_by_id(route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rute {route_id} tidak ditemukan.")
    return APIResponse(success=True, data={"selected_route_id": route_id, "status": "active"})


@router.post("/{route_id}/reroute", response_model=APIResponse[RouteOption])
async def reroute(route_id: str, request: ReRouteRequest):
    route = routing_service.get_route_by_id(route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rute {route_id} tidak ditemukan.")

    # Ambil titik tujuan dari koordinat terakhir rute lama
    coords = route.geometry.coordinates
    dest_coord = coords[-1] if coords else [106.827153, -6.175392]

    from app.schemas.location import Coordinates
    from app.schemas.route import VehicleType, RoutePreference

    search_res = routing_service.search_routes(
        RouteSearchRequest(
            origin=request.current_location,
            destination=Coordinates(latitude=dest_coord[1], longitude=dest_coord[0]),
            vehicle_type=VehicleType.MOTORCYCLE,
            route_preference=RoutePreference.FASTEST
        )
    )
    return APIResponse(success=True, data=search_res.recommended_route)


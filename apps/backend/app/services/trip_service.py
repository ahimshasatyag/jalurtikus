import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.schemas.trip import (
    TripStartRequest, GPSUpdateRequest, TripResponse, TripStatus
)
from app.schemas.route import Coordinates, RouteSearchRequest
from app.services.routing_service import routing_service
from app.database.repositories.trip_repository import trip_repository
from app.core.config import settings
from app.utils.geo import point_to_segment_distance, haversine_distance


class TripService:
    def start_trip(self, request: TripStartRequest, user_id: str) -> TripResponse:
        if not user_id:
            raise ValueError("User ID diperlukan untuk memulai perjalanan.")

        trip_id = f"trip_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()

        route = routing_service.get_route_by_id(request.route_id)
        if not route:
            search_res = routing_service.search_routes(
                RouteSearchRequest(
                    origin=request.origin,
                    destination=request.destination,
                    vehicle_type=request.vehicle_type
                )
            )
            route = search_res.recommended_route

        trip_data = {
            "trip_id": trip_id,
            "user_id": user_id,
            "route_id": route.route_id,
            "status": TripStatus.ACTIVE.value,
            "started_at": now,
            "completed_at": None,
            "remaining_distance_meters": route.distance_meters,
            "remaining_duration_seconds": route.duration_seconds,
            "destination": request.destination.model_dump(),
            "origin": request.origin.model_dump(),
            "vehicle_type": request.vehicle_type,
            "is_deviated": False,
            "reroute_suggested": False,
            "new_route_id": None
        }

        trip_repository.save(trip_id, trip_data)

        return TripResponse(
            trip_id=trip_id,
            user_id=user_id,
            route_id=route.route_id,
            status=TripStatus.ACTIVE,
            started_at=now,
            remaining_distance_meters=route.distance_meters,
            remaining_duration_seconds=route.duration_seconds,
            is_deviated=False,
            reroute_suggested=False
        )

    def update_gps(self, update: GPSUpdateRequest) -> TripResponse:
        trip = trip_repository.find_by_id(update.trip_id)
        if not trip:
            raise ValueError(f"Perjalanan dengan ID {update.trip_id} tidak ditemukan.")

        if trip.get("status") != TripStatus.ACTIVE.value:
            return TripResponse(
                trip_id=trip["trip_id"],
                user_id=trip.get("user_id"),
                route_id=trip["route_id"],
                status=TripStatus(trip["status"]),
                started_at=trip["started_at"],
                completed_at=trip.get("completed_at"),
                remaining_distance_meters=trip.get("remaining_distance_meters", 0.0),
                remaining_duration_seconds=trip.get("remaining_duration_seconds", 0.0)
            )

        route = routing_service.get_route_by_id(trip["route_id"])
        is_deviated = False
        reroute_suggested = False
        new_route_id = None

        if route and route.geometry.coordinates:
            curr_lat = update.current_location.latitude
            curr_lon = update.current_location.longitude

            min_dist_to_route = float("inf")
            coords = route.geometry.coordinates
            for i in range(len(coords) - 1):
                lon1, lat1 = coords[i]
                lon2, lat2 = coords[i + 1]
                dist = point_to_segment_distance(curr_lat, curr_lon, lat1, lon1, lat2, lon2)
                if dist < min_dist_to_route:
                    min_dist_to_route = dist

            if min_dist_to_route > settings.REROUTE_DEVIATION_THRESHOLD_METERS:
                is_deviated = True
                reroute_suggested = True

                dest_data = trip.get("destination", {})
                if dest_data:
                    try:
                        new_search = routing_service.search_routes(
                            RouteSearchRequest(
                                origin=update.current_location,
                                destination=Coordinates(**dest_data),
                                vehicle_type=trip.get("vehicle_type", "motorcycle")
                            )
                        )
                        new_route = new_search.recommended_route
                        new_route_id = new_route.route_id
                        trip["route_id"] = new_route_id
                        trip["remaining_distance_meters"] = new_route.distance_meters
                        trip["remaining_duration_seconds"] = new_route.duration_seconds
                    except Exception:
                        pass

            dest_data = trip.get("destination", {})
            if dest_data:
                rem_dist = haversine_distance(
                    curr_lat, curr_lon,
                    dest_data["latitude"], dest_data["longitude"]
                )
                trip["remaining_distance_meters"] = rem_dist
                trip["remaining_duration_seconds"] = rem_dist / (35.0 * 1000.0 / 3600.0)

        trip["is_deviated"] = is_deviated
        trip["reroute_suggested"] = reroute_suggested
        trip["new_route_id"] = new_route_id
        trip_repository.save(trip["trip_id"], trip)

        return TripResponse(
            trip_id=trip["trip_id"],
            user_id=trip.get("user_id"),
            route_id=trip["route_id"],
            status=TripStatus.ACTIVE,
            started_at=trip["started_at"],
            remaining_distance_meters=round(trip.get("remaining_distance_meters", 0.0), 1),
            remaining_duration_seconds=round(trip.get("remaining_duration_seconds", 0.0), 1),
            is_deviated=is_deviated,
            reroute_suggested=reroute_suggested,
            new_route_id=new_route_id
        )

    def complete_trip(self, trip_id: str) -> TripResponse:
        trip = trip_repository.find_by_id(trip_id)
        if not trip:
            raise ValueError(f"Trip {trip_id} tidak ditemukan.")
        now = datetime.now(timezone.utc).isoformat()
        trip["status"] = TripStatus.COMPLETED.value
        trip["completed_at"] = now
        trip["remaining_distance_meters"] = 0.0
        trip["remaining_duration_seconds"] = 0.0
        trip_repository.save(trip_id, trip)

        return TripResponse(
            trip_id=trip_id,
            user_id=trip.get("user_id"),
            route_id=trip["route_id"],
            status=TripStatus.COMPLETED,
            started_at=trip["started_at"],
            completed_at=now,
            remaining_distance_meters=0.0,
            remaining_duration_seconds=0.0
        )

    def cancel_trip(self, trip_id: str) -> TripResponse:
        trip = trip_repository.find_by_id(trip_id)
        if not trip:
            raise ValueError(f"Trip {trip_id} tidak ditemukan.")
        now = datetime.now(timezone.utc).isoformat()
        trip["status"] = TripStatus.CANCELLED.value
        trip["completed_at"] = now
        trip_repository.save(trip_id, trip)

        return TripResponse(
            trip_id=trip_id,
            user_id=trip.get("user_id"),
            route_id=trip["route_id"],
            status=TripStatus.CANCELLED,
            started_at=trip["started_at"],
            completed_at=now,
            remaining_distance_meters=trip.get("remaining_distance_meters", 0.0),
            remaining_duration_seconds=trip.get("remaining_duration_seconds", 0.0)
        )

    def get_trip_history(self, user_id: str) -> List[TripResponse]:
        raw_trips = trip_repository.get_user_trips(user_id)
        result: List[TripResponse] = []
        for t in raw_trips:
            result.append(
                TripResponse(
                    trip_id=t["trip_id"],
                    user_id=t.get("user_id"),
                    route_id=t["route_id"],
                    status=TripStatus(t["status"]),
                    started_at=t["started_at"],
                    completed_at=t.get("completed_at"),
                    remaining_distance_meters=t.get("remaining_distance_meters", 0.0),
                    remaining_duration_seconds=t.get("remaining_duration_seconds", 0.0)
                )
            )
        return result


trip_service = TripService()

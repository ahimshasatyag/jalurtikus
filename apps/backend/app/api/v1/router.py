from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, locations, routes,
    traffic, gps, trips, incidents, reports, health
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(locations.router)
api_router.include_router(routes.router)
api_router.include_router(traffic.router)
api_router.include_router(gps.router)
api_router.include_router(trips.router)
api_router.include_router(incidents.router)
api_router.include_router(reports.router)

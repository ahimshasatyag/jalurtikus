import os
import re
from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.schemas.traffic import TrafficSnapshot, TrafficSegmentResponse
from app.schemas.common import APIResponse
from app.services.traffic_service import traffic_service
from app.core.config import settings

router = APIRouter(prefix="/traffic", tags=["Traffic"])


class TrafficConfigRequest(BaseModel):
    api_key: str
    bbox: Optional[str] = None


@router.get("/current", response_model=APIResponse[TrafficSnapshot])
async def get_current_traffic():
    snapshot = traffic_service.get_current_snapshot()
    return APIResponse(success=True, data=snapshot)


@router.get("/segments/{edge_id}", response_model=APIResponse[TrafficSegmentResponse])
async def get_traffic_segment(edge_id: str):
    segment = traffic_service.get_edge_traffic(edge_id)
    return APIResponse(success=True, data=segment)


@router.post("/config", response_model=APIResponse[Dict[str, Any]])
async def set_traffic_config(config: TrafficConfigRequest):
    cleaned_key = config.api_key.strip()
    settings.TRAFFIC_API_KEY = cleaned_key
    settings.TOMTOM_API_KEY = cleaned_key
    if config.bbox:
        settings.TOMTOM_DEFAULT_BBOX = config.bbox.strip()

    # Perbarui file .env agar tersimpan permanen
    try:
        env_path = os.path.join(os.getcwd(), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

            if "TRAFFIC_API_KEY=" in content:
                content = re.sub(r"TRAFFIC_API_KEY=.*", f"TRAFFIC_API_KEY={cleaned_key}", content)
            else:
                content += f"\nTRAFFIC_API_KEY={cleaned_key}"

            if "TOMTOM_API_KEY=" in content:
                content = re.sub(r"TOMTOM_API_KEY=.*", f"TOMTOM_API_KEY={cleaned_key}", content)
            else:
                content += f"\nTOMTOM_API_KEY={cleaned_key}"

            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)
    except Exception:
        pass

    return APIResponse(
        success=True,
        data={
            "api_key_set": bool(cleaned_key),
            "source": "TomTom Traffic API" if cleaned_key else "OpenStreetMap",
            "bbox": settings.TOMTOM_DEFAULT_BBOX
        }
    )

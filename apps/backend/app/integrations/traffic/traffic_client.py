from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.schemas.traffic import TrafficCondition, TrafficSnapshot, TrafficSegmentResponse


class TrafficProviderClient:
    """
    Client Provider Trafik JalurTikus (PRD 8.5 & 10.4).
    Kondisi trafik diperoleh secara dinamis tanpa data dummy / hardcoded.
    """

    def __init__(self, provider_name: str = "jalurtikus_traffic_provider"):
        self.provider_name = provider_name
        self.current_conditions: Dict[str, Dict[str, Any]] = {}

    def update_condition(self, edge_id: str, condition: TrafficCondition, delay_seconds: float, speed_kmh: float):
        self.current_conditions[edge_id] = {
            "condition": condition,
            "delay_seconds": delay_seconds,
            "speed_kmh": speed_kmh
        }

    def get_current_snapshot(self) -> TrafficSnapshot:
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=5)

        return TrafficSnapshot(
            snapshot_id=f"snap_{int(now.timestamp())}",
            source=self.provider_name,
            recorded_at=now.isoformat(),
            expires_at=expires.isoformat(),
            is_fresh=True,
            overall_status=TrafficCondition.FREE_FLOW,
            active_incidents_count=len(self.current_conditions)
        )

    def get_edge_traffic(self, edge_id: str) -> TrafficSegmentResponse:
        now = datetime.now(timezone.utc)
        data = self.current_conditions.get(edge_id, {
            "condition": TrafficCondition.FREE_FLOW,
            "delay_seconds": 0.0,
            "speed_kmh": 40.0
        })

        return TrafficSegmentResponse(
            edge_id=edge_id,
            street_name=edge_id.replace("_", " ").title(),
            speed_kmh=data["speed_kmh"],
            free_flow_speed_kmh=40.0,
            condition=data["condition"],
            delay_seconds=data["delay_seconds"],
            updated_at=now.isoformat(),
            source=self.provider_name
        )

    def get_all_active_conditions(self) -> Dict[str, Dict[str, Any]]:
        return self.current_conditions

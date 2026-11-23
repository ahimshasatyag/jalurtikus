from app.integrations.traffic.traffic_client import TrafficProviderClient
from app.algorithms.graph.graph_loader import GraphManager
from app.schemas.traffic import TrafficSnapshot, TrafficSegmentResponse


class TrafficService:
    def __init__(self):
        self.client = TrafficProviderClient()
        self._sync_to_graph()

    def _sync_to_graph(self):
        conditions = self.client.get_all_active_conditions()
        GraphManager.get_instance().update_traffic_overrides(conditions)

    def get_current_snapshot(self) -> TrafficSnapshot:
        return self.client.get_current_snapshot()

    def get_edge_traffic(self, edge_id: str) -> TrafficSegmentResponse:
        return self.client.get_edge_traffic(edge_id)


traffic_service = TrafficService()


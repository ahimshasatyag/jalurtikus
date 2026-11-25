from app.integrations.traffic.traffic_client import TrafficProviderClient
from app.algorithms.graph.graph_loader import GraphManager
from app.schemas.traffic import TrafficSnapshot, TrafficSegmentResponse


class TrafficService:
    def __init__(self):
        self.client = TrafficProviderClient()
        self._sync_to_graph()

    def _sync_to_graph(self):
        conditions = dict(self.client.get_all_active_conditions())
        try:
            from app.services.incident_service import incident_service
            from app.utils.geo import haversine_distance
            from app.schemas.traffic import TrafficCondition

            incidents = incident_service.get_all_incidents()
            graph = GraphManager.get_instance().get_graph()

            for inc in incidents:
                inc_lat = inc.location.latitude
                inc_lon = inc.location.longitude
                cat = inc.category.value if hasattr(inc.category, "value") else str(inc.category)

                for u, v, data in graph.edges(data=True):
                    geom = data.get("geometry", {}).get("coordinates", [])
                    matched = False
                    for pt in geom:
                        dist = haversine_distance(inc_lat, inc_lon, pt[1], pt[0])
                        if dist <= 200:
                            matched = True
                            break

                    if matched:
                        edge_id = data.get("edge_id", f"{u}_{v}")
                        if "road_closed" in cat or "road_blocked" in cat:
                            conditions[edge_id] = {
                                "condition": TrafficCondition.SEVERE,
                                "is_closed": False,
                                "speed_kmh": 5.0
                            }
                        elif "congestion" in cat or "accident" in cat:
                            conditions[edge_id] = {
                                "condition": TrafficCondition.HEAVY,
                                "is_closed": False,
                                "speed_kmh": 12.0
                            }
                        elif "road_work" in cat or "flood" in cat:
                            conditions[edge_id] = {
                                "condition": TrafficCondition.HEAVY,
                                "is_closed": False,
                                "speed_kmh": 10.0
                            }
                        elif edge_id not in conditions:
                            conditions[edge_id] = {
                                "condition": TrafficCondition.MODERATE,
                                "is_closed": False,
                                "speed_kmh": 20.0
                            }
        except Exception:
            pass

        GraphManager.get_instance().update_traffic_overrides(conditions)

    def get_current_snapshot(self) -> TrafficSnapshot:
        self._sync_to_graph()
        return self.client.get_current_snapshot()

    def get_edge_traffic(self, edge_id: str) -> TrafficSegmentResponse:
        return self.client.get_edge_traffic(edge_id)


traffic_service = TrafficService()


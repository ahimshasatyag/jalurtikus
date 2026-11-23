import networkx as nx
from typing import Optional, Dict, Any
from app.algorithms.graph.graph_builder import build_road_graph, JAKARTA_MVP_NODES


class GraphManager:
    _instance: Optional["GraphManager"] = None

    def __init__(self):
        self.graph: nx.DiGraph = build_road_graph()
        self.nodes: Dict[str, Any] = JAKARTA_MVP_NODES
        self.traffic_overrides: Dict[str, Any] = {}

    @classmethod
    def get_instance(cls) -> "GraphManager":
        if cls._instance is None:
            cls._instance = GraphManager()
        return cls._instance

    def update_traffic_overrides(self, overrides: Dict[str, Any]):
        """
        Memperbarui kondisi trafik pada graf secara in-memory.
        """
        self.traffic_overrides.update(overrides)
        self.graph = build_road_graph(traffic_overrides=self.traffic_overrides)

    def get_graph(self) -> nx.DiGraph:
        return self.graph

    def get_nodes(self) -> Dict[str, Any]:
        return self.nodes


def get_active_graph() -> nx.DiGraph:
    return GraphManager.get_instance().get_graph()


def get_active_nodes() -> Dict[str, Any]:
    return GraphManager.get_instance().get_nodes()


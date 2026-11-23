from typing import Dict, Any, List
import networkx as nx


def validate_road_graph(graph: nx.DiGraph) -> Dict[str, Any]:
    """
    Memvalidasi konektivitas dan kelengkapan graf jalan (PRD 10.3 & 18.1).
    """
    num_nodes = graph.number_of_nodes()
    num_edges = graph.number_of_edges()

    # Cek node terisolasi (derajat masuk dan keluar 0)
    isolated_nodes: List[str] = [
        n for n in graph.nodes if graph.in_degree(n) == 0 and graph.out_degree(n) == 0
    ]

    # Cek strong connectivity
    is_strongly_connected = nx.is_strongly_connected(graph)
    is_weakly_connected = nx.is_weakly_connected(graph)

    # Validasi atribut edge wajib
    missing_attrs = []
    for u, v, data in graph.edges(data=True):
        if "distance_meters" not in data or "road_type" not in data:
            missing_attrs.append(f"{u}->{v}")

    return {
        "valid": len(isolated_nodes) == 0 and is_weakly_connected and len(missing_attrs) == 0,
        "nodes_count": num_nodes,
        "edges_count": num_edges,
        "isolated_nodes": isolated_nodes,
        "is_strongly_connected": is_strongly_connected,
        "is_weakly_connected": is_weakly_connected,
        "missing_attributes_count": len(missing_attrs)
    }


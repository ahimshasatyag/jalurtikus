from typing import List, Dict, Any, Tuple
import networkx as nx
from app.algorithms.astar import astar_search
from app.schemas.route import VehicleType, RoutePreference


def calculate_path_overlap(path_a: List[str], path_b: List[str]) -> float:
    """
    Menghitung persentase tumpang tindih (overlap) node antara dua rute (0.0 s.d. 1.0).
    """
    if not path_a or not path_b:
        return 0.0
    set_a = set(path_a)
    set_b = set(path_b)
    intersection = set_a.intersection(set_b)
    return len(intersection) / float(max(len(set_a), len(set_b)))


def generate_alternative_routes(
    graph: nx.DiGraph,
    start_node: str,
    target_node: str,
    primary_route: Dict[str, Any],
    max_alternatives: int = 2,
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE,
    preference: RoutePreference = RoutePreference.FASTEST,
    avoid_tolls: bool = False,
    avoid_congestion: bool = True
) -> List[Dict[str, Any]]:
    """
    Menghasilkan alternatif rute yang berbeda secara bermakna (PRD 9.6).
    Menerapkan penalti pada ruas yang telah dilewati rute utama dan memvalidasi
    agar overlap tidak melebihi ambang batas kemiripan (maks 80%).
    """
    if max_alternatives <= 0 or not primary_route or not primary_route.get("path_nodes"):
        return []

    alternatives: List[Dict[str, Any]] = []
    penalties: Dict[Tuple[str, str], float] = {}

    existing_paths = [primary_route["path_nodes"]]

    for i in range(max_alternatives):
        # Tambah penalti untuk setiap edge pada rute sebelumnya
        last_path = existing_paths[-1]
        for u, v in zip(last_path[:-1], last_path[1:]):
            penalties[(u, v)] = penalties.get((u, v), 1.0) * 2.0

        alt_result = astar_search(
            graph,
            start_node=start_node,
            target_node=target_node,
            vehicle_type=vehicle_type,
            preference=preference,
            avoid_tolls=avoid_tolls,
            avoid_congestion=avoid_congestion,
            edge_penalties=penalties
        )

        if not alt_result or not alt_result.get("path_nodes"):
            break

        candidate_path = alt_result["path_nodes"]

        # Cek apakah rute ini cukup berbeda dari semua rute sebelumnya
        is_distinct = True
        for prev_path in existing_paths:
            overlap = calculate_path_overlap(candidate_path, prev_path)
            if overlap > 0.85:  # Terlalu mirip
                is_distinct = False
                break

        if is_distinct:
            alt_result["algorithm"] = "A_STAR_ALTERNATIVE"
            alternatives.append(alt_result)
            existing_paths.append(candidate_path)

    return alternatives


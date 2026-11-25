import heapq
import time
from typing import Dict, Any, List, Optional, Tuple
import networkx as nx
from app.algorithms.edge_weight import calculate_edge_weight
from app.algorithms.heuristic import admissible_haversine_heuristic
from app.schemas.route import VehicleType, RoutePreference


def astar_search(
    graph: nx.DiGraph,
    start_node: str,
    target_node: str,
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE,
    preference: RoutePreference = RoutePreference.FASTEST,
    avoid_tolls: bool = False,
    avoid_congestion: bool = True,
    edge_penalties: Optional[Dict[Tuple[str, str], float]] = None,
    max_speed_kmh: float = 80.0
) -> Optional[Dict[str, Any]]:
    """
    Implementasi A* Algorithm (PRD 9.3)
    f(n) = g(n) + h(n)
    Mengembalikan jalur terpendek/tercepat, jumlah node dieksplorasi, durasi eksekusi, total jarak & waktu.
    """
    start_time = time.perf_counter()

    if start_node not in graph or target_node not in graph:
        return None

    if start_node == target_node:
        return {
            "path_nodes": [start_node],
            "path_edges": [],
            "total_distance_meters": 0.0,
            "total_duration_seconds": 0.0,
            "explored_nodes_count": 0,
            "execution_time_ms": 0.0,
            "algorithm": "A_STAR"
        }

    nodes_dict = {n: graph.nodes[n] for n in graph.nodes}

    # Priority queue: (f_score, counter, current_node)
    counter = 0
    open_set: List[Tuple[float, int, str]] = []
    initial_h = admissible_haversine_heuristic(start_node, target_node, nodes_dict, max_speed_kmh, preference)
    heapq.heappush(open_set, (initial_h, counter, start_node))

    # came_from: node -> (previous_node, edge_data)
    came_from: Dict[str, Tuple[str, Dict[str, Any]]] = {}

    g_score: Dict[str, float] = {node: float("inf") for node in graph.nodes}
    g_score[start_node] = 0.0

    explored_nodes_count = 0

    while open_set:
        current_f, _, current = heapq.heappop(open_set)
        explored_nodes_count += 1

        if current == target_node:
            # Rekonstruksi rute
            path_nodes = [current]
            path_edges: List[Dict[str, Any]] = []
            curr = current

            total_distance = 0.0
            total_duration = 0.0

            while curr in came_from:
                prev, edge_data = came_from[curr]
                path_nodes.append(prev)
                path_edges.append(edge_data)

                total_distance += float(edge_data.get("distance_meters", 0.0))
                # Durasi fisik tanpa penalti bobot heuristik / preferensi
                raw_cost = calculate_edge_weight(
                    edge_data, vehicle_type, preference,
                    avoid_tolls=avoid_tolls, avoid_congestion=avoid_congestion,
                    penalty_multiplier=1.0, raw_duration_only=True
                )
                total_duration += raw_cost
                curr = prev

            path_nodes.reverse()
            path_edges.reverse()

            exec_time_ms = (time.perf_counter() - start_time) * 1000.0

            return {
                "path_nodes": path_nodes,
                "path_edges": path_edges,
                "total_distance_meters": total_distance,
                "total_duration_seconds": total_duration,
                "explored_nodes_count": explored_nodes_count,
                "execution_time_ms": exec_time_ms,
                "algorithm": "A_STAR"
            }

        # Eksplorasi tetangga
        for neighbor in graph.successors(current):
            edge_data = graph[current][neighbor]

            # Hitung penalti tambahan (misal untuk pencarian alternatif rute)
            penalty = 1.0
            if edge_penalties and (current, neighbor) in edge_penalties:
                penalty = edge_penalties[(current, neighbor)]

            weight = calculate_edge_weight(
                edge_data,
                vehicle_type=vehicle_type,
                preference=preference,
                avoid_tolls=avoid_tolls,
                avoid_congestion=avoid_congestion,
                penalty_multiplier=penalty
            )

            if weight == float("inf"):
                continue

            tentative_g = g_score[current] + weight

            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = (current, edge_data)
                g_score[neighbor] = tentative_g
                h = admissible_haversine_heuristic(neighbor, target_node, nodes_dict, max_speed_kmh, preference)
                f_score = tentative_g + h
                counter += 1
                heapq.heappush(open_set, (f_score, counter, neighbor))

    return None


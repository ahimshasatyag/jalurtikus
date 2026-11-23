import heapq
import time
from typing import Dict, Any, List, Optional, Tuple
import networkx as nx
from app.algorithms.edge_weight import calculate_edge_weight
from app.schemas.route import VehicleType, RoutePreference


def dijkstra_search(
    graph: nx.DiGraph,
    start_node: str,
    target_node: str,
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE,
    preference: RoutePreference = RoutePreference.FASTEST,
    avoid_tolls: bool = False,
    avoid_congestion: bool = True,
    edge_penalties: Optional[Dict[Tuple[str, str], float]] = None
) -> Optional[Dict[str, Any]]:
    """
    Implementasi Algoritma Dijkstra (PRD 9.4)
    Digunakan sebagai pembanding optimalitas dan benchmark terhadap A*.
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
            "algorithm": "DIJKSTRA"
        }

    counter = 0
    open_set: List[Tuple[float, int, str]] = []
    heapq.heappush(open_set, (0.0, counter, start_node))

    came_from: Dict[str, Tuple[str, Dict[str, Any]]] = {}
    distances: Dict[str, float] = {node: float("inf") for node in graph.nodes}
    distances[start_node] = 0.0

    explored_nodes_count = 0

    while open_set:
        current_dist, _, current = heapq.heappop(open_set)
        explored_nodes_count += 1

        if current == target_node:
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
                raw_cost = calculate_edge_weight(
                    edge_data, vehicle_type, RoutePreference.FASTEST,
                    avoid_tolls=False, avoid_congestion=False, penalty_multiplier=1.0
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
                "algorithm": "DIJKSTRA"
            }

        if current_dist > distances[current]:
            continue

        for neighbor in graph.successors(current):
            edge_data = graph[current][neighbor]

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

            distance = current_dist + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                came_from[neighbor] = (current, edge_data)
                counter += 1
                heapq.heappush(open_set, (distance, counter, neighbor))

    return None


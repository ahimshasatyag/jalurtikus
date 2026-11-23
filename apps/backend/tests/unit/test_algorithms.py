import pytest
import networkx as nx
from app.algorithms.astar import astar_search
from app.algorithms.dijkstra import dijkstra_search
from app.algorithms.edge_weight import calculate_edge_weight
from app.algorithms.alternative_routes import generate_alternative_routes
from app.algorithms.graph.graph_builder import build_road_graph
from app.schemas.route import VehicleType, RoutePreference
from app.schemas.traffic import TrafficCondition


@pytest.fixture
def test_graph() -> nx.DiGraph:
    return build_road_graph()


def test_edge_weight_formula():
    """
    Menguji formula durasi PRD 9.2:
    T_e = D_e / (V_e * 1000/3600)
    Jarak 1000 meter dengan kecepatan 36 km/jam -> durasi harus 100 detik.
    """
    edge_data = {
        "distance_meters": 1000.0,
        "base_speed_kmh": 36.0,
        "traffic_condition": TrafficCondition.FREE_FLOW,
        "is_toll": False,
        "is_closed": False
    }
    duration = calculate_edge_weight(
        edge_data,
        vehicle_type=VehicleType.MOTORCYCLE,
        preference=RoutePreference.FASTEST,
        avoid_congestion=False
    )
    assert abs(duration - 100.0) < 0.01


def test_motorcycle_toll_restriction():
    """
    Menguji aturan bisnis: Sepeda motor dilarang melalui jalan tol (weight = infinity).
    """
    edge_data = {
        "distance_meters": 5000.0,
        "base_speed_kmh": 80.0,
        "is_toll": True,
        "is_closed": False
    }
    # Motor -> Tak hingga
    motor_weight = calculate_edge_weight(edge_data, vehicle_type=VehicleType.MOTORCYCLE)
    assert motor_weight == float("inf")

    # Mobil -> Diizinkan (bobot terhingga)
    car_weight = calculate_edge_weight(edge_data, vehicle_type=VehicleType.CAR)
    assert car_weight < float("inf")


def test_closed_road_restriction():
    """
    Menguji ruas jalan yang ditutup akibat banjir/insiden (is_closed = True).
    """
    edge_data = {
        "distance_meters": 500.0,
        "base_speed_kmh": 40.0,
        "is_closed": True
    }
    weight = calculate_edge_weight(edge_data)
    assert weight == float("inf")


def test_astar_and_dijkstra_optimality(test_graph: nx.DiGraph):
    """
    Menguji bahwa A* dan Dijkstra menghasilkan durasi rute yang konsisten dan optimal (PRD 18.1).
    """
    start_node = "monas"
    target_node = "blok_m"

    astar_res = astar_search(
        test_graph,
        start_node=start_node,
        target_node=target_node,
        vehicle_type=VehicleType.MOTORCYCLE,
        preference=RoutePreference.FASTEST
    )
    dijkstra_res = dijkstra_search(
        test_graph,
        start_node=start_node,
        target_node=target_node,
        vehicle_type=VehicleType.MOTORCYCLE,
        preference=RoutePreference.FASTEST
    )

    assert astar_res is not None
    assert dijkstra_res is not None
    assert len(astar_res["path_nodes"]) > 0
    assert astar_res["path_nodes"][0] == start_node
    assert astar_res["path_nodes"][-1] == target_node

    # Durasi rute optimal A* dan Dijkstra harus konsisten
    assert abs(astar_res["total_duration_seconds"] - dijkstra_res["total_duration_seconds"]) < 1.0

    # A* mengeksplorasi node lebih sedikit atau sama dengan Dijkstra berkat heuristik
    assert astar_res["explored_nodes_count"] <= dijkstra_res["explored_nodes_count"]


def test_alternative_routes_generation(test_graph: nx.DiGraph):
    """
    Menguji bahwa alternatif rute yang dihasilkan bermakna dan berbeda dari rute utama (PRD 9.6).
    """
    start_node = "monas"
    target_node = "blok_m"

    primary = astar_search(test_graph, start_node, target_node)
    assert primary is not None

    alternatives = generate_alternative_routes(
        test_graph,
        start_node=start_node,
        target_node=target_node,
        primary_route=primary,
        max_alternatives=2
    )

    assert len(alternatives) > 0
    for alt in alternatives:
        assert alt["path_nodes"] != primary["path_nodes"]
        assert alt["path_nodes"][-1] == target_node


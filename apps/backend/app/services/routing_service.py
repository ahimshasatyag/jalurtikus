import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.algorithms.astar import astar_search
from app.algorithms.dijkstra import dijkstra_search
from app.algorithms.alternative_routes import generate_alternative_routes
from app.algorithms.graph.graph_loader import get_active_graph, get_active_nodes
from app.utils.geo import find_nearest_node, haversine_distance
from app.database.repositories.route_repository import route_repository
from app.integrations.osm.osm_geometry_client import fetch_osm_road_geometry
from app.schemas.route import (
    RouteSearchRequest, RouteSearchData, RouteOption,
    RouteSegment, RouteGeometry, VehicleType, RoutePreference
)
from app.schemas.traffic import TrafficCondition


class RoutingService:
    def search_routes(self, request: RouteSearchRequest) -> RouteSearchData:
        # Sinkronkan data trafik real-time ke graf jalan sebelum kalkulasi rute
        from app.services.traffic_service import traffic_service
        traffic_service._sync_to_graph()

        graph = get_active_graph()
        nodes = get_active_nodes()

        # 1. Cari node terdekat untuk titik asal dan tujuan
        start_node = find_nearest_node(request.origin.latitude, request.origin.longitude, nodes)
        target_node = find_nearest_node(request.destination.latitude, request.destination.longitude, nodes)

        if not start_node or not target_node:
            raise ValueError("Tidak dapat menemukan titik jalan terdekat di area layanan.")

        if start_node == target_node:
            # Asal dan tujuan pada node yang sama
            now_iso = datetime.now(timezone.utc).isoformat()
            route_id = f"route_{uuid.uuid4().hex[:8]}"
            geom = RouteGeometry(coordinates=[
                [request.origin.longitude, request.origin.latitude],
                [request.destination.longitude, request.destination.latitude]
            ])
            rec_route = RouteOption(
                route_id=route_id,
                algorithm="A_STAR",
                name="Tiba di Lokasi",
                distance_meters=haversine_distance(
                    request.origin.latitude, request.origin.longitude,
                    request.destination.latitude, request.destination.longitude
                ),
                duration_seconds=30.0,
                traffic_level=TrafficCondition.FREE_FLOW.value,
                traffic_updated_at=now_iso,
                is_toll_free=True,
                geometry=geom,
                segments=[]
            )
            return RouteSearchData(recommended_route=rec_route, alternatives=[])

        # 2. Hitung Rute Rekomendasi Utama menggunakan A*
        astar_res = astar_search(
            graph,
            start_node=start_node,
            target_node=target_node,
            vehicle_type=request.vehicle_type,
            preference=request.route_preference,
            avoid_tolls=request.avoid_tolls,
            avoid_congestion=request.avoid_congestion
        )

        if not astar_res:
            raise ValueError("Tidak ditemukan jalur yang valid antara lokasi asal dan tujuan.")

        # 3. Hitung Rute Pembanding menggunakan Dijkstra (PRD 9.4)
        dijkstra_res = dijkstra_search(
            graph,
            start_node=start_node,
            target_node=target_node,
            vehicle_type=request.vehicle_type,
            preference=request.route_preference,
            avoid_tolls=request.avoid_tolls,
            avoid_congestion=request.avoid_congestion
        )

        # 4. Format Rute Rekomendasi
        route_name = (
            "Rute Jalur Tikus (Hindari Macet)"
            if (request.avoid_congestion or request.route_preference == RoutePreference.AVOID_CONGESTION)
            else "Rute Cepat (Jalan Utama)"
        )
        rec_route = self._format_route_option(
            route_raw=astar_res,
            name=route_name,
            origin_coords=[request.origin.longitude, request.origin.latitude],
            dest_coords=[request.destination.longitude, request.destination.latitude],
            is_primary=True
        )

        # 5. Cari Alternatif Rute
        alternatives: List[RouteOption] = []
        if request.alternatives > 0:
            raw_alts = generate_alternative_routes(
                graph,
                start_node=start_node,
                target_node=target_node,
                primary_route=astar_res,
                max_alternatives=request.alternatives,
                vehicle_type=request.vehicle_type,
                preference=request.route_preference,
                avoid_tolls=request.avoid_tolls,
                avoid_congestion=request.avoid_congestion
            )
            primary_nodes = astar_res.get("path_nodes", [])
            for i, raw_alt in enumerate(raw_alts):
                alt_name = f"Alternatif {i + 1}"
                alt_route = self._format_route_option(
                    route_raw=raw_alt,
                    name=alt_name,
                    origin_coords=[request.origin.longitude, request.origin.latitude],
                    dest_coords=[request.destination.longitude, request.destination.latitude],
                    is_primary=False,
                    primary_nodes=primary_nodes
                )
                alternatives.append(alt_route)

        # 6. Simpan rute ke repository
        route_repository.save_route(rec_route.route_id, rec_route.model_dump())
        for alt in alternatives:
            route_repository.save_route(alt.route_id, alt.model_dump())

        # 7. Informasi evaluasi algoritma (PRD 4.3 & 12.3)
        comparison_stats = {
            "astar": {
                "explored_nodes": astar_res.get("explored_nodes_count", 0),
                "execution_time_ms": round(astar_res.get("execution_time_ms", 0.0), 2),
                "duration_seconds": round(astar_res.get("total_duration_seconds", 0.0), 1),
            },
            "dijkstra": {
                "explored_nodes": dijkstra_res.get("explored_nodes_count", 0) if dijkstra_res else 0,
                "execution_time_ms": round(dijkstra_res.get("execution_time_ms", 0.0), 2) if dijkstra_res else 0,
                "duration_seconds": round(dijkstra_res.get("total_duration_seconds", 0.0), 1) if dijkstra_res else 0,
            }
        }

        return RouteSearchData(
            recommended_route=rec_route,
            alternatives=alternatives,
            comparison=comparison_stats
        )

    def get_route_by_id(self, route_id: str) -> Optional[RouteOption]:
        data = route_repository.get_route(route_id)
        if data:
            return RouteOption(**data)
        return None

    def _format_route_option(
        self,
        route_raw: Dict[str, Any],
        name: str,
        origin_coords: List[float],
        dest_coords: List[float],
        is_primary: bool = False,
        primary_nodes: Optional[List[str]] = None
    ) -> RouteOption:
        route_id = f"route_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        coordinates: List[List[float]] = [origin_coords]
        segments: List[RouteSegment] = []
        is_toll_free = True
        worst_traffic = TrafficCondition.FREE_FLOW.value

        for edge in route_raw.get("path_edges", []):
            if edge.get("is_toll", False):
                is_toll_free = False

            cond = edge.get("traffic_condition", TrafficCondition.FREE_FLOW)
            cond_val = cond.value if hasattr(cond, "value") else str(cond)

            # Prioritas tingkat keparahan trafik
            severity_order = ["free_flow", "light", "moderate", "heavy", "severe"]
            if cond_val in severity_order and worst_traffic in severity_order:
                if severity_order.index(cond_val) > severity_order.index(worst_traffic):
                    worst_traffic = cond_val

            edge_geom = edge.get("geometry", {}).get("coordinates", [])
            for pt in edge_geom:
                if not coordinates or coordinates[-1] != pt:
                    coordinates.append(pt)

            segments.append(
                RouteSegment(
                    edge_id=edge.get("edge_id", ""),
                    street_name=edge.get("street_name", "Ruas Jalan"),
                    distance_meters=float(edge.get("distance_meters", 0.0)),
                    duration_seconds=float(edge.get("distance_meters", 0.0)) / (float(edge.get("base_speed_kmh", 40.0)) * 1000.0 / 3600.0),
                    speed_kmh=float(edge.get("base_speed_kmh", 40.0)),
                    traffic_level=cond_val,
                    is_toll=edge.get("is_toll", False),
                    geometry=RouteGeometry(coordinates=edge_geom if edge_geom else [[0, 0], [0, 0]])
                )
            )

        if not coordinates or coordinates[-1] != dest_coords:
            coordinates.append(dest_coords)

        # Siapkan titik query koridor untuk OSRM:
        # Untuk rute rekomendasi: gunakan [origin, destination] langsung agar OSRM mengikuti aspal koridor utama secara presisi
        # Untuk rute alternatif: sertakan anchor_node pembeda agar OSRM mengikuti aspal koridor alternatif secara presisi
        path_nodes = route_raw.get("path_nodes", [])
        osm_query_points = [origin_coords]
        if not is_primary and path_nodes:
            nodes_dict = get_active_nodes()
            diff_nodes = [n for n in path_nodes if n not in (primary_nodes or []) and n in nodes_dict]
            chosen_node = diff_nodes[len(diff_nodes) // 2] if diff_nodes else (path_nodes[len(path_nodes) // 2] if len(path_nodes) > 2 else None)
            if chosen_node and chosen_node in nodes_dict:
                osm_query_points.append([nodes_dict[chosen_node]["lon"], nodes_dict[chosen_node]["lat"]])
        osm_query_points.append(dest_coords)

        osm_geom = fetch_osm_road_geometry(osm_query_points)
        final_coords = osm_geom if (osm_geom and len(osm_geom) > 1) else coordinates

        return RouteOption(
            route_id=route_id,
            algorithm=route_raw.get("algorithm", "A_STAR"),
            name=name,
            distance_meters=round(route_raw.get("total_distance_meters", 0.0), 1),
            duration_seconds=round(route_raw.get("total_duration_seconds", 0.0), 1),
            traffic_level=worst_traffic,
            traffic_updated_at=now_iso,
            is_toll_free=is_toll_free,
            geometry=RouteGeometry(coordinates=final_coords),
            segments=segments,
            nodes=route_raw.get("path_nodes", [])
        )


routing_service = RoutingService()


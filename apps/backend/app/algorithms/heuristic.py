from typing import Dict, Any
from app.utils.geo import haversine_distance
from app.schemas.route import RoutePreference


def admissible_haversine_heuristic(
    u: str,
    target: str,
    nodes: Dict[str, Any],
    max_speed_kmh: float = 80.0,
    preference: RoutePreference = RoutePreference.FASTEST
) -> float:
    """
    Menghitung estimasi biaya heuristik h(n) dari node u ke node target.
    Sesuai PRD Bab 9.3:
    Heuristik harus admissible (tidak pernah over-estimate biaya optimal sebenarnya).
    - Jika 'fastest': jarak garis lurus dibagi kecepatan maksimum yang mungkin (misal 80 km/jam).
    - Jika 'shortest': jarak garis lurus dalam meter.
    """
    if u == target:
        return 0.0

    u_node = nodes.get(u)
    target_node = nodes.get(target)

    if not u_node or not target_node:
        return 0.0

    dist_meters = haversine_distance(
        u_node["lat"], u_node["lon"],
        target_node["lat"], target_node["lon"]
    )

    if preference == RoutePreference.SHORTEST:
        return dist_meters

    # Konversi max_speed_kmh ke m/s
    max_speed_ms = max_speed_kmh * (1000.0 / 3600.0)
    return dist_meters / max_speed_ms


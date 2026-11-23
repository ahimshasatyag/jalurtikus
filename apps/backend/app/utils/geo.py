import math
from typing import List, Tuple, Dict, Any, Optional

# Radius bumi dalam meter
EARTH_RADIUS_METERS = 6371000.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Menghitung jarak lingkaran besar antara dua titik geografis dalam meter menggunakan formula Haversine.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c


def find_nearest_node(lat: float, lon: float, nodes: Dict[str, Any]) -> Optional[str]:
    """
    Mencari ID node terdekat dari koordinat yang diberikan.
    nodes dict diharapkan berformat: { node_id: {"lat": float, "lon": float, ...} }
    """
    if not nodes:
        return None

    nearest_node_id = None
    min_dist = float("inf")

    for node_id, data in nodes.items():
        dist = haversine_distance(lat, lon, data["lat"], data["lon"])
        if dist < min_dist:
            min_dist = dist
            nearest_node_id = node_id

    return nearest_node_id


def is_within_jakarta_bounds(lat: float, lon: float) -> bool:
    """
    Validasi batas geografis wilayah MVP Jakarta (-6.4 s.d. -6.0 Lat, 106.6 s.d. 107.0 Lon)
    """
    return -6.45 <= lat <= -6.00 and 106.60 <= lon <= 107.05


def point_to_segment_distance(
    px: float, py: float,
    x1: float, y1: float,
    x2: float, y2: float
) -> float:
    """
    Menghitung jarak perkiraan terpendek dari titik (px, py) ke segmen garis (x1, y1) -> (x2, y2) dalam meter.
    px, py, x1, y1, x2, y2 adalah koordinat lat/lon.
    """
    # Proyeksi sederhana lokal
    dx = x2 - x1
    dy = y2 - y1

    if dx == 0 and dy == 0:
        return haversine_distance(px, py, x1, y1)

    t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))

    proj_x = x1 + t * dx
    proj_y = y1 + t * dy

    return haversine_distance(px, py, proj_x, proj_y)


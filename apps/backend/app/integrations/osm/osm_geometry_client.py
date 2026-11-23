import urllib.request
import json
import ssl
from typing import List, Optional

# LRU / In-memory cache untuk geometri jalan OSM
_GEOMETRY_CACHE = {}


def fetch_osm_road_geometry(via_points: List[List[float]], timeout: float = 4.0) -> Optional[List[List[float]]]:
    """
    Mengambil detail polyline geometri jalan dari OpenStreetMap (OSRM)
    agar garis rute di MapLibre persis mengikuti aspal dan kelokan jalan raya.
    
    via_points: List of [lon, lat]
    """
    if not via_points or len(via_points) < 2:
        return None

    # Batasi maksimal 15 titik perantara untuk OSRM query
    sample_points = via_points
    if len(via_points) > 15:
        step = max(1, len(via_points) // 12)
        sample_points = [via_points[0]] + via_points[1:-1:step] + [via_points[-1]]

    # Cek cache
    cache_key = ";".join([f"{p[0]:.5f},{p[1]:.5f}" for p in sample_points])
    if cache_key in _GEOMETRY_CACHE:
        return _GEOMETRY_CACHE[cache_key]

    coords_str = ";".join([f"{p[0]},{p[1]}" for p in sample_points])
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"

    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(url, headers={"User-Agent": "JalurTikus-App/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    geometry = data["routes"][0]["geometry"]["coordinates"]
                    if geometry and len(geometry) > 1:
                        _GEOMETRY_CACHE[cache_key] = geometry
                        return geometry
    except Exception:
        # Fallback graceful jika offline / timeout
        pass

    return None


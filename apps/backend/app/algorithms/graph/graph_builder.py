import networkx as nx
from typing import Dict, Any, List, Optional
from app.utils.geo import haversine_distance
from app.schemas.traffic import TrafficCondition

# Dataset Node Wilayah Jakarta (Koridor Utama MVP + Koridor Utara Pluit)
JAKARTA_MVP_NODES: Dict[str, Dict[str, Any]] = {
    # Koridor Pusat - Selatan
    "monas": {"name": "Monumen Nasional", "lat": -6.175392, "lon": 106.827153},
    "gambir": {"name": "Stasiun Gambir", "lat": -6.176778, "lon": 106.830639},
    "thamrin_sarinah": {"name": "Thamrin Sarinah", "lat": -6.187441, "lon": 106.824219},
    "kebon_sirih": {"name": "Kebon Sirih", "lat": -6.183421, "lon": 106.828500},
    "bundaran_hi": {"name": "Bundaran Hotel Indonesia", "lat": -6.195027, "lon": 106.823028},
    "dukuh_atas": {"name": "Dukuh Atas Sudirman", "lat": -6.201452, "lon": 106.822765},
    "karet_sudirman": {"name": "Karet Sudirman", "lat": -6.211241, "lon": 106.820295},
    "semanggi": {"name": "Simpang Susun Semanggi", "lat": -6.219827, "lon": 106.815250},
    "senayan_gbk": {"name": "Gelora Bung Karno Senayan", "lat": -6.218520, "lon": 106.802140},
    "scbd": {"name": "SCBD Sudirman", "lat": -6.225912, "lon": 106.810528},
    "blok_m": {"name": "Terminal Blok M", "lat": -6.244383, "lon": 106.798132},
    "kuningan_rasuna": {"name": "Rasuna Said Kuningan", "lat": -6.223847, "lon": 106.830811},
    "casablanca": {"name": "Casablanca Kuningan", "lat": -6.223912, "lon": 106.840210},
    "gatot_subroto_timur": {"name": "Gatot Subroto Kuningan", "lat": -6.235912, "lon": 106.832100},
    "mampang_prapatan": {"name": "Mampang Prapatan", "lat": -6.251291, "lon": 106.826500},
    "pancoran": {"name": "Tugu Pancoran", "lat": -6.243512, "lon": 106.847192},
    "manggarai": {"name": "Stasiun Manggarai", "lat": -6.209871, "lon": 106.849920},
    "tanah_abang": {"name": "Pasar Tanah Abang", "lat": -6.186520, "lon": 106.814210},
    "tomang": {"name": "Simpang Tomang", "lat": -6.177210, "lon": 106.792510},
    "slipi": {"name": "Slipi Palmerah", "lat": -6.200120, "lon": 106.798510},
    "jalur_tikus_karet": {"name": "Jalur Tikus Karet Pedurenan", "lat": -6.217500, "lon": 106.825200},
    "jalur_tikus_benhil": {"name": "Jalur Tikus Bendungan Hilir", "lat": -6.214000, "lon": 106.814000},

    # Koridor Utara (Akses Pluit & Jakarta Utara)
    "harmoni": {"name": "Simpang Harmoni", "lat": -6.163300, "lon": 106.819800},
    "kota_tua": {"name": "Stasiun Jakarta Kota", "lat": -6.137600, "lon": 106.814600},
    "grogol": {"name": "Simpang Grogol", "lat": -6.162000, "lon": 106.788500},
    "pluit": {"name": "Pluit Penjaringan", "lat": -6.115030, "lon": 106.787360},
    "pejagalan": {"name": "Pejagalan Penjaringan", "lat": -6.137200, "lon": 106.789200},
    "jalur_tikus_teluk_gong": {"name": "Jalur Tikus Teluk Gong", "lat": -6.147500, "lon": 106.783500},
    "jalur_tikus_senopati": {"name": "Jalur Tikus Senopati Melawai", "lat": -6.230000, "lon": 106.805000},
}

# Ruas Jalan & Konektivitas
# Format: (u, v, street_name, road_type, is_toll, is_oneway, base_speed_kmh, [optional_waypoints])
# waypoints berupa list of [lon, lat] yang mengikuti kontur jalan sebenarnya di peta
JAKARTA_MVP_EDGES = [
    # Koridor Thamrin - Sudirman (dengan kurva jalan nyata)
    ("monas", "thamrin_sarinah", "Jl. M.H. Thamrin (Utara)", "primary", False, False, 45.0, [
        [106.8245, -6.1785], [106.8242, -6.1825]
    ]),
    ("thamrin_sarinah", "bundaran_hi", "Jl. M.H. Thamrin", "primary", False, False, 40.0, [
        [106.8235, -6.1915]
    ]),
    ("bundaran_hi", "dukuh_atas", "Jl. Jend. Sudirman", "primary", False, False, 45.0, [
        [106.8228, -6.1985]
    ]),
    ("dukuh_atas", "karet_sudirman", "Jl. Jend. Sudirman", "primary", False, False, 45.0, [
        [106.8218, -6.2065]
    ]),
    ("karet_sudirman", "semanggi", "Jl. Jend. Sudirman", "primary", False, False, 40.0, [
        [106.8185, -6.2155]
    ]),
    ("semanggi", "scbd", "Jl. Jend. Sudirman", "primary", False, False, 45.0, [
        [106.8128, -6.2235]
    ]),
    ("scbd", "blok_m", "Jl. Sisingamangaraja", "primary", False, False, 40.0, [
        [106.8055, -6.2250], [106.8005, -6.2241], [106.8000, -6.2270], [106.7992, -6.2345], [106.7985, -6.2405]
    ]),

    # Koridor Timur (Kuningan - Rasuna Said - Mampang)
    ("monas", "gambir", "Jl. Medan Merdeka Timur", "primary", False, False, 35.0, [
        [106.8285, -6.1755], [106.8305, -6.1762]
    ]),
    ("gambir", "manggarai", "Jl. Teuku Umar - Manggarai", "secondary", False, False, 30.0, [
        [106.8335, -6.1855], [106.8415, -6.1985]
    ]),
    ("manggarai", "casablanca", "Jl. Dr. Saharjo", "secondary", False, False, 30.0, [
        [106.8485, -6.2155], [106.8445, -6.2215]
    ]),
    ("dukuh_atas", "kuningan_rasuna", "Jl. Galunggung - Rasuna", "secondary", False, False, 35.0, [
        [106.8255, -6.2055], [106.8295, -6.2125]
    ]),
    ("kuningan_rasuna", "casablanca", "Flyover Casablanca", "secondary", False, False, 40.0, [
        [106.8355, -6.2238]
    ]),
    ("kuningan_rasuna", "gatot_subroto_timur", "Jl. H.R. Rasuna Said", "primary", False, False, 40.0, [
        [106.8315, -6.2295]
    ]),
    ("gatot_subroto_timur", "mampang_prapatan", "Jl. Mampang Prapatan Raya", "primary", False, False, 35.0, [
        [106.8305, -6.2425]
    ]),
    ("mampang_prapatan", "blok_m", "Jl. Wolter Monginsidi", "secondary", False, False, 30.0, [
        [106.8185, -6.2485], [106.8085, -6.2465]
    ]),
    ("gatot_subroto_timur", "pancoran", "Jl. Gatot Subroto", "primary", False, False, 45.0, [
        [106.8395, -6.2395]
    ]),

    # Koridor Barat (Tanah Abang - Slipi - Senayan)
    ("thamrin_sarinah", "kebon_sirih", "Jl. Kebon Sirih", "secondary", False, False, 30.0, []),
    ("kebon_sirih", "gambir", "Jl. Ridwan Rais", "secondary", False, False, 30.0, []),
    ("thamrin_sarinah", "tanah_abang", "Jl. Wahid Hasyim", "secondary", False, True, 25.0, [
        [106.8185, -6.1870]
    ]),
    ("tanah_abang", "slipi", "Jl. Brigjen Katamso", "secondary", False, False, 30.0, [
        [106.8065, -6.1925], [106.8015, -6.1965]
    ]),
    ("tomang", "slipi", "Jl. S. Parman", "primary", False, False, 45.0, [
        [106.7940, -6.1835], [106.7955, -6.1895], [106.7970, -6.1950]
    ]),
    ("monas", "tomang", "Jl. Suryopranoto - Tomang", "primary", False, False, 40.0, [
        [106.8200, -6.1725], [106.8125, -6.1718], [106.8040, -6.1725], [106.7975, -6.1745]
    ]),
    ("slipi", "senayan_gbk", "Jl. Palmerah - Gerbang Pemuda", "secondary", False, False, 35.0, [
        [106.7975, -6.2085], [106.7995, -6.2125], [106.8010, -6.2155]
    ]),
    ("slipi", "semanggi", "Jl. Jend. Gatot Subroto", "primary", False, False, 50.0, [
        [106.8040, -6.2080], [106.8090, -6.2150]
    ]),
    ("senayan_gbk", "semanggi", "Jl. Gatot Subroto Barat", "primary", False, False, 45.0, [
        [106.8085, -6.2190]
    ]),
    ("senayan_gbk", "blok_m", "Jl. Hang Tuah - Kyai Maja", "secondary", False, False, 32.0, [
        [106.7990, -6.2210], [106.7975, -6.2255], [106.7960, -6.2320], [106.7965, -6.2380], [106.7978, -6.2430]
    ]),

    # Tol Dalam Kota (Mobil Only)
    ("tomang", "semanggi", "Tol Dalam Kota (Tomang-Semanggi)", "motorway", True, True, 75.0, [
        [106.7950, -6.1880], [106.7980, -6.1990], [106.8040, -6.2140]
    ]),
    ("semanggi", "pancoran", "Tol Dalam Kota (Semanggi-Pancoran)", "motorway", True, True, 75.0, [
        [106.8250, -6.2310], [106.8380, -6.2400]
    ]),
    ("pancoran", "semanggi", "Tol Dalam Kota (Pancoran-Semanggi)", "motorway", True, True, 75.0, [
        [106.8380, -6.2400], [106.8250, -6.2310]
    ]),
    ("semanggi", "tomang", "Tol Dalam Kota (Semanggi-Tomang)", "motorway", True, True, 75.0, [
        [106.8040, -6.2140], [106.7980, -6.1990], [106.7950, -6.1880]
    ]),

    # Jalur Tikus (Jalur Alternatif Motor/Mobil Kecil Pemukiman)
    ("dukuh_atas", "jalur_tikus_benhil", "Gg. Benhil Pejompongan", "residential", False, False, 20.0, [
        [106.8180, -6.2080]
    ]),
    ("jalur_tikus_benhil", "senayan_gbk", "Jl. Danau Toba - Senayan", "residential", False, False, 25.0, [
        [106.8080, -6.2150]
    ]),
    ("karet_sudirman", "jalur_tikus_karet", "Jl. Karet Pedurenan", "residential", False, False, 20.0, [
        [106.8220, -6.2140]
    ]),
    ("jalur_tikus_karet", "kuningan_rasuna", "Gg. Sambas Kuningan", "residential", False, False, 20.0, [
        [106.8280, -6.2190]
    ]),
    ("jalur_tikus_karet", "semanggi", "Jl. Garnisun", "residential", False, False, 25.0, [
        [106.8190, -6.2180]
    ]),
    ("tanah_abang", "jalur_tikus_benhil", "Jalur Tikus Karet Tengsin", "residential", False, False, 22.0, [
        [106.8160, -6.1980], [106.8150, -6.2060]
    ]),
    ("senayan_gbk", "jalur_tikus_senopati", "Jalur Tikus Senopati", "residential", False, False, 22.0, [
        [106.8050, -6.2250]
    ]),
    ("jalur_tikus_senopati", "blok_m", "Gg. Melawai - Blok M", "residential", False, False, 20.0, [
        [106.8040, -6.2380]
    ]),
    ("harmoni", "tanah_abang", "Jalur Tikus Petojo - Cideng", "residential", False, False, 25.0, [
        [106.8130, -6.1720], [106.8140, -6.1800]
    ]),

    # Koridor Utara (Konektivitas ke Harmoni, Kota Tua, Grogol, dan Pluit)
    ("monas", "harmoni", "Jl. Medan Merdeka Barat - Gajah Mada", "primary", False, False, 45.0, [
        [106.8228, -6.1725], [106.8210, -6.1685]
    ]),
    ("harmoni", "kota_tua", "Jl. Gajah Mada - Hayam Wuruk", "primary", False, False, 40.0, [
        [106.8185, -6.1550], [106.8155, -6.1450]
    ]),
    ("kota_tua", "pluit", "Jl. Jembatan Tiga - Pluit Raya", "primary", False, False, 40.0, [
        [106.8105, -6.1345], [106.8015, -6.1305], [106.7945, -6.1245]
    ]),
    ("tomang", "grogol", "Jl. S. Parman (Grogol)", "primary", False, False, 45.0, [
        [106.7925, -6.1720], [106.7895, -6.1665]
    ]),
    ("grogol", "pluit", "Jl. Prof. Dr. Latumenten - Pluit Selatan", "primary", False, False, 40.0, [
        [106.7905, -6.1510], [106.7915, -6.1410], [106.7925, -6.1305], [106.7920, -6.1220]
    ]),
    ("harmoni", "tomang", "Jl. Suryopranoto", "primary", False, False, 40.0, [
        [106.8125, -6.1718], [106.8040, -6.1725]
    ]),
    ("pejagalan", "pluit", "Jl. Pluit Selatan Raya", "primary", False, False, 40.0, [
        [106.7905, -6.1280], [106.7890, -6.1200]
    ]),
    ("pejagalan", "grogol", "Jl. Prof. Dr. Latumenten", "primary", False, False, 45.0, [
        [106.7915, -6.1380], [106.7925, -6.1410], [106.7925, -6.1460], [106.7920, -6.1510], [106.7910, -6.1565], [106.7895, -6.1605]
    ]),
    ("pejagalan", "kota_tua", "Jl. Bandengan Selatan", "secondary", False, False, 35.0, [
        [106.7980, -6.1360], [106.8060, -6.1365]
    ]),
    ("pejagalan", "jalur_tikus_teluk_gong", "Jalur Tikus Teluk Gong", "residential", False, False, 22.0, [
        [106.7880, -6.1374], [106.7850, -6.1385], [106.7840, -6.1420], [106.7835, -6.1460]
    ]),
    ("jalur_tikus_teluk_gong", "grogol", "Gg. Jelambar Baru", "residential", False, False, 22.0, [
        [106.7830, -6.1505], [106.7838, -6.1540], [106.7850, -6.1575], [106.7870, -6.1600]
    ]),
]


def _calculate_polyline_distance(coords: List[List[float]]) -> float:
    """Menghitung total jarak kumulatif dari daftar koordinat [lon, lat]"""
    total = 0.0
    for i in range(len(coords) - 1):
        total += haversine_distance(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0])
    return total


def build_road_graph(traffic_overrides: Dict[str, Any] = None) -> nx.DiGraph:
    """
    Membangun directed graph (nx.DiGraph) untuk jaringan jalan Jakarta MVP.
    Menghitung jarak otomatis menggunakan koordinat Haversine dan waypoints ruas jalan.
    """
    G = nx.DiGraph()

    # 1. Tambahkan node
    for node_id, data in JAKARTA_MVP_NODES.items():
        G.add_node(node_id, **data)

    # 2. Tambahkan edge
    for edge_def in JAKARTA_MVP_EDGES:
        u = edge_def[0]
        v = edge_def[1]
        street_name = edge_def[2]
        road_type = edge_def[3]
        is_toll = edge_def[4]
        is_oneway = edge_def[5]
        base_speed = edge_def[6]
        waypoints = edge_def[7] if len(edge_def) > 7 else []

        u_data = JAKARTA_MVP_NODES[u]
        v_data = JAKARTA_MVP_NODES[v]

        forward_coords = [[u_data["lon"], u_data["lat"]], *waypoints, [v_data["lon"], v_data["lat"]]]
        dist = _calculate_polyline_distance(forward_coords)
        edge_id = f"{u}_{v}"

        # Cek kondisi trafik spesifik jika ada override
        condition = TrafficCondition.FREE_FLOW
        is_closed = False
        if traffic_overrides and edge_id in traffic_overrides:
            override = traffic_overrides[edge_id]
            condition = override.get("condition", TrafficCondition.FREE_FLOW)
            is_closed = override.get("is_closed", False)

        edge_attrs = {
            "edge_id": edge_id,
            "street_name": street_name,
            "road_type": road_type,
            "is_toll": is_toll,
            "is_oneway": is_oneway,
            "is_closed": is_closed,
            "distance_meters": dist,
            "base_speed_kmh": base_speed,
            "traffic_condition": condition,
            "geometry": {
                "type": "LineString",
                "coordinates": forward_coords
            }
        }

        # Arah maju (u -> v)
        G.add_edge(u, v, **edge_attrs)

        # Jika bukan satu arah, tambahkan arah sebaliknya (v -> u)
        if not is_oneway:
            reverse_edge_id = f"{v}_{u}"
            rev_condition = condition
            rev_closed = is_closed
            if traffic_overrides and reverse_edge_id in traffic_overrides:
                override = traffic_overrides[reverse_edge_id]
                rev_condition = override.get("condition", TrafficCondition.FREE_FLOW)
                rev_closed = override.get("is_closed", False)

            reverse_coords = [[v_data["lon"], v_data["lat"]], *list(reversed(waypoints)), [u_data["lon"], u_data["lat"]]]
            rev_attrs = dict(edge_attrs)
            rev_attrs["edge_id"] = reverse_edge_id
            rev_attrs["traffic_condition"] = rev_condition
            rev_attrs["is_closed"] = rev_closed
            rev_attrs["geometry"] = {
                "type": "LineString",
                "coordinates": reverse_coords
            }
            G.add_edge(v, u, **rev_attrs)

    return G

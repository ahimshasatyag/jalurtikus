from typing import Dict, Any, Optional
from app.schemas.route import VehicleType, RoutePreference
from app.schemas.traffic import TrafficCondition

# Kecepatan default berdasarkan jenis jalan (km/jam)
DEFAULT_SPEEDS_KMH = {
    "motorway": 70.0,       # Jalan Tol
    "trunk": 50.0,
    "primary": 40.0,        # Jalan Arteri Primer (e.g., Sudirman, Thamrin, Gatot Subroto)
    "secondary": 30.0,      # Jalan Sekunder (e.g., Rasuna Said, Casablanca)
    "tertiary": 25.0,
    "residential": 20.0,    # Jalan Lingkungan / Jalur Pemukiman
    "service": 15.0,
}

# Multiplier kecepatan berdasarkan kondisi trafik
TRAFFIC_SPEED_MULTIPLIER = {
    TrafficCondition.FREE_FLOW: 1.0,
    TrafficCondition.LIGHT: 0.85,
    TrafficCondition.MODERATE: 0.60,
    TrafficCondition.HEAVY: 0.35,
    TrafficCondition.SEVERE: 0.15,
    TrafficCondition.UNKNOWN: 1.0,
}


def calculate_edge_weight(
    edge_data: Dict[str, Any],
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE,
    preference: RoutePreference = RoutePreference.FASTEST,
    avoid_tolls: bool = False,
    avoid_congestion: bool = True,
    penalty_multiplier: float = 1.0
) -> float:
    """
    Menghitung bobot (cost) suatu edge berdasarkan PRD Bab 9:
    - Formula durasi: T_e = D_e / (V_e * 1000/3600)
    - Pembatasan kendaraan: Motor dilarang lewat tol.
    - Pembatasan penutupan jalan / insiden berat.
    - Preferensi fastest, shortest, avoid_tolls, avoid_congestion.
    """
    # 1. Cek status penutupan jalan
    if edge_data.get("is_closed", False):
        return float("inf")

    # 2. Cek izin kendaraan & jalan tol
    is_toll = edge_data.get("is_toll", False)
    if is_toll:
        if vehicle_type == VehicleType.MOTORCYCLE or avoid_tolls:
            return float("inf")

    # 3. Akses kendaraan
    allowed_vehicles = edge_data.get("allowed_vehicles")
    if allowed_vehicles and vehicle_type.value not in allowed_vehicles:
        return float("inf")

    distance_meters = float(edge_data.get("distance_meters", 100.0))
    if distance_meters <= 0:
        distance_meters = 1.0

    # Jika preferensi SHORTEST murni, gunakan jarak meter
    if preference == RoutePreference.SHORTEST:
        return distance_meters * penalty_multiplier

    # 4. Hitung Kecepatan Efektif (V_e)
    road_type = edge_data.get("road_type", "primary")
    base_speed = float(edge_data.get("base_speed_kmh", DEFAULT_SPEEDS_KMH.get(road_type, 30.0)))

    # Ambil kondisi trafik jika ada
    traffic_condition = edge_data.get("traffic_condition", TrafficCondition.FREE_FLOW)
    if isinstance(traffic_condition, str):
        try:
            traffic_condition = TrafficCondition(traffic_condition)
        except ValueError:
            traffic_condition = TrafficCondition.FREE_FLOW

    multiplier = TRAFFIC_SPEED_MULTIPLIER.get(traffic_condition, 1.0)
    effective_speed_kmh = max(3.0, base_speed * multiplier)

    # 5. Hitung Durasi Waktu Tempuh dalam detik (T_e)
    speed_ms = effective_speed_kmh * (1000.0 / 3600.0)
    duration_seconds = distance_meters / speed_ms

    # 6. Penalti Tambahan untuk Congestion jika diaktifkan
    congestion_penalty = 1.0
    if avoid_congestion:
        if traffic_condition == TrafficCondition.HEAVY:
            congestion_penalty = 1.5
        elif traffic_condition == TrafficCondition.SEVERE:
            congestion_penalty = 2.5

    total_weight = duration_seconds * congestion_penalty * penalty_multiplier
    return total_weight


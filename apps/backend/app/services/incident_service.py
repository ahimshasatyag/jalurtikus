import uuid
import json
import ssl
import time
import logging
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.database.repositories.incident_repository import incident_repository
from app.schemas.incident import IncidentResponse, IncidentCategory, UserReportCreate
from app.core.config import settings

logger = logging.getLogger(__name__)
_SSL_CONTEXT = ssl._create_unverified_context()

# Pemetaan resmi iconCategory TomTom v5 ke schema kategori JalurTikus
TOMTOM_ICON_CATEGORY_MAP: Dict[int, tuple[IncidentCategory, str]] = {
    0: (IncidentCategory.OTHER, "Peringatan Lalu Lintas"),
    1: (IncidentCategory.ACCIDENT, "Kecelakaan Lalu Lintas"),
    2: (IncidentCategory.OTHER, "Jarak Pandang Terbatas / Kabut"),
    3: (IncidentCategory.OTHER, "Kondisi Jalan Berbahaya"),
    4: (IncidentCategory.FLOOD, "Hujan Lebat / Genangan"),
    5: (IncidentCategory.OTHER, "Permukaan Jalan Licin"),
    6: (IncidentCategory.CONGESTION, "Kemacetan Lalu Lintas (Padat Merayap)"),
    7: (IncidentCategory.ROAD_CLOSED, "Penyempitan / Penutupan Sebagian Lajur"),
    8: (IncidentCategory.ROAD_CLOSED, "Penutupan Jalan Total"),
    9: (IncidentCategory.ROAD_WORK, "Pekerjaan Perbaikan Jalan"),
    10: (IncidentCategory.OTHER, "Kondisi Cuaca Ekstrem / Angin"),
    11: (IncidentCategory.FLOOD, "Banjir / Luapan Air"),
    14: (IncidentCategory.ROAD_DAMAGE, "Kendaraan Rusak / Mogok di Jalan"),
}

# Cache in-memory untuk respons TomTom per bbox
_TOMTOM_INCIDENTS_CACHE: Dict[str, tuple[float, List[IncidentResponse]]] = {}


class IncidentService:
    """
    Layanan Insiden Lalu Lintas Real-Time JalurTikus.
    Terintegrasi langsung dengan TomTom Traffic Incident Details API v5
    menggunakan parameter resmi sesuai spesifikasi curl pengguna.
    """

    def __init__(self):
        self.last_api_status: Optional[str] = None
        self.last_error: Optional[str] = None

    def get_all_incidents(
        self,
        bbox: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> List[IncidentResponse]:
        # 1. Ambil insiden tersimpan dari repository database
        raw_list = incident_repository.get_active_incidents()
        incidents = [IncidentResponse(**item) for item in raw_list]

        # 2. Tentukan API key aktif (dari query param, TRAFFIC_API_KEY, atau TOMTOM_API_KEY)
        active_key = (api_key or settings.TRAFFIC_API_KEY or settings.TOMTOM_API_KEY or "").strip()
        active_bbox = (bbox or settings.TOMTOM_DEFAULT_BBOX).strip()

        # 3. Tarik feed kejadian real-time dari TomTom API jika key tersedia
        if active_key:
            live_tomtom_incidents = self._fetch_tomtom_incidents(active_bbox, active_key)
            incidents.extend(live_tomtom_incidents)
        else:
            self.last_api_status = "unconfigured"
            self.last_error = "TomTom API Key belum diisi di .env (TRAFFIC_API_KEY) atau di query param."

        return incidents

    def create_report(self, report: UserReportCreate) -> IncidentResponse:
        incident_id = f"inc_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()

        data = {
            "incident_id": incident_id,
            "category": report.category.value,
            "description": report.description,
            "location": report.location.model_dump(),
            "street_name": report.street_name or "Ruas Jalan Jakarta",
            "severity": "medium",
            "is_verified": False,
            "reported_at": now
        }
        incident_repository.save(incident_id, data)
        return IncidentResponse(**data)

    def _fetch_tomtom_incidents(self, bbox: str, api_key: str) -> List[IncidentResponse]:
        """
        Mengambil semua kejadian/insiden real-time dari TomTom API v5:
        Format URL sesuai permintaan pengguna:
        https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=...&fields=%7Bincidents%7Btype%2Cgeometry%7Btype%2Ccoordinates%7D%2Cproperties%7BiconCategory%7D%7D%7D&language=en-GB&categoryFilter=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C14&timeValidityFilter=present&key=...
        """
        cache_key = f"{bbox}_{api_key}"
        now_ts = time.time()

        # Gunakan cache jika masih dalam batas TTL (60 detik)
        if cache_key in _TOMTOM_INCIDENTS_CACHE:
            cached_time, cached_data = _TOMTOM_INCIDENTS_CACHE[cache_key]
            if (now_ts - cached_time) < settings.TRAFFIC_CACHE_TTL_SECONDS:
                return cached_data

        params = {
            "bbox": bbox,
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory}}}",
            "language": "en-GB",
            "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11,14",
            "timeValidityFilter": "present",
            "key": api_key,
        }

        query_str = urllib.parse.urlencode(params)
        url = f"https://api.tomtom.com/traffic/services/5/incidentDetails?{query_str}"
        req = urllib.request.Request(
            url,
            headers={
                "accept": "*/*",
                "User-Agent": "JalurTikus-App/1.0"
            }
        )

        results: List[IncidentResponse] = []

        try:
            with urllib.request.urlopen(req, context=_SSL_CONTEXT, timeout=8.0) as response:
                if response.status == 200:
                    raw_body = response.read().decode("utf-8")
                    data = json.loads(raw_body)
                    raw_incidents = data.get("incidents", [])

                    for idx, inc in enumerate(raw_incidents):
                        parsed = self._parse_tomtom_incident(inc, idx)
                        if parsed:
                            results.append(parsed)

                    self.last_api_status = "connected"
                    self.last_error = None
                    # Simpan ke cache
                    _TOMTOM_INCIDENTS_CACHE[cache_key] = (now_ts, results)
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            self.last_api_status = f"http_error_{he.code}"
            self.last_error = f"TomTom API HTTP {he.code}: {err_body}"
            logger.error(self.last_error)
        except Exception as e:
            self.last_api_status = "error"
            self.last_error = f"TomTom Connection Error: {str(e)}"
            logger.error(self.last_error)

        return results

    def _parse_tomtom_incident(self, inc: Dict[str, Any], idx: int = 0) -> Optional[IncidentResponse]:
        """
        Mengurai objek insiden dari respons JSON TomTom v5 fields={incidents{type,geometry{type,coordinates},properties{iconCategory}}}.
        """
        try:
            props = inc.get("properties", {})
            geom = inc.get("geometry", {})
            raw_coords = geom.get("coordinates", [])

            # Ekstrak titik koordinat [lon, lat]
            lat: float = -6.2000
            lon: float = 106.8166

            if isinstance(raw_coords, list) and len(raw_coords) > 0:
                if isinstance(raw_coords[0], (int, float)) and len(raw_coords) >= 2:
                    # Point: [lon, lat]
                    lon = float(raw_coords[0])
                    lat = float(raw_coords[1])
                elif isinstance(raw_coords[0], list) and len(raw_coords[0]) > 0:
                    if isinstance(raw_coords[0][0], (int, float)):
                        # LineString: [[lon, lat], ...] -> ambil titik tengah jalur
                        mid_idx = len(raw_coords) // 2
                        lon = float(raw_coords[mid_idx][0])
                        lat = float(raw_coords[mid_idx][1])
                    elif isinstance(raw_coords[0][0], list):
                        # MultiLineString: [[[lon, lat], ...], ...]
                        lon = float(raw_coords[0][0][0])
                        lat = float(raw_coords[0][0][1])

            # Petakan iconCategory TomTom
            icon_cat = int(props.get("iconCategory", 0))
            category_enum, description = TOMTOM_ICON_CATEGORY_MAP.get(
                icon_cat, (IncidentCategory.OTHER, "Peringatan Lalu Lintas")
            )

            # Tentukan severity berdasarkan tipe insiden
            if icon_cat in (1, 8, 11):
                severity = "critical"
            elif icon_cat in (6, 7):
                severity = "high"
            else:
                severity = "medium"

            return IncidentResponse(
                incident_id=f"tomtom_{int(time.time())}_{idx}",
                category=category_enum,
                description=description,
                location={"latitude": lat, "longitude": lon},
                street_name="Ruas Jalan Terpantau",
                severity=severity,
                is_verified=True,
                reported_at=datetime.now(timezone.utc).isoformat()
            )
        except Exception as e:
            logger.debug(f"Error parsing incident: {e}")
            return None


incident_service = IncidentService()

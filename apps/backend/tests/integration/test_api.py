import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoints():
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "healthy"

    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["success"] is True


def test_auth_and_user_profile():
    # 1. Register user baru
    register_payload = {
        "email": "testdriver@jalurtikus.id",
        "password": "SecurePassword123!",
        "full_name": "Test Driver",
        "vehicle_type": "motorcycle"
    }
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 200
    user_data = reg_res.json()["data"]
    assert user_data["email"] == "testdriver@jalurtikus.id"

    # 2. Login untuk memperoleh token JWT riil
    login_payload = {
        "email": "testdriver@jalurtikus.id",
        "password": "SecurePassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    assert token is not None

    # 3. Akses profil /users/me dengan Authorization Bearer
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "testdriver@jalurtikus.id"

    # 4. Tanpa token harus ditolak 401 Unauthorized
    unauth_res = client.get("/api/v1/users/me")
    assert unauth_res.status_code == 401


def test_route_search_api():
    payload = {
        "origin": {
            "latitude": -6.175392,
            "longitude": 106.827153
        },
        "destination": {
            "latitude": -6.244383,
            "longitude": 106.798132
        },
        "vehicle_type": "motorcycle",
        "route_preference": "fastest",
        "avoid_tolls": True,
        "avoid_congestion": True,
        "alternatives": 2
    }
    res = client.post("/api/v1/routes/search", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True

    rec_route = body["data"]["recommended_route"]
    assert rec_route["route_id"] is not None
    assert rec_route["distance_meters"] > 0
    assert rec_route["duration_seconds"] > 0
    assert rec_route["geometry"]["type"] == "LineString"
    assert len(rec_route["geometry"]["coordinates"]) > 2

    # Cek alternatif rute
    alternatives = body["data"]["alternatives"]
    assert isinstance(alternatives, list)
    assert len(alternatives) >= 1

    # Cek data perbandingan algoritma (PRD 4.3)
    comparison = body["data"]["comparison"]
    assert "astar" in comparison
    assert "dijkstra" in comparison


def test_traffic_endpoints():
    res = client.get("/api/v1/traffic/current")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["is_fresh"] is True

    seg_res = client.get("/api/v1/traffic/segments/bundaran_hi_dukuh_atas")
    assert seg_res.status_code == 200
    assert seg_res.json()["data"]["condition"] == "free_flow"


def test_trip_lifecycle_with_real_auth():
    # Login terlebih dahulu
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testdriver@jalurtikus.id",
        "password": "SecurePassword123!"
    })
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Mulai perjalanan
    start_payload = {
        "route_id": "test_route_001",
        "origin": {"latitude": -6.175392, "longitude": 106.827153},
        "destination": {"latitude": -6.244383, "longitude": 106.798132},
        "vehicle_type": "motorcycle"
    }
    start_res = client.post("/api/v1/trips/start", json=start_payload, headers=headers)
    assert start_res.status_code == 200
    trip = start_res.json()["data"]
    trip_id = trip["trip_id"]
    assert trip["status"] == "active"

    # 2. Kirim update GPS
    gps_payload = {
        "trip_id": trip_id,
        "current_location": {"latitude": -6.195027, "longitude": 106.823028},
        "speed_kmh": 35.0
    }
    gps_res = client.post("/api/v1/gps/update", json=gps_payload)
    assert gps_res.status_code == 200
    assert gps_res.json()["data"]["trip_id"] == trip_id

    # 3. Selesaikan perjalanan
    comp_res = client.post(f"/api/v1/trips/{trip_id}/complete")
    assert comp_res.status_code == 200
    assert comp_res.json()["data"]["status"] == "completed"

    # 4. Riwayat perjalanan
    hist_res = client.get("/api/v1/trips/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) >= 1


def test_incidents_and_reports():
    # Kirim laporan kondisi jalan riil
    report_payload = {
        "category": "congestion",
        "description": "Antrean panjang di jalur lambat Rasuna Said",
        "location": {"latitude": -6.223847, "longitude": 106.830811},
        "street_name": "Jl. H.R. Rasuna Said"
    }
    rep_res = client.post("/api/v1/reports", json=report_payload)
    assert rep_res.status_code == 200
    assert rep_res.json()["data"]["category"] == "congestion"

    # Verifikasi laporan muncul di daftar insiden
    inc_res = client.get("/api/v1/incidents")
    assert inc_res.status_code == 200
    assert len(inc_res.json()["data"]) >= 1

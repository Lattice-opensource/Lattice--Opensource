"""Tests for REST API endpoints."""

from fastapi.testclient import TestClient


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "lattice-alert-engine"


def test_list_alerts_empty(client):
    r = client.get("/api/alerts")
    assert r.status_code == 200
    body = r.json()
    assert body["data"] == []
    assert body["meta"]["total"] == 0


def test_create_alert_normal_no_alert(client):
    r = client.post("/api/alerts", json={
        "building_id": "b1",
        "circuit_id": "c1",
        "consumption_kwh": 0.5,
        "history": [0.5, 0.5, 0.5],
        "previous_kwh": 0.5,
    })
    assert r.status_code == 201
    body = r.json()
    assert body["data"]["alert_generated"] is False
    assert body["data"]["detections"] == []
    assert body["data"]["alerts"] == []


def test_create_alert_high_consumption(client):
    r = client.post("/api/alerts", json={
        "building_id": "b1",
        "circuit_id": "c1",
        "consumption_kwh": 5.0,
        "history": [0.5, 0.5, 0.5],
        "previous_kwh": 0.5,
    })
    assert r.status_code == 201
    body = r.json()
    assert body["data"]["alert_generated"] is True
    assert len(body["data"]["alerts"]) >= 1


def test_get_alert_by_id(client):
    r = client.post("/api/alerts", json={
        "building_id": "b1",
        "circuit_id": "c1",
        "consumption_kwh": 5.0,
        "history": [0.5, 0.5, 0.5],
        "previous_kwh": 0.5,
    })
    aid = r.json()["data"]["alerts"][0]["id"]
    r2 = client.get(f"/api/alerts/{aid}")
    assert r2.status_code == 200
    assert r2.json()["data"]["id"] == aid


def test_get_alert_not_found(client):
    r = client.get("/api/alerts/does-not-exist")
    assert r.status_code == 404


def test_resolve_alert(client):
    r = client.post("/api/alerts", json={
        "building_id": "b1",
        "circuit_id": "c1",
        "consumption_kwh": 5.0,
        "history": [0.5, 0.5, 0.5],
        "previous_kwh": 0.5,
    })
    aid = r.json()["data"]["alerts"][0]["id"]
    r2 = client.patch(f"/api/alerts/{aid}/resolve")
    assert r2.status_code == 200
    assert r2.json()["data"]["resolution_status"] == "resolved"


def test_resolve_not_found(client):
    r = client.patch("/api/alerts/nope/resolve")
    assert r.status_code == 404


def test_invalid_request_negative_consumption(client):
    r = client.post("/api/alerts", json={
        "building_id": "b1",
        "circuit_id": "c1",
        "consumption_kwh": -1.0,
    })
    assert r.status_code == 422


def test_invalid_request_missing_fields(client):
    r = client.post("/api/alerts", json={"building_id": "b1"})
    assert r.status_code == 422


def test_filtering_and_pagination(client):
    # create a couple
    for _ in range(3):
        client.post("/api/alerts", json={
            "building_id": "b1",
            "circuit_id": "c1",
            "consumption_kwh": 5.0,
            "history": [0.5, 0.5, 0.5],
            "previous_kwh": 0.5,
        })
    r = client.get("/api/alerts?limit=2&offset=0")
    assert r.status_code == 200
    body = r.json()
    assert body["meta"]["limit"] == 2
    assert len(body["data"]) <= 2
    # filtering by severity
    r2 = client.get("/api/alerts?severity=High")
    assert r2.status_code == 200
    for a in r2.json()["data"]:
        assert a["severity"] == "High"
    # invalid severity
    r3 = client.get("/api/alerts?severity=BOGUS")
    assert r3.status_code == 400

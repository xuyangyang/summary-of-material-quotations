from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_groups_endpoint_returns_list():
    response = client.get("/api/batches/1/groups")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

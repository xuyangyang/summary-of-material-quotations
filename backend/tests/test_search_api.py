from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db import SessionLocal, init_db
from app.main import app
from app.models import ImportBatch, MaterialRecord


def _seed_records():
    init_db()
    session = SessionLocal()
    batch = ImportBatch(file_name="x", file_hash="x")
    session.add(batch)
    session.flush()
    session.add_all(
        [
            MaterialRecord(
                batch_id=batch.id,
                row_number=3,
                material_name="钢卡",
                raw_material="钢卡 DN100",
                spec="DN100",
                purchase_date="2026-09-09",
            ),
            MaterialRecord(
                batch_id=batch.id,
                row_number=4,
                material_name="DN80蓝色钢卡",
                raw_material="DN80蓝色钢卡",
                spec="DN80蓝色钢卡",
                purchase_date="2026-09-10",
            ),
            MaterialRecord(
                batch_id=batch.id,
                row_number=5,
                material_name="喷头",
                raw_material="快速响应喷头",
                spec="下喷15-68°C",
                purchase_date="2026-09-11",
            ),
        ]
    )
    session.commit()
    batch_id = batch.id
    session.close()
    return batch_id


def test_search_api_filters_by_material_name():
    batch_id = _seed_records()
    client = TestClient(app)
    response = client.get(
        f"/api/batches/{batch_id}/search",
        params={"material_name": "钢卡", "match_mode": "fuzzy"},
    )
    assert response.status_code == 200
    records = response.json()["records"]
    assert len(records) == 2
    assert {record["material_name"] for record in records} == {"钢卡", "DN80蓝色钢卡"}


def test_search_api_exact_mode_is_strict():
    batch_id = _seed_records()
    client = TestClient(app)
    response = client.get(
        f"/api/batches/{batch_id}/search",
        params={"material_name": "钢卡", "match_mode": "exact"},
    )
    assert response.status_code == 200
    records = response.json()["records"]
    assert len(records) == 1
    assert records[0]["material_name"] == "钢卡"


@patch("app.routers.search.ai_match_materials")
def test_search_api_ai_mode_delegates_and_degrades(mock_ai):
    batch_id = _seed_records()
    client = TestClient(app)

    mock_ai.return_value = [{"material_name": "钢卡", "score": 0.9}]
    response = client.get(
        f"/api/batches/{batch_id}/search",
        params={"material_name": "钢卡", "match_mode": "ai"},
    )
    assert response.status_code == 200
    assert response.json()["ai_matches"] == [{"material_name": "钢卡", "score": 0.9}]

    mock_ai.side_effect = RuntimeError("deepseek unavailable")
    response = client.get(
        f"/api/batches/{batch_id}/search",
        params={"material_name": "钢卡", "match_mode": "ai"},
    )
    assert response.status_code == 200
    assert response.json()["ai_matches"] == []

from fastapi.testclient import TestClient

from app.db import SessionLocal, init_db
from app.main import app
from app.models import (
    ImportBatch,
    MaterialGroup,
    MaterialRecord,
    SearchCache,
    SupplierPriceSummary,
)


def test_delete_batch_removes_related_rows():
    init_db()
    session = SessionLocal()
    batch = ImportBatch(file_name="x.xlsx", file_hash="x")
    session.add(batch)
    session.flush()
    group = MaterialGroup(
        batch_id=batch.id,
        group_no=1,
        material_name="钢卡",
        spec="DN100",
        spec_key="100",
        record_count=1,
        total_quantity=1,
        total_amount=10,
    )
    session.add(group)
    session.flush()
    session.add(
        MaterialRecord(
            batch_id=batch.id,
            row_number=3,
            group_id=group.id,
            material_name="钢卡",
            spec="DN100",
        )
    )
    session.add(
        SupplierPriceSummary(
            group_id=group.id,
            supplier="供应商A",
            record_count=1,
            min_price=10,
            max_price=10,
            avg_price=10,
            weighted_avg_price=10,
            latest_price=10,
        )
    )
    session.add(SearchCache(batch_id=batch.id, query_hash="x", result_json="[]"))
    session.commit()
    batch_id = batch.id
    group_id = group.id
    session.close()

    client = TestClient(app)
    response = client.delete(f"/api/batches/{batch_id}")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    session = SessionLocal()
    assert session.get(ImportBatch, batch_id) is None
    assert session.get(MaterialGroup, group_id) is None
    assert session.query(MaterialRecord).filter_by(batch_id=batch_id).count() == 0
    assert session.query(SearchCache).filter_by(batch_id=batch_id).count() == 0
    session.close()

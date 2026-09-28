from app.db import SessionLocal, init_db
from app.models import ImportBatch, MaterialRecord
from app.services.search import search_records


def test_search_filters_and_fuzzy(tmp_path):
    init_db()
    session = SessionLocal()
    batch = ImportBatch(file_name="x", file_hash="x")
    session.add(batch)
    session.flush()
    session.add(
        MaterialRecord(
            batch_id=batch.id,
            row_number=3,
            material_name="镀锌钢管",
            raw_material="镀锌钢管 DN25",
            spec_key="25",
            supplier="供应商A",
            project="项目A",
            purchase_date="2026-09-09",
        )
    )
    session.commit()

    rows = search_records(session, batch.id, {"project": "项目A", "supplier": "供应商A"}, "fuzzy")
    assert len(rows) == 1
    session.close()


def test_search_exact_mode_does_not_use_contains():
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
                material_name="镀锌钢管",
                raw_material="镀锌钢管 DN25",
                spec_key="25",
            ),
            MaterialRecord(
                batch_id=batch.id,
                row_number=4,
                material_name="热镀锌钢管",
                raw_material="热镀锌钢管 DN25",
                spec_key="25",
            ),
        ]
    )
    session.commit()

    fuzzy_rows = search_records(session, batch.id, {"material_name": "镀锌钢管"}, "fuzzy")
    exact_rows = search_records(session, batch.id, {"material_name": "镀锌钢管"}, "exact")

    assert len(fuzzy_rows) == 2
    assert len(exact_rows) == 1
    assert exact_rows[0].material_name == "镀锌钢管"
    session.close()


def test_search_filters_by_spec():
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
                spec="DN100",
                raw_spec="DN100",
            ),
            MaterialRecord(
                batch_id=batch.id,
                row_number=4,
                material_name="钢卡",
                spec="DN150",
                raw_spec="DN150",
            ),
        ]
    )
    session.commit()

    rows = search_records(session, batch.id, {"spec": "DN100"}, "fuzzy")
    assert len(rows) == 1
    assert rows[0].spec == "DN100"
    session.close()

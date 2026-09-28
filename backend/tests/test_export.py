from app.db import SessionLocal, init_db
from app.services.exporter import export_materials


def test_export_returns_bytes():
    init_db()
    data = export_materials(1, SessionLocal())
    assert data[:2] == b"PK"

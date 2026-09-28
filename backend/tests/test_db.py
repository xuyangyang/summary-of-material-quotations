from sqlalchemy import inspect

from app.db import engine, init_db
from app.models import ImportBatch, MaterialRecord


def test_tables_are_created():
    init_db()
    tables = inspect(engine).get_table_names()
    assert ImportBatch.__tablename__ in tables
    assert MaterialRecord.__tablename__ in tables

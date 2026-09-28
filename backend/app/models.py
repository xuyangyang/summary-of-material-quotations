from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ImportBatch(Base):
    __tablename__ = "import_batch"

    id: Mapped[int] = mapped_column(primary_key=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_hash: Mapped[str] = mapped_column(String(64), index=True)
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    source_rows: Mapped[int] = mapped_column(Integer, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0)
    unclassified_rows: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="done")


class MaterialRecord(Base):
    __tablename__ = "material_record"

    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("import_batch.id"), index=True)
    row_number: Mapped[int] = mapped_column(Integer)
    project: Mapped[str] = mapped_column(Text, default="")
    supplier: Mapped[str] = mapped_column(Text, default="")
    purchase_type: Mapped[str] = mapped_column(Text, default="")
    purchase_date: Mapped[str] = mapped_column(String(20), default="")
    raw_material: Mapped[str] = mapped_column(Text, default="")
    raw_spec: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(Text, default="")
    unit: Mapped[str] = mapped_column(String(50), default="")
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    material_name: Mapped[str] = mapped_column(Text, default="")
    spec: Mapped[str] = mapped_column(Text, default="")
    spec_key: Mapped[str] = mapped_column(Text, default="")
    group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    issue_reason: Mapped[str] = mapped_column(Text, default="")


class MaterialGroup(Base):
    __tablename__ = "material_group"

    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("import_batch.id"), index=True)
    group_no: Mapped[int] = mapped_column(Integer)
    material_name: Mapped[str] = mapped_column(Text)
    spec: Mapped[str] = mapped_column(Text)
    spec_key: Mapped[str] = mapped_column(Text)
    categories: Mapped[str] = mapped_column(Text, default="")
    units: Mapped[str] = mapped_column(Text, default="")
    record_count: Mapped[int] = mapped_column(Integer)
    total_quantity: Mapped[float] = mapped_column(Float)
    total_amount: Mapped[float] = mapped_column(Float)


class SupplierPriceSummary(Base):
    __tablename__ = "supplier_price_summary"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("material_group.id"), index=True)
    supplier: Mapped[str] = mapped_column(Text)
    record_count: Mapped[int] = mapped_column(Integer)
    min_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    weighted_avg_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    latest_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    latest_date: Mapped[str] = mapped_column(String(20), default="")


class SearchCache(Base):
    __tablename__ = "search_cache"

    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("import_batch.id"), index=True)
    query_hash: Mapped[str] = mapped_column(String(64), index=True)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

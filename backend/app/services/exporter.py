from io import BytesIO

from openpyxl import Workbook
from sqlalchemy.orm import Session

from app.models import MaterialGroup, MaterialRecord, SupplierPriceSummary


def _xlsx(rows, headers):
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(list(row))
    out = BytesIO()
    wb.save(out)
    return out.getvalue()


def export_materials(batch_id: int, session: Session) -> bytes:
    rows = session.query(MaterialGroup).filter_by(batch_id=batch_id).all()
    data = [(g.material_name, g.spec, g.record_count, g.total_quantity, g.total_amount) for g in rows]
    return _xlsx(data, ["标准材料名称", "标准规格", "记录数", "总采购量", "总金额"])


def export_prices(batch_id: int, session: Session) -> bytes:
    rows = session.query(MaterialRecord).filter_by(batch_id=batch_id).all()
    data = [
        (r.material_name, r.spec, r.purchase_date, r.supplier, r.unit_price, r.amount)
        for r in rows
    ]
    return _xlsx(data, ["标准材料名称", "标准规格", "采购日期", "供应商", "单价", "金额"])


def export_suppliers(batch_id: int, session: Session) -> bytes:
    rows = (
        session.query(SupplierPriceSummary)
        .join(MaterialGroup, SupplierPriceSummary.group_id == MaterialGroup.id)
        .filter(MaterialGroup.batch_id == batch_id)
        .all()
    )
    data = [
        (r.supplier, r.min_price, r.max_price, r.avg_price, r.latest_price)
        for r in rows
    ]
    return _xlsx(data, ["厂家", "最低价", "最高价", "平均价", "最近价"])

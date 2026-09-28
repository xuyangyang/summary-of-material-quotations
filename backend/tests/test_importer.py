import pandas as pd

from app.db import SessionLocal, init_db
from app.models import MaterialGroup, MaterialRecord, SupplierPriceSummary
from app.services.importer import import_excel


def test_import_excel_creates_groups(tmp_path):
    init_db()
    session = SessionLocal()
    session.query(MaterialRecord).delete()
    session.query(SupplierPriceSummary).delete()
    session.query(MaterialGroup).delete()
    session.commit()

    df = pd.DataFrame([
        ["所属项目", "所属供应商", "采购类型", "采购日期", None, None, "材料", "规格", "材料分类", "单位", "采购量", "单价"],
        [None, None, None, "年", "月", "日"],
        ["项目A", "供应商A", "自营", "2026", "09", "09", "镀锌钢管 DN25", "DN25", "管道", "米", "100", "10"],
        ["项目A", "供应商B", "自营", "2026", "09", "09", "镀锌钢管 Dn25", "Dn25", "管道", "米", "50", "12"],
    ])
    path = tmp_path / "input.xlsx"
    df.to_excel(path, index=False, header=False)

    batch = import_excel(str(path), "input.xlsx", session)
    assert batch.valid_rows == 2
    assert session.query(MaterialRecord).count() == 2
    assert session.query(MaterialRecord).first().material_name == "镀锌钢管"
    session.close()

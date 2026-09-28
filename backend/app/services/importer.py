import hashlib

import pandas as pd
from sqlalchemy.orm import Session

from app.models import ImportBatch, MaterialGroup, MaterialRecord, SupplierPriceSummary
from app.services.normalizer import (
    normalize_material_name,
    normalize_spec,
    normalize_text,
    normalize_unit,
    parse_material_spec,
    spec_key,
)

COLUMNS = ["项目", "供应商", "采购类型", "年", "月", "日", "材料", "规格", "材料分类", "单位", "采购量", "单价"]


def import_excel(file_path: str, file_name: str, session: Session) -> ImportBatch:
    df = pd.read_excel(file_path, header=None, skiprows=2, dtype=str)
    df.columns = COLUMNS

    for col in ["项目", "供应商", "采购类型", "年", "月", "日", "材料", "规格", "材料分类", "单位"]:
        df[col] = df[col].map(normalize_text)

    for col in ["项目", "供应商", "采购类型", "年", "月", "日"]:
        df[col] = df[col].replace("", pd.NA).ffill().fillna("")

    df["采购日期"] = df.apply(lambda r: "-".join(p for p in [r["年"], r["月"], r["日"]] if p), axis=1)
    df["采购量"] = pd.to_numeric(df["采购量"].str.replace(",", "", regex=False), errors="coerce")
    df["单价"] = pd.to_numeric(df["单价"].str.replace(",", "", regex=False), errors="coerce")
    df["金额"] = df["采购量"] * df["单价"]

    parsed = df.apply(lambda r: parse_material_spec(r["材料"], r["规格"]), axis=1, result_type="expand")
    df["材料名称"] = parsed[0].map(normalize_material_name)
    df["规格标准"] = parsed[1].map(normalize_spec)
    df["规格键"] = parsed[1].map(spec_key)
    df["单位标准"] = df["单位"].map(normalize_unit)

    valid = df[(df["材料"] != "") & (df["材料名称"] != "")].copy()
    unclassified = len(df) - len(valid)

    with open(file_path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    batch = ImportBatch(
        file_name=file_name,
        file_hash=file_hash,
        source_rows=len(df),
        valid_rows=len(valid),
        unclassified_rows=unclassified,
    )
    session.add(batch)
    session.flush()

    groups = {}
    group_category_sets = {}
    group_unit_sets = {}
    supplier_stats = {}

    for idx, (_, row) in enumerate(valid.iterrows()):
        key = (row["材料名称"], row["规格键"])
        if key not in groups:
            groups[key] = MaterialGroup(
                batch_id=batch.id,
                group_no=len(groups) + 1,
                material_name=row["材料名称"],
                spec=row["规格标准"],
                spec_key=row["规格键"],
                categories="",
                units="",
                record_count=0,
                total_quantity=0,
                total_amount=0,
            )
            session.add(groups[key])
            session.flush()

        group = groups[key]
        group.record_count += 1
        group.total_quantity += float(row["采购量"] or 0)
        group.total_amount += round(float(row["金额"] or 0), 2)
        group_category_sets.setdefault(key, set()).add(row["材料分类"])
        group_unit_sets.setdefault(key, set()).add(row["单位标准"])

        supplier_key = (group.id, row["供应商"])
        stats = supplier_stats.setdefault(
            supplier_key,
            {
                "supplier": row["供应商"],
                "count": 0,
                "min": None,
                "max": None,
                "total_amount": 0.0,
                "total_quantity": 0.0,
                "price_sum": 0.0,
                "price_count": 0,
                "latest_date": "",
                "latest_price": None,
            },
        )
        stats["count"] += 1
        price = row["单价"]
        if price is not None and not pd.isna(price):
            price = float(price)
            stats["min"] = price if stats["min"] is None else min(stats["min"], price)
            stats["max"] = price if stats["max"] is None else max(stats["max"], price)
            stats["price_sum"] += price
            stats["price_count"] += 1
            if row["采购日期"] >= stats["latest_date"]:
                stats["latest_date"] = row["采购日期"]
                stats["latest_price"] = price
        stats["total_amount"] += float(row["金额"] or 0)
        stats["total_quantity"] += float(row["采购量"] or 0)

        session.add(
            MaterialRecord(
                batch_id=batch.id,
                row_number=idx + 3,
                project=row["项目"],
                supplier=row["供应商"],
                purchase_type=row["采购类型"],
                purchase_date=row["采购日期"],
                raw_material=row["材料"],
                raw_spec=row["规格"],
                category=row["材料分类"],
                unit=row["单位标准"],
                quantity=row["采购量"],
                unit_price=row["单价"],
                amount=row["金额"],
                material_name=row["材料名称"],
                spec=row["规格标准"],
                spec_key=row["规格键"],
                group_id=group.id,
            )
        )

    for key, group in groups.items():
        group.categories = " | ".join(sorted(group_category_sets.get(key, set())))
        group.units = " | ".join(sorted(group_unit_sets.get(key, set())))

    for (group_id, supplier), stats in supplier_stats.items():
        avg = (
            stats["price_sum"] / stats["price_count"]
            if stats["price_count"]
            else None
        )
        weighted = (
            stats["total_amount"] / stats["total_quantity"]
            if stats["total_quantity"]
            else None
        )
        session.add(
            SupplierPriceSummary(
                group_id=group_id,
                supplier=supplier,
                record_count=stats["count"],
                min_price=round(stats["min"], 2) if stats["min"] is not None else None,
                max_price=round(stats["max"], 2) if stats["max"] is not None else None,
                avg_price=round(avg, 2) if avg is not None else None,
                weighted_avg_price=round(weighted, 2) if weighted is not None else None,
                latest_price=round(stats["latest_price"], 2)
                if stats["latest_price"] is not None
                else None,
                latest_date=stats["latest_date"],
            )
        )

    session.commit()
    return batch

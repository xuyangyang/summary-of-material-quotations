from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import MaterialRecord


def search_records(session: Session, batch_id: int, filters: dict, match_mode: str, limit: int = 200):
    query = session.query(MaterialRecord).filter(MaterialRecord.batch_id == batch_id)

    if filters.get("project"):
        query = query.filter(MaterialRecord.project.contains(filters["project"]))
    if filters.get("supplier"):
        query = query.filter(MaterialRecord.supplier.contains(filters["supplier"]))
    if filters.get("date_from"):
        query = query.filter(MaterialRecord.purchase_date >= filters["date_from"])
    if filters.get("date_to"):
        query = query.filter(MaterialRecord.purchase_date <= filters["date_to"])
    if filters.get("category"):
        query = query.filter(MaterialRecord.category == filters["category"])
    if filters.get("spec"):
        spec = filters["spec"]
        query = query.filter(
            or_(
                MaterialRecord.spec.contains(spec),
                MaterialRecord.raw_spec.contains(spec),
            )
        )
    if filters.get("material_name"):
        q = filters["material_name"]
        if match_mode == "exact":
            query = query.filter(MaterialRecord.material_name == q)
        else:
            query = query.filter(
                or_(
                    MaterialRecord.material_name.contains(q),
                    MaterialRecord.raw_material.contains(q),
                    MaterialRecord.spec.contains(q),
                )
            )

    return query.order_by(MaterialRecord.purchase_date.desc()).limit(limit).all()

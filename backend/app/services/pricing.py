from sqlalchemy.orm import Session

from app.models import MaterialRecord, SupplierPriceSummary


def price_history(group_id: int, session: Session):
    rows = (
        session.query(MaterialRecord)
        .filter_by(group_id=group_id)
        .order_by(MaterialRecord.purchase_date)
        .all()
    )
    return [
        {
            "purchase_date": r.purchase_date,
            "supplier": r.supplier,
            "project": r.project,
            "quantity": r.quantity,
            "unit_price": r.unit_price,
            "amount": r.amount,
        }
        for r in rows
    ]


def supplier_summary(group_id: int, session: Session):
    return (
        session.query(SupplierPriceSummary)
        .filter_by(group_id=group_id)
        .order_by(SupplierPriceSummary.record_count.desc())
        .all()
    )

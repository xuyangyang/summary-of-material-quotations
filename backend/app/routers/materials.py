from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import MaterialGroup, MaterialRecord

router = APIRouter(prefix="/api/batches/{batch_id}", tags=["materials"])


@router.get("/groups")
def list_groups(batch_id: int, session: Session = Depends(get_session)):
    return (
        session.query(MaterialGroup)
        .filter_by(batch_id=batch_id)
        .order_by(MaterialGroup.record_count.desc())
        .all()
    )


@router.get("/groups/{group_id}/records")
def group_records(batch_id: int, group_id: int, session: Session = Depends(get_session)):
    group = session.get(MaterialGroup, group_id)
    if not group or group.batch_id != batch_id:
        raise HTTPException(status_code=404, detail="group not found")
    return (
        session.query(MaterialRecord)
        .filter_by(group_id=group_id)
        .order_by(MaterialRecord.purchase_date)
        .all()
    )

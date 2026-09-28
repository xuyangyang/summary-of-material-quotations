from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.services.pricing import supplier_summary

router = APIRouter(prefix="/api/batches/{batch_id}", tags=["suppliers"])


@router.get("/groups/{group_id}/suppliers")
def get_supplier_summary(batch_id: int, group_id: int, session: Session = Depends(get_session)):
    return supplier_summary(group_id, session)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.services.pricing import price_history

router = APIRouter(prefix="/api/batches/{batch_id}", tags=["prices"])


@router.get("/groups/{group_id}/price-history")
def get_price_history(batch_id: int, group_id: int, session: Session = Depends(get_session)):
    return price_history(group_id, session)

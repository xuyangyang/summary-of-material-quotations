from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db import get_session
from app.services import exporter

router = APIRouter(prefix="/api/batches/{batch_id}/export", tags=["export"])


@router.get("/materials")
def materials(batch_id: int, session: Session = Depends(get_session)):
    return Response(
        content=exporter.export_materials(batch_id, session),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/prices")
def prices(batch_id: int, session: Session = Depends(get_session)):
    return Response(
        content=exporter.export_prices(batch_id, session),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/suppliers")
def suppliers(batch_id: int, session: Session = Depends(get_session)):
    return Response(
        content=exporter.export_suppliers(batch_id, session),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

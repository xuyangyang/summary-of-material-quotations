import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import (
    ImportBatch,
    MaterialGroup,
    MaterialRecord,
    SearchCache,
    SupplierPriceSummary,
)
from app.services.importer import import_excel

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.post("")
async def upload_batch(file: UploadFile = File(...), session: Session = Depends(get_session)):
    path = f"data/uploads/{file.filename}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(await file.read())
    batch = import_excel(path, file.filename, session)
    return {"id": batch.id}


@router.get("")
def list_batches(session: Session = Depends(get_session)):
    return session.query(ImportBatch).order_by(ImportBatch.imported_at.desc()).all()


@router.delete("/{batch_id}")
def delete_batch(batch_id: int, session: Session = Depends(get_session)):
    batch = session.get(ImportBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="batch not found")

    group_ids = [
        row[0]
        for row in session.query(MaterialGroup.id)
        .filter(MaterialGroup.batch_id == batch_id)
        .all()
    ]
    if group_ids:
        session.query(SupplierPriceSummary).filter(
            SupplierPriceSummary.group_id.in_(group_ids)
        ).delete(synchronize_session=False)

    session.query(MaterialRecord).filter(
        MaterialRecord.batch_id == batch_id
    ).delete(synchronize_session=False)
    session.query(MaterialGroup).filter(
        MaterialGroup.batch_id == batch_id
    ).delete(synchronize_session=False)
    session.query(SearchCache).filter(
        SearchCache.batch_id == batch_id
    ).delete(synchronize_session=False)

    file_name = batch.file_name
    session.delete(batch)
    session.commit()

    upload_dir = os.path.abspath("data/uploads")
    target = os.path.abspath(os.path.join(upload_dir, os.path.basename(file_name)))
    if target.startswith(upload_dir + os.sep) and os.path.isfile(target):
        os.remove(target)

    return {"ok": True}

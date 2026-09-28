from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.services.deepseek import ai_match_materials
from app.services.search import search_records

router = APIRouter(prefix="/api/batches/{batch_id}/search", tags=["search"])

AI_CANDIDATE_LIMIT = 50


@router.get("")
def search(
    batch_id: int,
    project: str = "",
    supplier: str = "",
    date_from: str = "",
    date_to: str = "",
    category: str = "",
    spec: str = "",
    material_name: str = "",
    match_mode: str = Query("fuzzy"),
    session: Session = Depends(get_session),
):
    # exact / fuzzy 直接落到结构化查询；ai 先做模糊召回，再交给 DeepSeek 重排。
    sql_mode = match_mode if match_mode in {"exact", "fuzzy"} else "fuzzy"
    records = search_records(
        session,
        batch_id,
        {
            "project": project,
            "supplier": supplier,
            "date_from": date_from,
            "date_to": date_to,
            "category": category,
            "spec": spec,
            "material_name": material_name,
        },
        sql_mode,
    )
    if match_mode == "ai" and material_name:
        names = list({r.material_name for r in records})
        try:
            matched = ai_match_materials(material_name, names[:AI_CANDIDATE_LIMIT])
            return {"records": records, "ai_matches": matched}
        except Exception:
            # DeepSeek 不可用时降级为模糊召回，避免整个搜索失败。
            return {"records": records, "ai_matches": []}
    return {"records": records, "ai_matches": []}

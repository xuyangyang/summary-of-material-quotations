from fastapi import APIRouter

from app.services.deepseek import test_connection

router = APIRouter(prefix="/api/config", tags=["config"])


@router.post("/deepseek/test")
def deepseek_test():
    return test_connection()

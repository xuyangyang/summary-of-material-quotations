from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import batches, config, export, materials, prices, search, suppliers


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="采购订单材料分析系统", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(batches.router)
app.include_router(config.router)
app.include_router(export.router)
app.include_router(materials.router)
app.include_router(prices.router)
app.include_router(search.router)
app.include_router(suppliers.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

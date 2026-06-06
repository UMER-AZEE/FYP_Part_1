from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import CORS_ORIGINS
from app.db.indexes import ensure_indexes
from app.db.mongo import close_mongo_client, get_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_indexes(get_database())
    yield
    close_mongo_client()


def create_application() -> FastAPI:
    app = FastAPI(title='Sentinel AI API', lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS or ['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    app.include_router(api_router)
    return app


app = create_application()

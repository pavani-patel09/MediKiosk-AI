from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.visits import router as visits_router
from app.api.documents import router as documents_router
from app.api.timeline import router as timeline_router
from app.api.summaries import router as summaries_router
from app.api.stats import router as stats_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(visits_router)
api_router.include_router(documents_router)
api_router.include_router(timeline_router)
api_router.include_router(summaries_router)
api_router.include_router(stats_router)

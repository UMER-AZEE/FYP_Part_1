from fastapi import APIRouter, Depends

from app.api.dependencies.services import get_dashboard_service
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])


@router.get('')
def dashboard(
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> dict:
    return dashboard_service.get_dashboard_data()

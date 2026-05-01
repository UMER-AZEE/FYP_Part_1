from fastapi import APIRouter

from app.db.mongo import get_database_status


router = APIRouter(tags=['health'])


@router.get('/api/health')
def health_check() -> dict[str, str]:
    database_status = get_database_status()
    return {
        'status': 'ok',
        'database_mode': database_status['mode'],
        'database_name': database_status['database_name'],
        'database_detail': database_status.get('detail', ''),
    }

import json
from functools import lru_cache
from pathlib import Path


MOCK_DATA_PATH = (
    Path(__file__).resolve().parents[3]
    / 'Frontend'
    / 'src'
    / 'services'
    / 'dashboard'
    / 'mockDashboardData.json'
)


@lru_cache
def load_dashboard_data() -> dict:
    return json.loads(MOCK_DATA_PATH.read_text(encoding='utf-8'))


class DashboardService:
    def get_dashboard_data(self) -> dict:
        return load_dashboard_data()

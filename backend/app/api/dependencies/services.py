from app.db.mongo import get_database
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService


def get_company_repository() -> CompanyRepository:
    return CompanyRepository(get_database())


def get_user_repository() -> UserRepository:
    database = get_database()
    company_repository = CompanyRepository(database)
    return UserRepository(database, company_repository)


def get_auth_service() -> AuthService:
    database = get_database()
    company_repository = CompanyRepository(database)
    user_repository = UserRepository(database, company_repository)
    return AuthService(user_repository, company_repository)


def get_dashboard_service() -> DashboardService:
    return DashboardService()

from pymongo import ASCENDING


def ensure_indexes(database) -> None:
    database.companies.create_index([('slug', ASCENDING)], unique=True, name='companies_slug_unique')
    database.users.create_index([('email', ASCENDING)], unique=True, name='users_email_unique')
    database.users.create_index([('company_id', ASCENDING)], name='users_company_id_idx')

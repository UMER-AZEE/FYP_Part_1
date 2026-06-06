from pymongo import ASCENDING


def ensure_indexes(database) -> None:
    database.companies.create_index([('slug', ASCENDING)], unique=True, name='companies_slug_unique')
    database.users.create_index([('email', ASCENDING)], unique=True, name='users_email_unique')
    database.users.create_index([('company_id', ASCENDING)], name='users_company_id_idx')
    database.users.create_index([('invitation_token_hash', ASCENDING)], name='users_invitation_token_hash_idx')
    database.integrations.create_index([('company_id', ASCENDING)], name='integrations_company_id_idx')
    database.integrations.create_index(
        [('company_id', ASCENDING), ('provider', ASCENDING), ('account_name', ASCENDING)],
        unique=True,
        name='integrations_company_provider_account_unique',
    )
    database.prompt_runs.create_index([('company_id', ASCENDING)], name='prompt_runs_company_id_idx')
    database.prompt_runs.create_index([('user_id', ASCENDING)], name='prompt_runs_user_id_idx')
    database.prompt_runs.create_index([('created_at', ASCENDING)], name='prompt_runs_created_at_idx')

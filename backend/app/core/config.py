import os
from pathlib import Path
from urllib.parse import quote, unquote

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[2] / '.env'
load_dotenv(ENV_FILE)


def normalize_mongodb_url(mongodb_url: str) -> str:
    if '://' not in mongodb_url or '@' not in mongodb_url:
        return mongodb_url

    scheme, remainder = mongodb_url.split('://', 1)
    credentials, separator, host_and_path = remainder.rpartition('@')
    if not separator or ':' not in credentials:
        return mongodb_url

    username, password = credentials.split(':', 1)
    encoded_username = quote(unquote(username), safe='')
    encoded_password = quote(unquote(password), safe='')
    return f'{scheme}://{encoded_username}:{encoded_password}@{host_and_path}'


ENVIRONMENT = os.getenv('ENVIRONMENT', os.getenv('APP_ENV', 'development')).strip().lower()
IS_PRODUCTION = ENVIRONMENT == 'production'
DEFAULT_SECRET_KEY = 'change-this-secret-before-production'
SECRET_KEY = os.getenv('SECRET_KEY', DEFAULT_SECRET_KEY)
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))

MONGODB_URL = normalize_mongodb_url(
    os.getenv('MONGODB_URL') or os.getenv('DATABASE_URL') or 'mongodb://127.0.0.1:27017/centurion'
)
MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'centurion').strip() or 'centurion'
DATABASE_MODE = os.getenv('DATABASE_MODE', 'auto').strip().lower() or 'auto'
FALLBACK_DB_PATH = Path(
    os.getenv('FALLBACK_DB_PATH', str(Path(__file__).resolve().parents[2] / 'app.db'))
).expanduser()
MONGODB_SERVER_SELECTION_TIMEOUT_MS = int(
    os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '2000')
)
MONGODB_FALLBACK_RETRY_SECONDS = int(os.getenv('MONGODB_FALLBACK_RETRY_SECONDS', '30'))

VERIFICATION_CODE_EXPIRE_MINUTES = int(os.getenv('VERIFICATION_CODE_EXPIRE_MINUTES', '10'))
VERIFICATION_RESEND_COOLDOWN_SECONDS = int(
    os.getenv('VERIFICATION_RESEND_COOLDOWN_SECONDS', '60')
)
VERIFICATION_MAX_ATTEMPTS = int(os.getenv('VERIFICATION_MAX_ATTEMPTS', '5'))
PASSWORD_RESET_CODE_EXPIRE_MINUTES = int(os.getenv('PASSWORD_RESET_CODE_EXPIRE_MINUTES', '10'))
PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = int(
    os.getenv('PASSWORD_RESET_RESEND_COOLDOWN_SECONDS', '60')
)
PASSWORD_RESET_MAX_ATTEMPTS = int(os.getenv('PASSWORD_RESET_MAX_ATTEMPTS', '5'))
SMTP_HOST = os.getenv('SMTP_HOST', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', '')
SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'Centurion')
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').strip().lower() in {'1', 'true', 'yes', 'on'}
SMTP_USE_SSL = os.getenv('SMTP_USE_SSL', 'false').strip().lower() in {'1', 'true', 'yes', 'on'}
SMTP_ENABLED = bool(SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',')
    if origin.strip()
]

if IS_PRODUCTION and SECRET_KEY == DEFAULT_SECRET_KEY:
    raise RuntimeError('SECRET_KEY must be configured in production')

if IS_PRODUCTION and (not SMTP_HOST or not SMTP_FROM_EMAIL):
    raise RuntimeError('SMTP_HOST and SMTP_FROM_EMAIL must be configured')

if DATABASE_MODE not in {'auto', 'memory'}:
    raise RuntimeError("DATABASE_MODE must be either 'auto' or 'memory'")

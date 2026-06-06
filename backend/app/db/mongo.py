from __future__ import annotations

import copy
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId, json_util
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

from app.core.config import (
    DATABASE_MODE,
    FALLBACK_DB_PATH,
    MONGODB_DB_NAME,
    MONGODB_FALLBACK_RETRY_SECONDS,
    MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    MONGODB_URL,
)


logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_database = None
_fallback_database: _FallbackDatabase | None = None
_last_connection_attempt_at: datetime | None = None
_last_connection_error: str | None = None


@dataclass(slots=True)
class _InsertOneResult:
    inserted_id: ObjectId


@dataclass(slots=True)
class _DeleteResult:
    deleted_count: int


class _FallbackStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._data: dict[str, Any] = {'collections': {}}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return

        raw = self._path.read_text(encoding='utf-8').strip()
        if not raw:
            return

        payload = json_util.loads(raw)
        if isinstance(payload, dict) and 'collections' in payload:
            self._data = payload

    def save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json_util.dumps(self._data, indent=2), encoding='utf-8')

    def get_collection(self, name: str) -> dict[str, Any]:
        collections = self._data.setdefault('collections', {})
        return collections.setdefault(name, {'documents': {}, 'indexes': []})


class _FallbackCollection:
    def __init__(self, store: _FallbackStore, name: str) -> None:
        self._store = store
        self._name = name

    @staticmethod
    def _normalize_value(value: Any) -> Any:
        if isinstance(value, ObjectId):
            return str(value)
        return value

    @property
    def _state(self) -> dict[str, Any]:
        return self._store.get_collection(self._name)

    @property
    def _documents(self) -> dict[str, dict[str, Any]]:
        return self._state['documents']

    def _matches(self, document: dict[str, Any], query: dict[str, Any]) -> bool:
        for key, expected in query.items():
            actual = document.get(key)
            if self._normalize_value(actual) != self._normalize_value(expected):
                return False
        return True

    def _assert_unique_indexes(self, candidate: dict[str, Any], skip_document_id: str | None = None) -> None:
        for index in self._state['indexes']:
            if not index.get('unique'):
                continue

            fields = index.get('fields', [])
            candidate_key = tuple(self._normalize_value(candidate.get(field)) for field in fields)
            for document_id, document in self._documents.items():
                if document_id == skip_document_id:
                    continue

                document_key = tuple(self._normalize_value(document.get(field)) for field in fields)
                if document_key == candidate_key:
                    raise DuplicateKeyError(f"Duplicate value for unique index on {', '.join(fields)}")

    def create_index(self, keys, unique: bool = False, name: str | None = None, **__) -> str:
        fields = [field for field, _ in keys]
        index_name = name or '_'.join(fields)
        indexes = self._state['indexes']
        for index in indexes:
            if index['name'] == index_name:
                return index_name

        if unique:
            seen_keys: set[tuple[Any, ...]] = set()
            for document in self._documents.values():
                document_key = tuple(self._normalize_value(document.get(field)) for field in fields)
                if document_key in seen_keys:
                    raise DuplicateKeyError(f"Duplicate value for unique index on {', '.join(fields)}")
                seen_keys.add(document_key)

        index_definition = {'name': index_name, 'fields': fields, 'unique': unique}
        indexes.append(index_definition)
        self._store.save()
        return index_name

    def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for document in self._documents.values():
            if self._matches(document, query):
                return copy.deepcopy(document)
        return None

    def find(self, query: dict[str, Any]) -> list[dict[str, Any]]:
        matches: list[dict[str, Any]] = []
        for document in self._documents.values():
            if self._matches(document, query):
                matches.append(copy.deepcopy(document))
        return matches

    def insert_one(self, document: dict[str, Any]) -> _InsertOneResult:
        stored_document = copy.deepcopy(document)
        inserted_id = stored_document.get('_id', ObjectId())
        stored_document['_id'] = inserted_id
        self._assert_unique_indexes(stored_document)
        self._documents[str(inserted_id)] = stored_document
        self._store.save()
        return _InsertOneResult(inserted_id=inserted_id)

    def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> None:
        for document_id, document in self._documents.items():
            if self._matches(document, query):
                if '$set' in update:
                    updated_document = copy.deepcopy(document)
                    updated_document.update(copy.deepcopy(update['$set']))
                    self._assert_unique_indexes(updated_document, skip_document_id=document_id)
                    self._documents[document_id] = updated_document
                    self._store.save()
                return

    def delete_one(self, query: dict[str, Any]) -> _DeleteResult:
        for document_id, document in list(self._documents.items()):
            if self._matches(document, query):
                del self._documents[document_id]
                self._store.save()
                return _DeleteResult(deleted_count=1)
        return _DeleteResult(deleted_count=0)


class _FallbackDatabase:
    def __init__(self, path: Path) -> None:
        self._collections: dict[str, _FallbackCollection] = {}
        self._store = _FallbackStore(path)

    def __getattr__(self, name: str) -> _FallbackCollection:
        if name not in self._collections:
            self._collections[name] = _FallbackCollection(self._store, name)
        return self._collections[name]


def get_mongo_client() -> MongoClient:
    global _client, _last_connection_attempt_at, _last_connection_error
    if _client is None:
        _last_connection_attempt_at = datetime.now(timezone.utc)
        try:
            client = MongoClient(
                MONGODB_URL,
                tz_aware=True,
                serverSelectionTimeoutMS=MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            )
            client.admin.command('ping')
        except Exception as exc:
            _last_connection_error = str(exc)
            raise
        _client = client
        _last_connection_error = None
    return _client


def get_database():
    global _database, _fallback_database
    if _database is not None:
        return _database

    if DATABASE_MODE == 'memory':
        if _fallback_database is None:
            logger.warning(
                'DATABASE_MODE=memory, using local fallback database at %s',
                FALLBACK_DB_PATH,
            )
            _fallback_database = _FallbackDatabase(FALLBACK_DB_PATH)
        return _fallback_database

    should_retry_connection = (
        _last_connection_attempt_at is None
        or datetime.now(timezone.utc) - _last_connection_attempt_at
        >= timedelta(seconds=MONGODB_FALLBACK_RETRY_SECONDS)
    )

    try:
        if not should_retry_connection and _fallback_database is not None:
            return _fallback_database

        _database = get_mongo_client()[MONGODB_DB_NAME]
        return _database
    except Exception as exc:
        if _fallback_database is None:
            logger.warning(
                'MongoDB unavailable, using local fallback database at %s: %s',
                FALLBACK_DB_PATH,
                exc,
            )
            _fallback_database = _FallbackDatabase(FALLBACK_DB_PATH)
        return _fallback_database


def get_database_status() -> dict[str, str]:
    if _database is not None:
        return {'mode': 'mongodb', 'database_name': MONGODB_DB_NAME}

    if _fallback_database is not None:
        detail = _last_connection_error or 'DATABASE_MODE=memory enabled'
        return {
            'mode': 'local-fallback',
            'database_name': MONGODB_DB_NAME,
            'detail': detail,
        }

    return {'mode': 'uninitialized', 'database_name': MONGODB_DB_NAME}


def close_mongo_client() -> None:
    global _client, _database
    if _client is not None:
        _client.close()
        _client = None
    _database = None

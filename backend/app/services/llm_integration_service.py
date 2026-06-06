from datetime import datetime, timezone
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.models.llm_integration import LLMIntegration
from app.models.user import User
from app.repositories.llm_integration_repository import LLMIntegrationRepository
from app.schemas.integrations import (
    LLMAvailableModelsRequest,
    LLMAvailableModelsResponse,
    LLMIntegrationCreateRequest,
    LLMIntegrationMutationResponse,
    LLMIntegrationRead,
    LLMIntegrationsResponse,
    LLMIntegrationUpdateRequest,
)


SUPPORTED_PROVIDERS = ('openai', 'groq', 'ollama', 'gemini', 'deepseek', 'anthropic')

OPENAI_COMPATIBLE_PROVIDERS = {
    'openai': 'https://api.openai.com/v1/models',
    'groq': 'https://api.groq.com/openai/v1/models',
    'deepseek': 'https://api.deepseek.com/models',
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class LLMIntegrationService:
    def __init__(self, integration_repository: LLMIntegrationRepository):
        self.integration_repository = integration_repository

    @staticmethod
    def ensure_manager(current_user: User) -> None:
        if current_user.role.strip().lower() != 'manager':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only managers can manage organization integrations',
            )

    @staticmethod
    def normalize_provider(provider: str) -> str:
        normalized = provider.strip().lower()
        if normalized not in SUPPORTED_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Select a supported provider',
            )
        return normalized

    @staticmethod
    def normalize_account_name(account_name: str) -> str:
        normalized = ' '.join(account_name.strip().split())
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Account name is required',
            )
        return normalized

    @staticmethod
    def normalize_policy_name(policy_name: str) -> str:
        normalized = ' '.join(policy_name.strip().split())
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Policy is required',
            )
        return normalized

    @staticmethod
    def normalize_api_key(api_key: str | None, *, required: bool) -> str | None:
        if api_key is None:
            if required:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail='API key is required',
                )
            return None

        normalized = api_key.strip()
        if not normalized:
            if required:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail='API key is required',
                )
            return None
        return normalized

    @staticmethod
    def normalize_remote_models(models: list[str]) -> list[str]:
        deduped: dict[str, str] = {}
        for model in models:
            normalized = ' '.join(model.strip().split())
            if not normalized:
                continue
            deduped.setdefault(normalized.lower(), normalized)
        return sorted(deduped.values(), key=str.lower)

    @staticmethod
    def normalize_models(models: list[str]) -> list[str]:
        normalized_models: list[str] = []
        seen: set[str] = set()
        for model in models:
            normalized = ' '.join(model.strip().split())
            if not normalized:
                continue
            dedupe_key = normalized.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            normalized_models.append(normalized)

        if not normalized_models:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Select at least one model',
            )
        return normalized_models

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        if len(api_key) <= 8:
            return '*' * len(api_key)
        return f'{api_key[:4]}{"*" * max(len(api_key) - 8, 4)}{api_key[-4:]}'

    @staticmethod
    def read_json_response(request: Request) -> dict:
        try:
            with urlopen(request, timeout=15) as response:
                body = response.read().decode('utf-8')
        except HTTPError as exc:
            try:
                payload = json.loads(exc.read().decode('utf-8'))
            except Exception:
                payload = {}
            detail = payload.get('error', {}).get('message') or payload.get('error') or payload.get('message')
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail or f'Could not load models for this provider ({exc.code})',
            ) from exc
        except URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Could not connect to provider: {exc.reason}',
            ) from exc
        except OSError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Could not connect to provider: {exc}',
            ) from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail='Provider returned an invalid response while loading models',
            ) from exc

    def fetch_openai_compatible_models(self, provider: str, api_key: str) -> list[str]:
        request = Request(
            OPENAI_COMPATIBLE_PROVIDERS[provider],
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='GET',
        )
        payload = self.read_json_response(request)
        models = [item.get('id', '').strip() for item in payload.get('data', [])]
        return self.normalize_remote_models(models)

    def fetch_gemini_models(self, api_key: str) -> list[str]:
        endpoint = f'https://generativelanguage.googleapis.com/v1beta/models?{urlencode({"key": api_key})}'
        request = Request(endpoint, method='GET')
        payload = self.read_json_response(request)
        models: list[str] = []
        for item in payload.get('models', []):
            if 'generateContent' not in item.get('supportedGenerationMethods', []):
                continue
            model_id = item.get('baseModelId') or item.get('name', '').removeprefix('models/')
            if model_id:
                models.append(model_id)
        return self.normalize_remote_models(models)

    def fetch_anthropic_models(self, api_key: str) -> list[str]:
        request = Request(
            'https://api.anthropic.com/v1/models',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            method='GET',
        )
        payload = self.read_json_response(request)
        models = [item.get('id', '').strip() for item in payload.get('data', [])]
        return self.normalize_remote_models(models)

    def fetch_ollama_models(self) -> list[str]:
        request = Request('http://127.0.0.1:11434/api/tags', method='GET')
        payload = self.read_json_response(request)
        models = [
            (item.get('model') or item.get('name') or '').strip()
            for item in payload.get('models', [])
        ]
        return self.normalize_remote_models(models)

    def to_read(self, integration: LLMIntegration) -> LLMIntegrationRead:
        return LLMIntegrationRead(
            id=integration.id,
            provider=integration.provider,
            account_name=integration.account_name,
            masked_api_key=self.mask_api_key(integration.api_key),
            policy_name=integration.policy_name,
            models=integration.models,
            created_at=integration.created_at,
            updated_at=integration.updated_at,
        )

    def ensure_unique_account_name(
        self,
        current_user: User,
        provider: str,
        account_name: str,
        *,
        exclude_integration_id: str | None = None,
    ) -> None:
        existing = self.integration_repository.find_by_company_provider_account_name(
            current_user.company.id,
            provider,
            account_name,
        )
        if existing is not None and existing.id != exclude_integration_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='An integration with this provider and account name already exists',
            )

    def list_integrations(self, current_user: User) -> LLMIntegrationsResponse:
        self.ensure_manager(current_user)
        integrations = [
            self.to_read(integration)
            for integration in self.integration_repository.list_by_company_id(current_user.company.id)
        ]
        return LLMIntegrationsResponse(integrations=integrations)

    def fetch_available_models(
        self,
        current_user: User,
        payload: LLMAvailableModelsRequest,
    ) -> LLMAvailableModelsResponse:
        self.ensure_manager(current_user)
        provider = self.normalize_provider(payload.provider)
        api_key = self.normalize_api_key(payload.api_key, required=provider != 'ollama')

        if provider in OPENAI_COMPATIBLE_PROVIDERS:
            models = self.fetch_openai_compatible_models(provider, api_key or '')
        elif provider == 'gemini':
            models = self.fetch_gemini_models(api_key or '')
        elif provider == 'anthropic':
            models = self.fetch_anthropic_models(api_key or '')
        elif provider == 'ollama':
            models = self.fetch_ollama_models()
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Provider model loading is not supported',
            )

        if not models:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='No available models were returned for this provider',
            )

        return LLMAvailableModelsResponse(provider=provider, models=models)

    def create_integration(
        self,
        current_user: User,
        payload: LLMIntegrationCreateRequest,
    ) -> LLMIntegrationMutationResponse:
        self.ensure_manager(current_user)
        provider = self.normalize_provider(payload.provider)
        account_name = self.normalize_account_name(payload.account_name)
        api_key = self.normalize_api_key(payload.api_key, required=True)
        policy_name = self.normalize_policy_name(payload.policy_name)
        models = self.normalize_models(payload.models)
        self.ensure_unique_account_name(current_user, provider, account_name)

        current_time = now_utc()
        integration = LLMIntegration(
            id='',
            company=current_user.company,
            provider=provider,
            account_name=account_name,
            api_key=api_key or '',
            policy_name=policy_name,
            models=models,
            created_at=current_time,
            updated_at=current_time,
        )

        try:
            self.integration_repository.create(integration)
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='An integration with this provider and account name already exists',
            ) from exc

        return LLMIntegrationMutationResponse(
            integration=self.to_read(integration),
            message='LLM integration created successfully.',
        )

    def update_integration(
        self,
        current_user: User,
        integration_id: str,
        payload: LLMIntegrationUpdateRequest,
    ) -> LLMIntegrationMutationResponse:
        self.ensure_manager(current_user)
        integration = self.integration_repository.find_by_id(integration_id)
        if integration is None or integration.company.id != current_user.company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Integration not found')

        provider = self.normalize_provider(payload.provider)
        account_name = self.normalize_account_name(payload.account_name)
        policy_name = self.normalize_policy_name(payload.policy_name)
        models = self.normalize_models(payload.models)
        api_key = self.normalize_api_key(payload.api_key, required=False)
        self.ensure_unique_account_name(
            current_user,
            provider,
            account_name,
            exclude_integration_id=integration.id,
        )

        integration.provider = provider
        integration.account_name = account_name
        integration.policy_name = policy_name
        integration.models = models
        if api_key is not None:
            integration.api_key = api_key
        integration.updated_at = now_utc()

        try:
            self.integration_repository.save(integration)
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='An integration with this provider and account name already exists',
            ) from exc

        return LLMIntegrationMutationResponse(
            integration=self.to_read(integration),
            message='LLM integration updated successfully.',
        )

    def delete_integration(self, current_user: User, integration_id: str) -> dict[str, str]:
        self.ensure_manager(current_user)
        integration = self.integration_repository.find_by_id(integration_id)
        if integration is None or integration.company.id != current_user.company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Integration not found')

        self.integration_repository.delete(integration_id)
        return {'message': 'LLM integration deleted successfully.'}

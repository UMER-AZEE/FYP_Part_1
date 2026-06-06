from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.models.prompt_run import PromptRun
from app.models.user import User
from app.repositories.llm_integration_repository import LLMIntegrationRepository
from app.repositories.prompt_run_repository import PromptRunRepository
from app.schemas.prompts import (
    PromptRunExecutionResponse,
    PromptRunExecuteRequest,
    PromptRunRead,
    PromptRunsResponse,
    PromptWorkspaceContextResponse,
    PromptWorkspaceIntegrationRead,
)


OPENAI_COMPATIBLE_CHAT_ENDPOINTS = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'groq': 'https://api.groq.com/openai/v1/chat/completions',
    'deepseek': 'https://api.deepseek.com/chat/completions',
}


@dataclass(slots=True)
class PromptProviderResult:
    response_text: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class PromptProviderError(Exception):
    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class PromptWorkspaceService:
    def __init__(
        self,
        integration_repository: LLMIntegrationRepository,
        prompt_run_repository: PromptRunRepository,
    ):
        self.integration_repository = integration_repository
        self.prompt_run_repository = prompt_run_repository

    @staticmethod
    def is_manager(user: User) -> bool:
        return user.role.strip().lower() == 'manager'

    @staticmethod
    def normalize_text(value: str, *, field_name: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f'{field_name} is required',
            )
        return normalized

    @staticmethod
    def normalize_optional_text(value: str | None) -> str:
        return ' '.join((value or '').strip().split())

    @staticmethod
    def normalize_groups(groups: list[str]) -> list[str]:
        normalized_groups: list[str] = []
        seen: set[str] = set()
        for group in groups:
            normalized = ' '.join(group.strip().split())
            if not normalized:
                continue
            dedupe_key = normalized.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            normalized_groups.append(normalized)
        return normalized_groups

    @staticmethod
    def build_messages(prompt: str, system_prompt: str) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': prompt})
        return messages

    @staticmethod
    def read_json_response(request: Request) -> dict:
        try:
            with urlopen(request, timeout=45) as response:
                body = response.read().decode('utf-8')
        except HTTPError as exc:
            try:
                payload = json.loads(exc.read().decode('utf-8'))
            except Exception:
                payload = {}
            detail = (
                payload.get('error', {}).get('message')
                or payload.get('error', {}).get('details')
                or payload.get('error')
                or payload.get('message')
            )
            if detail:
                detail = str(detail).strip()
            if not detail and exc.code in {401, 403}:
                detail = (
                    f'Provider rejected the request with status {exc.code}. '
                    'Check the API key, provider account access, and model permissions.'
                )
            raise PromptProviderError(
                detail or f'Provider request failed with status {exc.code}'
            ) from exc
        except URLError as exc:
            raise PromptProviderError(f'Could not connect to provider: {exc.reason}') from exc
        except OSError as exc:
            raise PromptProviderError(f'Could not connect to provider: {exc}') from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise PromptProviderError('Provider returned an invalid JSON response') from exc

    @staticmethod
    def extract_openai_text(payload: dict) -> str:
        choices = payload.get('choices', [])
        if not choices:
            return ''
        message = choices[0].get('message', {})
        content = message.get('content')
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts = [item.get('text', '').strip() for item in content if isinstance(item, dict)]
            return '\n'.join(part for part in parts if part)
        return ''

    @staticmethod
    def extract_anthropic_text(payload: dict) -> str:
        content = payload.get('content', [])
        if not isinstance(content, list):
            return ''
        parts = [item.get('text', '').strip() for item in content if isinstance(item, dict)]
        return '\n'.join(part for part in parts if part)

    @staticmethod
    def extract_gemini_text(payload: dict) -> str:
        candidates = payload.get('candidates', [])
        if not candidates:
            return ''
        content = candidates[0].get('content', {})
        parts = content.get('parts', [])
        text_parts = [item.get('text', '').strip() for item in parts if isinstance(item, dict)]
        return '\n'.join(part for part in text_parts if part)

    def to_context_integration(self, integration) -> PromptWorkspaceIntegrationRead:
        return PromptWorkspaceIntegrationRead(
            id=integration.id,
            provider=integration.provider,
            account_name=integration.account_name,
            policy_name=integration.policy_name,
            models=integration.models,
        )

    @staticmethod
    def to_run_read(run: PromptRun) -> PromptRunRead:
        return PromptRunRead(
            id=run.id,
            user_id=run.user_id,
            user_name=run.user_name,
            user_email=run.user_email,
            integration_id=run.integration_id,
            integration_account_name=run.integration_account_name,
            provider=run.provider,
            model=run.model,
            prompt=run.prompt,
            system_prompt=run.system_prompt,
            response_text=run.response_text,
            selected_groups=list(run.selected_groups),
            policy_name=run.policy_name,
            status=run.status,
            error_message=run.error_message,
            latency_ms=run.latency_ms,
            prompt_tokens=run.prompt_tokens,
            completion_tokens=run.completion_tokens,
            total_tokens=run.total_tokens,
            created_at=run.created_at,
        )

    def get_context(self, current_user: User) -> PromptWorkspaceContextResponse:
        integrations = self.integration_repository.list_by_company_id(current_user.company.id)
        return PromptWorkspaceContextResponse(
            integrations=[self.to_context_integration(integration) for integration in integrations]
        )

    def list_runs(self, current_user: User, limit: int = 20) -> PromptRunsResponse:
        bounded_limit = max(1, min(limit, 50))
        if self.is_manager(current_user):
            runs = self.prompt_run_repository.list_by_company_id(current_user.company.id, bounded_limit)
        else:
            runs = self.prompt_run_repository.list_by_user_id(current_user.id, bounded_limit)
        return PromptRunsResponse(runs=[self.to_run_read(run) for run in runs])

    def resolve_integration(self, current_user: User, integration_id: str):
        integration = self.integration_repository.find_by_id(integration_id)
        if integration is None or integration.company.id != current_user.company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Integration not found')
        return integration

    @staticmethod
    def resolve_model(integration, model: str) -> str:
        normalized_model = ' '.join(model.strip().split())
        if not normalized_model:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Model is required')

        available_models = {item.lower(): item for item in integration.models}
        resolved = available_models.get(normalized_model.lower())
        if resolved is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Selected model is not enabled for this integration',
            )
        return resolved

    def execute_openai_compatible(self, provider: str, integration, payload: PromptRunExecuteRequest) -> PromptProviderResult:
        request_body = {
            'model': payload.model,
            'messages': self.build_messages(payload.prompt, payload.system_prompt),
            'temperature': payload.temperature,
            'max_tokens': payload.max_tokens,
        }
        request = Request(
            OPENAI_COMPATIBLE_CHAT_ENDPOINTS[provider],
            headers={
                'Authorization': f'Bearer {integration.api_key}',
                'Content-Type': 'application/json',
            },
            data=json.dumps(request_body).encode('utf-8'),
            method='POST',
        )
        response_payload = self.read_json_response(request)
        usage = response_payload.get('usage', {})
        return PromptProviderResult(
            response_text=self.extract_openai_text(response_payload),
            prompt_tokens=usage.get('prompt_tokens'),
            completion_tokens=usage.get('completion_tokens'),
            total_tokens=usage.get('total_tokens'),
        )

    def execute_anthropic(self, integration, payload: PromptRunExecuteRequest) -> PromptProviderResult:
        request_body = {
            'model': payload.model,
            'system': payload.system_prompt or None,
            'messages': [{'role': 'user', 'content': payload.prompt}],
            'temperature': payload.temperature,
            'max_tokens': payload.max_tokens or 1024,
        }
        request = Request(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': integration.api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            data=json.dumps(request_body).encode('utf-8'),
            method='POST',
        )
        response_payload = self.read_json_response(request)
        usage = response_payload.get('usage', {})
        prompt_tokens = usage.get('input_tokens')
        completion_tokens = usage.get('output_tokens')
        total_tokens = None
        if prompt_tokens is not None or completion_tokens is not None:
            total_tokens = (prompt_tokens or 0) + (completion_tokens or 0)
        return PromptProviderResult(
            response_text=self.extract_anthropic_text(response_payload),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

    def execute_gemini(self, integration, payload: PromptRunExecuteRequest) -> PromptProviderResult:
        request_body = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': (
                                f'System instruction:\n{payload.system_prompt}\n\nUser prompt:\n{payload.prompt}'
                                if payload.system_prompt
                                else payload.prompt
                            )
                        }
                    ]
                }
            ],
            'generationConfig': {
                'temperature': payload.temperature,
                'maxOutputTokens': payload.max_tokens,
            },
        }
        endpoint = f'https://generativelanguage.googleapis.com/v1beta/models/{payload.model}:generateContent?{urlencode({"key": integration.api_key})}'
        request = Request(
            endpoint,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(request_body).encode('utf-8'),
            method='POST',
        )
        response_payload = self.read_json_response(request)
        usage = response_payload.get('usageMetadata', {})
        return PromptProviderResult(
            response_text=self.extract_gemini_text(response_payload),
            prompt_tokens=usage.get('promptTokenCount'),
            completion_tokens=usage.get('candidatesTokenCount'),
            total_tokens=usage.get('totalTokenCount'),
        )

    def execute_ollama(self, payload: PromptRunExecuteRequest) -> PromptProviderResult:
        request_body = {
            'model': payload.model,
            'messages': self.build_messages(payload.prompt, payload.system_prompt),
            'stream': False,
            'options': {
                'temperature': payload.temperature,
                'num_predict': payload.max_tokens,
            },
        }
        request = Request(
            'http://127.0.0.1:11434/api/chat',
            headers={'Content-Type': 'application/json'},
            data=json.dumps(request_body).encode('utf-8'),
            method='POST',
        )
        response_payload = self.read_json_response(request)
        message = response_payload.get('message', {})
        content = message.get('content', '')
        return PromptProviderResult(
            response_text=content.strip(),
            prompt_tokens=response_payload.get('prompt_eval_count'),
            completion_tokens=response_payload.get('eval_count'),
            total_tokens=(
                (response_payload.get('prompt_eval_count') or 0)
                + (response_payload.get('eval_count') or 0)
            ) if (
                response_payload.get('prompt_eval_count') is not None
                or response_payload.get('eval_count') is not None
            ) else None,
        )

    def run_provider_prompt(self, integration, payload: PromptRunExecuteRequest) -> PromptProviderResult:
        provider = integration.provider
        if provider in OPENAI_COMPATIBLE_CHAT_ENDPOINTS:
            return self.execute_openai_compatible(provider, integration, payload)
        if provider == 'anthropic':
            return self.execute_anthropic(integration, payload)
        if provider == 'gemini':
            return self.execute_gemini(integration, payload)
        if provider == 'ollama':
            return self.execute_ollama(payload)
        raise PromptProviderError('Prompt execution is not supported for this provider')

    def build_prompt_run(
        self,
        *,
        current_user: User,
        integration,
        payload: PromptRunExecuteRequest,
        model: str,
        response_text: str,
        status_value: str,
        error_message: str | None,
        latency_ms: int | None,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        total_tokens: int | None,
        selected_groups: list[str],
    ) -> PromptRun:
        return PromptRun(
            id='',
            company_id=current_user.company.id,
            user_id=current_user.id,
            user_name=' '.join(part for part in [current_user.first_name, current_user.last_name] if part).strip(),
            user_email=current_user.email,
            integration_id=integration.id,
            integration_account_name=integration.account_name,
            provider=integration.provider,
            model=model,
            prompt=payload.prompt,
            system_prompt=payload.system_prompt,
            response_text=response_text,
            selected_groups=selected_groups,
            policy_name=integration.policy_name,
            status=status_value,
            error_message=error_message,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            created_at=now_utc(),
        )

    def run_prompt(
        self,
        current_user: User,
        payload: PromptRunExecuteRequest,
    ) -> PromptRunExecutionResponse:
        integration = self.resolve_integration(current_user, payload.integration_id)
        model = self.resolve_model(integration, payload.model)
        prompt = self.normalize_text(payload.prompt, field_name='Prompt')
        system_prompt = self.normalize_optional_text(payload.system_prompt)
        selected_groups = self.normalize_groups(payload.selected_groups)

        normalized_payload = PromptRunExecuteRequest(
            integration_id=integration.id,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            selected_groups=selected_groups,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )

        started_at = perf_counter()

        try:
            provider_result = self.run_provider_prompt(integration, normalized_payload)
            latency_ms = int((perf_counter() - started_at) * 1000)
            run = self.build_prompt_run(
                current_user=current_user,
                integration=integration,
                payload=normalized_payload,
                model=model,
                response_text=provider_result.response_text,
                status_value='completed',
                error_message=None,
                latency_ms=latency_ms,
                prompt_tokens=provider_result.prompt_tokens,
                completion_tokens=provider_result.completion_tokens,
                total_tokens=provider_result.total_tokens,
                selected_groups=selected_groups,
            )
        except PromptProviderError as exc:
            latency_ms = int((perf_counter() - started_at) * 1000)
            run = self.build_prompt_run(
                current_user=current_user,
                integration=integration,
                payload=normalized_payload,
                model=model,
                response_text='',
                status_value='failed',
                error_message=exc.detail,
                latency_ms=latency_ms,
                prompt_tokens=None,
                completion_tokens=None,
                total_tokens=None,
                selected_groups=selected_groups,
            )

        self.prompt_run_repository.create(run)
        return PromptRunExecutionResponse(run=self.to_run_read(run))

from datetime import datetime, timezone

from bson import ObjectId

from app.models.llm_integration import LLMIntegration
from app.repositories.company_repository import CompanyRepository


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class LLMIntegrationRepository:
    def __init__(self, database, company_repository: CompanyRepository):
        self.collection = database.integrations
        self.company_repository = company_repository

    @staticmethod
    def _object_id(value: str) -> ObjectId:
        return ObjectId(value)

    @staticmethod
    def _sort_key(integration: LLMIntegration) -> tuple[str, str]:
        return (integration.provider.lower(), integration.account_name.lower())

    def _to_document(self, integration: LLMIntegration) -> dict:
        return {
            'company_id': self._object_id(integration.company.id),
            'provider': integration.provider,
            'account_name': integration.account_name,
            'api_key': integration.api_key,
            'policy_name': integration.policy_name,
            'models': integration.models,
            'created_at': integration.created_at,
            'updated_at': integration.updated_at,
        }

    def _to_model(self, document: dict | None) -> LLMIntegration | None:
        if document is None:
            return None

        company = self.company_repository.find_by_id(str(document['company_id']))
        if company is None:
            raise RuntimeError('Integration references a missing company document')

        return LLMIntegration(
            id=str(document['_id']),
            company=company,
            provider=document['provider'],
            account_name=document['account_name'],
            api_key=document['api_key'],
            policy_name=document.get('policy_name', ''),
            models=list(document.get('models', [])),
            created_at=_ensure_utc(document['created_at']),
            updated_at=_ensure_utc(document['updated_at']),
        )

    def find_by_id(self, integration_id: str) -> LLMIntegration | None:
        return self._to_model(self.collection.find_one({'_id': self._object_id(integration_id)}))

    def find_by_company_provider_account_name(
        self,
        company_id: str,
        provider: str,
        account_name: str,
    ) -> LLMIntegration | None:
        return self._to_model(
            self.collection.find_one(
                {
                    'company_id': self._object_id(company_id),
                    'provider': provider,
                    'account_name': account_name,
                }
            )
        )

    def list_by_company_id(self, company_id: str) -> list[LLMIntegration]:
        documents = self.collection.find({'company_id': self._object_id(company_id)})
        integrations = [self._to_model(document) for document in documents]
        return sorted(
            [integration for integration in integrations if integration is not None],
            key=self._sort_key,
        )

    def create(self, integration: LLMIntegration) -> LLMIntegration:
        result = self.collection.insert_one(self._to_document(integration))
        integration.id = str(result.inserted_id)
        return integration

    def save(self, integration: LLMIntegration) -> LLMIntegration:
        self.collection.update_one(
            {'_id': self._object_id(integration.id)},
            {'$set': self._to_document(integration)},
        )
        return integration

    def delete(self, integration_id: str) -> bool:
        result = self.collection.delete_one({'_id': self._object_id(integration_id)})
        return bool(getattr(result, 'deleted_count', 0))

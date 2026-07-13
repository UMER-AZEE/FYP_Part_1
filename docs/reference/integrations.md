# Integrations reference

Source: `backend/app/api/routes/integrations.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `list_integrations`

**Source:** `backend/app/api/routes/integrations.py`

**Signature:** `list_integrations(current_user: User=Depends(get_current_user), llm_integration_service: LLMIntegrationService=Depends(get_llm_integration_service)) -> LLMIntegrationsResponse`

**Route:** `GET `

**Key calls:** `router.get`, `Depends`, `llm_integration_service.list_integrations`.

## `available_models`

**Source:** `backend/app/api/routes/integrations.py`

**Signature:** `available_models(payload: LLMAvailableModelsRequest, current_user: User=Depends(get_current_user), llm_integration_service: LLMIntegrationService=Depends(get_llm_integration_service)) -> LLMAvailableModelsResponse`

**Route:** `POST /available-models`

**Key calls:** `router.post`, `Depends`, `llm_integration_service.fetch_available_models`.


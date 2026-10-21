# Company Repository reference

Source: `backend/app/repositories/company_repository.py`. This page records callable signatures, direct dependencies, and declared HTTP errors from the implementation.

## `CompanyRepository.find_by_id`

**Source:** `backend/app/repositories/company_repository.py`

**Signature:** `find_by_id(self, company_id: str) -> Company | None`

**Key calls:** `self._to_model`, `self.collection.find_one`, `ObjectId`.


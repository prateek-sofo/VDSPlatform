"""Salesforce connector — syncs Accounts, Opportunities, Leads, Contacts, Activities."""
import structlog
from typing import Optional

log = structlog.get_logger()

SALESFORCE_OBJECTS = ["Account", "Opportunity", "Lead", "Contact", "Task", "Event", "Campaign", "OpportunityLineItem"]


class SalesforceConnector:
    async def test_connection(self, config: dict, secret_ref: Optional[str] = None) -> dict:
        try:
            sf = self._get_client(config)
            limits = sf.api_limits()
            return {"success": True, "message": "Salesforce connected", "details": {"api_usage": limits}}
        except Exception as e:
            return {"success": False, "message": str(e), "details": {}}

    async def sync(self, config: dict, secret_ref: Optional[str], incremental: bool, run_id: str) -> dict:
        try:
            sf = self._get_client(config)
            results = {}
            rows_total = 0
            semantic_pack = {"entity_candidates": [], "relationship_candidates": [], "metric_candidates": [], "synonyms": []}

            for obj in SALESFORCE_OBJECTS:
                try:
                    soql = f"SELECT FIELDS(STANDARD) FROM {obj} LIMIT 5000"
                    records = sf.query_all(soql).get("records", [])
                    results[obj.lower()] = records
                    rows_total += len(records)
                    semantic_pack["entity_candidates"].append({
                        "entity": obj, "table": f"sf_{obj.lower()}",
                        "confidence": 0.97, "evidence": ["salesforce_standard_object"]
                    })
                except Exception as obj_err:
                    log.warning("sf.object_skip", obj=obj, error=str(obj_err))

            # Define standard relationships
            semantic_pack["relationship_candidates"] = [
                {"from": "Account", "to": "Opportunity", "from_col": "Id", "to_col": "AccountId", "confidence": 0.99},
                {"from": "Account", "to": "Contact", "from_col": "Id", "to_col": "AccountId", "confidence": 0.99},
                {"from": "Opportunity", "to": "Task", "from_col": "Id", "to_col": "WhatId", "confidence": 0.92},
                {"from": "Opportunity", "to": "OpportunityLineItem", "from_col": "Id", "to_col": "OpportunityId", "confidence": 0.99},
            ]
            semantic_pack["metric_candidates"] = [
                {"metric": "ARR", "field": "AnnualRevenue", "formula_hint": "SUM(AnnualRevenue) WHERE IsWon=true", "confidence": 0.90},
                {"metric": "Deal Amount", "field": "Amount", "formula_hint": "SUM(Amount)", "confidence": 0.95},
                {"metric": "Win Rate", "field": "IsWon", "formula_hint": "COUNT_IF(IsWon)/COUNT(*)", "confidence": 0.93},
                {"metric": "Stage Conversion", "field": "StageName", "formula_hint": "Funnel steps on StageName", "confidence": 0.88},
            ]

            profile = {
                "objects_synced": list(results.keys()),
                "row_counts": {k: len(v) for k, v in results.items()},
                "freshness": "live",
            }
            return {
                "rows_read": rows_total, "rows_written": rows_total,
                "sample_data": {k: v[:100] for k, v in results.items()},
                "profile_report": profile, "semantic_pack": semantic_pack,
            }
        except Exception as e:
            raise RuntimeError(f"Salesforce sync failed: {e}") from e

    def _get_client(self, config: dict):
        from simple_salesforce import Salesforce
        return Salesforce(
            username=config.get("username"),
            password=config.get("password"),
            security_token=config.get("security_token"),
            domain=config.get("domain", "login"),
        )

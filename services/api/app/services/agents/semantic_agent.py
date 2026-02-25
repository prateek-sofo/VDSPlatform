"""
SemanticAgent — Autonomous Knowledge Graph Discovery & Ontology Specialist.
"""
import uuid
import structlog
from typing import List, Dict, Optional
from app.services.llm.client import LLMClient
from app.db.session import AsyncSessionLocal
from app.db.models import EntityType, RelationshipType, DataSnapshot
from sqlalchemy import select

log = structlog.get_logger()

ONTOLOGY_DISCOVERY_PROMPT = """
ROLE: Palantir-Style Ontology Engineer
TASK: Analyze raw schema snapshots and industry blueprints to synthesize a formal Knowledge Graph (ontology).

INDUSTRY CONTEXT: {industry_context}
AVAILABLE TABLES/COLUMNS: {schema_manifest}

INSTRUCTIONS:
1. Map raw tables to Formal Entities (e.g., 'sf_accounts' -> 'Account').
2. Infer Relationships (Joins) between entities.
   - Look for standard foreign keys (account_id).
   - Look for fuzzy associations (email, domain, hashed_id).
3. Assign Confidence scores (0.0 - 1.0).
4. Categorize as 'PROPOSED' or 'CERTIFIED' (Use CERTIFIED only if mapping matches industry blueprint exactly).

GOAL: Build a high-fidelity ontology that enables complex cross-object analysis.

Return JSON:
{
  "entities": [{"name": "Account", "source_table": "...", "properties": {...}, "confidence": 0.95}],
  "relationships": [{"from": "Account", "to": "Opportunity", "type": "has_many", "keys": {"from": "id", "to": "account_id"}, "confidence": 0.9}],
  "industry_alignment": "..."
}
"""

class SemanticAgent:
    def __init__(self, tenant_id: str = "default"):
        self.tenant_id = tenant_id
        self.llm = LLMClient(agent_id="semantic_agent")

    async def discover_ontology(self, connector_id: str, industry: str = "revops") -> Dict:
        """Runs the autonomous discovery pipeline for a data source."""
        log.info("semantic.discovery.start", connector_id=connector_id, industry=industry)
        
        # 1. Load schema manifest
        schema_manifest = await self._get_schema_manifest(connector_id)
        
        # 2. Call LLM with industry context
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": "Discover ontology for this schema."}],
            system_prompt=ONTOLOGY_DISCOVERY_PROMPT.format(
                industry_context=industry,
                schema_manifest=str(schema_manifest)[:4000]
            ),
            temperature=0.1
        )
        
        # 3. Persist proposals
        await self._save_ontology_proposals(result)
        
        return result

    async def _get_schema_manifest(self, connector_id: str) -> Dict:
        async with AsyncSessionLocal() as db:
            snapshots = (await db.execute(
                select(DataSnapshot).where(DataSnapshot.connector_id == connector_id)
            )).scalars().all()
            return {s.table_name: s.schema_json for s in snapshots}

    async def _save_ontology_proposals(self, result: Dict):
        async with AsyncSessionLocal() as db:
            # Save proposed entities
            for ent in result.get("entities", []):
                new_ent = EntityType(
                    id=str(uuid.uuid4()),
                    tenant_id=self.tenant_id,
                    name=ent["name"],
                    description=f"Auto-discovered from {ent.get('source_table')}",
                    status="proposed" if ent.get("confidence", 0) < 0.9 else "certified",
                    properties=ent.get("properties", {}),
                    source_mappings={"table": ent.get("source_table"), "confidence": ent.get("confidence")}
                )
                db.add(new_ent)
            
            await db.commit()
            log.info("semantic.discovery.complete", entities=len(result.get("entities", [])))

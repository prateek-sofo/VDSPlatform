"""
Self-Learning Semantic Mapper — AI-driven join inference, entity mapping, synonym learning.
"""
import asyncio
from typing import Optional
import structlog
from app.services.llm.client import LLMClient

log = structlog.get_logger()


MAPPER_SYSTEM_PROMPT = """
ROLE: Semantic Mapper (Ontology Engineer + Domain SME + AI)
Map raw data tables and columns to business entities, relationships, and metrics.

TASKS:
1. Entity mapping: physical table → semantic entity + property mapping
   Confidence tiers: CONFIRMED (≥0.90) | SUGGESTED (0.70-0.89) | AMBIGUOUS (<0.70)

2. Relationship inference:
   - Name similarity + type match + value overlap + LLM business logic
   - Auto-accept CONFIRMED; queue SUGGESTED; block AMBIGUOUS

3. Metric definition: formula + grain + filters + synonyms + lineage

4. Synonym learning: map user vocabulary to canonical entities/metrics

5. Coverage scoring: % of domain concepts mapped

Return JSON with:
  entity_mappings, relationship_proposals, metric_definitions, synonym_additions,
  coverage_score, review_queue, recommendations
"""

NLQ_GROUNDING_PROMPT = """
ROLE: Semantic Mapper — NLQ Grounding
Map a natural language question to semantic entities, metrics, filters, and grains.

Given a question and the available semantic layer, return:
- entities: list of entity type names relevant to the question
- metrics: list of metric IDs or names from the semantic layer
- filters: inferred filters (time range, segments, status values)
- grain: the level of aggregation (account, deal, product, day, etc.)
- confidence: overall confidence that the mapping is correct
- missing_concepts: any concepts mentioned that aren't in the semantic layer
- suggested_sql_outline: high-level SQL structure (no actual execution)

Return JSON.
"""


class SemanticMapper:
    def __init__(self, connector_id: Optional[str] = None, job_id: Optional[str] = None):
        self.connector_id = connector_id
        self.job_id = job_id
        self.llm = LLMClient(agent_id="mapper")

    async def map_for_session(self, question: str, domain: str) -> dict:
        """Run mapping for a VDS session — ground the NL question + profile available entities."""
        grounding = await self.ground_nlq(question, domain)
        return {
            "grounding": grounding,
            "entities_matched": grounding.get("entities", []),
            "metrics_matched": grounding.get("metrics", []),
            "coverage_score": grounding.get("confidence", 0.8),
        }

    async def run(self, table_name: Optional[str] = None) -> dict:
        """Full AI-assisted mapping job against a connector's snapshot."""
        schema_info = await self._load_schema(table_name)
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": f"Map this schema to business entities:\n{schema_info}"}],
            system_prompt=MAPPER_SYSTEM_PROMPT,
            temperature=0.1,
        )
        # Persist suggestions to DB
        await self._persist_suggestions(result)
        return result

    async def ground_nlq(self, question: str, domain: str) -> dict:
        """Map an NL question to semantic entities + metrics + filters."""
        # Load available entities + metrics from DB
        semantic_context = await self._load_semantic_context(domain)
        prompt = f"""
Question: {question}
Domain: {domain}
Available entities: {', '.join(semantic_context.get('entities', []))}
Available metrics: {', '.join(semantic_context.get('metrics', []))}

Ground the question to the semantic layer.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=NLQ_GROUNDING_PROMPT,
            temperature=0.1,
        )
        return result

    async def _load_schema(self, table_name: Optional[str]) -> str:
        """Load schema from the last connector sync if available."""
        if not self.connector_id:
            return "No connector specified."
        from app.db.session import AsyncSessionLocal
        from app.db.models import DataConnector
        async with AsyncSessionLocal() as db:
            connector = await db.get(DataConnector, self.connector_id)
            if connector and connector.schema_manifest:
                manifest = connector.schema_manifest
                if table_name:
                    return str(manifest.get(table_name, manifest))
                return str(manifest)[:3000]
        return "Schema not available."

    async def _load_semantic_context(self, domain: str) -> dict:
        from app.db.session import AsyncSessionLocal
        from app.db.models import EntityType, MetricDefinition
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            entities = (await db.execute(
                select(EntityType.name).where(EntityType.domain.in_([domain, "generic"]))
            )).scalars().all()
            metrics = (await db.execute(
                select(MetricDefinition.name).where(MetricDefinition.domain.in_([domain, "generic"]))
            )).scalars().all()
        return {"entities": list(entities), "metrics": list(metrics)}

    async def _persist_suggestions(self, result: dict):
        """Write entity and relationship proposals to DB in draft status."""
        from app.db.session import AsyncSessionLocal
        from app.db.models import EntityType, RelationshipType
        import uuid
        async with AsyncSessionLocal() as db:
            for entity in result.get("entity_mappings", []):
                if entity.get("confidence", 0) >= 0.70:
                    existing = EntityType(
                        id=str(uuid.uuid4()),
                        tenant_id="default",
                        name=entity.get("entity", "Unknown"),
                        domain="generic",
                        status="draft",
                        source_mappings=entity,
                    )
                    db.add(existing)
            await db.commit()

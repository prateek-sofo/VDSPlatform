"""
Self-Learning Semantic Mapper — AI-driven join inference, entity mapping, synonym learning.
"""
import asyncio
import structlog
import uuid
import json
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import DataConnector, EntityType, RelationshipType, MetricDefinition
from app.services.llm.client import LLMClient

log = structlog.get_logger()

MAPPER_SYSTEM_PROMPT = """
ROLE: Senior Semantic Engineer (Ontology & Knowledge Graph Specialist)
Map raw data schemas to high-fidelity business entities and relationships.

DIAGNOSTIC TASKS:
1. Combinatorial Join Inference: Analyze all possible combinations of keys (IDs, names, codes) across tables to identify the most semantically valid relationships.
2. Industry Blueprint Mapping: Identify if the data matches specific domain patterns (RevOps, Finance, Supply Chain) and apply standard naming conventions.
3. Property Extraction: Map columns to semantic roles (Identity, Dimension, Measure, Timestamp, Attribute).
4. Logic Validation: Ensure that suggested joins are logical (e.g., matching a foreign key to a primary key of the same concept).

OUTPUT FORMAT:
Return a JSON object:
- entities: List of {name, description, columns: [], domain, confidence}
- relationships: List of {from_entity, to_entity, join_keys: {}, relationship_type, confidence}
- metrics: List of basic {name, formula, entity}
- domain_blueprint: The detected industry archetype.
- inference_notes: Explanation of why specific mappings were chosen over others.
"""

NLQ_GROUNDING_PROMPT = """
ROLE: Semantic Mapper — NLQ Grounding
Map a natural language question to semantic entities, metrics, filters, and grains.

Given a question and the available semantic layer, return JSON with:
- entities: list of entity type names relevant to the question
- metrics: list of metric IDs or names from the semantic layer
- filters: inferred filters (time range, segments, status values)
- grain: the level of aggregation
- confidence: overall confidence
"""

class SemanticMapper:
    def __init__(self, connector_id: Optional[str] = None, job_id: Optional[str] = None):
        self.connector_id = connector_id
        self.job_id = job_id
        self.llm = LLMClient(agent_id="mapper")

    async def run(self, table_name: Optional[str] = None) -> dict:
        """
        Execute high-inference semantic mapping.
        """
        schema_info = await self._load_schema(table_name)
        
        # Step 1: Combinatorial Inference & Blueprint Identification
        prompt = f"""
        Analyze the following schema manifest and perform combinatorial inference for entities and relationships.
        SCHEMA:
        {schema_info}
        """
        
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=MAPPER_SYSTEM_PROMPT,
            temperature=0.1
        )
        
        # Step 2: Persistence
        await self._persist_inference(result)
        
        return result

    async def ground_nlq(self, question: str, domain: str) -> dict:
        """Map an NL question to semantic entities + metrics + filters."""
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
        if not self.connector_id:
            return "No connector specified."
        async with AsyncSessionLocal() as db:
            connector = await db.get(DataConnector, self.connector_id)
            if connector and connector.schema_manifest:
                manifest = connector.schema_manifest
                if table_name:
                    return json.dumps(manifest.get(table_name, manifest), indent=2)
                return json.dumps(manifest, indent=2)[:5000]
        return "Schema not available."

    async def _load_semantic_context(self, domain: str) -> dict:
        async with AsyncSessionLocal() as db:
            entities = (await db.execute(
                select(EntityType.name).where(EntityType.domain.in_([domain, "generic"]))
            )).scalars().all()
            metrics = (await db.execute(
                select(MetricDefinition.name).where(MetricDefinition.domain.in_([domain, "generic"]))
            )).scalars().all()
        return {"entities": list(entities), "metrics": list(metrics)}

    async def _persist_inference(self, result: dict):
        """Persist inferred entities and relationships with draft/proposed status."""
        async with AsyncSessionLocal() as db:
            # Upsert Entities
            for ent in result.get("entities", []):
                if ent.get("confidence", 0) >= 0.7:
                    new_ent = EntityType(
                        id=str(uuid.uuid4()),
                        tenant_id="default",
                        name=ent["name"],
                        description=ent.get("description"),
                        domain=ent.get("domain", "generic"),
                        status="draft",
                        properties={"columns": ent.get("columns", [])},
                        source_mappings={"inference_notes": result.get("inference_notes")}
                    )
                    db.add(new_ent)
            
            # Upsert Relationships
            for rel in result.get("relationships", []):
                if rel.get("confidence", 0) >= 0.7:
                    new_rel = RelationshipType(
                        id=str(uuid.uuid4()),
                        tenant_id="default",
                        from_entity_id=rel["from_entity"],
                        to_entity_id=rel["to_entity"],
                        name=rel.get("relationship_type", "related_to"),
                        join_keys=rel.get("join_keys", {}),
                        confidence=rel["confidence"],
                        status="proposed"
                    )
                    db.add(new_rel)
            
            await db.commit()

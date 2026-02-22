"""
Semantic Layer API — Entity types, relationship types, metric definitions,
AI-assisted mapping suggestions, and synonym management.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import structlog

from app.db.session import get_db
from app.db.models import EntityType, RelationshipType, MetricDefinition, MetricStatus
from app.services.semantic.mapper import SemanticMapper
from app.services.semantic.metric_compiler import MetricCompiler

log = structlog.get_logger()
router = APIRouter()


# ---------------------------------------------------------------------------
# Entities
# ---------------------------------------------------------------------------

class EntityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    domain: str = "generic"
    properties: dict = {}


class EntityResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    domain: str
    version: int
    status: str
    properties: dict
    source_mappings: dict
    created_at: str

    class Config:
        from_attributes = True


@router.get("/entities", response_model=list[EntityResponse])
async def list_entities(domain: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(EntityType)
    if domain:
        q = q.where(EntityType.domain == domain)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/entities", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
async def create_entity(body: EntityCreate, db: AsyncSession = Depends(get_db)):
    entity = EntityType(id=str(uuid.uuid4()), tenant_id="default", **body.model_dump())
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
    return entity


@router.get("/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(entity_id: str, db: AsyncSession = Depends(get_db)):
    obj = await db.get(EntityType, entity_id)
    if not obj:
        raise HTTPException(404, "Entity not found")
    return obj


# ---------------------------------------------------------------------------
# Relationships
# ---------------------------------------------------------------------------

class RelationshipCreate(BaseModel):
    from_entity_id: str
    to_entity_id: str
    name: str
    join_keys: dict
    confidence: float = 1.0


class RelationshipResponse(BaseModel):
    id: str
    from_entity_id: str
    to_entity_id: str
    name: str
    join_keys: dict
    confidence: float
    status: str
    evidence: dict
    created_at: str

    class Config:
        from_attributes = True


@router.get("/relationships", response_model=list[RelationshipResponse])
async def list_relationships(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RelationshipType))
    return result.scalars().all()


@router.post("/relationships", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_relationship(body: RelationshipCreate, db: AsyncSession = Depends(get_db)):
    rel = RelationshipType(id=str(uuid.uuid4()), tenant_id="default", **body.model_dump())
    db.add(rel)
    await db.commit()
    await db.refresh(rel)
    return rel


@router.post("/relationships/{rel_id}/approve")
async def approve_relationship(rel_id: str, db: AsyncSession = Depends(get_db)):
    rel = await db.get(RelationshipType, rel_id)
    if not rel:
        raise HTTPException(404, "Relationship not found")
    rel.status = "confirmed"
    await db.commit()
    return {"id": rel_id, "status": "confirmed"}


@router.post("/relationships/{rel_id}/reject")
async def reject_relationship(rel_id: str, db: AsyncSession = Depends(get_db)):
    rel = await db.get(RelationshipType, rel_id)
    if not rel:
        raise HTTPException(404, "Relationship not found")
    rel.status = "rejected"
    await db.commit()
    return {"id": rel_id, "status": "rejected"}


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

class MetricCreate(BaseModel):
    name: str
    description: Optional[str] = None
    formula: str
    grain: list = []
    filters: dict = {}
    synonyms: list = []
    domain: str = "generic"
    owner: Optional[str] = None


class MetricResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    formula: str
    grain: list
    synonyms: list
    domain: str
    version: int
    status: str
    owner: Optional[str]
    lineage: dict
    created_at: str

    class Config:
        from_attributes = True


@router.get("/metrics", response_model=list[MetricResponse])
async def list_metrics(domain: Optional[str] = None, status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(MetricDefinition)
    if domain:
        q = q.where(MetricDefinition.domain == domain)
    if status:
        q = q.where(MetricDefinition.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/metrics", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
async def create_metric(body: MetricCreate, db: AsyncSession = Depends(get_db)):
    metric = MetricDefinition(id=str(uuid.uuid4()), tenant_id="default", **body.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.post("/metrics/{metric_id}/certify")
async def certify_metric(metric_id: str, db: AsyncSession = Depends(get_db)):
    metric = await db.get(MetricDefinition, metric_id)
    if not metric:
        raise HTTPException(404, "Metric not found")
    metric.status = MetricStatus.certified
    metric.version += 1
    await db.commit()
    return {"id": metric_id, "status": "certified", "version": metric.version}


@router.post("/metrics/{metric_id}/validate")
async def validate_metric(metric_id: str, db: AsyncSession = Depends(get_db)):
    """Compile and validate the metric formula against the entity registry."""
    metric = await db.get(MetricDefinition, metric_id)
    if not metric:
        raise HTTPException(404, "Metric not found")
    compiler = MetricCompiler()
    result = await compiler.validate(metric.formula)
    return result


# ---------------------------------------------------------------------------
# AI-Assisted Mapping
# ---------------------------------------------------------------------------

class MappingSuggestRequest(BaseModel):
    connector_id: str
    table_name: Optional[str] = None  # if None, run on all tables in last snapshot


@router.post("/mapping/suggest")
async def suggest_mappings(
    body: MappingSuggestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    AI-driven semantic mapping suggestion.
    Runs join inference, entity mapping, and synonym discovery.
    Returns candidates in the suggestion queue.
    """
    suggestion_job_id = str(uuid.uuid4())
    background_tasks.add_task(
        run_mapping_inference, body.connector_id, body.table_name, suggestion_job_id
    )
    return {"job_id": suggestion_job_id, "status": "queued", "message": "Mapping inference started. Check /mapping/suggestions for results."}


async def run_mapping_inference(connector_id: str, table_name: Optional[str], job_id: str):
    mapper = SemanticMapper(connector_id=connector_id, job_id=job_id)
    await mapper.run(table_name=table_name)


@router.get("/mapping/suggestions")
async def get_mapping_suggestions(connector_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Return pending mapping suggestions for human review."""
    result = await db.execute(
        select(RelationshipType).where(RelationshipType.status == "proposed")
    )
    pending_rels = result.scalars().all()
    result2 = await db.execute(
        select(EntityType).where(EntityType.status == "draft")
    )
    pending_entities = result2.scalars().all()
    return {
        "pending_entities": [{"id": e.id, "name": e.name, "confidence": e.source_mappings.get("confidence", 0)} for e in pending_entities],
        "pending_relationships": [{"id": r.id, "from": r.from_entity_id, "to": r.to_entity_id, "confidence": r.confidence} for r in pending_rels],
    }


# ---------------------------------------------------------------------------
# NLQ Grounding
# ---------------------------------------------------------------------------

class NLQGroundRequest(BaseModel):
    question: str
    domain: str = "generic"


@router.post("/nlq/ground")
async def ground_nlq(body: NLQGroundRequest, db: AsyncSession = Depends(get_db)):
    """
    Map a natural language question to semantic entities + metrics.
    Returns: interpreted entities, metrics, filters, and confidence.
    """
    mapper = SemanticMapper(connector_id=None)
    result = await mapper.ground_nlq(body.question, body.domain)
    return result


# ---------------------------------------------------------------------------
# Domain Templates
# ---------------------------------------------------------------------------

@router.get("/domains")
async def list_domain_templates():
    """Return available domain ontology templates."""
    from app.services.semantic.domain_packs import DOMAIN_PACKS
    return [{"id": k, **v["meta"]} for k, v in DOMAIN_PACKS.items()]


@router.post("/domains/{domain_id}/install")
async def install_domain_pack(domain_id: str, db: AsyncSession = Depends(get_db)):
    """Install all entities, relationships, and metrics for a domain template."""
    from app.services.semantic.domain_packs import DOMAIN_PACKS, install_domain
    if domain_id not in DOMAIN_PACKS:
        raise HTTPException(404, f"Domain pack '{domain_id}' not found")
    result = await install_domain(domain_id, db)
    return result

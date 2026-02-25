"""
Connector Catalog API — CRUD for data connectors + sync management.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import structlog

from app.db.session import get_db
from app.db.models import DataConnector, SyncRun, ConnectorType, ConnectorStatus
from app.services.connectors.registry import ConnectorRegistry

log = structlog.get_logger()
router = APIRouter()


class ConnectorCreate(BaseModel):
    name: str
    connector_type: ConnectorType
    config: dict = {}  # non-sensitive config (host, port, database name, etc.)
    secret_ref: Optional[str] = None  # vault key


class ConnectorResponse(BaseModel):
    id: str
    name: str
    connector_type: str
    status: str
    last_sync_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SyncRunResponse(BaseModel):
    id: str
    status: str
    rows_read: int
    rows_written: int
    rows_failed: int
    started_at: datetime
    finished_at: Optional[datetime]
    profile_report: Optional[dict]
    semantic_pack: Optional[dict]

    class Config:
        from_attributes = True


class TestConnectionResult(BaseModel):
    success: bool
    message: str
    details: dict = {}


@router.get("/catalog")
async def get_catalog():
    """Return all available connector types with metadata."""
    return ConnectorRegistry.catalog()


@router.post("/", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
async def create_connector(
    body: ConnectorCreate,
    db: AsyncSession = Depends(get_db),
):
    connector = DataConnector(
        id=str(uuid.uuid4()),
        tenant_id="default",
        name=body.name,
        connector_type=body.connector_type,
        config=body.config,
        secret_ref=body.secret_ref,
        status=ConnectorStatus.pending,
    )
    db.add(connector)
    await db.commit()
    await db.refresh(connector)
    log.info("connector.created", id=connector.id, type=connector.connector_type)
    return connector


@router.get("/", response_model=list[ConnectorResponse])
async def list_connectors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataConnector))
    return result.scalars().all()


@router.get("/{connector_id}/sample")
async def get_connector_sample(
    connector_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a sample of data from a connector for the Data Explorer."""
    connector = await _get_or_404(db, connector_id)
    try:
        impl = ConnectorRegistry.get(connector.connector_type)
        # Use sync logic but just for sampling
        result = await impl.sync(connector.config, connector.secret_ref, False, str(uuid.uuid4()))
        data = result.get("sample_data", [])[:limit]
        return {"data": data, "columns": list(data[0].keys()) if data else []}
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch sample: {str(e)}")


@router.get("/{connector_id}", response_model=ConnectorResponse)
async def get_connector(connector_id: str, db: AsyncSession = Depends(get_db)):
    return await _get_or_404(db, connector_id)


@router.post("/{connector_id}/test", response_model=TestConnectionResult)
async def test_connection(connector_id: str, db: AsyncSession = Depends(get_db)):
    connector = await _get_or_404(db, connector_id)
    try:
        impl = ConnectorRegistry.get(connector.connector_type)
        result = await impl.test_connection(connector.config, connector.secret_ref)
        connector.status = ConnectorStatus.connected if result["success"] else ConnectorStatus.error
        await db.commit()
        return TestConnectionResult(**result)
    except Exception as e:
        connector.status = ConnectorStatus.error
        connector.last_error = str(e)
        await db.commit()
        return TestConnectionResult(success=False, message=str(e))


@router.post("/{connector_id}/sync", response_model=SyncRunResponse)
async def trigger_sync(
    connector_id: str,
    background_tasks: BackgroundTasks,
    incremental: bool = True,
    db: AsyncSession = Depends(get_db),
):
    connector = await _get_or_404(db, connector_id)
    run = SyncRun(id=str(uuid.uuid4()), connector_id=connector_id)
    db.add(run)
    connector.status = ConnectorStatus.syncing
    await db.commit()
    await db.refresh(run)

    background_tasks.add_task(
        execute_sync, connector_id, run.id, incremental
    )
    return run


async def execute_sync(connector_id: str, run_id: str, incremental: bool):
    """Background sync execution."""
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        connector = await db.get(DataConnector, connector_id)
        run = await db.get(SyncRun, run_id)
        try:
            impl = ConnectorRegistry.get(connector.connector_type)
            result = await impl.sync(
                config=connector.config,
                secret_ref=connector.secret_ref,
                incremental=incremental,
                run_id=run_id,
            )
            run.rows_read = result.get("rows_read", 0)
            run.rows_written = result.get("rows_written", 0)
            run.status = "completed"
            run.profile_report = result.get("profile_report")
            run.semantic_pack = result.get("semantic_pack")
            connector.status = ConnectorStatus.connected
            from datetime import datetime, timezone
            connector.last_sync_at = datetime.now(timezone.utc)
            run.finished_at = datetime.now(timezone.utc)
        except Exception as e:
            run.status = "failed"
            run.error_log = str(e)
            connector.status = ConnectorStatus.error
            connector.last_error = str(e)
            log.error("sync.failed", connector_id=connector_id, error=str(e))
        await db.commit()


@router.get("/{connector_id}/runs", response_model=list[SyncRunResponse])
async def get_sync_runs(connector_id: str, db: AsyncSession = Depends(get_db)):
    await _get_or_404(db, connector_id)
    result = await db.execute(
        select(SyncRun).where(SyncRun.connector_id == connector_id).order_by(SyncRun.started_at.desc()).limit(20)
    )
    return result.scalars().all()




@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connector(connector_id: str, db: AsyncSession = Depends(get_db)):
    connector = await _get_or_404(db, connector_id)
    await db.delete(connector)
    await db.commit()


async def _get_or_404(db: AsyncSession, connector_id: str) -> DataConnector:
    obj = await db.get(DataConnector, connector_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Connector not found")
    return obj

"""
Sessions API — Create and manage VDS analysis sessions.
Supports streaming for live agent step updates.
"""
import uuid
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import json
import structlog

from app.db.session import get_db
from app.db.models import VDSSession, SessionMessage, SessionArtifact, AutonomyLevel, SessionStatus
from app.services.orchestration.supervisor import SupervisorAgent
from app.core.config import settings

log = structlog.get_logger()
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    question: str
    domain: str = "generic"
    autonomy_level: AutonomyLevel = AutonomyLevel.assist
    connector_ids: list[str] = []
    context: dict = {}


class SessionResponse(BaseModel):
    id: str
    title: Optional[str]
    status: str
    domain: str
    autonomy_level: str
    goal: Optional[str]
    plan: Optional[dict]
    current_step_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    role: str
    agent: Optional[str]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ArtifactResponse(BaseModel):
    id: str
    artifact_type: str
    name: str
    content: dict
    agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalAction(BaseModel):
    approved: bool
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Create a new VDS session and begin the agentic pipeline."""
    session = VDSSession(
        id=str(uuid.uuid4()),
        tenant_id="default",  # TODO: extract from JWT
        title=body.question[:120],
        domain=body.domain,
        autonomy_level=body.autonomy_level,
        status=SessionStatus.created,
        goal=body.question,
        context={"connector_ids": body.connector_ids, **body.context},
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Add user message
    user_msg = SessionMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="user",
        content=body.question,
    )
    db.add(user_msg)
    await db.commit()

    # Kick off supervisor in background
    background_tasks.add_task(
        run_supervisor_pipeline, session.id, body.question, body.domain,
        body.autonomy_level, body.connector_ids
    )

    log.info("session.created", session_id=session.id, domain=body.domain)
    return session


async def run_supervisor_pipeline(
    session_id: str, question: str, domain: str,
    autonomy: AutonomyLevel, connector_ids: list[str]
):
    """Background task running the full multi-agent pipeline."""
    supervisor = SupervisorAgent(
        session_id=session_id,
        question=question,
        domain=domain,
        autonomy_level=autonomy,
        connector_ids=connector_ids,
    )
    await supervisor.run()


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await _get_or_404(db, session_id)
    return session


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    await _get_or_404(db, session_id)
    result = await db.execute(
        select(SessionMessage)
        .where(SessionMessage.session_id == session_id)
        .order_by(SessionMessage.created_at)
    )
    return result.scalars().all()


@router.get("/{session_id}/artifacts", response_model=list[ArtifactResponse])
async def get_artifacts(session_id: str, db: AsyncSession = Depends(get_db)):
    await _get_or_404(db, session_id)
    result = await db.execute(
        select(SessionArtifact).where(SessionArtifact.session_id == session_id)
    )
    return result.scalars().all()


@router.get("/{session_id}/stream")
async def stream_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """SSE endpoint — streams agent step updates to the UI Plan pane."""
    await _get_or_404(db, session_id)

    async def event_generator() -> AsyncGenerator[str, None]:
        last_seen = 0
        while True:
            result = await db.execute(
                select(SessionMessage)
                .where(SessionMessage.session_id == session_id)
                .order_by(SessionMessage.created_at)
                .offset(last_seen)
            )
            msgs = result.scalars().all()
            for msg in msgs:
                data = {
                    "role": msg.role,
                    "agent": msg.agent,
                    "content": msg.content[:500],
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_seen += 1

            # Check if session is done
            session = await db.get(VDSSession, session_id)
            if session and session.status in (SessionStatus.done, SessionStatus.failed):
                yield f"data: {json.dumps({'event': 'done', 'status': session.status})}\n\n"
                break
            await asyncio.sleep(1.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/{session_id}/approve")
async def approve_checkpoint(
    session_id: str,
    body: ApprovalAction,
    db: AsyncSession = Depends(get_db),
):
    """Human-in-loop approval gate for semi-auto/assist mode."""
    session = await _get_or_404(db, session_id)
    if session.status != SessionStatus.checkpoint:
        raise HTTPException(400, "Session is not awaiting approval.")

    session.context["approval"] = {"approved": body.approved, "note": body.note}
    session.status = SessionStatus.executing if body.approved else SessionStatus.failed
    await db.commit()
    return {"approved": body.approved, "session_id": session_id}


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await _get_or_404(db, session_id)
    await db.delete(session)
    await db.commit()


async def _get_or_404(db: AsyncSession, session_id: str) -> VDSSession:
    session = await db.get(VDSSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

"""
Supervisor Agent — The master orchestrator that runs the full multi-agent pipeline.

Pipeline: Problem Framer → Connector → Semantic Mapper → Data Quality
          → EDA & Hypothesis → Modeling → Insight Narrator → Action → Governance
"""
import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional
import structlog

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.db.models import (
    VDSSession, SessionMessage, SessionArtifact,
    AuditEvent, SessionStatus, AutonomyLevel
)
from app.services.agents.problem_framer import ProblemFramerAgent
from app.services.agents.data_quality import DataQualityAgent
from app.services.agents.eda_hypothesis import EDAHypothesisAgent
from app.services.agents.modeling import ModelingAgent
from app.services.agents.insight_narrator import InsightNarratorAgent
from app.services.agents.action_agent import ActionAgent
from app.services.agents.governance import GovernanceAgent
from app.services.semantic.mapper import SemanticMapper
from app.services.llm.client import LLMClient

log = structlog.get_logger()

STEP_AGENTS = [
    ("frame",     "Problem Framer",     ProblemFramerAgent),
    ("map",       "Semantic Mapper",    None),          # handled inline
    ("quality",   "Data Quality",       DataQualityAgent),
    ("eda",       "EDA & Hypothesis",   EDAHypothesisAgent),
    ("model",     "Modeling",           ModelingAgent),
    ("narrate",   "Insight Narrator",   InsightNarratorAgent),
    ("act",       "Action",             ActionAgent),
    ("govern",    "Governance",         GovernanceAgent),
]


class SupervisorAgent:
    """
    Owns the full session lifecycle:
      1. Build plan
      2. Execute each specialist agent in sequence
      3. Handle checkpoints (autonomy dial)
      4. Persist all messages, artifacts, audit events
      5. Produce final consolidated output
    """

    def __init__(
        self,
        session_id: str,
        question: str,
        domain: str,
        autonomy_level: AutonomyLevel,
        connector_ids: list[str],
    ):
        self.session_id = session_id
        self.question = question
        self.domain = domain
        self.autonomy = autonomy_level
        self.connector_ids = connector_ids
        self.llm = LLMClient()
        self.context: dict = {}  # shared context across agents

    async def run(self):
        async with AsyncSessionLocal() as db:
            session = await db.get(VDSSession, self.session_id)
            session.status = SessionStatus.planned
            plan = self._build_plan()
            session.plan = plan
            await db.commit()

        log.info("supervisor.start", session_id=self.session_id, domain=self.domain)

        # Run each step
        for step_index, (step_id, step_name, AgentClass) in enumerate(STEP_AGENTS):
            try:
                await self._update_session_step(step_index, SessionStatus.executing)
                await self._post_message("system", f"▶ Starting: **{step_name}**", agent="supervisor")

                if self.autonomy == AutonomyLevel.assist and step_index > 0:
                    await self._wait_for_approval(step_index, step_name)

                if step_id == "map":
                    result = await self._run_semantic_mapping()
                else:
                    agent = AgentClass(
                        session_id=self.session_id,
                        domain=self.domain,
                        context=self.context,
                        connector_ids=self.connector_ids,
                        llm=self.llm,
                    )
                    result = await agent.run(self.question)

                self.context[step_id] = result
                await self._persist_artifacts(step_id, step_name, result)
                await self._post_message("assistant", f"✅ {step_name} complete.", agent=step_id)
                await self._emit_audit(f"agent.{step_id}.complete", result)

                # Semi-auto: checkpoint before modeling or action steps
                if self.autonomy == AutonomyLevel.semi_auto and step_id in ("model", "act"):
                    await self._wait_for_approval(step_index, step_name)

            except Exception as e:
                log.error("supervisor.step_failed", step=step_id, error=str(e))
                await self._post_message("system", f"❌ {step_name} failed: {e}", agent="supervisor")
                await self._update_session_step(step_index, SessionStatus.failed)
                return

        # Finalize
        await self._finalize()
        log.info("supervisor.done", session_id=self.session_id)

    def _build_plan(self) -> dict:
        return {
            "steps": [
                {"index": i, "id": s[0], "name": s[1], "status": "pending"}
                for i, s in enumerate(STEP_AGENTS)
            ]
        }

    async def _run_semantic_mapping(self) -> dict:
        mapper = SemanticMapper(connector_id=self.connector_ids[0] if self.connector_ids else None)
        return await mapper.map_for_session(self.question, self.domain)

    async def _wait_for_approval(self, step_index: int, step_name: str):
        """Pause execution and wait until the session context has an approval."""
        await self._update_session_step(step_index, SessionStatus.checkpoint)
        await self._post_message(
            "system",
            f"⏸ Checkpoint before **{step_name}**. Please review the plan above and approve to continue.",
            agent="supervisor",
        )
        # Poll for approval (UI calls POST /sessions/{id}/approve)
        for _ in range(120):  # timeout after 10 min
            await asyncio.sleep(5)
            async with AsyncSessionLocal() as db:
                session = await db.get(VDSSession, self.session_id)
                approval = session.context.get("approval")
                if approval:
                    if not approval.get("approved"):
                        raise Exception("User rejected the checkpoint.")
                    # Clear approval for next checkpoint
                    session.context.pop("approval", None)
                    await db.commit()
                    return
        raise Exception("Approval timeout")

    async def _update_session_step(self, step_index: int, status: SessionStatus):
        async with AsyncSessionLocal() as db:
            session = await db.get(VDSSession, self.session_id)
            session.status = status
            session.current_step_index = step_index
            if session.plan:
                session.plan["steps"][step_index]["status"] = status.value
            await db.commit()

    async def _post_message(self, role: str, content: str, agent: Optional[str] = None):
        async with AsyncSessionLocal() as db:
            msg = SessionMessage(
                id=str(uuid.uuid4()),
                session_id=self.session_id,
                role=role,
                agent=agent,
                content=content,
            )
            db.add(msg)
            await db.commit()

    async def _persist_artifacts(self, step_id: str, step_name: str, result: dict):
        artifacts_to_save = []
        for key, val in result.items():
            if isinstance(val, dict) and val:
                artifacts_to_save.append(
                    SessionArtifact(
                        id=str(uuid.uuid4()),
                        session_id=self.session_id,
                        artifact_type=key,
                        name=f"{step_name}: {key}",
                        content=val,
                        agent=step_id,
                    )
                )
        if artifacts_to_save:
            async with AsyncSessionLocal() as db:
                db.add_all(artifacts_to_save)
                await db.commit()

    async def _emit_audit(self, action: str, payload: dict):
        async with AsyncSessionLocal() as db:
            event = AuditEvent(
                id=str(uuid.uuid4()),
                tenant_id="default",
                session_id=self.session_id,
                actor=f"agent:supervisor",
                action=action,
                payload={k: str(v)[:500] for k, v in payload.items() if k != "raw_data"},
                policy_decision="PASS",
                timestamp=datetime.now(timezone.utc),
            )
            db.add(event)
            await db.commit()

    async def _finalize(self):
        narration = self.context.get("narrate", {})
        governance = self.context.get("govern", {})
        final = {
            "executive_summary": narration.get("executive_summary", ""),
            "findings": narration.get("findings", []),
            "recommendations": narration.get("recommendations", []),
            "governance_status": governance.get("status", "PASS"),
            "artifacts": list(self.context.keys()),
        }
        async with AsyncSessionLocal() as db:
            session = await db.get(VDSSession, self.session_id)
            session.status = SessionStatus.done
            session.final_output = final
            await db.commit()
        await self._post_message("assistant", narration.get("executive_summary", "Analysis complete."), agent="narrator")

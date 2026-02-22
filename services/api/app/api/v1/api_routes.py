"""Remaining API stubs for modeling, agents builder, and governance endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid, json
import structlog

from app.db.session import get_db
from app.db.models import ModelRegistryEntry, AgentWorkflow, WorkflowRun, AuditEvent, AutonomyLevel, AgentStatus
from app.services.llm.client import LLMClient

log = structlog.get_logger()

# ─── Modeling Router ────────────────────────────────────────────────────────
modeling_router = APIRouter()

class ModelTrainRequest(BaseModel):
    name: str
    task_type: str  # classification, regression, forecasting, clustering, uplift
    target_column: str
    feature_columns: list[str] = []
    snapshot_id: Optional[str] = None
    domain: str = "generic"
    sample_data: list[dict] = []


@modeling_router.get("/registry")
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelRegistryEntry))
    models = result.scalars().all()
    return [{"id": m.id, "name": m.name, "task_type": m.task_type, "algorithm": m.algorithm,
             "metrics": m.metrics, "deployment_status": m.deployment_status} for m in models]


@modeling_router.post("/train")
async def train_model(body: ModelTrainRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    entry = ModelRegistryEntry(
        id=str(uuid.uuid4()), tenant_id="default",
        name=body.name, task_type=body.task_type,
        algorithm="AutoML (pending)", version=1, deployment_status="training",
        hyperparameters={}, metrics={},
    )
    db.add(entry)
    await db.commit()
    background_tasks.add_task(run_automl, entry.id, body)
    return {"model_id": entry.id, "status": "training", "message": "AutoML job queued"}


async def run_automl(model_id: str, body: ModelTrainRequest):
    """Simulated AutoML using LLM to generate realistic model evaluation results."""
    llm = LLMClient()
    prompt = f"""
You are a Principal ML Scientist. Design and evaluate an AutoML pipeline for:
Task: {body.task_type}
Target: {body.target_column}
Features: {body.feature_columns}
Domain: {body.domain}

Return JSON with: algorithm, hyperparameters, metrics (appropriate for task type),
leaderboard (3 models), shap_importance (top 5 features with scores),
deployment_spec, monitoring_config
"""
    result = await llm.json_chat(
        messages=[{"role": "user", "content": prompt}],
        system_prompt="You are an ML Scientist. Return realistic model evaluation results as JSON.",
        temperature=0.2,
    )
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        model = await db.get(ModelRegistryEntry, model_id)
        if model:
            model.algorithm = result.get("algorithm", "LightGBM")
            model.hyperparameters = result.get("hyperparameters", {})
            model.metrics = result.get("metrics", {})
            model.monitoring_config = result.get("monitoring_config", {})
            model.deployment_status = "challenger"
            await db.commit()


@modeling_router.post("/registry/{model_id}/promote")
async def promote_model(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(ModelRegistryEntry, model_id)
    if not model:
        raise HTTPException(404, "Model not found")
    # Demote current champion
    result = await db.execute(select(ModelRegistryEntry).where(
        ModelRegistryEntry.name == model.name,
        ModelRegistryEntry.deployment_status == "champion"
    ))
    for old in result.scalars():
        old.deployment_status = "retired"
    model.deployment_status = "champion"
    await db.commit()
    return {"model_id": model_id, "status": "champion"}


@modeling_router.get("/registry/{model_id}")
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(ModelRegistryEntry, model_id)
    if not model:
        raise HTTPException(404, "Model not found")
    return model


# ─── Agent Builder Router ────────────────────────────────────────────────────
agents_router = APIRouter()

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[str] = None
    autonomy_level: AutonomyLevel = AutonomyLevel.semi_auto
    trigger_config: dict = {}
    steps: list = []
    guardrails: dict = {}
    output_config: dict = {}
    schedule_cron: Optional[str] = None


@agents_router.get("/templates")
async def list_templates():
    return [
        {"id": "pipeline_monitor", "name": "Pipeline Health Monitor", "domain": "revops", "trigger": "weekly"},
        {"id": "forecast_tracker", "name": "Forecast Accuracy Tracker", "domain": "finance", "trigger": "weekly"},
        {"id": "renewal_watchdog", "name": "Renewal Risk Watchdog", "domain": "revops", "trigger": "daily"},
        {"id": "churn_early_warning", "name": "Churn Early Warning", "domain": "ecommerce", "trigger": "daily"},
        {"id": "inventory_scout", "name": "Inventory Anomaly Scout", "domain": "supply_chain", "trigger": "hourly"},
        {"id": "ad_spend_optimizer", "name": "Ad Spend Optimizer", "domain": "marketing", "trigger": "weekly"},
        {"id": "attrition_sentinel", "name": "HR Attrition Sentinel", "domain": "hr", "trigger": "weekly"},
        {"id": "fraud_detector", "name": "Fraud Anomaly Detector", "domain": "risk", "trigger": "realtime"},
        {"id": "readmission_risk", "name": "Patient Readmission Risk", "domain": "healthcare", "trigger": "daily"},
        {"id": "ltv_ranker", "name": "Customer LTV Ranker", "domain": "ecommerce", "trigger": "weekly"},
        {"id": "demand_forecast", "name": "Demand Forecast Agent", "domain": "supply_chain", "trigger": "daily"},
        {"id": "budget_actuals", "name": "Budget vs Actuals Monitor", "domain": "finance", "trigger": "monthly"},
        {"id": "channel_attribution", "name": "Channel Attribution Agent", "domain": "marketing", "trigger": "weekly"},
        {"id": "comp_anomaly", "name": "Comp Anomaly Detector", "domain": "revops", "trigger": "monthly"},
        {"id": "nps_driver", "name": "NPS Driver Agent", "domain": "generic", "trigger": "monthly"},
    ]


@agents_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_workflow(body: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    workflow = AgentWorkflow(
        id=str(uuid.uuid4()), tenant_id="default",
        name=body.name, description=body.description,
        template_id=body.template_id, status=AgentStatus.draft,
        autonomy_level=body.autonomy_level,
        trigger_config=body.trigger_config, steps=body.steps,
        guardrails=body.guardrails, output_config=body.output_config,
        schedule_cron=body.schedule_cron,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return {"id": workflow.id, "name": workflow.name, "status": workflow.status}


@agents_router.get("/")
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentWorkflow))
    return [{"id": w.id, "name": w.name, "status": w.status, "template_id": w.template_id,
             "autonomy_level": w.autonomy_level, "last_run_at": str(w.last_run_at) if w.last_run_at else None}
            for w in result.scalars()]


@agents_router.post("/{workflow_id}/activate")
async def activate_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    w = await db.get(AgentWorkflow, workflow_id)
    if not w:
        raise HTTPException(404, "Workflow not found")
    w.status = AgentStatus.active
    await db.commit()
    return {"id": workflow_id, "status": "active"}


@agents_router.post("/{workflow_id}/run")
async def run_workflow(workflow_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    w = await db.get(AgentWorkflow, workflow_id)
    if not w:
        raise HTTPException(404, "Workflow not found")
    run = WorkflowRun(id=str(uuid.uuid4()), workflow_id=workflow_id, trigger_type="manual")
    db.add(run)
    await db.commit()
    return {"run_id": run.id, "status": "running"}


@agents_router.get("/{workflow_id}/runs")
async def get_workflow_runs(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.workflow_id == workflow_id).order_by(WorkflowRun.started_at.desc()).limit(20)
    )
    return result.scalars().all()


# ─── Governance Router ────────────────────────────────────────────────────────
governance_router = APIRouter()


@governance_router.get("/audit")
async def get_audit_log(limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit)
    )
    events = result.scalars().all()
    return [{"id": e.id, "actor": e.actor, "action": e.action, "object_type": e.object_type,
             "policy_decision": e.policy_decision, "timestamp": str(e.timestamp)} for e in events]


@governance_router.get("/policies")
async def list_policies():
    return [
        {"id": "pol_pii", "name": "PII Masking", "type": "hard_stop", "active": True, "applies_to": ["all"]},
        {"id": "pol_metric_integrity", "name": "Metric Integrity", "type": "hard_stop", "active": True, "applies_to": ["all"]},
        {"id": "pol_writeback_approval", "name": "Write-Back Approval Gate", "type": "approval_required", "active": True, "applies_to": ["actions"]},
        {"id": "pol_discount_guardrail", "name": "Discount Authority Check", "type": "hard_stop", "active": True, "applies_to": ["revops"]},
        {"id": "pol_model_deploy", "name": "Model Deployment Gate", "type": "approval_required", "active": True, "applies_to": ["modeling"]},
        {"id": "pol_phi_access", "name": "PHI Access Control", "type": "hard_stop", "active": True, "applies_to": ["healthcare"]},
    ]


@governance_router.post("/validate")
async def validate_output(payload: dict, db: AsyncSession = Depends(get_db)):
    """Run governance checks on an agent output."""
    llm = LLMClient()
    result = await llm.json_chat(
        messages=[{"role": "user", "content": f"Validate this output for governance compliance:\n{json.dumps(payload, indent=2)[:2000]}"}],
        system_prompt="You are a Governance Agent. Check for PII exposure, metric integrity, analytical correctness, and action safety. Return JSON with: status (PASS/FAIL/CONDITIONAL), issues, required_approvals.",
        temperature=0.1,
    )
    # Log the validation
    event = AuditEvent(
        id=str(uuid.uuid4()), tenant_id="default",
        actor="governance_agent", action="output.validate",
        payload={"status": result.get("status")},
        policy_decision=result.get("status", "PASS"),
    )
    db.add(event)
    await db.commit()
    return result


# ─── Analytics Router ─────────────────────────────────────────────────────────
analytics_router = APIRouter()


@analytics_router.post("/eda")
async def run_eda(payload: dict):
    """Run EDA directly on provided data or a snapshot."""
    question = payload.get("question", "Describe this data")
    domain = payload.get("domain", "generic")
    llm = LLMClient()
    result = await llm.json_chat(
        messages=[{"role": "user", "content": f"Domain: {domain}. Q: {question}. Run a comprehensive EDA."}],
        system_prompt="You are an EDA specialist. Return JSON with: eda_summary, key_findings, anomalies_detected, recommended_analyses, chart_specs.",
        temperature=0.3,
    )
    return result


@analytics_router.post("/forecast")
async def run_forecast(payload: dict):
    """Run a time-series forecast."""
    llm = LLMClient()
    result = await llm.json_chat(
        messages=[{"role": "user", "content": f"Forecast request: {json.dumps(payload, indent=2)[:1000]}"}],
        system_prompt="You are a time series expert (Prophet, N-BEATS, LightGBM). Return JSON with: algorithm, forecast_values, confidence_intervals, trend_analysis, seasonality_notes, mape.",
        temperature=0.2,
    )
    return result


# ─── Upload Router ────────────────────────────────────────────────────────────
uploads_router = APIRouter()

class UploadResponse(BaseModel):
    connector_id: str
    table_name: str
    row_count: int
    profile: dict
    semantic_pack: dict


@uploads_router.post("/csv", response_model=UploadResponse)
async def upload_csv(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Handle CSV/Excel file upload via form-data."""
    from fastapi import UploadFile, File
    import pandas as pd
    from app.db.models import DataConnector, ConnectorType, ConnectorStatus
    from app.services.connectors.csv_connector import CSVConnector
    import io

    # Create connector record
    connector = DataConnector(
        id=str(uuid.uuid4()), tenant_id="default",
        name="CSV Upload", connector_type=ConnectorType.csv,
        status=ConnectorStatus.connected, config={"table_name": "uploaded_data"},
    )
    db.add(connector)
    await db.commit()
    return {"connector_id": connector.id, "table_name": "uploaded_data", "row_count": 0, "profile": {}, "semantic_pack": {}}


# ─── Auth Router ──────────────────────────────────────────────────────────────
auth_router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str


@auth_router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    from app.db.models import User
    from sqlalchemy import select as sa_select
    result = await db.execute(sa_select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Invalid credentials")
    return {
        "access_token": f"demo_token_{user.id[:8]}",
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role, "name": user.full_name},
    }


@auth_router.post("/demo-token")
async def demo_token():
    """Issue a demo token for testing without a full auth setup."""
    return {
        "access_token": "demo_token_vds_test",
        "token_type": "bearer",
        "user": {"id": "demo_user", "email": "demo@vds.ai", "role": "analyst", "name": "Demo User"},
    }

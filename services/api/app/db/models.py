"""
SQLAlchemy database models for VDS Platform.
Covers: tenants, users, connectors, sessions, semantic layer, agents, audit.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Text, Boolean, DateTime, Integer, Float,
    ForeignKey, JSON, Enum as SAEnum, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import String as UUID
from app.db.session import Base
import enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ConnectorType(str, enum.Enum):
    csv = "csv"
    postgres = "postgres"
    mysql = "mysql"
    snowflake = "snowflake"
    bigquery = "bigquery"
    redshift = "redshift"
    salesforce = "salesforce"
    hubspot = "hubspot"
    stripe = "stripe"
    google_ads = "google_ads"
    segment = "segment"
    amplitude = "amplitude"
    zendesk = "zendesk"
    s3 = "s3"
    google_sheets = "google_sheets"
    excel = "excel"
    mongo = "mongo"
    unstructured = "unstructured"


class ConnectorStatus(str, enum.Enum):
    pending = "pending"
    connected = "connected"
    syncing = "syncing"
    error = "error"
    disconnected = "disconnected"


class SessionStatus(str, enum.Enum):
    created = "created"
    planned = "planned"
    executing = "executing"
    checkpoint = "checkpoint"
    finalizing = "finalizing"
    done = "done"
    failed = "failed"


class AutonomyLevel(str, enum.Enum):
    assist = "assist"
    semi_auto = "semi_auto"
    autonomous = "autonomous"


class MetricStatus(str, enum.Enum):
    draft = "draft"
    proposed = "proposed"
    certified = "certified"
    deprecated = "deprecated"


class AgentStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    archived = "archived"


class WorkflowRunStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    awaiting_approval = "awaiting_approval"
    succeeded = "succeeded"
    failed = "failed"
    rolled_back = "rolled_back"


# ---------------------------------------------------------------------------
# Tenant / Auth
# ---------------------------------------------------------------------------

class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    domain_pack: Mapped[str] = mapped_column(String(50), default="generic")  # revops, finance, healthcare, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    users: Mapped[list["User"]] = relationship(back_populates="tenant")
    connectors: Mapped[list["DataConnector"]] = relationship(back_populates="tenant")
    sessions: Mapped[list["VDSSession"]] = relationship(back_populates="tenant")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="analyst")  # admin, data_steward, analyst, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tenant: Mapped["Tenant"] = relationship(back_populates="users")


# ---------------------------------------------------------------------------
# Data Connectors
# ---------------------------------------------------------------------------

class DataConnector(Base):
    __tablename__ = "data_connectors"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    connector_type: Mapped[ConnectorType] = mapped_column(SAEnum(ConnectorType))
    status: Mapped[ConnectorStatus] = mapped_column(SAEnum(ConnectorStatus), default=ConnectorStatus.pending)
    config: Mapped[dict] = mapped_column(JSON, default=dict)  # non-sensitive config only
    secret_ref: Mapped[Optional[str]] = mapped_column(String(255))  # vault key reference
    schema_manifest: Mapped[Optional[dict]] = mapped_column(JSON)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tenant: Mapped["Tenant"] = relationship(back_populates="connectors")
    sync_runs: Mapped[list["SyncRun"]] = relationship(back_populates="connector")
    snapshot_refs: Mapped[list["DataSnapshot"]] = relationship(back_populates="connector")


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: Mapped[str] = mapped_column(ForeignKey("data_connectors.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="running")
    rows_read: Mapped[int] = mapped_column(Integer, default=0)
    rows_written: Mapped[int] = mapped_column(Integer, default=0)
    rows_failed: Mapped[int] = mapped_column(Integer, default=0)
    error_log: Mapped[Optional[str]] = mapped_column(Text)
    profile_report: Mapped[Optional[dict]] = mapped_column(JSON)
    semantic_pack: Mapped[Optional[dict]] = mapped_column(JSON)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    connector: Mapped["DataConnector"] = relationship(back_populates="sync_runs")


class DataSnapshot(Base):
    __tablename__ = "data_snapshots"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: Mapped[str] = mapped_column(ForeignKey("data_connectors.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    table_name: Mapped[str] = mapped_column(String(255))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    schema_json: Mapped[dict] = mapped_column(JSON, default=dict)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    connector: Mapped["DataConnector"] = relationship(back_populates="snapshot_refs")


# ---------------------------------------------------------------------------
# Semantic Layer
# ---------------------------------------------------------------------------

class EntityType(Base):
    __tablename__ = "entity_types"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255))  # e.g. "Account"
    description: Mapped[Optional[str]] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String(100), default="generic")  # revops, finance, etc.
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    properties: Mapped[dict] = mapped_column(JSON, default=dict)  # {name: {type, description, semantic_role}}
    source_mappings: Mapped[dict] = mapped_column(JSON, default=dict)  # [{table, column, confidence}]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class RelationshipType(Base):
    __tablename__ = "relationship_types"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    from_entity_id: Mapped[str] = mapped_column(ForeignKey("entity_types.id"))
    to_entity_id: Mapped[str] = mapped_column(ForeignKey("entity_types.id"))
    name: Mapped[str] = mapped_column(String(255))  # e.g. "has_many"
    join_keys: Mapped[dict] = mapped_column(JSON, default=dict)  # {from_col, to_col}
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="proposed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MetricDefinition(Base):
    __tablename__ = "metric_definitions"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    formula: Mapped[str] = mapped_column(Text)  # SQL expression using semantic entities
    grain: Mapped[list] = mapped_column(JSON, default=list)  # [date, segment, product]
    filters: Mapped[dict] = mapped_column(JSON, default=dict)
    synonyms: Mapped[list] = mapped_column(JSON, default=list)
    domain: Mapped[str] = mapped_column(String(100), default="generic")
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[MetricStatus] = mapped_column(SAEnum(MetricStatus), default=MetricStatus.draft)
    owner: Mapped[Optional[str]] = mapped_column(String(255))
    lineage: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


# ---------------------------------------------------------------------------
# Orchestration / Sessions
# ---------------------------------------------------------------------------

class VDSSession(Base):
    __tablename__ = "vds_sessions"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), index=True)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    title: Mapped[Optional[str]] = mapped_column(String(500))
    domain: Mapped[str] = mapped_column(String(100), default="generic")
    autonomy_level: Mapped[AutonomyLevel] = mapped_column(SAEnum(AutonomyLevel), default=AutonomyLevel.assist)
    status: Mapped[SessionStatus] = mapped_column(SAEnum(SessionStatus), default=SessionStatus.created)
    goal: Mapped[Optional[str]] = mapped_column(Text)
    plan: Mapped[Optional[dict]] = mapped_column(JSON)  # {steps: [{id, agent, description, status}]}
    current_step_index: Mapped[int] = mapped_column(Integer, default=0)
    context: Mapped[dict] = mapped_column(JSON, default=dict)  # snapshot_ids, model_versions, etc.
    final_output: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    tenant: Mapped["Tenant"] = relationship(back_populates="sessions")
    messages: Mapped[list["SessionMessage"]] = relationship(back_populates="session", order_by="SessionMessage.created_at")
    artifacts: Mapped[list["SessionArtifact"]] = relationship(back_populates="session")
    audit_events: Mapped[list["AuditEvent"]] = relationship(back_populates="session")


class SessionMessage(Base):
    __tablename__ = "session_messages"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(ForeignKey("vds_sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))  # user | assistant | system | tool
    agent: Mapped[Optional[str]] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)
    tool_call: Mapped[Optional[dict]] = mapped_column(JSON)
    tool_result: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["VDSSession"] = relationship(back_populates="messages")


class SessionArtifact(Base):
    __tablename__ = "session_artifacts"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(ForeignKey("vds_sessions.id"), index=True)
    artifact_type: Mapped[str] = mapped_column(String(50))  # chart, table, query, model, narrative, workflow
    name: Mapped[str] = mapped_column(String(255))
    content: Mapped[dict] = mapped_column(JSON)  # chart spec, table data, query text, etc.
    agent: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["VDSSession"] = relationship(back_populates="artifacts")


# ---------------------------------------------------------------------------
# Model Registry
# ---------------------------------------------------------------------------

class ModelRegistryEntry(Base):
    __tablename__ = "model_registry"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255))
    task_type: Mapped[str] = mapped_column(String(100))  # classification, regression, forecasting, etc.
    algorithm: Mapped[str] = mapped_column(String(255))
    version: Mapped[int] = mapped_column(Integer, default=1)
    training_snapshot_id: Mapped[Optional[str]] = mapped_column(String(100))
    feature_view_version: Mapped[Optional[str]] = mapped_column(String(100))
    hyperparameters: Mapped[dict] = mapped_column(JSON, default=dict)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)  # auc, mape, etc.
    deployment_status: Mapped[str] = mapped_column(String(50), default="challenger")  # champion | challenger | retired
    monitoring_config: Mapped[dict] = mapped_column(JSON, default=dict)
    artifact_path: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Agent Builder
# ---------------------------------------------------------------------------

class AgentWorkflow(Base):
    __tablename__ = "agent_workflows"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    template_id: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[AgentStatus] = mapped_column(SAEnum(AgentStatus), default=AgentStatus.draft)
    autonomy_level: Mapped[AutonomyLevel] = mapped_column(SAEnum(AutonomyLevel), default=AutonomyLevel.semi_auto)
    trigger_config: Mapped[dict] = mapped_column(JSON, default=dict)
    steps: Mapped[list] = mapped_column(JSON, default=list)
    guardrails: Mapped[dict] = mapped_column(JSON, default=dict)
    output_config: Mapped[dict] = mapped_column(JSON, default=dict)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(100))
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    runs: Mapped[list["WorkflowRun"]] = relationship(back_populates="workflow")


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id: Mapped[str] = mapped_column(ForeignKey("agent_workflows.id"), index=True)
    status: Mapped[WorkflowRunStatus] = mapped_column(SAEnum(WorkflowRunStatus), default=WorkflowRunStatus.pending)
    trigger_type: Mapped[str] = mapped_column(String(50), default="manual")
    steps_log: Mapped[list] = mapped_column(JSON, default=list)
    result: Mapped[Optional[dict]] = mapped_column(JSON)
    error: Mapped[Optional[str]] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    workflow: Mapped["AgentWorkflow"] = relationship(back_populates="runs")


# ---------------------------------------------------------------------------
# Governance / Audit
# ---------------------------------------------------------------------------

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(UUID(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(100), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(ForeignKey("vds_sessions.id"), nullable=True)
    actor: Mapped[str] = mapped_column(String(255))  # user_id or "agent:<name>"
    action: Mapped[str] = mapped_column(String(255))  # e.g. "session.create", "model.train", "writeback.execute"
    object_type: Mapped[Optional[str]] = mapped_column(String(100))
    object_id: Mapped[Optional[str]] = mapped_column(String(100))
    payload: Mapped[Optional[dict]] = mapped_column(JSON)  # redacted
    policy_decision: Mapped[Optional[str]] = mapped_column(String(50))  # PASS | WARN | FAIL
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    session: Mapped[Optional["VDSSession"]] = relationship(back_populates="audit_events")

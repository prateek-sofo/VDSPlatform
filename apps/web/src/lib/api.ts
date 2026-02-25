/**
 * VDS API client — typed functions for all backend endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const V1 = `${API_BASE}/api/v1`;

// ── Auth ────────────────────────────────────────────────────────────────────
export async function getDemoToken() {
    const r = await fetch(`${V1}/auth/demo-token`, { method: 'POST' });
    return r.json();
}

// ── Sessions ────────────────────────────────────────────────────────────────
export async function createSession(payload: {
    question: string;
    domain: string;
    autonomy_level: string;
    connector_ids?: string[];
}) {
    const r = await fetch(`${V1}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return r.json();
}

export async function getSession(sessionId: string) {
    const r = await fetch(`${V1}/sessions/${sessionId}`);
    return r.json();
}

export async function getSessionMessages(sessionId: string) {
    const r = await fetch(`${V1}/sessions/${sessionId}/messages`);
    return r.json();
}

export async function getSessionArtifacts(sessionId: string) {
    const r = await fetch(`${V1}/sessions/${sessionId}/artifacts`);
    return r.json();
}

export async function approveCheckpoint(sessionId: string, stepId: string) {
    const r = await fetch(`${V1}/sessions/${sessionId}/approvals/${stepId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
    });
    return r.json();
}

export function subscribeToSession(sessionId: string, onEvent: (data: any) => void) {
    const es = new EventSource(`${V1}/sessions/${sessionId}/stream`);
    es.onmessage = (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { onEvent({ raw: e.data }); }
    };
    es.onerror = () => es.close();
    return () => es.close();
}

// ── Connectors ──────────────────────────────────────────────────────────────
export async function listConnectors() {
    const r = await fetch(`${V1}/connectors`);
    return r.json();
}

export async function createConnector(payload: any) {
    const r = await fetch(`${V1}/connectors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return r.json();
}

export async function testConnector(connectorId: string) {
    const r = await fetch(`${V1}/connectors/${connectorId}/test`, { method: 'POST' });
    return r.json();
}

export async function syncConnector(connectorId: string) {
    const r = await fetch(`${V1}/connectors/${connectorId}/sync`, { method: 'POST' });
    return r.json();
}

export async function getConnectorCatalog() {
    const r = await fetch(`${V1}/connectors/catalog`);
    return r.json();
}

export async function uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const r = await fetch(`${V1}/uploads/csv`, {
        method: 'POST',
        body: formData,
    });
    return r.json();
}

export async function getConnectorSample(connectorId: string, limit: number = 100) {
    const r = await fetch(`${V1}/connectors/${connectorId}/sample?limit=${limit}`);
    return r.json();
}

// ── Semantic ────────────────────────────────────────────────────────────────
export async function listEntities() {
    const r = await fetch(`${V1}/semantic/entities`);
    return r.json();
}

export async function listRelationships() {
    const r = await fetch(`${V1}/semantic/relationships`);
    return r.json();
}

export async function discoverOntology(connectorId: string, industry: string = 'revops') {
    const r = await fetch(`${V1}/semantic/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connector_id: connectorId, industry }),
    });
    return r.json();
}

export async function certifyEntity(entityId: string) {
    const r = await fetch(`${V1}/semantic/entities/${entityId}/certify`, { method: 'POST' });
    return r.json();
}

export async function listMetrics() {
    const r = await fetch(`${V1}/semantic/metrics`);
    return r.json();
}

export async function installDomainPack(domain: string) {
    const r = await fetch(`${V1}/semantic/domains/${domain}/install`, { method: 'POST' });
    return r.json();
}

// ── Modeling ────────────────────────────────────────────────────────────────
export async function listModels() {
    const r = await fetch(`${V1}/modeling/registry`);
    return r.json();
}

// ── Agents / Workflows ──────────────────────────────────────────────────────
export async function listWorkflows() {
    const r = await fetch(`${V1}/agents`);
    return r.json();
}

export async function listTemplates() {
    const r = await fetch(`${V1}/agents/templates`);
    return r.json();
}

export async function createWorkflow(payload: any) {
    const r = await fetch(`${V1}/agents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return r.json();
}

// ── Governance ──────────────────────────────────────────────────────────────
export async function getAuditLog() {
    const r = await fetch(`${V1}/governance/audit`);
    return r.json();
}

export async function listPolicies() {
    const r = await fetch(`${V1}/governance/policies`);
    return r.json();
}

// ── Health ──────────────────────────────────────────────────────────────────
export async function healthCheck() {
    const r = await fetch(`${API_BASE}/health`);
    return r.json();
}

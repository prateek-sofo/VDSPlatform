'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSession, getSession, getSessionMessages, approveCheckpoint, subscribeToSession, listConnectors, installDomainPack, listWorkflows, listTemplates, getAuditLog, listPolicies } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface Message { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }
interface Step { index: number; agent: string; status: 'done' | 'active' | 'pending' | 'failed'; checkpoint?: boolean; }
interface Session { id: string; status: string; current_step_index: number; plan?: any[]; final_output?: any; }

const DOMAINS = [
    { id: 'revops', label: 'RevOps', icon: '💰' },
    { id: 'finance', label: 'Finance', icon: '📊' },
    { id: 'supply_chain', label: 'Supply Chain', icon: '🚚' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
    { id: 'hr', label: 'HR', icon: '👥' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'risk', label: 'Risk', icon: '🛡️' },
];

const QUICK_PROMPTS: Record<string, string[]> = {
    revops: ["Why did Q1 pipeline drop?", "Which deals are at risk this week?", "What's our forecast accuracy vs plan?"],
    finance: ["Explain our budget variance this quarter", "What's our cash runway?", "Show P&L vs budget"],
    supply_chain: ["Which SKUs are at stockout risk?", "Which suppliers have highest delay risk?", "Forecast demand for top 10 SKUs"],
    healthcare: ["Which patients are at readmission risk?", "What's driving claim denial rate?", "Show length of stay by DRG"],
    ecommerce: ["What's driving churn in VIP cohort?", "Which channels have best LTV?", "Show cart abandonment by device"],
    hr: ["Who is at flight risk this quarter?", "What's our attrition rate by department?", "Show pay equity analysis"],
    marketing: ["Which channels have best ROAS?", "What's our MQL to SQL conversion?", "Show attribution by touchpoint"],
    risk: ["Which transactions are highest fraud risk?", "Show anomalies in last 24 hours", "What's our false positive rate?"],
};

const AGENT_STEPS = [
    { key: 'frame', label: 'Problem Framing', icon: '🎯' },
    { key: 'connect', label: 'Data Connector', icon: '🔌' },
    { key: 'map', label: 'Semantic Mapping', icon: '🗺️' },
    { key: 'quality', label: 'Data Quality', icon: '✅' },
    { key: 'eda', label: 'EDA & Hypotheses', icon: '🔬' },
    { key: 'model', label: 'Modeling & ML', icon: '🤖' },
    { key: 'narrate', label: 'Insight Narrative', icon: '📝' },
    { key: 'act', label: 'Action Plan', icon: '⚡' },
    { key: 'govern', label: 'Governance Check', icon: '🛡️' },
];

// ── Main App ───────────────────────────────────────────────────────────────

export default function VDSApp() {
    const [domain, setDomain] = useState('revops');
    const [autonomy, setAutonomy] = useState<'assist' | 'semi_auto' | 'autonomous'>('semi_auto');
    const [messages, setMessages] = useState<Message[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [activeTab, setActiveTab] = useState<'viz' | 'evidence' | 'action' | 'agents'>('viz');
    const [sidebar, setSidebar] = useState<'recent' | 'connectors' | 'models'>('recent');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectors, setConnectors] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const chatBottomRef = useRef<HTMLDivElement>(null);

    // Bootstrap domain packs on mount
    useEffect(() => {
        installDomainPack(domain).catch(() => { });
        listConnectors().then(setConnectors).catch(() => { });
        listWorkflows().then(setWorkflows).catch(() => { });
    }, [domain]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // SSE subscription to session stream
    useEffect(() => {
        if (!session?.id) return;
        const unsub = subscribeToSession(session.id, (data) => {
            if (data.type === 'step_complete') {
                setSession(prev => prev ? { ...prev, current_step_index: data.step_index } : prev);
            }
            if (data.type === 'message') {
                const msg: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.content, created_at: new Date().toISOString() };
                setMessages(prev => [...prev, msg]);
            }
            if (data.type === 'status') {
                setSession(prev => prev ? { ...prev, status: data.status, final_output: data.final_output } : prev);
                if (data.status === 'done') setLoading(false);
            }
        });
        return unsub;
    }, [session?.id]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading) return;
        const q = input.trim();
        setInput('');
        setLoading(true);
        setError(null);

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: q, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);

        try {
            const s = await createSession({ question: q, domain, autonomy_level: autonomy, connector_ids: [] });
            if (s.id) {
                setSession(s);
                // Optimistic: add placeholder assistant message
                const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '🤖 Analyzing your question...', created_at: new Date().toISOString() };
                setMessages(prev => [...prev, assistantMsg]);

                // Poll for completion
                const poll = setInterval(async () => {
                    const updated = await getSession(s.id);
                    setSession(updated);
                    if (['done', 'failed'].includes(updated.status)) {
                        clearInterval(poll);
                        setLoading(false);
                        const msgs = await getSessionMessages(s.id);
                        setMessages(prev => {
                            const base = prev.filter(m => m.role === 'user');
                            return [...base, ...msgs.filter((m: Message) => m.role === 'assistant')];
                        });
                        getAuditLog().then(setAuditLog).catch(() => { });
                    }
                }, 3000);
            }
        } catch (e: any) {
            setError(e.message || 'Request failed');
            setLoading(false);
        }
    }, [input, loading, domain, autonomy]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="app-shell">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-mark">V</div>
                    <div>
                        <div className="logo-text">VDS Platform</div>
                        <div className="logo-sub">Virtual Data Scientist</div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="sidebar-section-label">Navigation</div>
                    <div className={`nav-item ${sidebar === 'recent' ? 'active' : ''}`} onClick={() => setSidebar('recent')}>
                        <span className="nav-item-icon">💬</span> Sessions
                    </div>
                    <div className={`nav-item ${sidebar === 'connectors' ? 'active' : ''}`} onClick={() => setSidebar('connectors')}>
                        <span className="nav-item-icon">🔌</span> Connectors
                        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>{connectors.length}</span>
                    </div>
                    <div className="nav-item">
                        <span className="nav-item-icon">🗺️</span> Semantic Layer
                    </div>
                    <div className={`nav-item ${sidebar === 'models' ? 'active' : ''}`} onClick={() => setSidebar('models')}>
                        <span className="nav-item-icon">🤖</span> Model Registry
                    </div>
                    <div className="nav-item" onClick={() => { setActiveTab('agents'); setSidebar('recent'); }}>
                        <span className="nav-item-icon">⚡</span> Agent Builder
                        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{workflows.length}</span>
                    </div>
                    <div className="nav-item">
                        <span className="nav-item-icon">🛡️</span> Governance
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                    <div className="sidebar-section">
                        <div className="sidebar-section-label">Recent Sessions</div>
                        {session && (
                            <div className="nav-item active" style={{ fontSize: '12px', display: 'block', padding: '8px 10px' }}>
                                <div style={{ fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {messages[0]?.content?.slice(0, 40) || 'New session'}...
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {session.status} · {domain}
                                </div>
                            </div>
                        )}
                        {!session && <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 10px' }}>No sessions yet</div>}
                    </div>
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    VDS v0.1.0 · demo@vds.ai
                </div>
            </aside>

            {/* ── Main Area ── */}
            <main className="main-area">
                {/* Top Bar */}
                <div className="topbar">
                    <div>
                        <div className="topbar-title">
                            {DOMAINS.find(d => d.id === domain)?.icon} {DOMAINS.find(d => d.id === domain)?.label} Workspace
                        </div>
                        <div className="topbar-sub">
                            {session ? `Session: ${session.id.slice(0, 8)}... · ${session.status}` : 'Ready to analyze'}
                        </div>
                    </div>

                    {/* Domain Selector */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {DOMAINS.map(d => (
                            <button key={d.id} className={`domain-chip ${domain === d.id ? 'active' : ''}`}
                                onClick={() => setDomain(d.id)}>
                                {d.icon} {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Autonomy Dial */}
                    <div className="autonomy-dial">
                        {(['assist', 'semi_auto', 'autonomous'] as const).map(a => (
                            <div key={a} className={`dial-option ${autonomy === a ? 'active' : ''}`}
                                onClick={() => setAutonomy(a)}>
                                {a === 'assist' ? '👤 Assist' : a === 'semi_auto' ? '⚡ Semi-Auto' : '🤖 Auto'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Workspace */}
                <div className="workspace">
                    {/* LEFT: Chat + Plan Stepper */}
                    <div className="left-col">
                        {/* Plan Stepper */}
                        {session && (
                            <div className="plan-pane">
                                <div className="plan-title">🗓️ Analysis Pipeline · Step {session.current_step_index + 1}/{AGENT_STEPS.length}</div>
                                {AGENT_STEPS.map((step, i) => {
                                    const stepStatus = i < session.current_step_index ? 'done'
                                        : i === session.current_step_index ? 'active' : 'pending';
                                    const isFailed = session.status === 'failed' && i === session.current_step_index;
                                    const finalStatus = isFailed ? 'failed' : stepStatus;
                                    return (
                                        <div key={step.key} className="step-item">
                                            <div className={`step-icon ${finalStatus}`}>
                                                {finalStatus === 'done' ? '✓' : finalStatus === 'active' ? '●' : finalStatus === 'failed' ? '✗' : step.icon}
                                            </div>
                                            <div className={`step-label ${finalStatus}`}>{step.label}</div>
                                            {stepStatus === 'active' && autonomy === 'assist' && (
                                                <>
                                                    <button className="checkpoint-btn approve" onClick={() => session && approveCheckpoint(session.id, step.key)}>Approve</button>
                                                    <button className="checkpoint-btn skip">Skip</button>
                                                </>
                                            )}
                                            {finalStatus === 'done' && <span className="badge badge-success">✓</span>}
                                            {finalStatus === 'active' && loading && <div className="spinner" style={{ width: 14, height: 14 }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Chat messages */}
                        <div className="chat-pane">
                            <div className="chat-messages">
                                {messages.length === 0 && (
                                    <div className="empty-state" style={{ marginTop: 40 }}>
                                        <div className="empty-state-icon">🤖</div>
                                        <div className="empty-state-title">Ask your data scientist</div>
                                        <div className="empty-state-desc">
                                            Ask any business question — in plain English. VDS will plan, analyze, model, and deliver actionable insights.
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: 400, marginTop: 8 }}>
                                            {(QUICK_PROMPTS[domain] || []).map(p => (
                                                <button key={p} className="quick-prompt" onClick={() => { setInput(p); }}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map(msg => (
                                    <div key={msg.id} className={`msg ${msg.role}`}>
                                        <div className="msg-avatar">
                                            {msg.role === 'user' ? '👤' : '🤖'}
                                        </div>
                                        <div className="msg-bubble">
                                            {msg.role === 'assistant' ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                            ) : msg.content}
                                        </div>
                                    </div>
                                ))}

                                {/* Error */}
                                {error && (
                                    <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                <div ref={chatBottomRef} />
                            </div>

                            {/* Quick prompts */}
                            {messages.length === 0 && (
                                <div className="quick-prompts">
                                    {(QUICK_PROMPTS[domain] || []).slice(0, 3).map(p => (
                                        <button key={p} className="quick-prompt" onClick={() => setInput(p)}>{p}</button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="chat-input-area">
                                <div className="chat-input-wrapper">
                                    <textarea
                                        className="chat-input"
                                        rows={1}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Ask a ${DOMAINS.find(d => d.id === domain)?.label || ''} question...`}
                                        disabled={loading}
                                    />
                                    <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                                        {loading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '↑'}
                                    </button>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                                    ⏎ Send · Shift+⏎ New line · Autonomy: {autonomy.replace('_', '-')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Tabs */}
                    <div className="right-col">
                        <div className="tab-bar">
                            {[
                                { id: 'viz', label: '📊 Viz & Data' },
                                { id: 'evidence', label: '🔍 Evidence' },
                                { id: 'action', label: '⚡ Action' },
                                { id: 'agents', label: '🤖 Agents' },
                            ].map(t => (
                                <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(t.id as any)}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="tab-content">
                            {/* VIZ TAB */}
                            {activeTab === 'viz' && (
                                <VizTab session={session} />
                            )}

                            {/* EVIDENCE TAB */}
                            {activeTab === 'evidence' && (
                                <EvidenceTab session={session} auditLog={auditLog} />
                            )}

                            {/* ACTION TAB */}
                            {activeTab === 'action' && (
                                <ActionTab session={session} domain={domain} />
                            )}

                            {/* AGENTS TAB */}
                            {activeTab === 'agents' && (
                                <AgentsTab workflows={workflows} setWorkflows={setWorkflows} domain={domain} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ── VIZ TAB ─────────────────────────────────────────────────────────────────

function VizTab({ session }: { session: Session | null }) {
    if (!session?.final_output) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">Charts & Metrics</div>
                <div className="empty-state-desc">Ask a question and VDS will generate relevant visualizations here.</div>
            </div>
        );
    }

    const output = session.final_output;
    const narrate = output?.narrate || {};
    const model = output?.model || {};
    const eda = output?.eda || {};

    return (
        <div>
            {/* KPI Summary */}
            {narrate.findings && narrate.findings.length > 0 && (
                <div className="metric-grid">
                    {narrate.findings.slice(0, 4).map((f: any, i: number) => (
                        <div key={i} className="metric-card">
                            <div className="metric-label">{f.label || `Finding ${i + 1}`}</div>
                            <div className="metric-value">{f.value || '—'}</div>
                            {f.delta && <div className={`metric-delta ${(f.delta || '').startsWith('+') ? 'up' : 'down'}`}>{f.delta}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Executive Summary bullets */}
            {narrate.executive_summary && (
                <div className="chart-card">
                    <div className="chart-title">📋 Executive Summary</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{
                            typeof narrate.executive_summary === 'string'
                                ? narrate.executive_summary
                                : narrate.executive_summary?.join?.('\n') || String(narrate.executive_summary)
                        }</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Top predictions table */}
            {model.top_predictions && model.top_predictions.length > 0 && (
                <div className="chart-card">
                    <div className="chart-title">🎯 Top Predictions</div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Record</th>
                                <th>Score</th>
                                <th>Risk</th>
                                <th>Top Driver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {model.top_predictions.slice(0, 8).map((p: any, i: number) => {
                                const score = parseFloat(p.score || p.probability || p.risk_score || '0');
                                const risk = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
                                return (
                                    <tr key={i}>
                                        <td>{p.name || p.id || `Record ${i + 1}`}</td>
                                        <td><strong>{(score * 100).toFixed(0)}%</strong></td>
                                        <td><span className={`score-badge ${risk}`}>{risk.toUpperCase()}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.top_driver || p.reason || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SHAP summary */}
            {model.shap_summary && (
                <div className="chart-card">
                    <div className="chart-title">🔬 Feature Importance (SHAP)</div>
                    {Object.entries(model.shap_summary || {}).slice(0, 6).map(([feature, value]: [string, any], i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-active)', borderRadius: 3 }}>
                                <div style={{
                                    height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-glow))',
                                    borderRadius: 3, width: `${Math.min(100, (i + 1) * 15)}%`,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendations */}
            {narrate.recommendations && narrate.recommendations.length > 0 && (
                <div className="chart-card">
                    <div className="chart-title">💡 Top Recommendations</div>
                    {narrate.recommendations.slice(0, 3).map((rec: any, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{rec.title || rec.action || rec}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.expected_impact || rec.impact || ''}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── EVIDENCE TAB ─────────────────────────────────────────────────────────────

function EvidenceTab({ session, auditLog }: { session: Session | null, auditLog: any[] }) {
    if (!session) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">Full Evidence Trail</div>
                <div className="empty-state-desc">Every query, metric definition, and model version will be shown here — fully linked.</div>
            </div>
        );
    }

    const output = session.final_output || {};
    const narrate = output.narrate || {};
    const govern = output.govern || {};

    return (
        <div>
            {/* Audit trail */}
            {auditLog.slice(0, 5).map((ev: any, i: number) => (
                <div key={i} className="evidence-item">
                    <div className="evidence-header">
                        <span className="evidence-id">audit:{ev.id?.slice(0, 8) || i}</span>
                        <span className="evidence-type">{ev.action || 'event'}</span>
                    </div>
                    <div className="evidence-content">
                        Policy: <span style={{ color: ev.policy_decision === 'PASS' ? 'var(--success)' : 'var(--danger)' }}>{ev.policy_decision || '—'}</span>
                        · Actor: {ev.actor || 'system'}
                    </div>
                </div>
            ))}

            {/* Governance report */}
            {govern.status && (
                <div className="evidence-item">
                    <div className="evidence-header">
                        <span className="evidence-id">governance.check</span>
                        <span className={`badge ${govern.status === 'PASS' ? 'badge-success' : 'badge-danger'}`}>{govern.status}</span>
                    </div>
                    <div className="evidence-content">
                        {govern.issues?.length > 0
                            ? govern.issues.map((iss: any, i: number) => <div key={i}>⚠️ {typeof iss === 'string' ? iss : iss.message}</div>)
                            : '✅ All governance checks passed'}
                    </div>
                    {govern.required_approvals?.length > 0 && (
                        <div className="evidence-query">Approvals required: {govern.required_approvals.join(', ')}</div>
                    )}
                </div>
            )}

            {/* Appendix evidence */}
            {narrate.appendix && (
                <div className="evidence-item">
                    <div className="evidence-header">
                        <span className="evidence-id">narrate.appendix</span>
                        <span className="evidence-type">metadata</span>
                    </div>
                    <div className="evidence-content">
                        <div className="evidence-query">{JSON.stringify(narrate.appendix, null, 2).slice(0, 500)}</div>
                    </div>
                </div>
            )}

            {!auditLog.length && !govern.status && (
                <div className="empty-state" style={{ paddingTop: 20 }}>
                    <div className="empty-state-icon" style={{ fontSize: 24 }}>⏳</div>
                    <div className="empty-state-desc">Evidence trail will populate as the agent pipeline runs.</div>
                </div>
            )}
        </div>
    );
}

// ── ACTION TAB ───────────────────────────────────────────────────────────────

function ActionTab({ session, domain }: { session: Session | null, domain: string }) {
    const [submitted, setSubmitted] = useState<Set<number>>(new Set());

    if (!session?.final_output) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚡</div>
                <div className="empty-state-title">Operational Actions</div>
                <div className="empty-state-desc">VDS will generate deployable workflows and write-back actions here based on analysis findings.</div>
            </div>
        );
    }

    const act = session.final_output.act || {};
    const actions = act.actions || [];
    const recommend = session.final_output.narrate?.recommendations || [];

    const displayActions = actions.length > 0 ? actions : recommend.map((r: any) => ({
        title: r.title || r.action || r,
        description: r.expected_impact || '',
        type: 'notification',
        target: 'Slack',
    }));

    return (
        <div>
            {displayActions.map((action: any, i: number) => (
                <div key={i} className="action-card">
                    <div className="action-header">
                        <span className="action-icon">{action.type === 'record_update' ? '📝' : action.type === 'task' ? '✅' : '📢'}</span>
                        <span className="action-title">{action.title || action.name || `Action ${i + 1}`}</span>
                        {submitted.has(i) && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Deployed</span>}
                    </div>
                    <div className="action-desc">
                        {action.description || action.details || ''}
                    </div>
                    {action.target && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                            🎯 Target: {action.target} · Guardrail: {action.guardrail || 'min_confidence ≥ 0.70'}
                        </div>
                    )}
                    <div className="action-footer">
                        <button className="btn btn-secondary">Dry Run</button>
                        {!submitted.has(i)
                            ? <button className="btn btn-primary" onClick={() => setSubmitted(prev => new Set([...Array.from(prev), i]))}>Deploy ⚡</button>
                            : <button className="btn btn-success" disabled>✓ Live</button>
                        }
                    </div>
                </div>
            ))}

            {displayActions.length === 0 && (
                <div className="empty-state" style={{ paddingTop: 20 }}>
                    <div className="empty-state-desc">No actions generated yet. Complete analysis first.</div>
                </div>
            )}
        </div>
    );
}

// ── AGENTS TAB ───────────────────────────────────────────────────────────────

function AgentsTab({ workflows, setWorkflows, domain }: { workflows: any[], setWorkflows: any, domain: string }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [view, setView] = useState<'workflows' | 'templates'>('workflows');

    useEffect(() => {
        listTemplates().then(setTemplates).catch(() => { });
    }, []);

    const domainTemplates = templates.filter(t => t.domain === domain || t.domain === 'generic');

    return (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button className={`btn ${view === 'workflows' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('workflows')}>
                    My Agents ({workflows.length})
                </button>
                <button className={`btn ${view === 'templates' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('templates')}>
                    Templates ({domainTemplates.length})
                </button>
            </div>

            {view === 'templates' && (
                <div>
                    {domainTemplates.map((t: any) => (
                        <div key={t.id} className="action-card" style={{ marginBottom: 8 }}>
                            <div className="action-header">
                                <span className="action-icon">🤖</span>
                                <span className="action-title">{t.name}</span>
                                <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>{t.trigger}</span>
                            </div>
                            <div className="action-desc">{t.domain} · Runs {t.trigger}</div>
                            <div className="action-footer">
                                <button className="btn btn-primary" style={{ fontSize: 11 }}>Install Template</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'workflows' && (
                <div>
                    {workflows.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">⚡</div>
                            <div className="empty-state-title">No Agents Yet</div>
                            <div className="empty-state-desc">Deploy an insight as an agent, or install a template to get started.</div>
                        </div>
                    )}
                    {workflows.map((w: any) => (
                        <div key={w.id} className="action-card">
                            <div className="action-header">
                                <span className="action-title">{w.name}</span>
                                <span className={`badge badge-${w.status === 'active' ? 'success' : 'warning'}`} style={{ marginLeft: 'auto' }}>
                                    {w.status}
                                </span>
                            </div>
                            <div className="action-desc">Autonomy: {w.autonomy_level} · Last run: {w.last_run_at || 'Never'}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

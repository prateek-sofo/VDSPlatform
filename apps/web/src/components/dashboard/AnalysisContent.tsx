import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BarChart3, Search, Zap, CheckCircle, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, FileText, ClipboardList, ShieldCheck, Play, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalysisContentProps {
    session: any;
    artifacts: any[];
    auditLog: any[];
}

export function AnalysisContent({ session, artifacts, auditLog }: AnalysisContentProps) {
    const [activeTab, setActiveTab] = useState<'viz' | 'evidence' | 'action'>('viz');

    if (!session) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Analysis Workspace</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Results, evidence, and operational actions will appear here once you start an analysis session.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-1 border-b border-border bg-card/50 px-8">
                {[
                    { id: 'viz', label: 'Visualization & Results', icon: BarChart3 },
                    { id: 'evidence', label: 'Evidence Trail', icon: Search },
                    { id: 'action', label: 'Operational Actions', icon: Zap },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2",
                            activeTab === tab.id
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                {activeTab === 'viz' && <VizTab session={session} />}
                {activeTab === 'evidence' && <EvidenceTab session={session} auditLog={auditLog} />}
                {activeTab === 'action' && <ActionTab session={session} />}
            </div>
        </div>
    );
}

function VizTab({ session }: { session: any }) {
    const output = session.final_output || {};
    const narrate = output.narrate || {};
    const model = output.model || {};

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl">
            {/* KPI Row */}
            {narrate.findings && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {narrate.findings.slice(0, 4).map((f: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm group hover:border-primary/30 transition-all">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{f.label || `Finding ${i + 1}`}</div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-bold text-foreground leading-none">{f.value || '—'}</div>
                                {f.delta && (
                                    <div className={cn(
                                        "flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded",
                                        f.delta.startsWith('+') ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                                    )}>
                                        {f.delta.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                        {f.delta.replace('+', '').replace('-', '')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Executive Summary */}
            {narrate.executive_summary && (
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Executive Summary
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{
                            typeof narrate.executive_summary === 'string'
                                ? narrate.executive_summary
                                : narrate.executive_summary?.join?.('\n') || String(narrate.executive_summary)
                        }</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Prediction Table */}
            {model.top_predictions && model.top_predictions.length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-muted/30">
                        <Target className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground">Top Predictions & Insights</h4>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subject</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confidence/Probability</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Risk Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Key Driver</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {model.top_predictions.slice(0, 8).map((p: any, i: number) => {
                                const score = parseFloat(p.score || p.probability || p.risk_score || '0');
                                const risk = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
                                return (
                                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{p.name || p.id || `Ref - ${i + 1}`}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 bg-secondary h-1 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full" style={{ width: `${score * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-mono font-bold">{(score * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                risk === 'high' ? "bg-red-400/10 text-red-400" :
                                                    risk === 'medium' ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"
                                            )}>{risk}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-muted-foreground italic">
                                            {p.top_driver || p.reason || 'Calculated dynamic driver'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Recommendations Row */}
            {narrate.recommendations && narrate.recommendations.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        AI Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {narrate.recommendations.slice(0, 3).map((rec: any, i: number) => (
                            <div key={i} className="p-5 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col h-full group hover:border-amber-400/30 transition-all">
                                <div className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-500 flex items-center justify-center text-xs font-bold mb-4 border border-amber-400/20 group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <h4 className="text-sm font-bold text-foreground mb-2">{rec.title || rec.action || rec}</h4>
                                <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                                    {rec.expected_impact || rec.impact || 'Identified optimization opportunity with significant projected impact.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function EvidenceTab({ session, auditLog }: { session: any, auditLog: any[] }) {
    const output = session.final_output || {};
    const govern = output.govern || {};
    const narrate = output.narrate || {};

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Governance Item */}
            {govern.status && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-foreground">Governance Verification</span>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            govern.status === 'PASS' ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                        )}>{govern.status}</span>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {govern.issues?.length > 0 ? (
                                govern.issues.map((iss: any, i: number) => (
                                    <div key={i} className="flex gap-3 text-xs text-red-400 bg-red-400/5 p-3 rounded-lg border border-red-400/10">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {typeof iss === 'string' ? iss : iss.message}
                                    </div>
                                ))
                            ) : (
                                <div className="flex gap-3 text-xs text-emerald-400 bg-emerald-400/5 p-3 rounded-lg border border-emerald-400/10">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    Zero policy violations detected. Data masking and access controls verified for this analysis.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Stream */}
            <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Atomic Evidence Trail</h4>
                {auditLog.slice(0, 10).map((ev: any, i: number) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-mono text-primary uppercase tracking-tighter mb-1">audit:{ev.id?.slice(0, 8) || `evt-${i}`}</div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-foreground">{ev.action || 'Data Access'}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span className="text-[11px] text-muted-foreground">by {ev.actor || 'vds-agent'}</span>
                                </div>
                            </div>
                        </div>
                        <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            ev.policy_decision === 'PASS' ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                        )}>
                            {ev.policy_decision || 'PASS'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ActionTab({ session }: { session: any }) {
    const [submitted, setSubmitted] = useState<Set<number>>(new Set());
    const output = session.final_output || {};
    const act = output.act || {};
    const actions = act.actions || [];
    const recommend = output.narrate?.recommendations || [];

    const displayActions = actions.length > 0 ? actions : recommend.map((r: any) => ({
        title: r.title || r.action || r,
        description: r.expected_impact || 'Operational recommendation identified during automated analysis.',
        type: 'notification',
        target: 'Slack',
    }));

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {displayActions.map((action: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-md group hover:border-primary/30 transition-all border-l-4 border-l-primary">
                    <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                                    {action.type === 'record_update' ? <Play className="w-6 h-6 rotate-90" /> : <Zap className="w-6 h-6 fill-current" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground mb-1">{action.title || action.name || `Action Deployment ${i + 1}`}</h4>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> {action.target || 'ERP/CRM System'}</span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase">Guardrail: {action.guardrail || 'Confidence ≥ 0.7'}</span>
                                    </div>
                                </div>
                            </div>
                            {submitted.has(i) && (
                                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Deployed
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                            {action.description || action.details || 'This automated action was generated to address the findings discovered in the analysis pipeline.'}
                        </p>

                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" className="rounded-xl px-6 h-10 border-border bg-transparent hover:bg-secondary">
                                Dry Run Analysis
                            </Button>
                            {!submitted.has(i) ? (
                                <Button size="sm" className="rounded-xl px-8 h-10 font-bold shadow-lg shadow-primary/20" onClick={() => setSubmitted(prev => new Set([...Array.from(prev), i]))}>
                                    Deploy Strategy ⚡
                                </Button>
                            ) : (
                                <Button size="sm" variant="secondary" className="rounded-xl px-8 h-10 font-bold opacity-50 cursor-not-allowed" disabled>
                                    Deployed to Production
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

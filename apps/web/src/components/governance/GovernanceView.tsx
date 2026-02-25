import { Shield, CheckCircle, AlertTriangle, Search, Activity, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
    id: string;
    action: string;
    actor: string;
    policy_decision: 'PASS' | 'FAIL' | 'WARN';
    timestamp: string;
    details: string;
}

interface Policy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

export function GovernanceView({ auditLog, policies }: { auditLog: AuditLogEntry[], policies: Policy[] }) {
    return (
        <div className="p-8 animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Governance & Audit</h1>
                    <p className="text-muted-foreground text-sm">Transparency, policy enforcement, and decision traceability</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Lock className="w-4 h-4" />
                        Access Control
                    </Button>
                    <Button className="gap-2">
                        <Shield className="w-4 h-4" />
                        Configure Policies
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Policy Enforcement */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Active Policies
                        </h3>
                        <div className="space-y-4">
                            {policies.map((policy) => (
                                <div key={policy.id} className="flex items-start justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-foreground mb-1">{policy.name}</div>
                                        <div className="text-[11px] text-muted-foreground line-clamp-1">{policy.description}</div>
                                    </div>
                                    <div className={cn(
                                        "w-8 h-4 rounded-full relative transition-colors",
                                        policy.enabled ? "bg-emerald-400" : "bg-muted"
                                    )}>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full bg-card absolute top-1 transition-all",
                                            policy.enabled ? "right-1" : "left-1"
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-400/10 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h4 className="text-sm font-bold text-emerald-400">Compliance Status</h4>
                        </div>
                        <p className="text-xs text-emerald-400/80 leading-relaxed">
                            Your workspace is currently compliant with all PII and SOC2 data masking policies. No anomalies detected in the last 24 hours.
                        </p>
                    </div>
                </div>

                {/* Audit Log */}
                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Audit Trail
                            </h3>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
                                <FileText className="w-3.5 h-3.5" />
                                Export CSV
                            </Button>
                        </div>
                        <div className="overflow-auto max-h-[600px] scrollbar-thin">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-card z-10 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Action</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actor</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Decision</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {auditLog.map((log) => (
                                        <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                                    {log.id.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {log.actor}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    log.policy_decision === 'PASS' ? "bg-emerald-400/10 text-emerald-400" :
                                                        log.policy_decision === 'FAIL' ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400"
                                                )}>
                                                    {log.policy_decision}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {auditLog.length === 0 && (
                                <div className="py-20 text-center">
                                    <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-1">No activities logged</h3>
                                    <p className="text-muted-foreground text-sm">Decision logs will appear once the agent runs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

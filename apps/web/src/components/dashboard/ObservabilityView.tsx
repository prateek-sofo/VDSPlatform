import { useState } from 'react';
import { Activity, Database, Brain, Sparkles, AlertTriangle, CheckCircle, Clock, Server, BarChart3, TrendingUp, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicChart } from './DynamicChart';

export function ObservabilityView() {
    const [timeRange, setTimeRange] = useState('24h');

    return (
        <div className="p-8 animate-fade-in space-y-8 bg-background h-full overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Operations Hub</h1>
                    <p className="text-muted-foreground text-sm">Unified observability for DataOps, MLOps, and GenAIOps pipelines.</p>
                </div>
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                    {['1h', '24h', '7d', '30d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                timeRange === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* DataOps Pillar */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                                <Database className="w-5 h-5" />
                            </div>
                            <h2 className="text-base font-bold text-foreground">DataOps</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" /> Healthy
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <MetricRow label="Pipeline Freshness" value="99.98%" trend="+0.02%" active />
                        <MetricRow label="Ingestion Latency" value="124ms" trend="-12ms" />
                        <MetricRow label="Data Quality Score" value="94/100" trend="-1" alert />
                        <MetricRow label="Sync Failures (24h)" value="0" />
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Ingestion Volume</div>
                        <div className="h-24">
                            <DynamicChart spec={{
                                type: 'bar', xAxis: 'time', yAxis: 'vol',
                                data: [
                                    { time: '00:00', vol: 400 }, { time: '04:00', vol: 300 },
                                    { time: '08:00', vol: 800 }, { time: '12:00', vol: 1200 },
                                    { time: '16:00', vol: 950 }, { time: '20:00', vol: 600 }
                                ]
                            }} />
                        </div>
                    </div>
                </div>

                {/* MLOps Pillar */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                <Brain className="w-5 h-5" />
                            </div>
                            <h2 className="text-base font-bold text-foreground">MLOps</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold uppercase">
                            <AlertTriangle className="w-3 h-3" /> Degraded
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <MetricRow label="Models in Production" value="12" />
                        <MetricRow label="Avg Inference Time" value="45ms" trend="+5ms" />
                        <MetricRow label="Feature Drift Alerts" value="2" alert />
                        <MetricRow label="Prediction Accuracy" value="92.4%" trend="-1.2%" alert />
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Prediction Accuracy Trend</div>
                        <div className="h-24">
                            <DynamicChart spec={{
                                type: 'line', xAxis: 'day', yAxis: 'acc',
                                data: [
                                    { day: 'Mon', acc: 94.2 }, { day: 'Tue', acc: 94.0 },
                                    { day: 'Wed', acc: 93.8 }, { day: 'Thu', acc: 93.5 },
                                    { day: 'Fri', acc: 92.4 }
                                ]
                            }} />
                        </div>
                    </div>
                </div>

                {/* GenAIOps Pillar */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h2 className="text-base font-bold text-foreground">GenAIOps</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" /> Optimal
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <MetricRow label="Token Usage (30d)" value="4.2M" trend="+12%" />
                        <MetricRow label="Avg LLM Latency" value="1.2s" trend="-0.3s" active />
                        <MetricRow label="Safety Interventions" value="4" />
                        <MetricRow label="Est. API Cost" value="$142.50" />
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Token Consumption</div>
                        <div className="h-24">
                            <DynamicChart spec={{
                                type: 'bar', xAxis: 'day', yAxis: 'tokens',
                                data: [
                                    { day: 'Mon', tokens: 120000 }, { day: 'Tue', tokens: 150000 },
                                    { day: 'Wed', tokens: 110000 }, { day: 'Thu', tokens: 180000 },
                                    { day: 'Fri', tokens: 210000 }
                                ]
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* System Resources / Infrastructure */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Server className="w-4 h-4 text-primary" /> Infrastructure Health
                    </h3>
                    <div className="text-xs text-muted-foreground font-mono">us-east-1 (AWS)</div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <ResourceNode label="API Gateway" status="operational" load={42} />
                    <ResourceNode label="Redis Cache" status="operational" load={28} />
                    <ResourceNode label="Vector DB (Qdrant)" status="operational" load={65} />
                    <ResourceNode label="Spark Workers" status="scaling" load={88} />
                </div>
            </div>
        </div>
    );
}

function MetricRow({ label, value, trend, active, alert }: { label: string, value: string, trend?: string, active?: boolean, alert?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-3">
                {trend && (
                    <span className={cn(
                        "text-[10px] font-bold",
                        alert ? "text-red-400" : (trend.startsWith('+') && !active ? "text-emerald-400" : active ? "text-emerald-400" : "text-muted-foreground")
                    )}>
                        {trend}
                    </span>
                )}
                <span className={cn(
                    "font-mono text-sm font-bold",
                    alert ? "text-red-400" : "text-foreground"
                )}>{value}</span>
            </div>
        </div>
    );
}

function ResourceNode({ label, status, load }: { label: string, status: string, load: number }) {
    return (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-foreground">{label}</span>
                <span className={cn(
                    "w-2 h-2 rounded-full",
                    status === 'operational' ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                )} />
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                    <span>Load Capacity</span>
                    <span>{load}%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className={cn(
                        "h-full rounded-full transition-all",
                        load > 80 ? "bg-amber-400" : "bg-primary"
                    )} style={{ width: `${load}%` }} />
                </div>
            </div>
        </div>
    );
}

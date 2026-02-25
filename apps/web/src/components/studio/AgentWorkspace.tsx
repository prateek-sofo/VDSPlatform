import { useState } from "react";
import {
    Play,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    Download,
    Filter,
    Search,
    MoreVertical,
    Zap,
    Database,
    Brain,
    Mail,
    Shield,
    Layout,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentRun {
    id: string;
    agentName: string;
    version: string;
    status: "success" | "failed" | "running" | "pending";
    duration: string;
    accuracy: string;
    volume: number;
    trigger: string;
    startTime: string;
    steps: {
        name: string;
        icon: React.ComponentType<{ className?: string }>;
        status: "success" | "failed" | "running" | "pending";
        duration: string;
        output?: string;
    }[];
}

const agentRuns: AgentRun[] = [
    {
        id: "vds-run-882",
        agentName: "Revenue Retention Agent",
        version: "v4.2-prod",
        status: "success",
        duration: "4m 12s",
        accuracy: "94.8%",
        volume: 12450,
        trigger: "Scheduled (Daily)",
        startTime: "Today, 08:00 AM",
        steps: [
            { name: "Schema Inspection", icon: Database, status: "success", duration: "2s" },
            { name: "Feature Synthesis", icon: Cpu, status: "success", duration: "1m 10s", output: "42 features generated" },
            { name: "Inference Loop", icon: Brain, status: "success", duration: "2m 45s", output: "Probabilities computed" },
            { name: "CRM Writeback", icon: Mail, status: "success", duration: "15s", output: "892 leads updated" },
        ],
    },
    {
        id: "vds-run-881",
        agentName: "Fraud Sentinel Agent",
        version: "v1.2-beta",
        status: "failed",
        duration: "45s",
        accuracy: "--",
        volume: 156,
        trigger: "Webhook (Stripe)",
        startTime: "Today, 10:15 AM",
        steps: [
            { name: "Webhook Payload parsing", icon: Zap, status: "success", duration: "0.5s" },
            { name: "Historical Context Fetch", icon: Database, status: "success", duration: "12s" },
            { name: "Risk Scoring", icon: Brain, status: "failed", duration: "32s", output: "LLM Context Window Overload" },
        ],
    },
    {
        id: "vds-run-880",
        agentName: "Price Optimization Agent",
        version: "v2.0",
        status: "running",
        duration: "2m 15s",
        accuracy: "--",
        volume: 540,
        trigger: "Manual (kaizen)",
        startTime: "Today, 11:30 AM",
        steps: [
            { name: "Market Data Crawl", icon: Database, status: "success", duration: "1m 05s" },
            { name: "Competitor Analysis", icon: Layout, status: "success", duration: "45s" },
            { name: "Elasticity Simulation", icon: Brain, status: "running", duration: "25s" },
        ],
    },
];

const statusStyles = {
    success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Operational" },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "Interrupted" },
    running: { icon: RefreshCw, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "Executing" },
    pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", label: "Queued" },
};

export function AgentWorkspace() {
    const [selectedRun, setSelectedRun] = useState<string | null>("vds-run-882");
    const [expandedRun, setExpandedRun] = useState<string | null>("vds-run-882");

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-card/30 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Agent Workspace</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Registry of active agents and their operational history
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-primary/20 hover:bg-primary/5">
                            <Filter className="w-4 h-4 text-primary" />
                            Filter Agents
                        </Button>
                        <Button className="gap-2 h-9 rounded-xl shadow-lg shadow-primary/20">
                            <Zap className="w-4 h-4 shrink-0" />
                            New Agent
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="px-8 py-4 border-b border-border bg-secondary/20 flex items-center gap-10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Active Agents</span>
                    <span className="text-xl font-bold text-foreground">12 <span className="text-xs text-emerald-400 font-medium">+2 new</span></span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Pass Rate</span>
                    <span className="text-xl font-bold text-foreground">98.2%</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Tokens/Hour</span>
                    <span className="text-xl font-bold text-foreground">1.4M</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto scrollbar-thin p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search agents by name or ID..."
                            className="w-full h-11 pl-12 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 hover:border-primary/30 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <th className="px-6 py-4 w-10 text-center">#</th>
                                <th className="px-4 py-4">Agent Identification</th>
                                <th className="px-4 py-4">Operational Status</th>
                                <th className="px-4 py-4">Performance</th>
                                <th className="px-4 py-4">Throughput</th>
                                <th className="px-4 py-4">Last Activity</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {agentRuns.map((run) => {
                                const style = statusStyles[run.status];
                                const Icon = style.icon;
                                const isExpanded = expandedRun === run.id;

                                return (
                                    <React.Fragment key={run.id}>
                                        <tr
                                            className={cn(
                                                "group text-sm font-medium transition-all cursor-pointer",
                                                isExpanded ? "bg-primary/[0.02]" : "hover:bg-primary/[0.01]"
                                            )}
                                            onClick={() => {
                                                setSelectedRun(run.id);
                                                setExpandedRun(isExpanded ? null : run.id);
                                            }}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center">
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-secondary text-muted-foreground group-hover:text-primary transition-colors border border-border">
                                                        <Cpu className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground tracking-tight">{run.agentName}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{run.id} • {run.version}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 font-mono text-sm text-foreground">
                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border", style.bg, style.border, style.color)}>
                                                    <Icon className={cn("w-3.5 h-3.5", run.status === "running" && "animate-spin")} />
                                                    {style.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground">{run.accuracy}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">ACC_SCORE</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{run.volume.toLocaleString()}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">RECORDS_PROCESSED</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground text-xs">{run.startTime}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Via {run.trigger}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-0 py-0">
                                                    <div className="px-10 py-8 bg-secondary/10 border-b border-border grid grid-cols-12 gap-8 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="col-span-8">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                                                <Layout className="w-3.5 h-3.5" />
                                                                Execution Trace
                                                            </h4>
                                                            <div className="space-y-3 relative">
                                                                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border/50" />
                                                                {run.steps.map((step, idx) => {
                                                                    const stepStyle = statusStyles[step.status];
                                                                    const StepIcon = step.icon;
                                                                    return (
                                                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-sm relative z-10 transition-all hover:border-primary/20">
                                                                            <div className={cn("p-2 rounded-lg shrink-0", stepStyle.bg, stepStyle.color)}>
                                                                                <StepIcon className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-sm font-bold text-foreground">{step.name}</span>
                                                                                    <span className="text-[10px] font-mono text-muted-foreground">{step.duration}</span>
                                                                                </div>
                                                                                {step.output && (
                                                                                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg font-mono">
                                                                                        {step.output}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase border mt-1", stepStyle.bg, stepStyle.border, stepStyle.color)}>
                                                                                {step.status}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-4 space-y-6">
                                                            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
                                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operational Insights</h5>
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400">
                                                                            <Shield className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-foreground tracking-tight">Governance Check passed</span>
                                                                            <span className="text-[10px] text-muted-foreground">0 policy violations detected</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                                            <Cpu className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-foreground tracking-tight">Computational Efficiency</span>
                                                                            <span className="text-[10px] text-muted-foreground">Optimized via Parallel Fan-out</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button className="w-full rounded-xl h-11 gap-2 uppercase text-[10px] font-bold tracking-widest">
                                                                <Zap className="w-4 h-4" />
                                                                Run Agent Manually
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import React from "react";

import { useState } from "react";
import {
    Rocket,
    Database,
    Cloud,
    MessageSquare,
    Mail,
    Webhook,
    Calendar,
    Clock,
    Play,
    CheckCircle,
    ArrowRight,
    Filter,
    Settings,
    RefreshCw,
    ChevronRight,
    AlertTriangle,
    Zap,
    Table,
    Users,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const destinations = [
    { id: "warehouse", name: "Warehouse Table", icon: Database, description: "Write predictions to a database table" },
    { id: "crm", name: "CRM Field Update", icon: Users, description: "Update Salesforce or HubSpot fields" },
    { id: "slack", name: "Slack Notification", icon: MessageSquare, description: "Send alerts to Slack channels" },
    { id: "email", name: "Email Report", icon: Mail, description: "Send scheduled email reports" },
    { id: "webhook", name: "Webhook", icon: Webhook, description: "POST to external endpoints" },
];

const scheduleOptions = [
    { id: "realtime", label: "Real-time", description: "Score immediately on new data" },
    { id: "hourly", label: "Hourly", description: "Run every hour" },
    { id: "daily", label: "Daily", description: "Run once per day" },
    { id: "weekly", label: "Weekly", description: "Run once per week" },
];

const previewData = [
    { customer_id: "CUS-001", churn_score: 0.92, segment: "Enterprise", action: "Update" },
    { customer_id: "CUS-002", churn_score: 0.87, segment: "Growth", action: "Update" },
    { customer_id: "CUS-003", churn_score: 0.74, segment: "Enterprise", action: "Update" },
    { customer_id: "CUS-004", churn_score: 0.68, segment: "Standard", action: "Skip (below threshold)" },
];

export function DeploymentView() {
    const [step, setStep] = useState(1);
    const [selectedDestination, setSelectedDestination] = useState<string | null>("warehouse");
    const [selectedSchedule, setSelectedSchedule] = useState("daily");
    const [threshold, setThreshold] = useState(0.7);
    const [deploymentName, setDeploymentName] = useState("Churn Scores Daily");

    const selectedDestinationData = destinations.find((d) => d.id === selectedDestination);

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-card/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Deployment & Write-Back</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure how model predictions are delivered to your business systems
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Engine Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="px-8 py-4 border-b border-border bg-card/10">
                <div className="flex items-center gap-2 max-w-5xl overflow-x-auto scrollbar-none">
                    {[
                        { num: 1, label: "Schedule" },
                        { num: 2, label: "Destination" },
                        { num: 3, label: "Mapping" },
                        { num: 4, label: "Review" },
                    ].map((s, index) => (
                        <div key={s.num} className="flex items-center shrink-0">
                            <button
                                onClick={() => setStep(s.num)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-xl transition-all border",
                                    step === s.num
                                        ? "bg-primary/10 text-primary border-primary/20 ring-4 ring-primary/5"
                                        : step > s.num
                                            ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 shadow-sm shadow-emerald-400/10"
                                            : "text-muted-foreground border-transparent hover:bg-secondary/50"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors",
                                        step === s.num
                                            ? "bg-primary text-primary-foreground"
                                            : step > s.num
                                                ? "bg-emerald-400 text-emerald-950"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
                            </button>
                            {index < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground/30 mx-2" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-auto p-8 scrollbar-thin">
                <div className="max-w-4xl mx-auto">
                    {/* Step 1: Name & Schedule */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Deployment Identification</h2>
                                    <p className="text-xs text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">Define how this pipeline appears in the governance audit trail.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground pl-1">
                                        Pipeline Name
                                    </label>
                                    <input
                                        type="text"
                                        value={deploymentName}
                                        onChange={(e) => setDeploymentName(e.target.value)}
                                        className="w-full h-12 px-5 rounded-2xl bg-secondary/50 border border-border text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                                        placeholder="e.g., Enterprise Churn Prediction Sync"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground pl-1">
                                        Scoring Frequency
                                    </label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {scheduleOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => setSelectedSchedule(option.id)}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-left transition-all group relative overflow-hidden",
                                                    selectedSchedule === option.id
                                                        ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                                                        : "bg-card/50 border-border hover:border-primary/20"
                                                )}
                                            >
                                                <div className="relative z-10 flex flex-col gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                            selectedSchedule === option.id ? "bg-primary text-primary-foreground scale-110" : "bg-secondary text-muted-foreground"
                                                        )}
                                                    >
                                                        {option.id === "realtime" ? (
                                                            <Zap className="w-5 h-5 fill-current" />
                                                        ) : (
                                                            <Clock className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground">{option.label}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{option.description}</p>
                                                    </div>
                                                </div>
                                                {selectedSchedule === option.id && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedSchedule === "daily" && (
                                    <div className="p-6 rounded-3xl bg-secondary/30 border border-border/50 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Execution Window</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">VDS will trigger scoring on fresh partition data.</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-border">
                                            <select className="h-10 px-4 rounded-xl bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer">
                                                <option>06:00 AM</option>
                                                <option>09:00 AM</option>
                                                <option>12:00 PM</option>
                                                <option>18:00 PM</option>
                                            </select>
                                            <div className="w-px h-6 bg-border" />
                                            <span className="text-xs font-bold text-primary px-2">UTC +0</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Destination */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Data Activation</h2>
                                <p className="text-xs text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">Select the system where predictions will be activated.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {destinations.map((dest) => {
                                    const Icon = dest.icon;
                                    return (
                                        <button
                                            key={dest.id}
                                            onClick={() => setSelectedDestination(dest.id)}
                                            className={cn(
                                                "p-6 rounded-3xl border text-left transition-all flex items-center gap-6 group relative overflow-hidden",
                                                selectedDestination === dest.id
                                                    ? "bg-primary/5 border-primary/40 shadow-xl shadow-primary/5"
                                                    : "bg-card/50 border-border hover:border-primary/20"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                                    selectedDestination === dest.id ? "bg-primary text-primary-foreground scale-110 shadow-lg" : "bg-secondary text-muted-foreground"
                                                )}
                                            >
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{dest.name}</p>
                                                <p className="text-sm text-muted-foreground mt-0.5">{dest.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {selectedDestination === dest.id ? (
                                                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Active Choice</span>
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary/50 transition-all" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Mapping & Filters */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in zoom-in-95 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Field Mapping & Guardrails</h2>
                                <p className="text-xs text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">Map predictions to destination fields and define output filters.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Field Mapping */}
                                <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                            <Table className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-foreground">Source-to-Target</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { source: "customer_id", target: "external_id", type: "UUID" },
                                            { source: "churn_score", target: "vds_risk_score", type: "FLOAT" },
                                            { source: "risk_band", target: "vds_risk_tag", type: "STRING" },
                                        ].map((mapping, i) => (
                                            <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                                    <span>VDS Source</span>
                                                    <span>{mapping.type}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <code className="flex-1 text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl">
                                                        {mapping.source}
                                                    </code>
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground/30 animate-pulse" />
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            defaultValue={mapping.target}
                                                            className="w-full h-9 px-4 rounded-xl bg-card border border-border text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="space-y-8">
                                    <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                                                <Filter className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-foreground">Action Threshold</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                    Only write scores {'>='}
                                                </span>
                                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{(threshold * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={threshold * 100}
                                                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                                                className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
                                            />
                                            <p className="text-[10px] text-muted-foreground leading-relaxed italic pr-4">
                                                Lowering the threshold increases data volume but may noise up CRM systems with low-risk entries.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Shield className="w-5 h-5 text-emerald-400" />
                                            <h3 className="font-bold text-foreground">Governance</h3>
                                        </div>
                                        <label className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border hover:border-primary/30 transition-all cursor-pointer group">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary" />
                                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Audit trail enabled</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & Deploy */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
                                    <Rocket className="w-10 h-10 text-primary animate-bounce-subtle" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Final Confirmation</h2>
                                    <p className="text-xs text-muted-foreground mt-1 underline decoration-primary/30 underline-offset-4">Review your automated scoring pipeline before activation.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Freq</p>
                                    <p className="text-lg font-bold text-foreground capitalize">{selectedSchedule}</p>
                                </div>
                                <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target</p>
                                    <p className="text-lg font-bold text-foreground">{selectedDestinationData?.name}</p>
                                </div>
                                <div className="p-6 rounded-3xl border border-border bg-card/40 backdrop-blur-sm flex flex-col gap-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact</p>
                                    <p className="text-lg font-bold text-emerald-400">842 Records/day</p>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-foreground">Write-Back Preview</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top 5 Records</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-secondary/40">
                                            <tr className="border-b border-border/50">
                                                {Object.keys(previewData[0]).map((col) => (
                                                    <th key={col} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        {col.replace("_", " ")}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20 font-mono text-[11px]">
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4 text-foreground/80">{row.customer_id}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-primary">{(row.churn_score * 100).toFixed(0)}%</span>
                                                            <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary" style={{ width: `${row.churn_score * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{row.segment}</td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={cn(
                                                                "px-2 py-0.5 rounded-lg font-bold uppercase tracking-tighter",
                                                                row.action === "Update"
                                                                    ? "bg-emerald-400/10 text-emerald-400"
                                                                    : "bg-secondary text-muted-foreground/50"
                                                            )}
                                                        >
                                                            {row.action}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-border bg-card/50 backdrop-blur-md flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest"
                >
                    Previous
                </Button>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                        Save Draft
                    </Button>
                    {step < 4 ? (
                        <Button onClick={() => setStep(Math.min(4, step + 1))} className="rounded-xl h-12 px-10 gap-3 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 group">
                            Continue
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button className="rounded-2xl h-12 px-12 gap-3 font-bold text-base uppercase tracking-[0.1em] shadow-2xl shadow-primary/30 animate-pulse-subtle">
                            <Rocket className="w-5 h-5 fill-current" />
                            Activate Pipeline
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

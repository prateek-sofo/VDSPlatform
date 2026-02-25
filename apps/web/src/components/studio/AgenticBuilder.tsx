import React, { useState } from "react";
import {
    Play,
    Pause,
    Save,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Settings,
    Clock,
    Webhook,
    Database,
    Brain,
    Mail,
    MessageSquare,
    CheckCircle,
    GitBranch,
    ArrowRight,
    Plus,
    Trash2,
    Activity,
    BarChart3,
    PieChart,
    Target,
    ChevronDown,
    Cpu,
    Layout,
    Shield,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    LineChart,
    Line
} from 'recharts';

interface WorkflowNode {
    id: string;
    type: "trigger" | "data" | "model" | "action" | "approval" | "condition";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    x: number;
    y: number;
    description?: string;
    config?: Record<string, unknown>;
}

const nodeTypes = [
    {
        category: "Triggers",
        items: [
            { type: "trigger", title: "Schedule", icon: Clock, description: "Trigger on a cron schedule" },
            { type: "trigger", title: "Webhook", icon: Webhook, description: "External API trigger" },
        ],
    },
    {
        category: "Data",
        items: [
            { type: "data", title: "SQL Query", icon: Database, description: "Extract data from warehouse" },
            { type: "data", title: "API Call", icon: GitBranch, description: "Fetch external data" },
        ],
    },
    {
        category: "Agents & Decisions",
        items: [
            { type: "model", title: "Inference Agent", icon: Brain, description: "Run an AI agent step" },
            { type: "condition", title: "Router Agent", icon: GitBranch, description: "Conditional branch logic" },
        ],
    },
    {
        category: "Action Ops",
        items: [
            { type: "action", title: "Email Service", icon: Mail, description: "Send automated outreach" },
            { type: "action", title: "Slack Alert", icon: MessageSquare, description: "Post to team channel" },
            { type: "approval", title: "Human Review", icon: CheckCircle, description: "Pause for manual sign-off" },
        ],
    },
];

const sampleWorkflow: WorkflowNode[] = [
    { id: "1", type: "trigger", title: "Daily Schedule", icon: Clock, x: 100, y: 200 },
    { id: "2", type: "data", title: "Fetch Churn Data", icon: Database, x: 320, y: 200 },
    { id: "3", type: "model", title: "Predictive Agent", icon: Brain, x: 540, y: 200 },
    { id: "4", type: "condition", title: "High Risk?", icon: GitBranch, x: 760, y: 200 },
    { id: "5", type: "action", title: "Send Email", icon: Mail, x: 980, y: 140 },
    { id: "6", type: "action", title: "Slack Log", icon: MessageSquare, x: 980, y: 260 },
];

const connections = [
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "4" },
    { from: "4", to: "5" },
    { from: "4", to: "6" },
];

const chartData = [
    { name: 'Mon', churn: 400, retention: 2400 },
    { name: 'Tue', churn: 300, retention: 1398 },
    { name: 'Wed', churn: 200, retention: 9800 },
    { name: 'Thu', churn: 278, retention: 3908 },
    { name: 'Fri', churn: 189, retention: 4800 },
    { name: 'Sat', churn: 239, retention: 3800 },
    { name: 'Sun', churn: 349, retention: 4300 },
];

export function AgenticBuilder() {
    const [nodes] = useState<WorkflowNode[]>(sampleWorkflow);
    const [selectedNode, setSelectedNode] = useState<string | null>("3");
    const [isExpertMode, setIsExpertMode] = useState(false);

    const getNodePosition = (id: string) => {
        const node = nodes.find((n) => n.id === id);
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    };

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in font-sans">
            {/* Universal Header with Mode Toggle */}
            <div className="h-16 border-b border-border px-8 flex items-center justify-between bg-card/10 backdrop-blur-md z-40 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-foreground tracking-tight">Retention Multi-Agent System</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Status: Online & Monitoring</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-border mx-2" />

                    <div className="flex items-center bg-secondary/80 rounded-xl p-1 border border-border/50">
                        <Button
                            size="sm"
                            variant={!isExpertMode ? "default" : "ghost"}
                            className={cn(
                                "h-8 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest transition-all",
                                !isExpertMode ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsExpertMode(false)}
                        >
                            <BarChart3 className="w-3.5 h-3.5 mr-2" />
                            Business Insights
                        </Button>
                        <Button
                            size="sm"
                            variant={isExpertMode ? "default" : "ghost"}
                            className={cn(
                                "h-8 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest transition-all",
                                isExpertMode ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsExpertMode(true)}
                        >
                            <Cpu className="w-3.5 h-3.5 mr-2" />
                            Expert Canvas
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-primary/20 hover:bg-primary/5 transition-colors">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold">History</span>
                    </Button>
                    <Button size="sm" className="gap-2 h-9 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all font-bold">
                        <Play className="w-4 h-4 fill-current" />
                        <span className="text-xs">Trigger Manual Inference</span>
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {!isExpertMode ? (
                    /* Simplified Business Mode (Insights) */
                    <div className="flex-1 overflow-auto bg-background/50 p-10 scrollbar-thin">
                        <div className="max-w-6xl mx-auto space-y-10">
                            {/* Executive Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/40">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-emerald-400 text-xs font-bold font-mono">+12.4%</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">vs Last Month</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">Projected Retained Revenue</h3>
                                    <p className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">$428,500</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-400/40">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-red-400 text-xs font-bold font-mono">-2.1%</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">Improved Accuracy</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">Avg. Churn Probability</h3>
                                    <p className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">18.2%</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-400/40">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 rounded-2xl bg-emerald-400/10 text-emerald-400">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <span className="text-emerald-400 text-[10px] font-bold uppercase py-1 px-2 bg-emerald-400/10 rounded-full border border-emerald-400/20">Operational</span>
                                    </div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">System Health Score</h3>
                                    <p className="text-3xl font-black text-foreground mt-1 tabular-nums tracking-tight">98.4%</p>
                                </div>
                            </div>

                            {/* Performance Visualizations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-foreground">Retention Trends</h3>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border px-3 py-1 rounded-full">Weekly Projection</div>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                />
                                                <Bar dataKey="retention" radius={[6, 6, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 2 ? 'hsl(var(--primary))' : 'rgba(59,130,246,0.15)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
                                    <h3 className="text-lg font-bold text-foreground">Highest Risk Signals</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Dormant usage (>14 days)", impact: "High", score: 82, color: "text-red-400", bg: "bg-red-400/5" },
                                            { label: "Failed payment attempts", impact: "Critical", score: 94, color: "text-red-500", bg: "bg-red-500/10" },
                                            { label: "Key feature abandonment", impact: "Medium", score: 45, color: "text-amber-400", bg: "bg-amber-400/5" },
                                            { label: "Competitor mention in chat", impact: "High", score: 76, color: "text-red-400", bg: "bg-red-400/5" },
                                        ].map((driver, idx) => (
                                            <div key={idx} className={cn("flex items-center gap-4 p-4 rounded-2xl border border-border/50 hover:border-primary/20 transition-all", driver.bg)}>
                                                <div className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border bg-background shrink-0 w-16 text-center tracking-tighter uppercase", driver.color)}>
                                                    {driver.impact}
                                                </div>
                                                <span className="flex-1 text-sm font-semibold text-foreground/80">{driver.label}</span>
                                                <span className="text-xs font-black text-muted-foreground tabular-nums">{driver.score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Executive Strategy */}
                            <div className="relative p-1 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/30 to-purple-500/30">
                                <div className="bg-card/90 backdrop-blur-xl rounded-[1.95rem] p-8 space-y-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                                            <Brain className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tight">Sofo AI Strategy Recommendation</h3>
                                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Autonomous Agent Decisioning</div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                                            "Our **Inference Agent** has identified a surge in 'Failed Payment' patterns among high-tier enterprise accounts. To mitigate a potential **$82,000 ARR loss**, Sofo AI suggests automatically applying a **30-day grace period extension** and triggering a high-priority outreach agent for 12 accounts identified in today's run."
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <Button className="rounded-2xl h-12 px-8 gap-3 bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest group">
                                            <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                                            Approve & Deploy Action
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl h-12 px-8 gap-2 border-primary/20 hover:bg-primary/5 font-bold text-xs uppercase tracking-widest">
                                            <Save className="w-4 h-4" />
                                            Save as Playbook
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* High-Fidelity Expert Mode (Canvas + Code) */
                    <>
                        {/* Node Palette */}
                        <div className="w-72 border-r border-border bg-card/20 flex flex-col shrink-0 animate-in slide-in-from-left duration-300">
                            <div className="p-6 border-b border-border bg-card/10">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Logic Library</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin">
                                {nodeTypes.map((category) => (
                                    <div key={category.category}>
                                        <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary/70 mb-4 px-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {category.category}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {category.items.map((item) => (
                                                <div
                                                    key={item.title}
                                                    className="group flex flex-col gap-1 p-3.5 rounded-2xl bg-card border border-border/50 cursor-grab hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                                                    draggable
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-secondary group-hover:bg-primary/10 transition-colors">
                                                            <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground">
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Canvas Area Container */}
                        <div className="flex-1 flex flex-col relative bg-[rgba(15,23,42,0.5)]">
                            {/* Context Toolbar */}
                            <div className="h-12 border-b border-border px-6 flex items-center justify-between bg-card/30 backdrop-blur-md z-20">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center rounded-xl p-1 border border-border bg-secondary/40">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"><Undo className="w-3.5 h-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"><Redo className="w-3.5 h-3.5" /></Button>
                                    </div>
                                    <div className="flex items-center rounded-xl p-1 border border-border bg-secondary/40 text-[10px] font-black px-4 gap-4 text-muted-foreground">
                                        <ZoomOut className="w-3.5 h-3.5 cursor-pointer hover:text-foreground transition-colors" />
                                        <span className="w-8 text-center tabular-nums">1.0X</span>
                                        <ZoomIn className="w-3.5 h-3.5 cursor-pointer hover:text-foreground transition-colors" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] font-mono">SOFO_ORCHESTRATION_LAYER v4.2</span>
                                </div>
                            </div>

                            {/* Main Interactive Canvas */}
                            <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle,rgba(59,130,246,0.06)_1.5px,transparent_1.5px)] bg-[size:32px_32px]">
                                {/* SVG Connections (High Fidelity) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <defs>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="2" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <marker id="arrowhead-sofo" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <path d="M0,0 L10,3.5 L0,7 Z" fill="hsl(var(--primary))" />
                                        </marker>
                                    </defs>
                                    {connections.map((conn, index) => {
                                        const from = getNodePosition(conn.from);
                                        const to = getNodePosition(conn.to);
                                        return (
                                            <g key={index}>
                                                <path
                                                    d={`M ${from.x + 176} ${from.y + 40} C ${from.x + 230} ${from.y + 40}, ${to.x - 50} ${to.y + 40}, ${to.x} ${to.y + 40}`}
                                                    fill="none"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth="2"
                                                    strokeOpacity="0.4"
                                                    markerEnd="url(#arrowhead-sofo)"
                                                    filter="url(#glow)"
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Functional Agent Nodes */}
                                {nodes.map((node) => {
                                    const Icon = node.icon;
                                    const isSelected = selectedNode === node.id;
                                    return (
                                        <div
                                            key={node.id}
                                            className={cn(
                                                "absolute w-44 p-4 rounded-2xl border bg-card cursor-pointer transition-all duration-300 shadow-sm",
                                                isSelected
                                                    ? "border-primary ring-4 ring-primary/10 shadow-2xl z-30 -translate-y-1"
                                                    : "border-border/60 hover:border-primary/40 hover:scale-[1.02]"
                                            )}
                                            style={{ left: node.x, top: node.y }}
                                            onClick={() => setSelectedNode(node.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2.5 rounded-xl transition-all shadow-inner",
                                                    isSelected ? "bg-primary text-primary-foreground rotate-[5deg]" : "bg-secondary text-muted-foreground rotate-0"
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tighter">{node.title}</span>
                                                    <span className="text-[8px] text-muted-foreground uppercase font-mono tracking-widest leading-none mt-0.5">{node.type}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground border-2 border-background animate-in zoom-in-50 duration-200">
                                                    1
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Floating Action Button */}
                                <button className="absolute bottom-10 right-10 w-16 h-16 rounded-[1.5rem] bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-20 group">
                                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* High-Performance Inspector Panel (Code + Config) */}
                        <div className="w-80 border-l border-border bg-card/10 backdrop-blur-xl flex flex-col p-6 space-y-8 animate-in slide-in-from-right duration-500 overflow-y-auto scrollbar-thin">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Properties_v5</h3>
                                <div className="p-2 rounded-xl bg-secondary border border-border">
                                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                            </div>

                            {selectedNode ? (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Identifier</label>
                                        <input
                                            type="text"
                                            defaultValue={nodes.find((n) => n.id === selectedNode)?.title}
                                            className="w-full h-10 px-4 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-3 p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                            <Brain className="w-10 h-10 -mr-4 -mt-4 text-primary" />
                                        </div>
                                        <span className="text-[9px] font-black text-primary uppercase flex items-center gap-2 tracking-widest">
                                            <Code2 className="w-3 h-3" /> System Logic (JS/PY)
                                        </span>
                                        <div className="p-3 rounded-xl bg-background border border-border/50 font-mono text-[10px] leading-relaxed text-muted-foreground h-32 overflow-hidden relative">
                                            <code>{`const analyzeRisk = (user) => {\n  const score = weights.churn * user.usage;\n  if (score > THRESHOLD) {\n    return emit('critical_risk', { \n      userId: user.id \n    });\n  }\n}`}</code>
                                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
                                        </div>
                                        <Button variant="link" size="sm" className="h-4 p-0 text-[10px] font-black uppercase text-primary tracking-widest">Open in Full Editor</Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-bold px-1">
                                            <span className="text-muted-foreground uppercase tracking-widest">Memory Context</span>
                                            <span className="text-primary">128K TOKENS</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                                            <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <Button className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                                            Deploy Update
                                        </Button>
                                        <Button variant="outline" className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-red-500/20 text-red-400 hover:bg-red-400/5">
                                            Kill Node
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30 gap-4">
                                    <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                        <Database className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Select a functional node to access low-level orchestration properties</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

import { Code2 } from "lucide-react";

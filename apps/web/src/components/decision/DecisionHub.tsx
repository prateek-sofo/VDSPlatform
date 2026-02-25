import { useState } from "react";
import {
    Users,
    TrendingDown,
    DollarSign,
    Filter,
    Download,
    Play,
    Settings,
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    Clock,
    Zap,
    Target,
    Shield,
    Sliders,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
    id: string;
    name: string;
    email: string;
    churnScore: number;
    riskBand: "low" | "medium" | "high" | "critical";
    ltv: number;
    topDrivers: string[];
    segment: string;
}

const customers: Customer[] = [
    {
        id: "CUS-001",
        name: "Sarah Johnson",
        email: "sarah.j@techcorp.com",
        churnScore: 0.92,
        riskBand: "critical",
        ltv: 12400,
        topDrivers: ["No login 14d", "Support tickets ↑", "Usage ↓ 60%"],
        segment: "Enterprise",
    },
    {
        id: "CUS-002",
        name: "Michael Chen",
        email: "m.chen@startup.io",
        churnScore: 0.87,
        riskBand: "critical",
        ltv: 8200,
        topDrivers: ["Payment failed", "No feature adoption", "Competitor visit"],
        segment: "Growth",
    },
    {
        id: "CUS-003",
        name: "Emma Williams",
        email: "emma.w@retail.com",
        churnScore: 0.74,
        riskBand: "high",
        ltv: 15800,
        topDrivers: ["Contract ending", "Low NPS", "Feature requests"],
        segment: "Enterprise",
    },
    {
        id: "CUS-004",
        name: "James Rodriguez",
        email: "j.rod@media.co",
        churnScore: 0.68,
        riskBand: "high",
        ltv: 6400,
        topDrivers: ["Price sensitivity", "Usage plateau", "No expansion"],
        segment: "Mid-Market",
    },
    {
        id: "CUS-005",
        name: "Lisa Park",
        email: "lisa.p@finance.org",
        churnScore: 0.45,
        riskBand: "medium",
        ltv: 22100,
        topDrivers: ["Reduced seats", "Budget review", "Champion left"],
        segment: "Enterprise",
    },
];

const playbooks = [
    {
        id: "retain",
        name: "Retention Offer",
        description: "Personalized discount + dedicated success call",
        impact: "+32% retention",
        cost: "$50/customer",
        icon: Shield,
    },
    {
        id: "upsell",
        name: "Upsell Campaign",
        description: "Feature upgrade with 30-day trial",
        impact: "+18% expansion",
        cost: "$0 upfront",
        icon: TrendingDown,
    },
    {
        id: "nurture",
        name: "Re-engagement",
        description: "Automated email sequence + content",
        impact: "+24% activation",
        cost: "$5/customer",
        icon: Zap,
    },
    {
        id: "escalate",
        name: "Executive Outreach",
        description: "VP-level intervention for key accounts",
        impact: "+45% save rate",
        cost: "Internal",
        icon: Users,
    },
];

const riskBandColors = {
    low: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    medium: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-400/10 text-red-400 border-red-400/20",
};

export function DecisionHub() {
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>(["CUS-001", "CUS-002"]);
    const [activePlaybook, setActivePlaybook] = useState<string | null>("retain");
    const [threshold, setThreshold] = useState(0.7);
    const [budget, setBudget] = useState(10000);

    const toggleCustomer = (id: string) => {
        setSelectedCustomers((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const qualifiedCustomers = customers.filter((c) => c.churnScore >= threshold);

    return (
        <div className="h-full flex bg-background animate-fade-in">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-8 py-6 border-b border-border bg-card/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Decision Hub</h1>
                            <p className="text-sm text-muted-foreground">
                                Convert predictive insights into governed business actions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                                <Filter className="w-4 h-4" />
                                Advanced Filters
                            </Button>
                            <Button size="sm" className="gap-2 rounded-lg shadow-lg shadow-primary/20">
                                <Play className="w-4 h-4 fill-current" />
                                Execute Policy
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="px-8 py-4 border-b border-border flex items-center gap-8 bg-card/10">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">{qualifiedCustomers.length}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">At Risk</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-lg font-bold text-foreground leading-none">
                                ${qualifiedCustomers.reduce((sum, c) => sum + c.ltv, 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mt-1">Exposed LTV</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">{selectedCustomers.length}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected</span>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto scrollbar-thin">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-card z-10">
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-8 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border bg-secondary"
                                        checked={selectedCustomers.length === customers.length}
                                        onChange={() =>
                                            setSelectedCustomers(
                                                selectedCustomers.length === customers.length
                                                    ? []
                                                    : customers.map((c) => c.id)
                                            )
                                        }
                                    />
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Customer
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Churn Probability
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Risk Tier
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    LTV
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Key Drivers
                                </th>
                                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Segment
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {customers.map((customer, index) => (
                                <tr
                                    key={customer.id}
                                    className={cn(
                                        "hover:bg-secondary/30 transition-colors cursor-pointer group",
                                        selectedCustomers.includes(customer.id) && "bg-primary/5"
                                    )}
                                    onClick={() => toggleCustomer(customer.id)}
                                >
                                    <td className="px-8 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-border bg-secondary"
                                            checked={selectedCustomers.includes(customer.id)}
                                            onChange={() => toggleCustomer(customer.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <p className="font-bold text-foreground text-sm">{customer.name}</p>
                                            <p className="text-[11px] text-muted-foreground font-mono">{customer.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-1 rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        customer.churnScore >= 0.8
                                                            ? "bg-red-400"
                                                            : customer.churnScore >= 0.6
                                                                ? "bg-orange-400"
                                                                : customer.churnScore >= 0.4
                                                                    ? "bg-amber-400"
                                                                    : "bg-emerald-400"
                                                    )}
                                                    style={{ width: `${customer.churnScore * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-foreground">
                                                {(customer.churnScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg border",
                                                riskBandColors[customer.riskBand]
                                            )}
                                        >
                                            {customer.riskBand}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm font-bold text-foreground">
                                            ${customer.ltv.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {customer.topDrivers.map((driver, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-secondary/50 text-muted-foreground border border-border/30"
                                                >
                                                    {driver}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">{customer.segment}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Policy Builder Sidebar */}
            <div className="w-96 border-l border-border bg-card/30 backdrop-blur-xl flex flex-col">
                <Tabs defaultValue="policy" className="flex flex-col h-full">
                    <div className="px-6 py-4 border-b border-border bg-card/50">
                        <TabsList className="w-full bg-secondary/50 rounded-xl p-1">
                            <TabsTrigger value="policy" className="flex-1 gap-2 rounded-lg py-2">
                                <Sliders className="w-4 h-4" />
                                Policy
                            </TabsTrigger>
                            <TabsTrigger value="playbooks" className="flex-1 gap-2 rounded-lg py-2">
                                <Target className="w-4 h-4" />
                                Playbooks
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="policy" className="flex-1 m-0 p-6 space-y-8 overflow-y-auto scrollbar-thin">
                        {/* Threshold */}
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Risk Threshold</span>
                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{'>='} {(threshold * 100).toFixed(0)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={threshold * 100}
                                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                                className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
                            />
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                Currently qualifying <span className="text-foreground font-bold">{qualifiedCustomers.length}</span> high-priority targets for intervention.
                            </p>
                        </div>

                        {/* Budget */}
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Allocation Limit</span>
                                <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">${budget.toLocaleString()}</span>
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="50000"
                                step="1000"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Constraints */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Governance Constraints</h4>
                            <div className="space-y-2">
                                {[
                                    "Max ±5% variance across segments",
                                    "Prioritize tenure > 24 months",
                                    "Exclude active support escalations"
                                ].map((constraint, i) => (
                                    <label key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-all cursor-pointer group">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-secondary text-primary" />
                                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{constraint}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Simulation */}
                        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 shadow-inner">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" />
                                Live Projection
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Targets</p>
                                    <p className="text-lg font-bold text-foreground leading-tight">{selectedCustomers.length}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Est. Cost</p>
                                    <p className="text-lg font-bold text-foreground leading-tight">
                                        ${(selectedCustomers.length * 50).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Goal: Saves</p>
                                    <p className="text-lg font-bold text-emerald-400 leading-tight">
                                        ~{Math.round(selectedCustomers.length * 0.32)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">LTV Yield</p>
                                    <p className="text-lg font-bold text-emerald-400 leading-tight">$28.4K</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="playbooks" className="flex-1 m-0 p-6 space-y-3 overflow-y-auto scrollbar-thin">
                        {playbooks.map((playbook) => {
                            const Icon = playbook.icon;
                            const isActive = activePlaybook === playbook.id;
                            return (
                                <button
                                    key={playbook.id}
                                    onClick={() => setActivePlaybook(playbook.id)}
                                    className={cn(
                                        "w-full p-5 rounded-2xl border text-left transition-all group",
                                        isActive
                                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                            : "bg-card/50 border-border hover:border-primary/20"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-2.5 rounded-xl transition-all", isActive ? "bg-primary/20 text-primary scale-110" : "bg-secondary text-muted-foreground")}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground">{playbook.name}</h4>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{playbook.description}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                                                    <TrendingDown className="w-3 h-3" />
                                                    {playbook.impact}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{playbook.cost}</span>
                                            </div>
                                        </div>
                                        {isActive && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                                    </div>
                                </button>
                            );
                        })}
                    </TabsContent>

                    {/* Execute Button */}
                    <div className="p-6 border-t border-border bg-card/60 backdrop-blur-md">
                        <Button size="lg" className="w-full h-12 rounded-2xl gap-3 text-sm font-bold shadow-xl shadow-primary/20">
                            <Play className="w-4 h-4 fill-current" />
                            Execute for {selectedCustomers.length} Customers
                        </Button>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

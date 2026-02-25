import {
    DollarSign,
    Users,
    TrendingUp,
    Package,
    RefreshCw,
    ArrowRight,
    Database,
    Activity,
    Globe,
    Zap,
    Scale
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { Button } from "@/components/ui/button";

const kpis = [
    {
        title: "Global Revenue Realization",
        value: "$24.8M",
        delta: 12.5,
        deltaLabel: "vs Q2 target",
        icon: Globe,
    },
    {
        title: "CAC : LTV Ratio",
        value: "1:4.2",
        delta: 8.4,
        deltaLabel: "improving",
        icon: Scale,
    },
    {
        title: "Supply Chain Resilience",
        value: "94.2%",
        delta: -1.2,
        deltaLabel: "logistics delay",
        icon: Package,
    },
    {
        title: "Cloud Compute Spend",
        value: "$142K",
        delta: -5.4,
        deltaLabel: "cost optimized",
        icon: Database,
    },
];

const insights = [
    {
        type: "anomaly" as const,
        title: "Predictive Shortfall in Q3 EMEA Pipeline",
        description: "Leading indicators and macro-economic models forecast a 14% gap in enterprise deals closing in the DACH region by end of quarter.",
        metric: "-14%",
        timestamp: "12 mins ago",
    },
    {
        type: "opportunity" as const,
        title: "Dynamic Pricing Arbitration",
        description: "Competitor 'Alpha' raised prices by 8%. Simulation models suggest we can capture 4% market share by holding prices steady this month.",
        metric: "+4.0%",
        timestamp: "1 hour ago",
    },
    {
        type: "driver" as const,
        title: "Customer Sentiment Drop in APJ",
        description: "NLP analysis of recent support tickets indicates extreme frustration with the v2.4 mobile app rollout. Correlated with 12% drop in DAU.",
        metric: "-12% DAU",
        timestamp: "3 hours ago",
    },
    {
        type: "anomaly" as const,
        title: "Logistics Vendor Latency",
        description: "Average shipping time for Vendor B has drifted from 2.1 days to 4.5 days, risking SLA violations for premium tier customers.",
        metric: "4.5 days",
        timestamp: "5 hours ago",
    },
];

const actions = [
    {
        title: "Re-route supply chain fulfillment",
        description: "Shift 40% of standard shipping volume to Vendor A to mitigate SLA risks and preserve customer sat score.",
        impact: "$1.2M at risk",
        dueDate: "Today",
        status: "pending" as const,
    },
    {
        title: "Launch proactive retention campaign",
        description: "Deploy automated 'we're listening' email sequence to affected mobile app users with a 15% service credit.",
        impact: "3,400 users",
        dueDate: "In 2 days",
        status: "approved" as const,
    },
];

export function CommandCentre() {
    return (
        <div className="min-h-full p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Command Centre</h1>
                    <p className="text-muted-foreground text-sm">Real-time business intelligence and recommended actions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Activity className="w-4 h-4" />
                        View Models
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi) => (
                    <KPICard key={kpi.title} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Insights */}
                <div className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Insights Feed</h2>
                        <Button variant="ghost" size="sm" className="text-primary text-xs hover:text-primary">
                            View all <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, idx) => (
                            <InsightCard key={idx} {...insight} />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Action Queue</h2>
                    <div className="space-y-4">
                        {actions.map((action, idx) => (
                            <ActionCard key={idx} {...action} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4 text-primary" />
                        <h3 className="font-medium text-sm">Pipeline Health</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <StatusIndicator status="healthy" label="Data freshness" value="< 1m" />
                        <StatusIndicator status="healthy" label="Sync jobs" value="42 active" />
                        <StatusIndicator status="warning" label="Error rate" value="0.3%" />
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-primary" />
                        <h3 className="font-medium text-sm">Model Status</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <StatusIndicator status="healthy" label="Churn Predictor" value="Active" />
                        <StatusIndicator status="warning" label="Demand Forecast" value="Drift" />
                        <StatusIndicator status="inactive" label="LTV Model" value="Training" />
                    </div>
                </div>
            </div>
        </div>
    );
}

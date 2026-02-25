import { useState } from "react";
import {
    Sparkles,
    Search,
    Plus,
    Settings,
    Filter,
    Download,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Hash,
    Calendar,
    BarChart3,
    Eye,
    EyeOff,
    ChevronRight,
    Zap,
    Clock,
    DollarSign,
    Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Feature {
    id: string;
    name: string;
    displayName: string;
    type: "numeric" | "categorical" | "boolean" | "timestamp";
    category: "behavioral" | "transactional" | "time-series" | "text" | "derived";
    importance: number;
    correlation: number;
    leakageFlag: boolean;
    included: boolean;
    description: string;
}

const features: Feature[] = [
    { id: "f1", name: "days_since_last_purchase", displayName: "Days Since Last Purchase", type: "numeric", category: "behavioral", importance: 0.92, correlation: 0.78, leakageFlag: false, included: true, description: "Number of days since customer's last transaction" },
    { id: "f2", name: "purchase_frequency_30d", displayName: "Purchase Frequency (30d)", type: "numeric", category: "transactional", importance: 0.87, correlation: 0.72, leakageFlag: false, included: true, description: "Count of purchases in the last 30 days" },
    { id: "f3", name: "avg_order_value", displayName: "Average Order Value", type: "numeric", category: "transactional", importance: 0.76, correlation: 0.65, leakageFlag: false, included: true, description: "Mean transaction amount across all orders" },
    { id: "f4", name: "support_tickets_count", displayName: "Support Tickets Count", type: "numeric", category: "behavioral", importance: 0.68, correlation: 0.54, leakageFlag: false, included: true, description: "Total support tickets opened by customer" },
    { id: "f5", name: "email_open_rate", displayName: "Email Open Rate", type: "numeric", category: "behavioral", importance: 0.61, correlation: 0.48, leakageFlag: false, included: true, description: "Percentage of marketing emails opened" },
    { id: "f6", name: "session_duration_avg", displayName: "Avg Session Duration", type: "numeric", category: "behavioral", importance: 0.54, correlation: 0.42, leakageFlag: false, included: true, description: "Average time spent per session in minutes" },
    { id: "f7", name: "churn_date", displayName: "Churn Date", type: "timestamp", category: "derived", importance: 0.98, correlation: 0.95, leakageFlag: true, included: false, description: "Date when customer churned - LEAKAGE" },
    { id: "f8", name: "is_premium", displayName: "Is Premium", type: "boolean", category: "derived", importance: 0.45, correlation: 0.38, leakageFlag: false, included: true, description: "Whether customer is on premium tier" },
    { id: "f9", name: "ltv_total", displayName: "Lifetime Value", type: "numeric", category: "transactional", importance: 0.72, correlation: 0.61, leakageFlag: false, included: true, description: "Total customer lifetime value in dollars" },
    { id: "f10", name: "seasonality_score", displayName: "Seasonality Score", type: "numeric", category: "time-series", importance: 0.48, correlation: 0.35, leakageFlag: false, included: false, description: "Seasonal purchase pattern indicator" },
];

const categories = [
    { id: "all", label: "All Features", count: features.length },
    { id: "behavioral", label: "Behavioral", count: features.filter((f) => f.category === "behavioral").length },
    { id: "transactional", label: "Transactional", count: features.filter((f) => f.category === "transactional").length },
    { id: "time-series", label: "Time-Series", count: features.filter((f) => f.category === "time-series").length },
    { id: "derived", label: "Derived", count: features.filter((f) => f.category === "derived").length },
];

const featureTemplates = [
    { id: "rolling", name: "Rolling Average", icon: TrendingUp, description: "Calculate moving average over a time window" },
    { id: "rfm", name: "RFM Scores", icon: BarChart3, description: "Recency, Frequency, Monetary analysis" },
    { id: "lag", name: "Lag Features", icon: Clock, description: "Create time-lagged versions of features" },
    { id: "ratio", name: "Ratio Features", icon: Shuffle, description: "Create ratios between numeric features" },
];

export function FeatureStudio() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [featureList, setFeatureList] = useState(features);
    const [selectedFeature, setSelectedFeature] = useState<string | null>("f1");
    const [showBuilder, setShowBuilder] = useState(false);

    const filteredFeatures = featureList.filter((f) => {
        const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
        const matchesSearch = f.displayName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleFeature = (id: string) => {
        setFeatureList((prev) =>
            prev.map((f) => (f.id === id ? { ...f, included: !f.included } : f))
        );
    };

    const activeFeature = featureList.find((f) => f.id === selectedFeature);
    const includedCount = featureList.filter((f) => f.included).length;

    return (
        <div className="h-full flex bg-background animate-fade-in">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-8 py-6 border-b border-border bg-card/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Feature Engineering Studio</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage auto-generated and custom features for your predictive models
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                                <Download className="w-4 h-4" />
                                Export Store
                            </Button>
                            <Button size="sm" className="gap-2 rounded-lg" onClick={() => setShowBuilder(true)}>
                                <Plus className="w-4 h-4" />
                                Create Feature
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Guardrails Banner */}
                <div className="px-8 py-3 border-b border-amber-400/30 bg-amber-400/5 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm text-foreground">
                            <span className="font-bold">Guardrails Active:</span> 1 feature blocked to prevent data leakage.
                            VDS automatically excludes features using information from the future.
                        </p>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="px-8 py-4 border-b border-border flex items-center gap-8 bg-card/10">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">{includedCount}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Included</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">{featureList.length}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-emerald-400">98%</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coverage</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-8 py-4 border-b border-border flex items-center gap-6 bg-card/5">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search features..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all border",
                                    selectedCategory === cat.id
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "text-muted-foreground border-transparent hover:bg-secondary/50"
                                )}
                            >
                                {cat.label}
                                <span className="ml-2 text-[10px] opacity-40">{cat.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature List */}
                <div className="flex-1 overflow-auto scrollbar-thin">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-card z-10">
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground w-12 text-center">
                                    Inc
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Feature
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Type
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Category
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Importance
                                </th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Correlation
                                </th>
                                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredFeatures.map((feature, index) => (
                                <tr
                                    key={feature.id}
                                    className={cn(
                                        "hover:bg-secondary/30 transition-colors cursor-pointer group",
                                        selectedFeature === feature.id && "bg-primary/5",
                                        feature.leakageFlag && "opacity-60"
                                    )}
                                    onClick={() => setSelectedFeature(feature.id)}
                                >
                                    <td className="px-8 py-4 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!feature.leakageFlag) toggleFeature(feature.id);
                                            }}
                                            disabled={feature.leakageFlag}
                                            className={cn(
                                                "w-5 h-5 rounded-lg flex items-center justify-center transition-all border shrink-0 mx-auto",
                                                feature.included && !feature.leakageFlag
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "bg-secondary/50 border-border group-hover:border-primary/50",
                                                feature.leakageFlag && "cursor-not-allowed border-red-400/50"
                                            )}
                                        >
                                            {feature.included && !feature.leakageFlag && (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            )}
                                            {feature.leakageFlag && (
                                                <AlertTriangle className="w-3 h-3 text-red-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <code className="text-sm font-mono font-bold text-primary group-hover:text-primary transition-colors">{feature.name}</code>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{feature.displayName}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-secondary text-foreground">
                                            {feature.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-muted-foreground capitalize">{feature.category}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 bg-secondary h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${feature.importance * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-foreground">
                                                {(feature.importance * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 bg-secondary h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400"
                                                    style={{ width: `${feature.correlation * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                                {feature.correlation.toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        {feature.leakageFlag ? (
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-red-400/10 text-red-400 flex items-center gap-1.5 w-fit">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Leakage
                                            </span>
                                        ) : feature.included ? (
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center gap-1.5 w-fit">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Included
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-secondary text-muted-foreground flex items-center gap-1.5 w-fit">
                                                <EyeOff className="w-3.5 h-3.5" />
                                                Excluded
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Feature Detail / Builder Panel */}
            <div className="w-96 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
                <Tabs defaultValue={showBuilder ? "builder" : "details"} className="flex flex-col h-full">
                    <div className="px-6 py-4 border-b border-border bg-card/50">
                        <TabsList className="w-full bg-secondary/50 rounded-xl p-1">
                            <TabsTrigger value="details" className="flex-1 gap-2 rounded-lg py-2" onClick={() => setShowBuilder(false)}>
                                <Eye className="w-4 h-4" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="builder" className="flex-1 gap-2 rounded-lg py-2" onClick={() => setShowBuilder(true)}>
                                <Zap className="w-4 h-4" />
                                Builder
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="details" className="flex-1 m-0 p-6 space-y-8 overflow-y-auto scrollbar-thin">
                        {activeFeature ? (
                            <>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                                        <code className="text-lg font-mono font-bold text-primary">{activeFeature.name}</code>
                                        <p className="text-sm text-balance text-muted-foreground mt-2 leading-relaxed">{activeFeature.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-card/50 border border-border flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</p>
                                        <p className="text-sm font-bold text-foreground capitalize">{activeFeature.type}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-card/50 border border-border flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</p>
                                        <p className="text-sm font-bold text-foreground capitalize">{activeFeature.category}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-card/50 border border-border flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Importance</p>
                                        <p className="text-sm font-bold text-primary">{(activeFeature.importance * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-card/50 border border-border flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correl</p>
                                        <p className="text-sm font-bold text-emerald-400">{activeFeature.correlation.toFixed(3)}</p>
                                    </div>
                                </div>

                                {activeFeature.leakageFlag && (
                                    <div className="p-5 rounded-2xl bg-red-400/5 border border-red-400/20 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-400/10">
                                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                            </div>
                                            <h4 className="font-bold text-red-400">Leakage Warning</h4>
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                            This feature contains information that would not be available at prediction time.
                                            It has been automatically excluded to prevent overfitting.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distribution Preview</h4>
                                    <div className="h-32 rounded-2xl bg-card/50 border border-border flex items-end justify-center gap-1.5 p-6 shadow-inner">
                                        {[25, 45, 70, 85, 95, 80, 60, 40, 30, 15].map((height, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-gradient-to-t from-primary/80 to-primary/20 rounded-t-lg transition-all group-hover:from-primary"
                                                style={{ height: `${height}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select a feature to view analysis</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="builder" className="flex-1 m-0 p-6 space-y-8 overflow-y-auto scrollbar-thin">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Feature Templates</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {featureTemplates.map((template) => {
                                    const Icon = template.icon;
                                    return (
                                        <button
                                            key={template.id}
                                            className="w-full p-4 rounded-2xl border border-border bg-card/50 hover:border-primary/50 transition-all text-left flex items-start gap-4 group"
                                        >
                                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 pr-4">
                                                <p className="font-bold text-foreground text-sm">{template.name}</p>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{template.description}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-1" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manual Definition</h3>
                            <div className="space-y-4 p-5 rounded-2xl bg-card/50 border border-border">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Feature Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., purchase_velocity_7d"
                                        className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Source Column</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat">
                                        <option>transactions.amount</option>
                                        <option>transactions.created_at</option>
                                        <option>sessions.duration</option>
                                        <option>customers.created_at</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Aggregation</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat">
                                        <option>COUNT</option>
                                        <option>SUM</option>
                                        <option>AVG</option>
                                        <option>MAX</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <div className="p-6 border-t border-border bg-card/60 backdrop-blur-md">
                        <Button size="lg" className="w-full gap-3 rounded-2xl h-12 shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5" />
                            {showBuilder ? "Confirm New Feature" : "Update Feature Set"}
                        </Button>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

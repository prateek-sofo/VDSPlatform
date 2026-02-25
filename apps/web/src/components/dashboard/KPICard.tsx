import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string;
    delta: number;
    deltaLabel: string;
    confidence?: "low" | "medium" | "high" | "critical";
    icon: React.ComponentType<{ className?: string }>;
}

export function KPICard({
    title,
    value,
    delta,
    deltaLabel,
    icon: Icon,
}: KPICardProps) {
    const isPositive = delta > 0;

    return (
        <div className="p-5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{title}</span>
            </div>

            <p className="text-2xl font-semibold text-foreground mb-2">{value}</p>

            <div className="flex items-center gap-2 text-sm">
                <span
                    className={cn(
                        "flex items-center gap-1",
                        isPositive ? "text-emerald-400" : "text-red-400"
                    )}
                >
                    {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {isPositive ? "+" : ""}
                    {delta}%
                </span>
                <span className="text-muted-foreground">{deltaLabel}</span>
            </div>
        </div>
    );
}

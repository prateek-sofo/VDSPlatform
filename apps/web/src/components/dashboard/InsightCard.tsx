import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";

type InsightType = "anomaly" | "driver" | "opportunity";

interface InsightCardProps {
    type: InsightType;
    title: string;
    description: string;
    metric?: string;
    timestamp: string;
    onClick?: () => void;
}

export function InsightCard({
    type,
    title,
    description,
    metric,
    timestamp,
    onClick,
}: InsightCardProps) {
    const icons = {
        anomaly: AlertTriangle,
        driver: TrendingUp,
        opportunity: Lightbulb,
    };

    const colors = {
        anomaly: "text-amber-400",
        driver: "text-emerald-400",
        opportunity: "text-primary",
    };

    const Icon = icons[type];

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-4 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
        >
            <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", colors[type])} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
                        {metric && (
                            <span className={cn("text-sm font-medium shrink-0", colors[type])}>
                                {metric}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {description}
                    </p>
                    <span className="text-xs text-muted-foreground">{timestamp}</span>
                </div>
            </div>
        </button>
    );
}

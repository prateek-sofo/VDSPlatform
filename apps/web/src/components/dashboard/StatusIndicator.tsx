import { cn } from "@/lib/utils";

type Status = "healthy" | "warning" | "error" | "inactive";

interface StatusIndicatorProps {
    status: Status;
    label: string;
    value?: string;
}

export function StatusIndicator({ status, label, value }: StatusIndicatorProps) {
    const colors = {
        healthy: "bg-emerald-400",
        warning: "bg-amber-400",
        error: "bg-red-400",
        inactive: "bg-muted-foreground",
    };

    return (
        <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className={cn("w-2 h-2 rounded-full", colors[status])} />
            <span className="text-sm text-foreground flex-1">{label}</span>
            {value && <span className="text-sm text-muted-foreground">{value}</span>}
        </div>
    );
}

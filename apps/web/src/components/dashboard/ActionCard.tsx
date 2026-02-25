import { cn } from "@/lib/utils";
import { Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionStatus = "pending" | "approved" | "rejected" | "executed";

interface ActionCardProps {
    title: string;
    description: string;
    impact: string;
    dueDate: string;
    status: ActionStatus;
    onApprove?: () => void;
    onReject?: () => void;
}

export function ActionCard({
    title,
    description,
    impact,
    dueDate,
    status,
    onApprove,
    onReject,
}: ActionCardProps) {
    return (
        <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-1 truncate">{title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                </div>
                {status === "approved" && (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                        <span className="text-emerald-400">↑ {impact}</span> expected impact
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {dueDate}
                    </span>
                </div>

                {status === "pending" && (
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={onReject} className="h-7 text-xs">
                            Reject
                        </Button>
                        <Button size="sm" onClick={onApprove} className="h-7 text-xs">
                            Approve
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

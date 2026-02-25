import { useState } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    GitBranch,
    Database,
    Layers,
    Code2,
    Sparkles,
    Brain,
    Rocket,
    Shield,
    Settings,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Zap,
    Cpu,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const expertNavigation: NavGroup[] = [
    {
        label: "Virtual Data Scientist",
        items: [
            { id: "dashboard", title: "Command Centre", icon: LayoutDashboard },
            { id: "insights", title: "Business Insights", icon: TrendingUp },
            { id: "ask-predict", title: "Ask & Predict", icon: MessageSquare },
            { id: "decisions", title: "Decision Hub", icon: Zap },
        ],
    },
    {
        label: "Studio & Engineering",
        items: [
            { id: "features", title: "Feature Studio", icon: Sparkles },
            { id: "notebook", title: "SQL Notebook", icon: Code2 },
            { id: "builder", title: "Agentic Builder", icon: Zap },
            { id: "agents", title: "Agent Workspace", icon: Cpu },
        ],
    },
    {
        label: "Data Science Core",
        items: [
            { id: "connectors", title: "Data Connections", icon: Database },
            { id: "semantic", title: "Semantic Layer", icon: Layers },
            { id: "modeling", title: "Model Training", icon: Brain },
            { id: "deployment", title: "Deployment", icon: Rocket },
        ],
    },
    {
        label: "Platform",
        items: [
            { id: "observability", title: "Operations Hub", icon: Activity },
            { id: "governance", title: "Governance", icon: Shield },
            { id: "settings", title: "Settings", icon: Settings },
        ],
    },
];

const businessNavigation: NavGroup[] = [
    {
        label: "Business Workspace",
        items: [
            { id: "dashboard", title: "Command Centre", icon: LayoutDashboard },
            { id: "insights", title: "Interactive Insights", icon: TrendingUp },
            { id: "saved-views", title: "My Views & Reports", icon: Layers },
        ],
    }
];

interface AppSidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
    appMode?: 'expert' | 'business';
}

export function AppSidebar({ activeView, onViewChange, appMode = 'expert' }: AppSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const navigation = appMode === 'expert' ? expertNavigation : businessNavigation;

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
                collapsed ? "w-14" : "w-56"
            )}
        >
            <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary-foreground" />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-foreground">
                            Sofo<span className="text-primary"> AI</span>
                        </span>
                    )}
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                {navigation.map((group) => (
                    <div key={group.label} className="mb-6">
                        {!collapsed && (
                            <h3 className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {group.label}
                            </h3>
                        )}
                        <ul className="space-y-0.5 px-2">
                            {group.items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => onViewChange(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                                            activeView === item.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4 shrink-0" />
                                        {!collapsed && <span>{item.title}</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="p-2 border-t border-sidebar-border">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}

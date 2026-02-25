import { useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Play, Plus, Search, Layers, RefreshCw, ChevronRight, Zap, Target, Filter, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function AgentNode({ data }: { data: any }) {
    const Icons: any = { trigger: Target, action: Zap, filter: Filter, notify: MessageSquare };
    const Icon = Icons[data.type] || Bot;

    return (
        <div className="bg-card border border-border rounded-xl p-4 min-w-[200px] shadow-2xl animate-in zoom-in-95 duration-200">
            <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
            <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                    "p-2 rounded-lg bg-secondary",
                    data.type === 'trigger' && "bg-purple-500/10 text-purple-400",
                    data.type === 'action' && "bg-emerald-500/10 text-emerald-400",
                    data.type === 'filter' && "bg-blue-500/10 text-blue-400",
                    data.type === 'notify' && "bg-amber-400/10 text-amber-400",
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{data.type}</div>
                    <div className="text-sm font-bold text-foreground">{data.label}</div>
                </div>
            </div>
            <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
                {data.description}
            </div>
            <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
        </div>
    );
}

const nodeTypes = {
    agentStep: AgentNode,
};

export function AgentsTab({ workflows, setWorkflows, domain }: { workflows: any[], setWorkflows: any, domain: string }) {
    const [view, setView] = useState<'inventory' | 'builder'>('inventory');

    const initialNodes = [
        { id: '1', type: 'agentStep', data: { type: 'trigger', label: 'Daily Forecast Shift', description: 'Triggers when sales forecast shifts > 5%' }, position: { x: 50, y: 100 } },
        { id: '2', type: 'agentStep', data: { type: 'filter', label: 'Impact Filter', description: 'Only proceed if impact > $50k' }, position: { x: 320, y: 100 } },
        { id: '3', type: 'agentStep', data: { type: 'notify', label: 'Notify Slack', description: 'Alert #revops-war-room' }, position: { x: 590, y: 100 } },
    ];

    const initialEdges = [
        { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 } },
        { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 } },
    ];

    return (
        <div className="h-full flex flex-col p-8 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                    <button
                        onClick={() => setView('inventory')}
                        className={cn(
                            "px-6 py-2 text-xs font-bold rounded-lg transition-all",
                            view === 'inventory' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >Agent Library</button>
                    <button
                        onClick={() => setView('builder')}
                        className={cn(
                            "px-6 py-2 text-xs font-bold rounded-lg transition-all",
                            view === 'builder' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >Visual Workflow</button>
                </div>
                {view === 'builder' && (
                    <Button className="gap-2 px-6">
                        <Zap className="w-4 h-4 fill-current" />
                        Deploy Agent
                    </Button>
                )}
            </div>

            <div className="flex-1 bg-card/30 border border-border rounded-2xl overflow-hidden relative">
                {view === 'inventory' ? (
                    <div className="p-8 h-full overflow-y-auto scrollbar-thin">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workflows.map(w => (
                                <div key={w.id} className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                            <Bot className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            w.status === 'active' ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                                        )}>
                                            {w.status}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{w.name}</h3>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Daily</span>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Write-back</span>
                                    </div>
                                </div>
                            ))}
                            <button className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-8 hover:bg-secondary/30 hover:border-primary/30 transition-all group">
                                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Create Custom Agent</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <ReactFlow
                            nodes={initialNodes}
                            edges={initialEdges}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background color="hsl(var(--border))" gap={20} />
                            <Controls className="!bg-card !border-border" />
                        </ReactFlow>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Background, Controls, MiniMap, Handle, Position,
    applyNodeChanges, applyEdgeChanges, addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Database, Zap, RefreshCw, Layers, CheckCircle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listEntities, listRelationships, listConnectors, discoverOntology, certifyEntity } from '@/lib/api';

function EntityNode({ data, selected }: { data: any, selected?: boolean }) {
    return (
        <div className={cn(
            "bg-card border-2 rounded-xl p-4 min-w-[180px] shadow-xl transition-all",
            selected ? "border-primary" : "border-border hover:border-border/80"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
            <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Entity</div>
            <div className="text-sm font-bold text-foreground mb-2">{data.label}</div>
            <div className="border-t border-border pt-2 space-y-1">
                {data.fields?.slice(0, 3).map((f: string) => (
                    <div key={f} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        {f}
                    </div>
                ))}
                {data.fields?.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/60 pl-2.5">+{data.fields.length - 3} more</div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
        </div>
    );
}

const nodeTypes = {
    entity: EntityNode,
};

export function SemanticView({ domain }: { domain: string }) {
    const [entities, setEntities] = useState<any[]>([]);
    const [relationships, setRelationships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedElement, setSelectedElement] = useState<any | null>(null);

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [ents, rels] = await Promise.all([listEntities(), listRelationships()]);
            setEntities(ents);
            setRelationships(rels);
        } catch (err) {
            console.error("Failed to fetch ontology", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refreshData(); }, [refreshData]);

    const initialNodes = entities.map((e, i) => ({
        id: e.id,
        type: 'entity',
        data: { label: e.name, fields: Object.keys(e.properties || {}), status: e.status },
        position: { x: 100 + (i % 3) * 280, y: 100 + Math.floor(i / 3) * 220 }
    }));

    const initialEdges = relationships.map(r => ({
        id: r.id,
        source: r.from_entity_id,
        target: r.to_entity_id,
        label: r.name,
        animated: r.status === 'proposed',
        style: { stroke: r.status === 'certified' ? 'hsl(var(--emerald-400))' : 'hsl(var(--amber-400))', strokeWidth: 2 }
    }));

    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [entities, relationships]);

    const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds) as any), []);

    const handleRunDiscovery = async () => {
        const connectors = await listConnectors();
        if (connectors.length > 0) {
            await discoverOntology(connectors[0].id, domain);
            console.log("AI Discovery started");
            setTimeout(refreshData, 5000);
        }
    };

    const handleCertify = async () => {
        if (selectedElement?.type === 'entity') {
            await certifyEntity(selectedElement.id);
            refreshData();
            setSelectedElement(null);
        }
    };

    return (
        <div className="flex h-full animate-fade-in overflow-hidden">
            <div className="flex-1 flex flex-col p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1">Semantic Layer</h1>
                        <p className="text-muted-foreground text-sm">Visualize and manage your business ontology and data relationships</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2" onClick={refreshData}>
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Sync Graph
                        </Button>
                        <Button className="gap-2" onClick={handleRunDiscovery}>
                            <Zap className="w-4 h-4" />
                            Run AI Discovery
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-card/30 border border-border rounded-2xl overflow-hidden relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={(_, node) => setSelectedElement({ type: 'entity', ...node })}
                        onEdgeClick={(_, edge) => setSelectedElement({ type: 'relationship', ...edge })}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="hsl(var(--border))" gap={20} />
                        <Controls className="!bg-card !border-border" />
                        <MiniMap className="!bg-card !border-border" maskColor="rgba(0,0,0,0.5)" nodeColor="hsl(var(--primary))" />
                    </ReactFlow>
                </div>
            </div>

            {selectedElement && (
                <div className="w-[380px] border-l border-border bg-card/50 backdrop-blur-md p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-foreground">Entity Metadata</h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedElement(null)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Name</label>
                            <input
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                defaultValue={selectedElement.data?.label || selectedElement.label}
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
                            <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                                (selectedElement.data?.status === 'certified' || selectedElement.status === 'certified')
                                    ? "bg-emerald-400/10 text-emerald-400"
                                    : "bg-amber-400/10 text-amber-400"
                            )}>
                                {(selectedElement.data?.status || selectedElement.status || 'PROPOSED')}
                            </div>
                        </div>

                        {selectedElement.type === 'entity' && selectedElement.data.status !== 'certified' && (
                            <Button className="w-full gap-2" onClick={handleCertify}>
                                <CheckCircle className="w-4 h-4" />
                                Certify Entity
                            </Button>
                        )}

                        <div className="pt-8 border-t border-border">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Properties</label>
                            <div className="space-y-2">
                                {selectedElement.data?.fields?.map((f: string) => (
                                    <div key={f} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-all">
                                        <span className="text-sm text-foreground font-medium">{f}</span>
                                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">String</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

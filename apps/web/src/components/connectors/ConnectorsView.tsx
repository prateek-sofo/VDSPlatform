import { useState, useRef, useEffect } from 'react';
import { Database, Upload, Plus, Search, RefreshCw, X, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadCSV, listConnectors, getConnectorSample } from '@/lib/api';

interface Connector {
    id: string;
    name: string;
    connector_type: string;
    status: 'connected' | 'error' | 'syncing';
    last_sync_at?: string;
}

export function ConnectorsView({ connectors, setConnectors }: { connectors: Connector[], setConnectors: (c: Connector[]) => void }) {
    const [uploading, setUploading] = useState(false);
    const [explorerConnector, setExplorerConnector] = useState<Connector | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadCSV(file);
            const updated = await listConnectors();
            setConnectors(updated);
            // In a real app we'd use a toast component
            console.log(`Successfully ingested ${res.table_name}`);
        } catch (err: any) {
            console.error(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Data Connectors</h1>
                    <p className="text-muted-foreground text-sm">Manage your data sources and ingestion pipelines</p>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept=".csv" />
                    <Button variant="outline" className="gap-2" onClick={() => { }}>
                        <Plus className="w-4 h-4" />
                        Add SQL Source
                    </Button>
                    <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Ingesting...' : 'Upload CSV'}
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Sync</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {connectors.map((c) => (
                            <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-secondary">
                                            <Database className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium text-foreground">{c.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                                        {c.connector_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            c.status === 'connected' ? "bg-emerald-400" : "bg-amber-400"
                                        )} />
                                        <span className="text-sm text-foreground capitalize">{c.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : 'Never'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => setExplorerConnector(c)}>
                                            Explore
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {connectors.length === 0 && (
                    <div className="py-20 text-center">
                        <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No connectors found</h3>
                        <p className="text-muted-foreground text-sm">Connect a data source to begin your analysis</p>
                    </div>
                )}
            </div>

            {explorerConnector && (
                <DataExplorerModal connector={explorerConnector} onClose={() => setExplorerConnector(null)} />
            )}
        </div>
    );
}

function DataExplorerModal({ connector, onClose }: { connector: Connector, onClose: () => void }) {
    const [sample, setSample] = useState<{ data: any[], columns: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getConnectorSample(connector.id)
            .then(setSample)
            .finally(() => setLoading(false));
    }, [connector.id]);

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Data Explorer: {connector.name}</h3>
                        <p className="text-xs text-muted-foreground">Previewing sample rows from the dataset</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto bg-muted/20">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : sample?.data?.length ? (
                        <div className="min-w-full inline-block align-middle">
                            <table className="min-w-full border-collapse">
                                <thead className="sticky top-0 bg-card z-10 border-b border-border">
                                    <tr>
                                        {sample.columns.map(col => (
                                            <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sample.data.map((row, i) => (
                                        <tr key={i} className="hover:bg-secondary/50">
                                            {sample.columns.map(col => (
                                                <td key={col} className="px-4 py-3 text-[12px] text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                    {String(row[col])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">No data available for preview</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-card">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button>Run Auto-Profile</Button>
                </div>
            </div>
        </div>
    );
}

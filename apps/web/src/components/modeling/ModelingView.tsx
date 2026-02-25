import { useState, useEffect } from 'react';
import { Brain, Search, Plus, Filter, RefreshCw, ChevronRight, CheckCircle, AlertTriangle, Info, Play, BarChart3, Code, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listModels } from '@/lib/api';

interface Model {
    id: string;
    name: string;
    task_type: string;
    algorithm: string;
    metrics: { accuracy?: number; f1?: number; precision?: number; recall?: number };
    deployment_status: 'champion' | 'challenger' | 'training' | 'failed';
    created_at: string;
}

export function ModelingView() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [trainingModal, setTrainingModal] = useState(false);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    const refreshModels = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listModels();
            setModels(data);
        } catch (err) {
            console.error("Failed to list models", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshModels();
    }, [refreshModels]);

    if (selectedModel) {
        return <ModelInspector model={selectedModel} onBack={() => setSelectedModel(null)} />;
    }

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Model Registry</h1>
                    <p className="text-muted-foreground text-sm">Monitor performance, explainability, and deployment status of your ML models</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2" onClick={refreshModels}>
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button size="sm" className="gap-2" onClick={() => setTrainingModal(true)}>
                        <Plus className="w-4 h-4" />
                        Train New Model
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : models.length > 0 ? (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Algorithm</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accuracy</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {models.map((m) => (
                                <tr key={m.id} className="hover:bg-secondary/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Brain className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground">{m.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-secondary text-muted-foreground">
                                            {m.task_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                        {m.algorithm}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 bg-secondary h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-primary h-full transition-all"
                                                    style={{ width: `${(m.metrics?.accuracy || 0) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-foreground">
                                                {((m.metrics?.accuracy || 0) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                            m.deployment_status === 'champion' ? "bg-emerald-400/10 text-emerald-400" : "bg-primary/10 text-primary"
                                        )}>
                                            {m.deployment_status === 'champion' && <CheckCircle className="w-3 h-3" />}
                                            {m.deployment_status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 px-3 text-xs"
                                            onClick={() => setSelectedModel(m)}
                                        >
                                            Inspect
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-card/30 border border-dashed border-border rounded-2xl">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
                        <Brain className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">No models found</h2>
                    <p className="text-muted-foreground text-sm max-w-sm mb-8">
                        Ready to extract insights from your data? Start an AutoML pipeline to train your first model.
                    </p>
                    <Button onClick={() => setTrainingModal(true)} size="lg" className="rounded-xl px-8">
                        Train Your First Model
                    </Button>
                </div>
            )}

            {trainingModal && (
                <TrainingModal
                    onClose={() => setTrainingModal(false)}
                    onStarted={() => {
                        refreshModels();
                        setTrainingModal(false);
                    }}
                />
            )}
        </div>
    );
}

function ModelInspector({ model, onBack }: { model: Model, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'metrics' | 'code' | 'explain'>('metrics');

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b border-border bg-card/30">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 h-8">
                        <X className="w-4 h-4" />
                        Close Inspector
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{model.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground font-mono">{model.algorithm}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-[10px] font-bold uppercase text-primary">{model.deployment_status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">Deploy Challenger</Button>
                        <Button size="sm">Promote to Champion</Button>
                    </div>
                </div>

                <div className="flex gap-1 mt-8 bg-secondary/50 p-1 rounded-lg w-fit border border-border">
                    {[
                        { id: 'metrics', label: 'Performance', icon: BarChart3 },
                        { id: 'code', label: 'Expert Code', icon: Code },
                        { id: 'explain', label: 'Explainability', icon: Shield },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                                activeTab === tab.id
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 scrollbar-thin">
                {activeTab === 'metrics' && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h4 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Confusion Matrix
                            </h4>
                            <div className="grid grid-cols-2 gap-1 bg-border/50 border border-border p-1 rounded-xl">
                                {[
                                    { val: 92, label: 'True Positive', bg: 'bg-emerald-400/5' },
                                    { val: 8, label: 'False Negative', bg: 'bg-red-400/5' },
                                    { val: 4, label: 'False Positive', bg: 'bg-red-400/5' },
                                    { val: 124, label: 'True Negative', bg: 'bg-emerald-400/5' }
                                ].map((cell, i) => (
                                    <div key={i} className={cn("p-10 text-center rounded-lg bg-card/50", cell.bg)}>
                                        <div className="text-3xl font-bold text-foreground mb-1">{cell.val}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cell.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-foreground mb-6">Aggregate Metrics</h4>
                                <div className="space-y-4">
                                    {Object.entries(model.metrics || {}).map(([k, v]: [string, any]) => (
                                        <div key={k} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                    {k.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-foreground capitalize">{k}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 bg-secondary h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full" style={{ width: `${v * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-mono font-bold text-foreground">{(v * 100).toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">preprocessing_pipeline.py</span>
                                </div>
                                <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider">Copy Snippet</Button>
                            </div>
                            <pre className="p-8 text-[13px] font-mono leading-relaxed overflow-auto bg-[#09090b] text-[#a1a1aa] fill-available">
                                {`import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def preprocess_data(df, target_col):
    # Handling missing values
    df = df.fillna(df.mean())
    
    # Encoding categorical variables
    cat_cols = df.select_dtypes(include=['object']).columns
    df = pd.get_dummies(df, columns=cat_cols)
    
    # Scaling numeric features
    scaler = StandardScaler()
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
    
    return df`}
                            </pre>
                        </div>
                    </div>
                )}

                {activeTab === 'explain' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border border-border rounded-2xl p-10 text-center border-dashed">
                            <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">SHAP Summary Plot</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-10">
                                This model used 42 core features from the semantic layer. Top drivers identified: Customer tenure, Average order value, and Support ticket volume.
                            </p>
                            <div className="h-64 bg-secondary/30 rounded-2xl flex items-center justify-center border border-border">
                                <p className="text-xs font-mono text-muted-foreground">SHAP VISUALIZATION ENGINE LOADING...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TrainingModal({ onClose, onStarted }: { onClose: () => void, onStarted: () => void }) {
    const [mode, setMode] = useState<'automl' | 'autocode' | 'byom'>('automl');
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [type, setType] = useState('classification');
    const [byomUrl, setByomUrl] = useState('');

    const handleTrain = async () => {
        if (!name) return;
        try {
            await fetch('/api/v1/modeling/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, task_type: type, target_column: target || 'churn', domain: 'generic', mode })
            });
            onStarted();
        } catch (err) {
            console.error("Training trigger failed", err);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Add New Model</h3>
                            <p className="text-xs text-muted-foreground">Select how you want to deploy a model</p>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-border bg-card/50 px-8 pt-4 gap-6">
                    <button
                        onClick={() => setMode('automl')}
                        className={cn("pb-3 text-sm font-bold border-b-2 transition-all", mode === 'automl' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >AutoML Pipeline</button>
                    <button
                        onClick={() => setMode('autocode')}
                        className={cn("pb-3 text-sm font-bold border-b-2 transition-all", mode === 'autocode' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >Auto-Generate Code</button>
                    <button
                        onClick={() => setMode('byom')}
                        className={cn("pb-3 text-sm font-bold border-b-2 transition-all", mode === 'byom' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >Bring Your Own Model</button>
                </div>

                <div className="p-8 pb-4 space-y-6">
                    <div>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Model Registry Name</label>
                        <input
                            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground/60"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Risk Scoring Ensemble"
                        />
                    </div>

                    {mode === 'automl' && (
                        <>
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Target Field</label>
                                <input
                                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground/60"
                                    value={target}
                                    onChange={e => setTarget(e.target.value)}
                                    placeholder="e.g. is_churned"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Algorithm Strategy</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="classification">XGBoost Classifier</option>
                                    <option value="lightgbm">LightGBM (High Speed)</option>
                                    <option value="rf">Random Forest (Explainable)</option>
                                    <option value="regression">Deep Neural Network (Regression)</option>
                                    <option value="forecasting">Prophet Time Series</option>
                                </select>
                            </div>
                        </>
                    )}

                    {mode === 'autocode' && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl">
                            <p className="text-xs text-muted-foreground mb-4">
                                Our AI will scaffold a complete Python Jupyter Notebook tailored to your semantic ontology. You can run this locally and push the resulting weights back to VDS.
                            </p>
                            <pre className="text-[10px] p-3 bg-[#09090b] text-[#a1a1aa] rounded-lg overflow-x-auto border border-border font-mono border-l-2 border-l-primary">
                                {`from vds_sdk import VDSClient
client = VDSClient(api_key="your_key")

# Pull semantic features
df = client.get_dataset("${target || 'dataset_name'}")

# ... (Auto-generated training script will appear here) ...

# Register model back to platform
client.register_model(model, name="${name || 'my_model'}")`}
                            </pre>
                        </div>
                    )}

                    {mode === 'byom' && (
                        <>
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Inference API Endpoint (REST)</label>
                                <input
                                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground/60 text-mono"
                                    value={byomUrl}
                                    onChange={e => setByomUrl(e.target.value)}
                                    placeholder="https://your-sagemaker-endpoint.amazonaws.com/invocations"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    VDS will construct a unified payload and proxy inference requests to your proprietary endpoint.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs">
                                <Shield className="w-4 h-4" />
                                Support for managed SageMaker, Vertex AI, and Hugging Face inference endpoints included.
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-secondary/30 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1 rounded-xl font-bold" onClick={handleTrain} disabled={!name}>
                        {mode === 'automl' ? 'Start Pipeline' : mode === 'autocode' ? 'Generate Jupyter Notebook' : 'Register External Model'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { useCallback } from 'react';

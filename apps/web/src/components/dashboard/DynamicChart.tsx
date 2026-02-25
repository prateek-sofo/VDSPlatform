import { useState } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicChartProps {
    spec: any;
    hideHeader?: boolean;
    onSave?: () => void;
}

export function DynamicChart({ spec, hideHeader, onSave }: DynamicChartProps) {
    const [mode, setMode] = useState<'preview' | 'code'>('preview');

    if (!spec || !spec.data) return null;

    const renderChart = () => {
        if (mode === 'code') {
            return (
                <div className="h-full overflow-auto bg-[#0D0D0D] p-4 rounded-lg font-mono text-[11px] text-[#888]">
                    <pre className="m-0">{JSON.stringify(spec, null, 2)}</pre>
                </div>
            );
        }

        switch (spec.type) {
            case 'bar':
                return (
                    <BarChart data={spec.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                        <XAxis dataKey={spec.xAxis} stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                            itemStyle={{ color: '#E0E0E0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                        <Bar dataKey={spec.yAxis} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={spec.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                        <XAxis dataKey={spec.xAxis} stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                        <Line type="monotone" dataKey={spec.yAxis} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                );
            case 'pie':
                const COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A'];
                return (
                    <PieChart>
                        <Pie
                            data={spec.data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={spec.yAxis}
                            nameKey={spec.xAxis}
                        >
                            {spec.data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                );
            default:
                return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported chart type: {spec.type}</div>;
        }
    };

    return (
        <div className={cn("bg-card border border-border rounded-xl shadow-sm flex flex-col h-full", !hideHeader ? "p-4" : "p-0 border-none")}>
            {!hideHeader && (
                <div className="flex justify-between items-center mb-5">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <BarChart2 size={16} className="text-primary" />
                        {spec.title || 'Analysis'}
                    </h4>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-secondary/50 rounded-lg p-0.5 border border-border">
                            <button
                                onClick={() => setMode('preview')}
                                className={cn("px-3 py-1 text-[10px] font-medium rounded-md transition-all", mode === 'preview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >Preview</button>
                            <button
                                onClick={() => setMode('code')}
                                className={cn("px-3 py-1 text-[10px] font-medium rounded-md transition-all", mode === 'code' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >Code</button>
                        </div>
                        {onSave && (
                            <button
                                onClick={onSave}
                                className="px-3 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded-md border border-primary/20 hover:bg-primary/20 transition-all font-bold uppercase tracking-wider"
                            >
                                Save View
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() as any}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

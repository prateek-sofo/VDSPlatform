import { useState } from 'react';
import { Layers, Plus, Calendar, MoreVertical, Share2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicChart } from './DynamicChart';

// Mock saved views for demonstration
const initialSavedViews = [
    {
        id: 'v1',
        title: 'Q3 Revenue Drivers',
        frequency: 'Weekly on Monday',
        lastRefreshed: '2 hours ago',
        chart: {
            type: 'bar',
            title: 'Revenue Impact by Feature',
            xAxis: 'feature',
            yAxis: 'impact',
            data: [
                { feature: 'New Onboarding', impact: 45000 },
                { feature: 'Pricing Page Update', impact: 28000 },
                { feature: 'Premium Upsell', impact: 82000 },
                { feature: 'Referral Program', impact: -12000 }
            ]
        }
    },
    {
        id: 'v2',
        title: 'Churn Risk by Segment',
        frequency: 'Daily at 9:00 AM',
        lastRefreshed: '10 mins ago',
        chart: {
            type: 'pie',
            title: 'High Risk Customers',
            xAxis: 'segment',
            yAxis: 'value',
            data: [
                { segment: 'Enterprise', value: 12 },
                { segment: 'Mid-Market', value: 34 },
                { segment: 'SMB', value: 54 }
            ]
        }
    }
];

export function SavedViews() {
    const [views, setViews] = useState(initialSavedViews);
    const [selectedView, setSelectedView] = useState<any>(null);

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in scrollbar-thin overflow-auto p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">My Views & Reports</h1>
                    <p className="text-muted-foreground text-sm">Your scheduled dynamic charts and collaborative reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Custom View
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {views.map((view) => (
                    <div key={view.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col group transition-all hover:border-primary/30">
                        <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Layers className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">{view.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{view.frequency}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Play className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setSelectedView(view)}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 flex-1">
                            <DynamicChart spec={view.chart} hideHeader={true} />
                        </div>
                        <div className="px-4 py-3 bg-secondary/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                            <span>Last refreshed {view.lastRefreshed}</span>
                            <span className="text-primary hover:underline cursor-pointer font-medium" onClick={() => setSelectedView(view)}>View Full Report &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedView && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selectedView.title}</h2>
                                <p className="text-sm text-muted-foreground mt-1">Collaborate and share insights</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedView(null)}>
                                <span className="sr-only">Close</span>
                                <MoreVertical className="w-5 h-5 rotate-90" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-4">Chart Preview</h3>
                                <div className="border border-border rounded-xl p-4 bg-background">
                                    <DynamicChart spec={selectedView.chart} hideHeader={true} />
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>Schedule: {selectedView.frequency}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Executive Narrative</label>
                                    <textarea
                                        className="w-full h-24 p-3 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder-muted-foreground"
                                        placeholder="Add context or summarize the findings for the team..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tag Team Members</label>
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50 border border-border focus-within:ring-1 focus-within:ring-primary">
                                        <span className="text-primary font-medium pl-2">@</span>
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent border-none text-sm focus:outline-none"
                                            placeholder="Type name (e.g. Sales Team)"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold">@Sarah (VP Sales)</span>
                                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold">@Marketing</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-between">
                            <Button variant="outline" className="gap-2">
                                <Share2 className="w-4 h-4" />
                                Generate Shareable Link
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setSelectedView(null)}>Cancel</Button>
                                <Button onClick={() => {
                                    alert('Collaboration updates saved and notifications sent!');
                                    setSelectedView(null);
                                }}>Save & Notify</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

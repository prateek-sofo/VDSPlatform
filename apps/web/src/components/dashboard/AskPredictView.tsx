import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, AlertTriangle, ArrowRight, Activity, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicChart } from "./DynamicChart";

interface AskPredictViewProps {
    messages: any[];
    onSendMessage: (msg: string) => void;
}

const scenarioTemplates = [
    { title: "Churn Prediction", prompt: "Identify customers at >70% risk of churning in the next 30 days and analyze top contributing factors." },
    { title: "Price Optimization", prompt: "Simulate a 5% price increase on the 'Pro' tier and forecast impact to MRR and conversion rate based on historical price elasticity." },
    { title: "Anomaly Detection", prompt: "Scan the last 6 months of transaction data for anomalous patterns in refund rates across all regions." }
];

export function AskPredictView({ messages, onSendMessage }: AskPredictViewProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in relative z-0">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-card/30 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Ask & Predict</h1>
                        <p className="text-sm text-muted-foreground">Run predictive simulations, scenario analyses, and deep data investigations.</p>
                    </div>
                </div>
            </div>

            {/* Chat/Output Area */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="max-w-4xl mx-auto space-y-12 py-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-foreground">Predictive Analytics Hub</h2>
                            <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed">
                                Enter a scenario or hypothesis. The system will frame the problem, query the semantic layer, execute ML models if necessary, and return a comprehensive analysis.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {scenarioTemplates.map((template, i) => (
                                <div
                                    key={i}
                                    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col"
                                    onClick={() => onSendMessage(template.prompt)}
                                >
                                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center justify-between">
                                        {template.title}
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                                        "{template.prompt}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.map((message, idx) => (
                            <div key={idx} className="space-y-6 animate-fade-in">
                                {message.role === "user" ? (
                                    <div className="flex gap-4 justify-end">
                                        <div className="max-w-[80%] p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 text-[15px] leading-relaxed font-medium">
                                            {message.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border shadow-sm">
                                            <Bot className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
                                            <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                                                {message.content}
                                            </div>

                                            {/* Mocking rich predictive output for demo realism */}
                                            {message.content.toLowerCase().includes('simulate') && (
                                                <div className="mt-6 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-4 rounded-xl bg-background border border-border">
                                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">MRR Impact</div>
                                                            <div className="text-2xl font-bold text-green-500">+$12,450</div>
                                                            <div className="text-xs text-muted-foreground mt-1">Monthly recurring</div>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-background border border-border">
                                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Conv. Rate Drop</div>
                                                            <div className="text-2xl font-bold text-red-400">-1.2%</div>
                                                            <div className="text-xs text-muted-foreground mt-1">Estimated elasticity</div>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-background border border-border">
                                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Confidence</div>
                                                            <div className="text-2xl font-bold text-primary">89%</div>
                                                            <div className="text-xs text-muted-foreground mt-1">Based on 12mo history</div>
                                                        </div>
                                                    </div>
                                                    <div className="border border-border/50 rounded-xl overflow-hidden h-64 bg-background">
                                                        <DynamicChart
                                                            spec={{
                                                                type: 'line',
                                                                title: 'Revenue Forecast (Base vs. Simulated)',
                                                                xAxis: 'month',
                                                                yAxis: 'revenue',
                                                                data: [
                                                                    { month: 'Jan', revenue: 100 },
                                                                    { month: 'Feb', revenue: 110 },
                                                                    { month: 'Mar', revenue: 105 },
                                                                    { month: 'Apr', revenue: 125 },
                                                                    { month: 'May (Sim)', revenue: 140 }
                                                                ]
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border bg-card/30 shrink-0">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="relative flex items-center">
                        <div className="absolute left-4 p-1.5 bg-primary/10 rounded-md">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe a scenario, prediction, or hypothesis..."
                            className="w-full h-14 pl-14 pr-16 rounded-2xl bg-background border-2 border-border text-[15px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform active:scale-95"
                            disabled={!input.trim()}
                        >
                            <Send className="w-4 h-4 translate-x-0.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from "react";
import {
    Send,
    Sparkles,
    Bot,
    User,
    Loader2,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Lightbulb,
    Download,
    Share2,
    Bookmark,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DynamicChart } from "./DynamicChart";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    insights?: any[];
    chart?: any;
    recommendations?: any[];
    kpis?: any[];
}

const suggestedQuestions = [
    "What are my top performing products this month?",
    "Why did revenue drop last week?",
    "Which customers are at risk of churning?",
    "What should I focus on to increase sales?",
];

const quickFilters = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "This quarter", value: "quarter" },
    { label: "Year to date", value: "ytd" },
];

export function BusinessInsights({ messages: externalMessages, onSendMessage }: { messages: any[], onSendMessage: (msg: string) => void }) {
    const [input, setInput] = useState("");
    const [activeFilter, setActiveFilter] = useState("30d");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [externalMessages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="h-full flex flex-col bg-background animate-fade-in">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-card/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Business Insights</h1>
                            <p className="text-sm text-muted-foreground">Ask questions in plain English to uncover deep patterns</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                        {quickFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    activeFilter === filter.value
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                {externalMessages.length === 0 ? (
                    <div className="max-w-3xl mx-auto space-y-12 py-12">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">What can I find for you today?</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                I have access to your full revenue, customer, and marketing stacks. Ask me anything.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {suggestedQuestions.map((question, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSendMessage(question)}
                                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left group"
                                >
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        {question}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {externalMessages.map((message, idx) => (
                            <div key={idx} className="space-y-6 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                {message.role === "user" ? (
                                    <div className="flex gap-4 justify-end">
                                        <div className="max-w-[80%] p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10 text-sm leading-relaxed">
                                            {message.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/5">
                                            <Bot className="w-5 h-5 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                                                {/* Strip JSON blocks from the visible text if we can parse them as charts */}
                                                {message.content.replace(/```json\n([\s\S]*?)\n```/g, '')}
                                            </div>

                                            {/* Extract and render JSON chart specs */}
                                            {(() => {
                                                if (message.role !== "assistant") return null;
                                                const match = message.content.match(/```json\n([\s\S]*?)\n```/);
                                                if (match) {
                                                    try {
                                                        const spec = JSON.parse(match[1]);
                                                        if (spec.type && spec.data) {
                                                            return (
                                                                <div className="mt-4 border border-primary/20 rounded-xl overflow-hidden shadow-lg shadow-primary/5">
                                                                    <DynamicChart
                                                                        spec={spec}
                                                                        onSave={() => alert("Chart saved to your 'My Views' dashboard!")}
                                                                    />
                                                                </div>
                                                            );
                                                        }
                                                    } catch (e) {
                                                        console.error("Failed to parse chart spec:", e);
                                                    }
                                                }
                                                return null;
                                            })()}
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
            <div className="p-6 border-t border-border bg-card/30">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
                    <div className="relative flex-1">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your business..."
                            className="w-full h-12 px-5 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <Button type="submit" className="h-12 w-12 rounded-xl" disabled={!input.trim()}>
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

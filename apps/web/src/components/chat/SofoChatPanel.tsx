import { useState, useRef, useEffect, useMemo } from "react";
import {
    Send,
    Sparkles,
    Bot,
    User,
    Loader2,
    Database,
    Brain,
    Zap,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    ArrowRight,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
    activities?: Activity[];
}

interface Activity {
    id: string;
    type: "data" | "model" | "action" | "insight" | "frame" | "quality" | "eda" | "narrate" | "govern";
    title: string;
    status: "pending" | "running" | "complete" | "error";
    detail?: string;
    view?: string;
}

interface SofoChatPanelProps {
    onClose?: () => void;
    onNavigate?: (view: string) => void;
    messages: any[];
    onSendMessage: (msg: string) => void;
    session: any;
    isTyping: boolean;
}

const AGENT_STEPS = [
    { key: 'frame', label: 'Problem Framing', icon: '🎯', type: 'frame' },
    { key: 'connect', label: 'Data Connector', icon: '🔌', type: 'data' },
    { key: 'map', label: 'Semantic Mapping', icon: '🗺️', type: 'data' },
    { key: 'quality', label: 'Data Quality', icon: '✅', type: 'quality' },
    { key: 'eda', label: 'EDA & Hypotheses', icon: '🔬', type: 'eda' },
    { key: 'model', label: 'Modeling & ML', icon: '🤖', type: 'model' },
    { key: 'narrate', label: 'Insight Narrative', icon: '📝', type: 'narrate' },
    { key: 'act', label: 'Action Plan', icon: '⚡', type: 'action' },
    { key: 'govern', label: 'Governance Check', icon: '🛡️', type: 'govern' },
];

export function SofoChatPanel({ onClose, onNavigate, messages, onSendMessage, session, isTyping }: SofoChatPanelProps) {
    const [input, setInput] = useState("");
    const [expandedActivities, setExpandedActivities] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const toggleActivityExpand = (messageId: string) => {
        setExpandedActivities((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        onSendMessage(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "data": return Database;
            case "model": return Brain;
            case "action": return Zap;
            case "insight": return TrendingUp;
            default: return Bot;
        }
    };

    const getStatusIcon = (status: Activity["status"]) => {
        switch (status) {
            case "complete": return CheckCircle;
            case "running": return Loader2;
            case "pending": return Clock;
            case "error": return AlertCircle;
        }
    };

    // Map session steps to activities for the last assistant message
    const currentActivities = useMemo(() => {
        if (!session) return [];
        return AGENT_STEPS.map((step, i) => {
            let status: Activity["status"] = "pending";
            if (i < session.current_step_index) status = "complete";
            else if (i === session.current_step_index) {
                status = session.status === 'failed' ? 'error' : 'running';
            }
            return {
                id: step.key,
                type: step.type as any,
                title: step.label,
                status: status
            };
        });
    }, [session]);

    return (
        <div className="flex flex-col h-full bg-background border-l border-border animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/10 backdrop-blur-md cursor-pointer group" onClick={onClose}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                        <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Sofo AI</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Predictive Agent</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mr-2">Click to Collapse</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-foreground" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                {messages.length === 0 && (
                    <div className="pt-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">How can I help you today?</h3>
                        <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                            Ask me to analyze your revenue, predict churn, or build a new agentic workflow.
                        </p>
                    </div>
                )}

                {messages.map((message, i) => (
                    <div key={message.id || i} className="space-y-3">
                        <div className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}>
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                                message.role === "user" ? "bg-secondary border-border" : "bg-primary border-primary/20"
                            )}>
                                {message.role === "user" ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-primary-foreground" />}
                            </div>
                            <div className={cn(
                                "flex-1 p-4 rounded-2xl text-sm leading-relaxed",
                                message.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-card border border-border mr-8"
                            )}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Show activities for the last assistant message if session is active */}
                        {message.role === 'assistant' && i === messages.length - 1 && session && (
                            <div className="ml-11 mt-2">
                                <button
                                    onClick={() => toggleActivityExpand('current')}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
                                >
                                    {expandedActivities.includes('current') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    <span>Analysis Pipeline: {session.status}</span>
                                </button>
                                {expandedActivities.includes('current') && (
                                    <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-primary/20">
                                        {currentActivities.map((activity) => {
                                            const ActivityIcon = getActivityIcon(activity.type);
                                            const StatusIcon = getStatusIcon(activity.status);
                                            return (
                                                <div key={activity.id} className="flex items-center gap-3 py-1 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                                                    <ActivityIcon className={cn(
                                                        "w-3.5 h-3.5",
                                                        activity.status === 'complete' ? "text-primary" : "text-muted-foreground"
                                                    )} />
                                                    <span className={cn(
                                                        "flex-1 text-[11px] font-medium transition-colors",
                                                        activity.status === 'complete' ? "text-foreground" : "text-muted-foreground"
                                                    )}>{activity.title}</span>
                                                    <StatusIcon className={cn(
                                                        "w-3.5 h-3.5",
                                                        activity.status === "complete" ? "text-emerald-400" :
                                                            activity.status === "running" ? "text-primary animate-spin" :
                                                                activity.status === "error" ? "text-red-400" : "text-muted-foreground/30"
                                                    )} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && !session && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary border border-primary/20 shadow-lg shadow-primary/10">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="relative group">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="w-full min-h-[44px] max-h-[160px] p-3 pr-12 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all scrollbar-thin shadow-inner"
                        rows={1}
                        disabled={isTyping}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shadow-lg shadow-primary/20"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Analysis Active</span>
                    <span>Press Enter to send</span>
                </div>
            </div>
        </div>
    );
}

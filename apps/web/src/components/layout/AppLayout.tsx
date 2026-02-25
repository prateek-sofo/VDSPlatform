import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { SofoChatPanel } from "@/components/chat/SofoChatPanel";
import { MessageSquare, Bell, Search, User, TrendingUp, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
    children: ReactNode;
    activeView: string;
    onViewChange: (view: string) => void;
    onSendMessage: (content: string) => void;
    messages: any[];
    session: any;
    isTyping: boolean;
    appMode: 'expert' | 'business';
    onAppModeChange: (mode: 'expert' | 'business') => void;
}

export function AppLayout({
    children,
    activeView,
    onViewChange,
    onSendMessage,
    messages,
    session,
    isTyping,
    appMode,
    onAppModeChange
}: AppLayoutProps) {
    const [isChatOpen, setIsChatOpen] = useState(true);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AppSidebar activeView={activeView} onViewChange={onViewChange} appMode={appMode} />

            {/* Persistent Chat Panel (Next to Sidebar) */}
            <div className={cn(
                "transition-all duration-300 ease-in-out border-r border-border shrink-0 bg-card/10 z-30",
                isChatOpen ? "w-[380px]" : "w-0 overflow-hidden"
            )}>
                <SofoChatPanel
                    onClose={() => setIsChatOpen(false)}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    session={session}
                    isTyping={isTyping}
                    onNavigate={onViewChange}
                />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                {/* Top Bar */}
                <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search insights, agents, or datasets..."
                                className="w-full h-9 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* App Mode Toggle */}
                        <div className="flex items-center bg-secondary/80 rounded-xl p-1 border border-border/50">
                            <Button
                                size="sm"
                                variant={appMode === 'business' ? "default" : "ghost"}
                                className={cn(
                                    "h-8 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest transition-all",
                                    appMode === 'business' ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => onAppModeChange('business')}
                            >
                                <TrendingUp className="w-3.5 h-3.5 mr-2" />
                                Business
                            </Button>
                            <Button
                                size="sm"
                                variant={appMode === 'expert' ? "default" : "ghost"}
                                className={cn(
                                    "h-8 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest transition-all",
                                    appMode === 'expert' ? "bg-background text-foreground shadow-sm hover:bg-background" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => onAppModeChange('expert')}
                            >
                                <Code2 className="w-3.5 h-3.5 mr-2" />
                                Expert
                            </Button>
                        </div>

                        <div className="w-px h-6 bg-border mx-2" />

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-secondary">
                                <Bell className="w-4 h-4" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 hidden md:flex"
                                onClick={() => setIsChatOpen(true)}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Consult Sofo AI
                            </Button>
                            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center border border-border cursor-pointer hover:border-primary/50 transition-colors">
                                <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden relative">
                    <main className="flex-1 overflow-auto scrollbar-thin">
                        {children}
                    </main>
                </div>
            </div>

            {/* Floating Chat Toggle (if closed) */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 left-16 z-50 p-4 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

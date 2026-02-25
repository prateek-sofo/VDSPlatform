'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CommandCentre } from '@/components/dashboard/CommandCentre';
import { ConnectorsView } from '@/components/connectors/ConnectorsView';
import { SemanticView } from '@/components/semantic/SemanticView';
import { ModelingView } from '@/components/modeling/ModelingView';
import { AnalysisContent } from '@/components/dashboard/AnalysisContent';
import { GovernanceView } from '@/components/governance/GovernanceView';
import { AgentsTab } from '@/components/dashboard/AgentsTab';
import { BusinessInsights } from '@/components/dashboard/BusinessInsights';
import { FeatureStudio } from '@/components/studio/FeatureStudio';
import { SQLNotebook } from '@/components/studio/SQLNotebook';
import { DecisionHub } from '@/components/decision/DecisionHub';
import { DeploymentView } from '@/components/modeling/DeploymentView';
import { AgenticBuilder } from '@/components/studio/AgenticBuilder';
import { AgentWorkspace } from '@/components/studio/AgentWorkspace';
import { SavedViews } from '@/components/dashboard/SavedViews';
import { AskPredictView } from '@/components/dashboard/AskPredictView';
import { ObservabilityView } from '@/components/dashboard/ObservabilityView';
import {
    createSession, getSession, getSessionMessages, getSessionArtifacts,
    subscribeToSession, listConnectors, listWorkflows, getAuditLog, listPolicies,
    installDomainPack
} from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

export type AppMode = 'expert' | 'business';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    structured_content?: any;
}

interface Session {
    id: string;
    status: string;
    current_step_index: number;
    plan?: any[];
    final_output?: any;
}

export default function VDSApp() {
    // --- State Management ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [domain, setDomain] = useState('revops');
    const [activeView, setActiveView] = useState('dashboard');
    const [appMode, setAppMode] = useState<AppMode>('expert');

    // Data states for views
    const [connectors, setConnectors] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);

    // --- Initialization ---
    useEffect(() => {
        installDomainPack(domain).catch(() => { });
        listConnectors().then(setConnectors).catch(() => { });
        listWorkflows().then(setWorkflows).catch(() => { });
    }, [domain]);

    useEffect(() => {
        if (activeView === 'governance') {
            getAuditLog().then(setAuditLog).catch(() => { });
            listPolicies().then(setPolicies).catch(() => { });
        }
    }, [activeView]);

    // --- Session & Chat Logic ---
    useEffect(() => {
        if (!session?.id) return;
        const unsub = subscribeToSession(session.id, (data) => {
            if (data.type === 'step_complete') {
                setSession(prev => prev ? { ...prev, current_step_index: data.step_index } : prev);
            }
            if (data.type === 'message') {
                const msg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.content,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, msg]);
            }
            if (data.type === 'status') {
                setSession(prev => prev ? { ...prev, status: data.status, final_output: data.final_output } : prev);
                if (data.status === 'done') {
                    setLoading(false);
                    // When analysis is done, we might want to automatically switch to the Viz/Insights view
                    setActiveView('insights');
                }
            }
        });
        return unsub;
    }, [session?.id]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!content.trim() || loading) return;
        setLoading(true);
        setError(null);

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: content.trim(),
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        if (appMode === 'business') {
            // Mock dynamic response for Business Mode Demo
            setTimeout(() => {
                const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `Based on an analysis of the last 7 days, there are key trends with your ${content.includes('product') ? 'products' : 'revenue'} to review.`,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMsg]);
                setLoading(false);
            }, 1500);
            return;
        }

        try {
            const s = await createSession({
                question: content.trim(),
                domain,
                autonomy_level: 'semi_auto',
                connector_ids: connectors.map(c => c.id)
            });

            if (s.id) {
                setSession(s);
                const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: '🤖 Analysis pipeline initialized. I am framing the problem and exploring available data connectors...',
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMsg]);

                const poll = setInterval(async () => {
                    const updated = await getSession(s.id);
                    setSession(updated);
                    if (['done', 'failed'].includes(updated.status)) {
                        clearInterval(poll);
                        setLoading(false);
                        const msgs = await getSessionMessages(s.id);
                        setMessages(prev => {
                            const base = prev.filter(m => m.role === 'user');
                            return [...base, ...msgs.map((m: any) => ({
                                ...m,
                                id: m.id || crypto.randomUUID()
                            }))];
                        });
                        const arts = await getSessionArtifacts(s.id);
                        setArtifacts(arts);
                        getAuditLog().then(setAuditLog).catch(() => { });

                        if (updated.status === 'done') {
                            setActiveView('insights');
                        }
                    }
                }, 3000);
            }
        } catch (e: any) {
            setError(e.message || 'Request failed. Is the backend running?');
            setLoading(false);
        }
    }, [domain, loading]);

    // --- Dynamic View Routing ---
    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <CommandCentre />;
            case 'ask-predict':
                return <AskPredictView messages={messages} onSendMessage={handleSendMessage} />;
            case 'insights':
                return session?.final_output ? (
                    <BusinessInsights
                        messages={messages}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <AnalysisContent session={session} artifacts={artifacts} auditLog={auditLog} />
                );
            case 'connectors':
                return <ConnectorsView connectors={connectors} setConnectors={setConnectors} />;
            case 'semantic':
                return <SemanticView domain={domain} />;
            case 'modeling':
                return <ModelingView />;
            case 'governance':
                return <GovernanceView auditLog={auditLog} policies={policies} />;
            case 'observability':
                return <ObservabilityView />;
            case 'decisions':
                return <DecisionHub />;
            case 'notebook':
                return <SQLNotebook />;
            case 'features':
                return <FeatureStudio />;
            case 'deployment':
                return <DeploymentView />;
            case 'builder':
                return <AgenticBuilder />;
            case 'agents':
                return <AgentWorkspace />;
            case 'saved-views':
                return <SavedViews />;
            default:
                return <CommandCentre />;
        }
    };

    return (
        <AppLayout
            activeView={activeView}
            onViewChange={setActiveView}
            onSendMessage={handleSendMessage}
            messages={messages}
            session={session}
            isTyping={loading}
            appMode={appMode}
            onAppModeChange={setAppMode}
        >
            {renderActiveView()}
        </AppLayout>
    );
}
